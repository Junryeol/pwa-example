class githubFrontAPI {
  constructor(listUpdateCallback) {
    this.user_name = "";
    this.github_indexeddb = new IndexedDB(
      window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB,
      "github",
      "api"
    );
    this.channel = new BroadcastChannel('github');
    this.channel.onmessage = listUpdateCallback;
  }

  basicAuth(user_name_or_e_mail, password) {
    return this.authIn(`Basic ${btoa(user_name_or_e_mail + ":" + password)}`);
  }
  tokenAuth(token) {
    return this.authIn(`Token ${token}`);
  }
  authIn(authorization) {
    return fetch("https://api.github.com/user", {
      method: "get",
      headers: new Headers({ Authorization: authorization})
    }).then(response => {

      return response.json().then(data => {
        this.user_name = data.login;
        service_worker.then(reg => {
          reg.active.postMessage(JSON.stringify({
            user_name: this.user_name,
            authorization: authorization
          }));
        });
        return data;
      });
    });
  }
  authOut() {
    return service_worker.then(reg => {
      reg.active.postMessage("");
    });
  }

  upload(file_path, file) {
    this.github_indexeddb
      .put(file_path, {
        method: "post",
        file_path: file_path,
        file: file
      })
      .then(() => {
        service_worker.then(reg => {
          reg.sync.register(file_path);
        });
      });
  }
  get(file_path) {
    this.github_indexeddb
      .put(file_path, {
        method: "get",
        file_path: file_path
      })
      .then(() => {
        service_worker.then(reg => {
          reg.sync.register(file_path);
        });
      });
  }
  download(file_path){
    // TODO: file system api 추가

    this.github_indexeddb
      .get(file_path).then(async (data)=>{
        let link = document.createElement("a");
        console.log(data)
        link.download = data.file_path;

        if(data.shas.length == 1){
          let file = await this.github_indexeddb.get(data.shas[0])
          link.href = URL.createObjectURL(file.file);
        } else {
          for (let index in data.shas){
            console.log(data.shas[index])
            let file = await this.github_indexeddb.get(data.shas[index])
            console.log(file)
            await file_system.put(data.file_path, file.file);
            await this.github_indexeddb.delete(data.shas[index]); // TODO: 파일 시스템에 쓰면 지우기
          }
          data.file_system_url = await file_system.url(data.file_path);
          console.log(data.file_system_url)
          await this.github_indexeddb.put(data.file_path, data); // TODO: 파일 시스템 경로 추가하기
          link.href = data.file_system_url;
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);  
      })
  }

  // delete(file_path) {
  //   return fetch("/github", {
  //     method: "delete",
  //     body: { file_path: file_path }
  //   });
  // }
  // copy(src_file_path, dst_file_path) {
  //   return fetch("/github", {
  //     method: "put",
  //     body: { src_file_path: src_file_path, dst_file_path: dst_file_path }
  //   });
  // }
  // move(src_file_path, dst_file_path) {
  //   return fetch("/github", {
  //     method: "patch",
  //     body: { src_file_path: src_file_path, dst_file_path: dst_file_path }
  //   });
  // }
}