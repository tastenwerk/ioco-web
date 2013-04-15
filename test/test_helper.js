/*
 * tTestHelper
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco');

TestHelper = {};

TestHelper.prepareDb = function prepareDb( done ){

  ioco.db.open( 'mongodb://localhost:27017/ioco_testdb' );
  ioco.initModels();

  var Webpage = require( __dirname + '/../app/models/webpage');
  var Webbit = require( __dirname + '/../app/models/webbit');
  User = ioco.db.model('User');

  User.remove( function( err ){
    if( err ) return done( err );
    User.create( {name: {nick: 'henry'}, password: 'henry', email: 'henry@v.com'}, function( err, user ){
      Webpage.remove( function( err ){
        if( err ) return done( err );
        Webbit.remove( function( err ){
          done( err, user );
        });
      });
    });
  });

}

module.exports = exports = TestHelper