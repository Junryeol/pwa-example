function basicAuth() {
  let id = document.getElementById("user-id").value;
  let pw = document.getElementById("user-pw").value;

  github_front_API.basicAuth(id, pw).then(data => {
    console.log("github_front_API.basicAuth(id, pw)",data)
  });
}

function upload() {
  let files = document.getElementById("files").files;

  for (let file of files) {
    github_front_API.upload(file.name, file);
  }
}

const service_worker =
  "serviceWorker" in navigator
    ? navigator.serviceWorker
        .register("/pwa-example/sw.js")
        .then(reg => {
          console.log("Service Worker Registered:", reg);
          return reg;
        })
        .catch(error => {
          console.log("Service Worker Register failed: ", error);
        })
    : console.log("Service Worker Not Supported");

// if('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('./sw.js')
//     .then(function(reg) {
//       console.log(reg)
//       console.log('Service Worker Registered');
//     })
//     .catch(function(err) {
//       console.log('Service Worker Register failed: ', err);
//     });

//   navigator.serviceWorker.onmessage = ()=>{

//   }
// }

// // Register service worker to control making site work offline

// if('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/pwa-example/sw.js')
//     .then(function() {
//       console.log('Service Worker Registered');
//     })
//     .catch(function(err) {
//       console.log('Service Worker Register failed: ', err);
//     });

//   navigator.serviceWorker.onmessage = ()=>{

//   }
// }

// // TODO: indexedDB 기능 추가
// document.querySelector('#upload-button').addEventListener('click', (event) =>{
//   event.preventDefault();

//   new Promise(function(resolve, reject) {
//     Notification.requestPermission(function(result) {
//       if (result !== 'granted') return reject(Error("Denied notification permission"));
//       resolve();
//     })
//   }).then(function() {
//     return navigator.serviceWorker.ready;
//   }).then(function(reg) {
//     return reg.sync.register('syncTest');
//   }).then(function() {
//     console.log('Sync registered');
//   }).catch(function(err) {
//     console.log('It broke');
//     console.log(err.message);
//   });
// });

// function handleServiceWorkerActive(registration) {
//   if (registration.active) {
//       const serviceWorker = registration.active;
//       const button = document.querySelector('.worker-message');
//       button.addEventListener('click', ()  => {
//           serviceWorker.postMessage('Hi service worker');
//       });
//   }
// }

// // Code to handle install prompt on desktop
// let deferredPrompt;
// const addBtn = document.querySelector('#home-add-button');
// addBtn.style.display = 'none';

// if (!window.matchMedia('(display-mode: standalone)').matches)
//   console.log('Please install app in your deviece');

// window.addEventListener('appinstalled', function() {
//   addBtn.style.display = 'none';
//   console.log('Thank you for installing our app!');
// });

// window.addEventListener('beforeinstallprompt', (e) => {
//   // Prevent Chrome 67 and earlier from automatically showing the prompt
//   e.preventDefault();
//   // Stash the event so it can be triggered later.
//   deferredPrompt = e;
//   // Update UI to notify the user they can add to home screen
//   addBtn.style.display = 'block';

//   addBtn.addEventListener('click', (e) => {
//     // hide our user interface that shows our A2HS button
//     addBtn.style.display = 'none';
//     // Show the prompt
//     deferredPrompt.prompt();
//     // Wait for the user to respond to the prompt
//     deferredPrompt.userChoice.then((choiceResult) => {
//         if (choiceResult.outcome === 'accepted') {
//           console.log('User accepted the A2HS prompt');
//         } else {
//           console.log('User dismissed the A2HS prompt');
//         }
//         deferredPrompt = null;
//       });
//   });
// });
