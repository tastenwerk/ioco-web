/*
 * ioco-web / WebBit model
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco');

var WebBitSchema = ioco.db.Schema({
  pluginName: String,
  content: String,
  api: { type: ioco.db.Schema.Types.Mixed, default: { url: '', data: {}, postProcTemplate: ''} },
  category: String,
  library: { type: Boolean, default: false },
  template: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  root: { type: Boolean, default: false },
  //webBits: { type: [ioco.db.Schema.ObjectId], ref: 'WebBit' },
  properties: { type: ioco.db.Schema.Types.Mixed },
})

WebBitSchema.plugin( ioco.getSchemaPlugin('Default') );
WebBitSchema.plugin( ioco.getSchemaPlugin('Versioning') );

/**
 * deep copy a webbit
 * save the copy of the webbit
 * and return the new root webbit
 * passed as an id
 *
 * @param {String} id - the id of the original root webbit
 * to be deep copied
 */
WebBitSchema.static( 'deepCopy', function( id, callback ){

  var self = this;

  this.findById( id, function( err, webbit ){
    if( err ) return callback( err );
    if( webbit ){
      copyWebBitAndSave.call(self, webbit, callback );
    }
  });

});

/**
 * gets and renders the webbit
 *
 */
WebBitSchema.static( 'getAndRender', function( id, callback ){
  this.findById( id, function( err, webbit ){
    if( err ) return callback( err );
    if( !webbit ) return callback( 'webbit not found' );
    callback( null, new pageDesigner.WebBit( webbit ) );
  });
} );

/**
 * check if webbit is root webbit.
 *
 * disable library if is root webbit (does not make sense)
 *
 */
WebBitSchema.pre('save', function( next ){
  if( this.root )
    this.library = false;
  next();
});

/**
 * copies the given webbit and parses the new copied webbit's
 * content for data-web-bit-id attributes via cheerio
 *
 * @param {WebBit} - webbit to be copied
 *
 * @param {function( err, webbit )} - the webbit is the copy of the
 * given webbit
 */
function copyWebBitAndSave( webbit, callback ){

  var self = this;

  // don't copy if the webbit is marked as library
  // we assume that in that case, we want a link to this
  // webbit
  //
  if( webbit.library )
    return parseWebBit.call( self, webbit, callback );

  var attrs = {};
  for( var i in webbit )
    if( i.match(/pluginName|name|content|root|properties|locked|api/) )
      attrs[i] = webbit[i];

  self.create( attrs, function( err, copiedWebBit ){

    if( err ) return callback( err );
    parseWebBit.call( self, copiedWebBit, callback );

  });

}

/**
 * parse given webbit for contents
 * and copy them if required
 */
function parseWebBit( webbit, callback ){

  var self = this;

  var $ = require('cheerio')
    , webBitIds = []
    , counter = 0;

  $('<div/>').append(webbit.content).find('[data-web-bit-id]').each( function(){
    webBitIds.push( $(this).attr('data-web-bit-id') );
  });

  function parseForWebBits(){

    if( webBitIds.length > counter ){
      //console.log('[cpy] parsing webbit ', webBitIds[counter])
      self.findById( webBitIds[counter++], function( err, origWebBit ){
        if( err ) return callback( err );
        if( origWebBit )
          copyWebBitAndSave.call( self, origWebBit, function( err, deepCopiedWebBit ){
            if( err ) return callback( err );
            if( deepCopiedWebBit ){
              //console.log('[cpy] copied webbit:', deepCopiedWebBit);
              //console.log('[cpy] going to replace ', webBitIds[counter-1], deepCopiedWebBit._id.toString());
              webbit.content = webbit.content.replace(new RegExp(webBitIds[counter-1],'g'), deepCopiedWebBit._id.toString());
              webbit.save( function( err ){
                if( err ) return callback( err );
                parseForWebBits();
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

  parseForWebBits();

}

ioco.db.model( 'WebBit', WebBitSchema );
ioco.db.model( 'WebBit' ).setVersionAttrs([ 'name', 'properties', 'api', 'template', 'library', 'locked', 'root', 'content', 'category' ]);