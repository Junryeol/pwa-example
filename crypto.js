class AES_GCM {
  constructor(key=null){
    if (!key){
      window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      ).then((key) => {
        this.key = key;
        this.iv = window.crypto.getRandomValues(new Uint8Array(12));
      });  
    }
  }
  encrypt(plain){
    return window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: this.iv
      },
      this.key,
      plain
    );
  }
  decrypt(cipher){
    return window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: this.iv
      },
      this.key,
      cipher
    );
  }
}