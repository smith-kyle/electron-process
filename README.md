# electron-process

Send blocking operations to a background process. Example application available [here](https://github.com/smith-kyle/electron-background-process-app).

## Installation

```
npm install --save electron-process
```

## Usage
`electron-process` uses a hidden `BrowserWindow` to do all the blocking operations that your heart desires. Create the background process in the main electron process, register modules you wish to run in the background, then call those functions within the `BrowserWindow`s that you consider the foreground.

### Main
```javascript
const main = require('electron-process').main;

app.on('ready', function() {
  const backgroundURL = 'file://' + __dirname + '/background.html';
  const backgroundProcessHandler = main.createBackgroundProcess(backgroundURL, true);
  mainWindow = new BrowserWindow({width: 1280, height: 600});
  backgroundProcessHandler.addWindow(mainWindow);
  mainWindow.loadURL('file://' + __dirname + '/foreground.html');
});
```
### Foreground
```javascript
const foreground = require('electron-process').foreground;
const someModule = foreground.getModule(require('./someModule'));
someModule.doStuff()
  .then((result) => console.log(result));
```

### Background
```javascript
const background = require('electron-process').background;
background.registerModule(require('./someModule'));
```
