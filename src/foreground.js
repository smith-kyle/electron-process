const uuid = require('uuid');
const _ = require('lodash');
const objectHash = require('object-hash');
const {ipcRenderer} = require('electron');

function taskCompleteCallback(eventKey, resolve, reject, event, data) {
  const {resultType, result, reason, eventKey: replyEventKey} = data;

  if (replyEventKey === eventKey) {
    switch (resultType) {
    case 'BACKGROUND_RESOLVE':
      ipcRenderer.removeListener('BACKGROUND_REPLY', taskCompleteCallback);
      resolve(result);
      break;
    case 'BACKGROUND_REJECT':
      ipcRenderer.removeListener('BACKGROUND_REPLY', taskCompleteCallback);
      reject(reason);
      break;
    default:
    }
  }
}

function callbackCallback(functionsById, event, data) {
  const {functionId, args} = data;
  if (functionsById[functionId]) {
    functionsById[functionId](...args);
  }
}

function run(moduleHash, funcName, args) {
  const eventKey = uuid.v4();

  const functionsById = {};
  const argsWithCallbacksReplaced = _.map(args, arg => {
    if (!_.isFunction(arg)) {
      return arg;
    }

    const functionId = uuid.v4();
    functionsById[functionId] = arg;
    return {
      $isFunction: true,
      functionId
    };
  });

  const payload = {
    moduleHash,
    funcName,
    args: argsWithCallbacksReplaced,
    eventKey
  };

  return new Promise((resolve, reject) => {
    if (_.some(args, _.isFunction)) {
      // When a callback is executed in the background process it sends an
      // IPC event named 'CALLBACK'.
      ipcRenderer.on('CALLBACK', callbackCallback.bind(this, functionsById));
    }
    ipcRenderer.on('BACKGROUND_REPLY', taskCompleteCallback.bind(this, eventKey, resolve, reject));
    ipcRenderer.send('BACKGROUND_START', payload);
  });
}

const foreground = {
  getModule(originalModule) {
    const promiseWrappedModule = {};
    const moduleHash = objectHash(originalModule);
    _.forEach(originalModule, (func, funcName) => {
      if (_.isFunction(func)) {
        promiseWrappedModule[funcName] = function() {
          // Remove non-enumarable properties of arguments
          const args = _.map(arguments, (element) => element);
          return run(
            moduleHash,
            funcName,
            args
          );
        };
      }
    });
    return promiseWrappedModule;
  }
};

module.exports = foreground;
