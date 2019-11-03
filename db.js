class indexedDB {
  constructor(db_name){
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    if (!window.indexedDB) {
        console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
    }

    this.db_name = db_name;
    let request = window.indexedDB.open(db_name);

    request.onerror = (event)=>{console.log(event)};     
    request.onsuccess = (event)=>{
        this.db = request.result;
        this.object_store = {};
    };
  }
  create(object_store_name){
    this.object_stores[object_store_name] = this.db.createObjectStore(object_store_name);
  }
  get(object_store_name, key){
    let transaction = db.transaction([object_store_name],"readonly");
    let objec_store = transaction.objectStore(object_store_name);
    let request = objec_store.get(key);
    
    return new Promise((resolve, reject)=>{
      request.onerror = (event)=>{
        reject(event);
      };
      request.onsuccess = (event)=>{
        resolve(request.result);
      };
    });
  }
  put(object_store_name, key, data){
    let transaction = db.transaction([object_store_name],"readwrite");
    let objec_store = transaction.objectStore(object_store_name);
    let request = objec_store.put(data, key);

    return new Promise((resolve, reject)=>{
      request.onerror = (event)=>{
        reject(event);
      };
      request.onsuccess = (event)=>{
        resolve(request.result);
      };
    });
  }
  delete(object_store_name, key){
    let transaction = db.transaction([object_store_name],"readwrite");
    let objec_store = transaction.objectStore(object_store_name);
    let request = objec_store.delete(key);

    return new Promise((resolve, reject)=>{
      request.onerror = (event)=>{
        reject(event);
      };
      request.onsuccess = (event)=>{
        resolve(request.result);
      };
    });
  }
}