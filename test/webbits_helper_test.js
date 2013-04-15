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
  , TestHelper = require( __dirname+'/test_helper' )
  , WebbitsHelper = require( __dirname + '/../app/helper/webbits_helper');

describe('WebbitsHelper', function(){

  before( function( done ){

    var setup = this;

    TestHelper.prepareDb( function( err ){

      setup.items = [
        { name: 'bit0', revisions: {master: {}}, _id: 'bit0' }
      ];

      done();

    });

  });

  describe('finding webbits', function(){

    describe('stores and attaches one new webbit, leaves webpage unstored', function(){

      before( function( done ){
        var Webpage = ioco.db.model('Webpage');
        this.webpage = new Webpage({ name: 'p0', revisions: {master: {}} });
        WebbitsHelper.attachItems( this.webpage, this.items, function(err){
          if( err ) console.log(err);
          done();
        });
      });

      it('webpage has items array set with a valid webbit', function(){
        this.webpage.items.should.have.lengthOf(1);
        this.webpage.items[0].toString().should.have.lengthOf(24);
      });

    });

    describe('stores and attaches one nested webbit and one single webbit', function(){
      
      before( function( done ){
        var items = [
          { name: 'bit0', revisions: {master: {}}, _id: 'bit0',
            items: [
              { name: 'nestedbit0', revisions: {master: {} }, _id: 'nestedbit0' }
            ]
          },
          { name: 'bit1', revisions: {master: {}}, _id: 'bit1' }
        ];
        var Webpage = ioco.db.model('Webpage');
        this.webpage = new Webpage({ name: 'p0', revisions: {master: {}} });
        WebbitsHelper.attachItems( this.webpage, items, function(err){
          if( err ) console.log(err);
          done();
        });
      });

      it('webpage has 2 webbit items', function(){
        this.webpage.items.should.have.lengthOf(2);
      });

    })

  });

});
