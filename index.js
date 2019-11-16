const MAX_BYTE = 67108864; // 2^26 64MB
const github_upload_indexedDB = new IndexedDB("github","upload");


function basicAuth(){
  let id = document.getElementById('user-id').value;
  let pw = document.getElementById('user-pw').value;

  github.basicAuth(id, pw).then((data)=>{
      if (data.type == "User"){
        github.getRoot().then((data)=>{
          for(let el of data.tree){
            document.getElementById('file-list').innerHTML += `<li>${el.path}</li>`
          }
        })
      } else {
          alert("Worng ID or Password.");
      }
  });
}

function upload(){
  let files = document.getElementById('files').files;

  for(let file of files){
    githubUpload(file);
    //let indexedDB = new IndexedDB("githubUpload", file.name);
    //indexedDB._getAll(file.name)
  }
}

function githubUpload(file){
  let read_size = 0;

  while(read_size != file.size){
    let reader = new FileReader();
    let indexedDB_ID = file.name+read_size;
    reader.onloadend = ()=>{
      console.log(indexedDB_ID)
      github_upload_indexedDB.put(indexedDB_ID,reader.result);
    }

    buffer_size = (MAX_BYTE < file.size - read_size ? MAX_BYTE : file.size - read_size);
    reader.readAsDataURL(file.slice(read_size, read_size + buffer_size)); 
    read_size += buffer_size;
  }
}



















// Register service worker to control making site work offline

if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa-example/sw.js')
    .then(function() { 
      console.log('Service Worker Registered');
    })
    .catch(function(err) {
      console.log('Service Worker Register failed: ', err);
    });
}

// TODO: indexedDB 기능 추가
document.querySelector('#upload-button').addEventListener('click', function(event) {
  event.preventDefault();

  new Promise(function(resolve, reject) {
    Notification.requestPermission(function(result) {
      if (result !== 'granted') return reject(Error("Denied notification permission"));
      resolve();
    })
  }).then(function() {
    return navigator.serviceWorker.ready;
  }).then(function(reg) {
    return reg.sync.register('syncTest');
  }).then(function() {
    console.log('Sync registered');
  }).catch(function(err) {
    console.log('It broke');
    console.log(err.message);
  });
});

function handleServiceWorkerActive(registration) {
  if (registration.active) {
      const serviceWorker = registration.active;
      const button = document.querySelector('.worker-message');
      button.addEventListener('click', ()  => {
          serviceWorker.postMessage('Hi service worker');
      });
  }
}

// Code to handle install prompt on desktop
let deferredPrompt;
const addBtn = document.querySelector('#home-add-button');
addBtn.style.display = 'none';

if (!window.matchMedia('(display-mode: standalone)').matches)
  console.log('Please install app in your deviece'); 

window.addEventListener('appinstalled', function() { 
  addBtn.style.display = 'none';
  console.log('Thank you for installing our app!'); 
});

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI to notify the user they can add to home screen
  addBtn.style.display = 'block';

  addBtn.addEventListener('click', (e) => {
    // hide our user interface that shows our A2HS button
    addBtn.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
      });
  });
});
