const uuid = require('uuid');
const _ = require('lodash');
const objectHash = require('object-hash');
const {ipcRenderer} = require('electron');

function run(moduleHash, funcName, args) {
  const eventKey = uuid.v4();
  const payload = {
    moduleHash,
    funcName,
    args,
    eventKey
  };

  return new Promise((resolve, reject) => {
    function taskCompleteCallback(data) {
      const resultType = data.resultType;
      const result = data.result;
      const reason = data.reason;
      const replyEventKey = data.eventKey;

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
    ipcRenderer.on('BACKGROUND_REPLY', taskCompleteCallback);
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
