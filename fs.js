// NOTE: This is only available in Chrome because it uses the file system API.

class temporaryFileSystem {
  constructor(){
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    if (!this.check()) {
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
  _open(path, option={}){
    return new Promise((resolve)=>{
      this.cwd.getFile(path, option, (fileEntry)=>{
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
  _check(){
    return Boolean(window.requestFileSystem);
  }
  _error(e){
    console.log(e.name);
  }
}
