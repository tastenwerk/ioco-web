var ioco = require('ioco')
  , fs = require('fs')
  , path = require('path');

var webMiddleware = function webMiddleware( app ){

  ioco.web = ioco.web || {};
  ioco.web.templates = ioco.web.templates || {};

  ioco.web.registerTemplate = function registerTemplate( absPath ){
    var basename = path.basename( absPath );
    var controllerFileName = path.join( absPath, basename+'_tmpl_controller');
    var tmplFileName = path.join( absPath, basename+'_tmpl.jade');

    if( !fs.existsSync( controllerFileName + '.js' ) )
      return ioco.log.error('controller file not found. expected ' + controllerFileName );
    if( !fs.existsSync( tmplFileName ) )
      return ioco.log.error('template file not found. expected ' + tmplFileName );

    var tmplController = require(controllerFileName);
    tmplController._tmplFile = tmplFileName;
    tmplController._path = absPath;
    tmplController._basename = basename;

    ioco.web.templates[ basename ] = tmplController;
    ioco.log.info('template', basename, 'registered' );

  }
}

module.exports = exports = webMiddleware;