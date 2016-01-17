const background = require('./background');
const foreground = require('./foreground');
const main = require('./main');

const electronProcess = {
  background,
  foreground,
  main
};

module.exports = electronProcess;
