const MAX_BYTE = 33554432;

class githubBackAPI {
  constructor() {
    this.user_name = "";
    this.authorization = null;
    this.github_api_base_url = "https://api.github.com";
    this.private_repos_name = "private-repos";
    this.file_system_path = "file_system.json";

    this.github_indexeddb = new IndexedDB(self.indexedDB, "github", "api");
    this.channel = new BroadcastChannel('github');
    console.log("back", this.github_indexeddb);
  }

  match(content, name) {
    if (content) {
      for (let key of content.keys) {
        if (this.contents[key].name == name) {
          return this.contents[key];
        }
      }
    }
    return null;
  }

  read(path) {
    let content = this.contents[0];

    for (let name of path.split("/")) {
      content = this.match(content, name);
    }

    return content;
  }

  delete(path) {
    let content = this.read(path);

    if (content) {
      content.date = new Date().toISOString();
      content.status = "deleted";
    }

    return content;
  }

  rename(path, new_name) {
    let content = this.read(path);

    if (content) {
      content.name = new_name;

      content.date = new Date().toISOString();
      content.status = "renamed";
    }

    return content;
  }

  move(src_dir_path, dst_dir_path, name) {
    let src_dir = this.read(src_dir_path);
    if (src_dir) {
      let dst_dir = this.write(dst_dir_path);

      for (let key of src_dir.keys) {
        if (this.contents[key] == name) {
          let content = this.contents[key];

          dst_dir.keys.push(key);
          src_dir.keys.splice(src_dir.keys.indexOf(key), 1);

          content.date = new Date().toISOString();
          content.status = "moved";

          return content;
        }
      }
    }
  }

  copy() {}

  fetchAPI(request) {
    switch (request.method) {
      case "get":
        let content = this.read(request.body.file_path);

        for (let sha of content.shas) {
          let req = {
            method: "get",
            url: `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/git/blobs/${sha}`,
            headers: new Headers({
              Authorization: this.authorization,
              Accept: "application/vnd.github.v3.raw"
            })
          };
          caches.match(req).then(response => {
            console.log(response);
          });
        }
        return fetch(request);

      case "post":
        _setInfo(); //상태 시간 폴더 임시파일 생성
        this._write(data).then(request => {
          return fetch(request);
        });
        _setInfo(); //상태 시간 shas 생성
        return null;
      case "delete":
        _setInfo(); //상태 삭제
        return null;
      case "put":
        //let info = _info(request.body.src_file_path);
        _setInfo(); //상태 시간 폴더 임시파일 생성
        return null;
      case "patch":
        //let info = _info(request.body.src_file_path);
        _setInfo(); //이름 상태 변경
        return null;
    }
  }

  async get(content){
    let files = [];

    for (let sha of content.shas) {
      let blob = await fetch(
        `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/git/blobs/${sha}`,
        {
          method: "get",
          headers: new Headers({
            Authorization: this.authorization
          })
        }
      ).then(async (data)=>{
        let json = await data.json();
        //console.log('data:'+content.type+';base64,'+json.content)
        //console.log('data:application/octet-stream;base64,'+json.content)
        //return await fetch('data:application/octet-stream;base64,'+json.content)
        return await fetch('data:'+content.type+';base64,'+json.content)
          .then(async res => {return await res.blob()})
      });

      //console.log(response)
      //let content = response.content.substr('dataapplication/octetstreambase64'.length,response.content.length)
      //console.log(response.content);
      //console.log(content);
      files.push(blob);
      //console.log(atob(response.content));
    }

    console.log(files);
    return files;
  }

  backSync(key) {
    console.log("this.github_indexeddb", this.github_indexeddb);

    return this.github_indexeddb
      .get(key)
      .then(async data => {
        switch (data.method) {
          case "get":
            let content = this.read(data.file_path);
            let files = await this.get(content)
            let blob = new Blob(files,{type : content.type});
            //let blob = new Blob(files,{type : 'application/octet-stream'});

            this.github_indexeddb.put(data.file_path, {
              file_path: data.file_path,
              file: blob
            });

            console.log(blob);
            break;

          case "post":
            console.log(data);
            let shas = await this.upload(data.file);
            this.write(data.file_path, shas, data.file.type);
            this.update();
            break;
        }
      })
      .then(() => {
        this.channel.postMessage(this.contents);
      });
  }

