// NOTE: This is only available in Chrome because it uses the file system API.

class localFileSystem {
  constructor(){
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    if (!window.requestFileSystem) {
      console.log("The FileSystem APIs are not available in your browser.");
    } else {
      navigator.storage.estimate().then((estimate)=>{
        this.type = window.TEMPORARY;
        this.size = (estimate.quota - estimate.usage) / 2;
      }).then(()=>{
        window.requestFileSystem(this.type, this.size, (filesystem) => {
          this.fs = filesystem;
          this.cwd = this.fs.root;
        }, this._error);  
      }).then(()=>{
        // TODO: need destructor
        this._list().then((entries)=>{
          for (entry of entries){
            this._remove(entry.name);
          }
        });
      });
    }
  }
  _list(){
    return new Promise((resolve)=>{
      cwd_.createReader().readEntries((entries)=>{
        resolve(entries);
      }, this._error);
    });
  }
  _open(file_name, option={}){
    return new Promise((resolve)=>{
      this.cwd.getFile(file_name, option, (fileEntry)=>{
        resolve(fileEntry);
      }, this._error);
    });
  }
  _remove(file_name){
    this._open(file_name).then((fileEntry)=>{
      fileEntry.remove(()=>{}, this._error);
    });
  }
  get(file_name){
    return new Promise((resolve)=>{
      this._open(file_name).then((fileEntry)=>{
        fileEntry.file((file)=>{
          resolve(file);
        }, this._error);
      })
    });
  }
  put(file_name, file_or_blob){
    return new Promise((resolve)=>{
      _open(file_name, {create: true}).then((fileEntry)=>{
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.seek(fileWriter.length);
          fileWriter.write(file_or_blob);
        }, this._error);
      })
    });
  }
  save(file_name){
    this._open(path).then((fileEntry)=>{
      let link = document.createElement("a");
      link.download = file_name;
      link.href = fileEntry.toURL();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).then(()=>{
      this._remove(file_name);
    });
  }
  _error(e){
    console.log(e.name);
  }
}

class memoryFileSystem{
  constructor(){
    this.files = {};
  }
  _list(){
    return this.files;
  }
  _remove(file_name){
    delete this.files[file_name]
  }
  get(file_name){
    return this.files[file_name];
  }
  put(file_name, blob){
    if (this.files[file_name]){
      this.files[file_name] = new Blob([this.files[file_name], blob]);
    } else {
      this.files[file_name] = new Blob([blob]);
    }
  }
  save(file_name){
    let link = document.createElement("a");
    link.download = file_name;
    link.href = URL.createObjectURL(this.files[file_name]);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

class githubFileSystem {
  constructor(){
    const MAX_BYTE = 33554432; // 2^25 32MB

    if(window.requestFileSystem || window.webkitRequestFileSystem){
      this.fs = new localFileSystem();    
    } else {
      this.fs = new memoryFileSystem();
    }
  }

  _part_upload(file_part){
    return new Promise((resolve)=>{
      let reader = new FileReader();
      reader.onloadend = ()=>{
        resolve(github.createBlob(reader.result));
      }
      reader.readAsDataURL(file_part); 
    })
  }

  async upload(file_name, file){
    let shas = []
    let read_size = 0;

    while(read_size != file.size){
      buffer_size = (MAX_BYTE < file.size - read_size ? MAX_BYTE : file.size - read_size);
      shas.push(await this._part_upload(file.slice(read_size, read_size + buffer_size)));
      read_size += buffer_size;
    }

    return shas;
  }
  async download(file_name, shas){
    if (!this.get(file_name)){
      await this.put(file_name, shas);
    }
    this.fs.save();
  }
  async put(file_name, shas){
    for(let sha of shas){
      await this.fs.put(file_name, await github.getBlob(sha));
    }
  }
  get(file_name){
    return this.fs.get(); //createobjecurl
  }
}

const github_file_system = new githubFileSystem();