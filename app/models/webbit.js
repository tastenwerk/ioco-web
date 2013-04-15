/*
 * ioco-web / Webbit model
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco')
  , pageDesigner = require('ioco-pagedesigner');

var WebbitSchema = ioco.db.Schema({
  pluginName: String,
  revisions: { type: ioco.db.Schema.Types.Mixed, default: { master: {} } },
  config: { type: ioco.db.Schema.Types.Mixed, default: { locked: false, library: false } },
  items: [ { type: ioco.db.Schema.Types.ObjectId, ref: 'Webbit' }],
})

WebbitSchema.plugin( ioco.getSchemaPlugin('Default') );
WebbitSchema.plugin( ioco.getSchemaPlugin('Label') );
WebbitSchema.plugin( ioco.getSchemaPlugin('Versioning') );

/**
 * deep copy a webbit
 * save the copy of the webbit
 * and return the new root webbit
 * passed as an id
 *
 * @param {String} id - the id of the original root webbit
 * to be deep copied
 */
WebbitSchema.static( 'deepCopy', function( id, callback ){

  var self = this;

  this.findById( id, function( err, webbit ){
    if( err ) return callback( err );
    if( webbit ){
      copyWebbitAndSave.call(self, webbit, callback );
    }
  });

});

/**
 * gets and renders the webbit
 *
 */
WebbitSchema.static( 'getAndRender', function( id, callback ){
  this.findById( id, function( err, webbit ){
    if( err ) return callback( err );
    if( !webbit ) return callback( 'webbit not found' );
    callback( null, new pageDesigner.Webbit( webbit ) );
  });
});

/**
 * checks if serverProcContent is available
 * and attaches it to the objectified webbit
 * (it is not passed on to toObject() or toJSON() by default
 * as it is no virtual or getter method)
 *
 */
WebbitSchema.method( 'toProcObject', function(){
  var webbitJSON = this.toObject();
  if( this.serverProcContent )
    webbitJSON.serverProcContent = this.serverProcContent;
  return webbitJSON;
});

/**
 * check if webbit is root webbit.
 *
 * disable library if is root webbit (does not make sense)
 *
 */
WebbitSchema.pre('save', function( next ){
  if( this.root )
    this.library = false;
  next();
});

/**
 * copies the given webbit and parses the new copied webbit's
 * content for data-web-bit-id attributes via cheerio
 *
 * @param {Webbit} - webbit to be copied
 *
 * @param {function( err, webbit )} - the webbit is the copy of the
 * given webbit
 */
function copyWebbitAndSave( webbit, callback ){

  var self = this;

  // don't copy if the webbit is marked as library
  // we assume that in that case, we want a link to this
  // webbit
  //
  if( webbit.library )
    return parseWebbit.call( self, webbit, callback );

  var attrs = {};
  for( var i in webbit )
    if( i.match(/pluginName|name|content|root|properties|locked|api/) )
      attrs[i] = webbit[i];

  self.create( attrs, function( err, copiedWebbit ){

    if( err ) return callback( err );
    parseWebbit.call( self, copiedWebbit, callback );

  });

}

/**
 * parse given webbit for contents
 * and copy them if required
 */
function parseWebbit( webbit, callback ){

  var self = this;

  var $ = require('cheerio')
    , webBitIds = []
    , counter = 0;

  $('<div/>').append(webbit.content).find('[data-web-bit-id]').each( function(){
    webBitIds.push( $(this).attr('data-web-bit-id') );
  });

  function parseForWebbits(){

    if( webBitIds.length > counter ){
      //console.log('[cpy] parsing webbit ', webBitIds[counter])
      self.findById( webBitIds[counter++], function( err, origWebbit ){
        if( err ) return callback( err );
        if( origWebbit )
          copyWebbitAndSave.call( self, origWebbit, function( err, deepCopiedWebbit ){
            if( err ) return callback( err );
            if( deepCopiedWebbit ){
              //console.log('[cpy] copied webbit:', deepCopiedWebbit);
              //console.log('[cpy] going to replace ', webBitIds[counter-1], deepCopiedWebbit._id.toString());
              webbit.content = webbit.content.replace(new RegExp(webBitIds[counter-1],'g'), deepCopiedWebbit._id.toString());
              webbit.save( function( err ){
                if( err ) return callback( err );
                parseForWebbits();
              });
            } else
              callback('did not get back a new copied webbit when parsing ' + webbit.name + ' (' + webbit.id + ')');
          });
        else
          callback( err );
      });
    } else
      callback( null, webbit );
  
  }

  parseForWebbits();

}

// pageDesigner extensions
WebbitSchema.method( 'getRevision', pageDesigner.renderer.getRevision );
WebbitSchema.method( 'getView', pageDesigner.renderer.getRevision );
WebbitSchema.method( 'getLang', pageDesigner.renderer.getRevision );
WebbitSchema.method( 'renderStyles', pageDesigner.renderer.renderStyles );
WebbitSchema.method( 'render', pageDesigner.renderer.render );

ioco.db.model( 'Webbit', WebbitSchema );
ioco.db.model( 'Webbit' ).setVersionAttrs([ 'name', 'properties', 'api', 'template', 'library', 'locked', 'root', 'content', 'category' ]);


module.exports = exports = ioco.db.model('Webbit');