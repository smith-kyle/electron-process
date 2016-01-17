const _ = require('lodash');
const {BrowserWindow, ipcMain} = require('electron');
const foregroundWindows = [];
const backgroundProcessHandler = {
  addWindow(browserWindow) {
    foregroundWindows.push(browserWindow);
  }
};

const main = {
  createBackgroundProcess(url, debug) {
    const backgroundWindow = new BrowserWindow();
    if (!debug) {
      backgroundWindow.hide();
    }
    backgroundWindow.loadURL(url);

    ipcMain.on('BACKGROUND_START', (event, result) => {
      backgroundWindow.webContents.send.apply(backgroundWindow.webContents, ['BACKGROUND_START', result]);
    });

    ipcMain.on('BACKGROUND_REPLY', (event, result) => {
      _.forEach(foregroundWindows, (foregroundWindow) => {
        foregroundWindow.send.apply(foregroundWindow.webContents, ['BACKGROUND_REPLY', result]);
      });
    });
    return backgroundProcessHandler;
  }
};

module.exports = main;
