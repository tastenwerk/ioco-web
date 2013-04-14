  var fs = require('fs')
    , path = require('path');

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

    pageDesigner.initPlugins();
    var plugin = pageDesigner.getPluginByName( webbit.pluginName );

    if( tmpAttrs )
      for( var i in tmpAttrs )
        webbit[i] = tmpAttrs[i];

    var controller
      , action
      , compiledJade;

    if( plugin.serverSide ){

      try{
        var basePath = path.join(plugin.__basePath, 'app', 'page-designer', plugin.name);
        controller = require( path.join( basePath, (plugin.name+'_action') ) );
        var tmplFile = path.join( basePath, (plugin.name+'_tmpl.jade' ) );
        compiledJade = jade.compile( fs.readFileSync( tmplFile ), { filename: tmplFile } );
      } catch( err ){
        console.log('[pageDesigner server-side rendering] ERROR: ', err);
        return callback( err );
      }

    } else if( webbit && webbit.api.url && webbit.api.url.length > 0 ){
      action = webbit.api.url.split(':')[1];

      try{
        compiledJade = jade.compile( webbit.api.postProcTemplate );
        if( webbit.api.url.split(':')[0].indexOf('/') === 0 )
          controller = require(process.cwd()+webbit.api.url.split(':')[0]);
        else
          controller = require(process.cwd()+'/app/controller/'+webbit.api.url.split(':')[0]);
      } catch( err ){
        console.log('[pageDesigner server-side rendering] ERROR: ', err);
        return callback( err );
      }
    } else
      return callback( err, webbit );

    var run = action ? controller[action] : controller;

    // processing either api or serverSide
    run( webbit, function( locals ){
      locals.webbit = webbit;
      locals.currentUser = res.locals.currentUser;
      try{
        webbit.serverProcContent = compiledJade( locals );
        callback( err, webbit );
      } catch( err ){
        console.log('[pageDesigner server-side rendering] JADE ERROR: ', err);
        return callback( err );
      }
    });

  });
}

pageDesigner.initPlugins = function initPlugins(){

  // check if already initialized. Don't do multiple times
  if( pageDesigner._plugins.length > 0 )
    return;

  for( var i in ioco.plugins ){
    var plugin = ioco.plugins[i];
    if( plugin.pageDesignerJSPlugins )
      for( var j=0,pdPlugin;pdPlugin=plugin.pageDesignerJSPlugins[j];j++ )
        if( plugin.__modulePath || plugin.__filePath ){
          var pdPluginPath = path.join(getPluginBaseName( plugin ), 'public', pdPlugin);
          var initializedPdPlugin = require( pdPluginPath );
          initializedPdPlugin.__basePath = getPluginBaseName( plugin );
          pageDesigner.registerPlugin( initializedPdPlugin );
        }
  }
}

function getPluginBaseName( iocoPlugin ){

  if( iocoPlugin.__modulePath )
    return path.dirname( iocoPlugin.__modulePath );
  if( fs.existsSync( path.join( path.dirname(iocoPlugin.__filePath), '..', 'public') ) )
    return path.join(path.dirname(iocoPlugin.__filePath), '..');

}

module.exports = exports = pageDesigner;