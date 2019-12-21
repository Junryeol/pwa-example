function basicAuth() {
  let id = document.getElementById("user-id").value;
  let pw = document.getElementById("user-pw").value;

  github_front_API.basicAuth(id, pw).then(data => {
    console.log("basicAuth", data);
  });
}

function upload() {
  let files = document.getElementById("files").files;

  for (let file of files) {
    github_front_API.upload(file.name, file);
  }
}

function get() {
  let path = document.getElementById("path").value;

  github_front_API.get(path);
}

function download() {
  let path = document.getElementById("path").value;

  github_front_API.download(path);
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

function listUpdateCallback(event) {
  console.log("Received", event.data);

  document.getElementById("file-list").innerHTML = "";
  for (let content of event.data) {
    document.getElementById("file-list").innerHTML += `
          <p>${content.name}</p>
        `;
  }
}

const github_front_API = new githubFrontAPI(listUpdateCallback);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  let deferredPrompt = e;

  document.getElementById('home-add-button').addEventListener('click', (e) => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the prompt');
        } else {
          console.log('User dismissed the prompt');
        }
        deferredPrompt = null;
      });
  });
});
