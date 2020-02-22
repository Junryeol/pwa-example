// NOTE: This is only available in Chrome because it uses the file system API.

class fileSystem {
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
      });
      // .then(()=>{
      //   this._list().then((entries)=>{
      //     for (entry of entries){
      //       this.remove(entry.name);
      //     }
      //   });
      // });
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
  remove(file_name){
    return new Promise((resolve)=>{
      this._open(file_name).then((fileEntry)=>{
        fileEntry.remove(()=>{resolve();}, this._error);
      });
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
      this._open(file_name, {create: true}).then((fileEntry)=>{
        fileEntry.createWriter((fileWriter) => {
          fileWriter.seek(fileWriter.length);
          fileWriter.write(file_or_blob);
          resolve();
        }, this._error);
      })
    });
  }
  url(file_name){
    return this._open(file_name).then((fileEntry)=>{
      return fileEntry.toURL();
    });
  }
  _error(e){
    console.log("file system error", e.name);
  }
}

const file_system = new fileSystem();