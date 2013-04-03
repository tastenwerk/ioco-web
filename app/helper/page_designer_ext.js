
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

pageDesigner.WebBit.loadById = function loadWebBitById( id, tmpAttrs, req, res, callback ){

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

      try{
        var controller = require(process.cwd()+'/app/controller/'+webbit.api.url.split(':')[0]);
        var action = webbit.api.url.split(':')[1];
      } catch( err ){
        console.log('[pageDesigner server-side rendering] ERROR: ', err);
        return callback( err );
      }
      controller[action]( webbit, function( locals ){
        locals.webbit = webbit;
        locals.currentUser = res.locals.currentUser;
        try{
          webbit.serverProcContent = compiledJade( locals );
        } catch( err ){
          console.log('[pageDesigner server-side rendering] JADE ERROR: ', err);
          return callback( err );
        }

        callback( err, webbit );
      });
    } else
      callback( err, webbit );

  });
}

module.exports = exports = pageDesigner;