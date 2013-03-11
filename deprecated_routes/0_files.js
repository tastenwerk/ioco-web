/**
 *
 * users (general CRUD operations)
 *
 */

var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , easyimg = require('easyimage')
  , exec = require('child_process').exec;

var iomapper = require('iomapper')
  , ioco = require( 'ioco' )
  , WebElement = require( __dirname + '/../models/web_element' )
  , common = require( __dirname + '/../lib/web_elements_common' )
  , iocoFileUtils = require( 'ioco/lib/file_utils' )
  , streambuffer = require( 'ioco/lib/streambuffer' );

module.exports = exports = function( app ){
  
  /**
   * displays a files modal
   */
  app.get('/webelements/files:format?', ioco.plugins.auth.check, function(req, res ){
    res.render( ioco.view.lookup( 'web_elements/files/index.jade' ) );
  });
  
  /**
   * load the upload form into a modal
   *
   */
  app.get('/webelements/:id/files:format?', ioco.plugins.auth.check, common.getWebElement, function( req, res ){

    res.format({

      json: function(){
        if( !req.webElement ) return res.json({ error: 'not found'});
        ioco.db.model('File').find({ paths: req.webElement._id.toString()+':WebElement' }).execWithUser( res.locals.currentUser, function( err, files ){
          res.json( files );
        });
      }

    });
  });

  /**
   * Upload a file to the server
   */
  app.post('/web_elements/:id/files', streambuffer, ioco.plugins.auth.check, common.getWebElement, function( req, res ){

    var PAUSE_TIME = 5000
      , bytesUploaded = 0;

    if(req.xhr) {
      var fileName = req.header('x-file-name');
      var fileSize = req.header('content-length');
      var fileType = req.header('x-mime-type');

      var fileOpts = { holder: res.locals.currentUser, 
        name: fileName, 
        fileSize: fileSize, 
        contentType: fileType,
        _subtype: req.query._subtype,
        parent: req.query.parent };

      var file = new ioco.db.model('File')( fileOpts );
      file.save( function( err ){
        if( err )
          req.flash('error', req.i18n.t('files.failed') );
        else{
          var absPath = path.join( 'files', file._id.toString().substr(11,2), file._id.toString() );
          iocoFileUtils.ensureRecursiveDir( absPath, function( err ){
            var origName = path.join( ioco.config.datastore.absolutePath, absPath, 'orig' );
            var fileStream = fs.createWriteStream( origName );

            req.streambuffer.ondata( function( chunk ) {
                if( bytesUploaded+chunk.length > (ioco.config.max_upload_size_mb || 5)*1024*1024 ) {
                  fileStream.end();
                  return res.send(JSON.stringify({error: "Too big."}));
                }
                fileStream.write(chunk);
                bytesUploaded += chunk.length;
                req.pause();
                setTimeout(function() { req.resume(); }, PAUSE_TIME);
            });

            req.streambuffer.onend( function() {
              fileStream.end();
              if( file.contentType.indexOf('image') === 0 )
                resizeAndCopyImage( req, origName, function( err ){
                  if( err ) req.flash('error', err);
                  getInfoAndSave( file, origName, function( err ){
                    if( err )
                      req.flash('error', err );
                    else
                      req.flash('notice', req.i18n.t('files.success', {name: file.name}));
                    res.json({ success: true, flash: req.flash(), data: file });
                  });
                });
              else{
                req.flash('notice', req.i18n.t('files.success', {name: file.name}));
                file.holder = file.holder.toSafeJSON();
                res.json({ success: true, flash: req.flash(), data: file });
              }
            });
          });

        }
      })

    } // if xhr

  });

}

function resizeAndCopyImage( req, origName, callback ){

  var def = ioco.config.datastore.resizeDefaultPX;

  //var dest = path.dirname(origName) + '/' + path.basename(origName, path.extname(origName)) + '_' + def + path.extname(origName);
  var dest = origName;
  var resizeOpts = { src: origName, dst: dest, width: def, height: def };
  easyimg.resize( resizeOpts, callback );

}

function getInfoAndSave( file, filePath, callback ){
  easyimg.info( filePath, function( err, stdout ){

    if( stdout && stdout.width && stdout.height )
      file.dimension = stdout.width+'x'+stdout.height;

    if( err )
      callback( err );
    else
      file.save( callback );

  });
}