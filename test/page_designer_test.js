/*
 * test WebbitsHelper
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */
var should = require('should')
  , ioco = require( 'ioco' )
  , TestHelper = require( __dirname+'/test_helper' );

describe('PageDesigner', function(){

  before( function( done ){
    var setup = this;
    TestHelper.prepareDb( function( err ){
      done();
    });
  });

  describe('#create', function(){});

});
