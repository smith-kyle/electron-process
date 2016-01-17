const backgroundTasks = {};
const objectHash = require('object-hash');
const {ipcRenderer} = require('electron');
let hasRegisteredListeners = false;

function registerListeners() {
  ipcRenderer.on('BACKGROUND_START', (event, payload) => {
    const {moduleHash, funcName, args, eventKey} = payload;

    const backgroundPromise = new Promise((resolve, reject) => {
      try {
        const result = backgroundTasks[moduleHash][funcName](...args);
        resolve(result);
      } catch(e) {
        reject(e);
      }
    });

    Promise.resolve(backgroundPromise)
      .then((result) => {
        ipcRenderer.send(
          'BACKGROUND_REPLY',
          {
            result,
            eventKey,
            resultType: 'BACKGROUND_RESOLVE'
          }
        );
      })
      .catch((reason) => {
        ipcRenderer.send(
          'BACKGROUND_REPLY',
          {
            reason,
            eventKey,
            resultType: 'BACKGROUND_REJECT'
          }
        );
      });
  });
}

const background = {
  registerModule(backgroundModule) {
    if (!hasRegisteredListeners) {
      registerListeners();
      hasRegisteredListeners = true;
    }
    backgroundTasks[objectHash(backgroundModule)] = backgroundModule;
  }
};

module.exports = background;
