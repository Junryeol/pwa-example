class IndexedDB {
  constructor(indexedDB, db_name, object_store_name) {
    this.db_name = db_name;
    this.object_store_name = object_store_name;

    let request = indexedDB.open(db_name);

    request.onerror = event => {
      console.log("error: ", event);
    };

    request.onsuccess = event => {
      this.db = request.result;
      console.log(this.db);
    };

    request.onupgradeneeded = event => {
      event.target.result.createObjectStore(this.object_store_name);
    };
  }

  get(key) {
    return new Promise((resolve, reject) => {
      let request = this.db
        .transaction([this.object_store_name])
        .objectStore(this.object_store_name)
        .get(key);

      request.onerror = event => {
        reject(event);
      };

      request.onsuccess = event => {
        resolve(request.result);
      };
    });
  }

  _getAll() {
    let object_store = this.db
      .transaction(this.object_store_name)
      .objectStore(this.object_store_name);

    object_store.openCursor().onsuccess = event => {
      let cursor = event.target.result;

      if (cursor) {
        console.log(cursor.key, cursor.value);
        cursor.continue();
      } else {
        console.log("No more entries.");
      }
    };
  }

  put(key, value) {
    return new Promise((resolve, reject) => {
      let request = this.db
        .transaction([this.object_store_name], "readwrite")
        .objectStore(this.object_store_name)
        .put(value, key);

      request.onsuccess = event => {
        resolve(event);
        console.log("Successful add to database.");
      };

      request.onerror = event => {
        reject(event);
        console.log("Aready exist in database.");
      };
    });
  }

  delete(key) {
    return new Promise((resolve, reject) => {
      let request = this.db
        .transaction([this.object_store_name], "readwrite")
        .objectStore(this.object_store_name)
        .delete(key);

      request.onsuccess = event => {
        resolve(event);
        console.log("Successful deletion from the database.");
      };

      request.onerror = event => {
        reject(event);
        console.log("Failed to delete from database.");
      };
    });
  }
}
