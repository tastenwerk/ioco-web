
  var jade = require('jade')
    , ioco = require('ioco')
    , WebBit = ioco.db.model('WebBit');

/**
 *
 * requires pageDesigner and extends
 * WebBit.loadById function to comply with nodejs
 *
 */

var pageDesigner = require('ioco-pagedesigner').lib;

pageDesigner.WebBit.loadById = function loadWebBitById( id, tmpAttrs, callback ){

  if( typeof(tmpAttrs) === 'function' ){
    callback = tmpAttrs;
    tmpAttrs = null;
  }

  WebBit.getAndRender( id, function( err, webbit ){

    if( tmpAttrs )
      for( var i in tmpAttrs )
        webbit[i] = tmpAttrs[i];
    
    if( webbit && webbit.api.url && webbit.api.url.length > 0 ){
      var compiledJade = jade.compile( webbit.api.postProcTemplate );

      var controller = require(process.cwd()+webbit.api.url.split(':')[0]);
      var action = webbit.api.url.split(':')[1];

      controller[action]( webbit, function( locals ){
        locals.webbit = webbit;
        webbit.serverProcContent = compiledJade( locals );
        callback( err, webbit );
      });
    } else
      callback( err, webbit );

  });
}

module.exports = exports = pageDesigner;