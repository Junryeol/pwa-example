const images = ['fox1','fox2','fox3','fox4'];
const imgElem = document.querySelector('img');

function randomValueFromArray(array) {
  let randomNo =  Math.floor(Math.random() * array.length);
  return array[randomNo];
}

setInterval(function() {
  let randomChoice = randomValueFromArray(images);
  imgElem.src = 'images/' + randomChoice + '.jpg';
}, 2000)

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

document.querySelector('.register').addEventListener('click', function(event) {
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

// // Code to handle install prompt on desktop
// let deferredPrompt;
// const addBtn = document.querySelector('.add-button');
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