  auth(user_name, authorization) {
    this.user_name = user_name;
    this.authorization = authorization;

    console.log("auth", this.user_name, this.authorization);

    fetch(
      `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}`,
      {
        method: "get",
        headers: new Headers({ Authorization: this.authorization })
      }
    ).then(data => {
      console.log("will make repos", data);
      data.json().then(data => {
        console.log(data);
      });

      if (data.status == 404) {
        console.log(this.private_repos_name, "not exist");

        fetch(`${this.github_api_base_url}/user/repos`, {
          method: "post",
          headers: new Headers({ Authorization: this.authorization }),
          body: JSON.stringify({
            name: this.private_repos_name,
            private: true
          })
        }).then(data => {
          console.log("after make repos", data);
          data.json().then(data => {
            console.log(data);
          });

          this.contents = [
            {
              status: "created",
              type: "dir",
              name: "",
              date: new Date().toISOString(),
              keys: []
            }
          ];

          fetch(
            `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/contents/${this.file_system_path}`,
            {
              method: "put",
              headers: new Headers({ Authorization: this.authorization }),
              body: JSON.stringify({
                message: "init",
                content: btoa(JSON.stringify(this.contents))
              })
            }
          ).then(this.list);
        });
      } else {
        this.list();
      }
    });
  }

  list(){
    fetch(
      `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/contents/${this.file_system_path}`,
      {
        method: "get",
        headers: new Headers({ Authorization: this.authorization })
      }
    ).then(data => {
      data.json().then(json => {
        this.contents = JSON.parse(atob(json.content));
        this.channel.postMessage(this.contents);
        console.log(this.contents);
      });
    });
  }

  write(path, shas = [], type='text/plain') {
    let dir_path = path.split("/");
    let file_name = dir_path.pop();

    let content = this.contents[0];
    for (let name of dir_path) {
      let found = this.match(content, name);

      if (found) {
        content = found;
      } else {
        content.keys.push(this.contents.length);
        this.contents.push({
          status: "created",
          type: "directory",
          name: name,
          date: new Date().toISOString(),
          keys: []
        });
        content = this.contents[this.contents.length - 1];
      }
    }

    if (shas) {
      content.keys.push(this.contents.length);
      this.contents.push({
        status: "created",
        type: type,
        name: file_name,
        date: new Date().toISOString(),
        shas: shas
      });
      content = this.contents[this.contents.length - 1];
    }

    return content;
  }

  update() {
    return fetch(
      `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/contents/${this.file_system_path}`,
      {
        method: "get",
        headers: new Headers({ Authorization: this.authorization })
      }
    ).then(data => {
      data.json().then(json => {
        fetch(
          `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/contents/${this.file_system_path}`,
          {
            method: "put",
            headers: new Headers({ Authorization: this.authorization }),
            body: JSON.stringify({
              message: "update",
              content: btoa(JSON.stringify(this.contents)),
              sha: json.sha
            })
          }
        );
      });
    });
  }

  async upload(file) {
    let shas = [];
    let read_size = 0;

    while (read_size != file.size) {
      let buffer_size =
        MAX_BYTE < file.size - read_size ? MAX_BYTE : file.size - read_size;

      let result = await new Promise(resolve => {
        let fileReader = new FileReader();
        fileReader.onload = e => resolve(fileReader.result);
        fileReader.readAsDataURL(
          file.slice(read_size, read_size + buffer_size)
        );
      });

      let content = result.substr('data:application/octet-stream;base64,'.length,result.length)

      let response = await fetch(
        `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/git/blobs`,
        {
          method: "post",
          headers: new Headers({ Authorization: this.authorization }),
          body: JSON.stringify({ content: content, encoding: "base64" })
        }
      );

      let json = await response.json();
      shas.push(json.sha);

      read_size += buffer_size;
    }

    return shas;
  }
}

const github_back_API = new githubBackAPI();
