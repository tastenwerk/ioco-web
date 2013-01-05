var iokit = require('iokit');

module.exports = exports = function( app ){
  
  iokit.view.paths.push( __dirname + '/views' );

}