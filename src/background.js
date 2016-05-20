const _ = require('lodash');
const objectHash = require('object-hash');
const {ipcRenderer} = require('electron');

const backgroundTasks = {};
let hasRegisteredListeners = false;

function turnCallbackIntoIpcCall(functionId) {
  return function() {
    // Filter all non-enumarable properties
    const args = _.map(arguments, argument => argument);

    ipcRenderer.send(
      'CALLBACK',
      {
        functionId,
        args
      }
    );
  };
}

function registerListeners() {
  ipcRenderer.on('BACKGROUND_START', (event, payload) => {
    const {moduleHash, funcName, args, eventKey} = payload;

    // In order for callbacks to execute in the foreground they
    // must be replaced with an IPC call
    const argsWithCallbacksReplaced = _.map(
      args,
      arg => _.get(arg, '$isFunction') ? turnCallbackIntoIpcCall(arg.functionId) : arg
    );

    Promise.resolve()
      .then(() => backgroundTasks[moduleHash][funcName](...argsWithCallbacksReplaced))
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
