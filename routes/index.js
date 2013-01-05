var path = require('path')
  , fs = require('fs');

module.exports = exports = function( app ){
  
    fs.readdirSync( __dirname ).forEach( function( routeFile ){

      if( routeFile.indexOf('index') < 0 )
        require( path.join( __dirname, routeFile ) )( app );

    });

}