class githubFrontAPI {
  constructor() {
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
    console.log(this.channel);
    this.channel.onmessage = function(e) {
      console.log('Received', e.data);

      document.getElementById('file-list').innerHTML = ''
      for (let content of e.data){
        document.getElementById('file-list').innerHTML += `
          <p>${content.name}</p>
        `  
      }
    };
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
      headers: new Headers({ Authorization: authorization })
    }).then(response => {

      return response.json().then(data => {
        this.user_name = data.login;
        service_worker.then(reg => {
          reg.active.postMessage(
            JSON.stringify({
              user_name: this.user_name,
              authorization: authorization
            })
          );
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

  // get(file_path) {
  //   return fetch("/github", {
  //     method: "get",
  //     body: { file_path: file_path }
  //   });
  // }
  // put(file_path, blob) {
  //   return Promise(resolve => {
  //     let reader = new FileReader();
  //     reader.onloadend = () => {
  //       resolve(reader.result);
  //     };
  //     reader.readAsDataURL(blob);
  //   }).then(content => {
  //     return fetch("/github", {
  //       method: "post",
  //       body: { file_path: file_path, content: content }
  //     });
  //   });
  // }
  delete(file_path) {
    return fetch("/github", {
      method: "delete",
      body: { file_path: file_path }
    });
  }
  copy(src_file_path, dst_file_path) {
    return fetch("/github", {
      method: "put",
      body: { src_file_path: src_file_path, dst_file_path: dst_file_path }
    });
  }
  move(src_file_path, dst_file_path) {
    return fetch("/github", {
      method: "patch",
      body: { src_file_path: src_file_path, dst_file_path: dst_file_path }
    });
  }

  download(file_path){
    this.github_indexeddb
      .get(file_path).then((data)=>{
        console.log(data)

        let link = document.createElement("a");
        link.download = data.file_path;
        link.href = URL.createObjectURL(data.file);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
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
  upload(file_path, file) {
    this.github_indexeddb
      .put(file_path, {
        method: "post",
        file_path: file_path,
        file: file
      })
      .then(() => {
        console.log("ready")
        service_worker.then(reg => {
          reg.sync.register(file_path);
        });
      });
  }
  list(){

  }
}

const github_front_API = new githubFrontAPI();
