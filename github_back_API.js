
class githubBackAPI {
    constructor() {
      this.contents = [
        // {
        //   status: "created",
        //   type: "dir",
        //   name: "",
        //   date: new Date().toISOString(),
        //   keys: [1, 2]
        // },
        // {
        //   status: "created",
        //   type: "file",
        //   name: "test.txt",
        //   date: new Date().toISOString(),
        //   shas: ["12asd34as23d1"]
        // },
        // {
        //   status: "created",
        //   type: "file",
        //   name: "test2.txt",
        //   date: new Date().toISOString(),
        //   shas: ["12asd34as23d1"]
        // }
      ];
  
      this.user_name = "";
      this.authorization = null;
      this.github_api_base_url = "https://api.github.com";
      this.private_repos_name = "private_repos";
      this.file_system_path = "file_system.json";
  
      this.github_indexeddb = new IndexedDB(self.indexedDB, "github", "api");
    }
  
    _upload() {}
    _download() {}
  
    _fakeFetch(object) {
      return fetch(URL.createObjectURL(object));
    }
  
    base64toBlob(b64Data, contentType, sliceSize) {
      contentType = contentType || '';
      sliceSize = sliceSize || 512;
    
      var byteCharacters = atob(b64Data);
      var byteArrays = [];
    
      for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);
    
        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
    
        var byteArray = new Uint8Array(byteNumbers);
    
        byteArrays.push(byteArray);
      }
    
      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
    }
  
    match(content, name) {
      if (content) {
        for (let key of content.keys) {
          if (this.contents[key] == name) {
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
  
    write(dir_path, file_name = "") {
      let content = this.contents[0];
      for (let name of dir_path.split("/")) {
        let found = this.match(content, name);
  
        if (found) {
          content = found;
        } else {
          content.keys.push(this.contents.length);
          this.contents.push({
            status: "created",
            type: "dir",
            name: name,
            date: new Date().toISOString(),
            keys: []
          });
          content = this.contents[this.contents.length - 1];
        }
      }
  
      if (file_name) {
        content.keys.push(this.contents.length);
        this.contents.push({
          status: "temporary",
          type: "file",
          name: file_name,
          date: new Date().toISOString(),
          shas: []
        });
        content = this.contents[this.contents.length - 1];
      }
  
      return content;
    }
  
    auth(user_name,authorization) {
      this.user_name = user_name;
      this.authorization = authorization;
  
      fetch(`${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}`, {
        method: "get",
        headers: new Headers({ Authorization: this.authorization })
      }).catch(()=>{
        fetch(`${this.github_api_base_url}/user/repos`, {
          method: "post",
          headers: new Headers({ Authorization: this.authorization }),
          body:{
            name: this.private_repos_name
          }
        }).then(()=>{
          fetch(`${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/contents/${this.file_system_path}`, {
            method: "put",
            headers: new Headers({ Authorization: this.authorization }),
            body:{
              message: "init",
              content: btoa(JSON.stringify([{
                status: "created",
                type: "dir",
                name: "",
                date: new Date().toISOString(),
                keys: []
              }])),
            }
          });  
        });
      });
    }
  
    fetchAPI(request) {
      switch (request.method) {
        case "get":
          let content = this.read(request.body.file_path);
  
          for (let sha of content.shas) {
            let req = {
              method: "get",
              url: `${this.github_api_base_url}/repos/${this.user_name}/${this.private_repos_name}/git/blobs/${sha}`,
              headers: new Headers({ Authorization: this.authorization, Accept: "application/vnd.github.v3.raw" })
            }
            caches.match(req).then(response => {
              console.log(response)
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
  
    backSync(key) {
      return this.github_indexeddb
        .get(key)
        .then(data => {
          switch (data.method) {
            case "get":
              return this._download(data).then(() => {
                // 다운로드
                // 알람
              });
            case "post":
              return this._upload(data).then(() => {
                // 알람
              });
          }
        })
        .then(() => {
          this.github_indexeddb.delete(key);
        });
    }
  }
  
  const github_back_API = new githubBackAPI();
  