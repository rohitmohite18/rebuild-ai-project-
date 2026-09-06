const path = require('path');

module.exports = require(
  require.resolve('mongoose', { paths: [path.join(__dirname, '../backend')] })
);
