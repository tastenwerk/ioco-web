var ioco = require('ioco')
  , fs = require('fs')
  , path = require('path');

var webMiddleware = function webMiddleware( app ){

  ioco.web = ioco.web || {};
  ioco.web.templates = ioco.web.templates || {};
  ioco.web.addons = ioco.web.addons || {};
  ioco.web.config = ioco.web.config || {};

  ioco.web.registerTemplate = function registerTemplate( absPath ){
    var basename = path.basename( absPath );
    var controllerFilename = path.join( absPath, basename+'_tmpl_controller');
    var tmplFilename = path.join( absPath, basename+'_tmpl.jade');

    if( !fs.existsSync( controllerFilename + '.js' ) )
      return ioco.log.error('controller file not found. expected ' + controllerFilename );
    if( !fs.existsSync( tmplFilename ) )
      return ioco.log.error('template file not found. expected ' + tmplFilename );

    var tmplController = require(controllerFilename);
    tmplController._tmplFile = tmplFilename;
    tmplController._path = absPath;
    tmplController.name = tmplController.name || basename;
    tmplController._basename = basename;

    ioco.web.templates[ basename ] = tmplController;
    ioco.log.info('[TEMPLATE]', basename, 'registered' );

  }

  ioco.web.registerAddon = function registerAddon( absPath ){
    var basename = path.basename( absPath );
    var addonFilename = path.join( absPath, basename+'_addon');
    var tmplFilename = path.join( absPath, basename+'_tmpl.jade');

    if( !fs.existsSync( addonFilename + '.js' ) )
      return ioco.log.error('controller file not found. expected ' + addonFilename );

    var addonController = require(addonFilename);

    if( fs.existsSync( addonFilename ) )
      addonController._tmplFile = tmplFilename;

    addonController._path = absPath;
    addonController.name = addonController.name || basename;
    addonController._basename = basename;

    ioco.web.addons[ basename ] = addonController;
    ioco.log.info('[ADDON]', basename, 'registered' );

  }

}

module.exports = exports = webMiddleware;