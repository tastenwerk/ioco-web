/*
 * ioco-web / Webbit routes
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

// for file uploading
var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , easyimg = require('easyimage')
  , exec = require('child_process').exec;

var sanitize = require('validator').sanitize;

// internals
var ioco = require('ioco')
  , User = ioco.db.model('User')
  , Webbit = ioco.db.model('Webbit')
  , iocoFileUtils = require( 'ioco/lib/file_utils' )
  , streambuffer = require( 'ioco/lib/streambuffer' );

module.exports = exports = function( app ){

  /**
   * look up for a webbit
   *
   * @param {String} - ?name=<name>
   *
   */
  app.get( '/webbits.json', ioco.plugins.auth.check, function( req, res ){

    var q = {};
    if( req.query.parentId )
      q = {paths: new RegExp('^'+req.query.parentId+':[a-zA-Z0-9]*$')};
    if( req.query.roots )
      q = {paths: []};
    getWebbits( res.locals.currentUser, q, function( err, webbits ){
      res.json( webbits );
    });

  });

  /**
   * create a new webbit
   */
  app.post('/webbits', ioco.plugins.auth.check, function( req, res ){
    if( req.body.webbit && req.body.webbit.name.length > 1 ){
      var attrs = {
        name: req.body.webbit.name,
        content: req.body.webbit.content,
        pluginName: req.body.webbit.pluginName,
        properties: req.body.webbit.properties,
        api: req.body.webbit.api,
        root: sanitize( req.body.webbit.root ).toBoolean(),
        library: sanitize( req.body.webbit.library ).toBoolean()
      };
      if( req.body.webbit.category )
        attrs.category = req.body.webbit.category;
      Webbit.create( attrs, function( err, webbit ){
        res.json({ success: err === null, error: err, data: webbit });
      });
    }
  });

  app.get('/webbits/:id/edit:format?', ioco.plugins.auth.check, getWebbit, function( req, res ){
    res.render( ioco.view.lookup( '/webbits/edit.jade' ), {flash: req.flash(), webbit: req.webbit });
  });

  /**
   * update a webbit
   */
  app.put('/webbits/:id', ioco.plugins.auth.check, getWebbit, function( req, res ){
    if( req.body.webbit ){
      var attrs = {
        name: req.body.webbit.name,
        content: req.body.webbit.content,
        properties: req.body.webbit.properties,
        library: sanitize( req.body.webbit.library ).toBoolean(),
        template: sanitize( req.body.webbit.template ).toBoolean(),
        api: req.body.webbit.api

      };

      if( req.body.webbit.category )
        attrs.category = req.body.webbit.category;

      req.webbit._holder = res.locals.currentUser;      
      req.webbit.createVersion();

      for( var i in attrs )
        req.webbit[i] = attrs[i];

      req.webbit.save( function( err ){
        res.json({ success: err === null, error: err, data: req.webbit });
      });
    }
  });

  app.put( '/webbits/:id/revisions/:revision/comment', ioco.plugins.auth.check, getWebbit, function( req, res ){
    if( req.webbit && req.body.comment && req.params.revision ){
      var success = false;
      for( var i=0, rev; rev=req.webbit.versions[i]; i++ )
        if( rev.revision === parseInt(req.params.revision) ){
          rev.comment = req.body.comment;
          req.webbit.save( function( err ){
            return res.json({ success: err === null });
          });
          success = true;
        }
      if( ! success )
        res.json({ error: 'could not find revision ' + req.body.revision });
    } else
      res.json({ error: 'could not find webbit' })
  });

  app.put( '/webbits/:id/revisions/:revision/switch', ioco.plugins.auth.check, getWebbit, function( req, res ){
    if( req.webbit && req.params.revision ){
      var success = false;
      var revision = req.webbit.switchVersion( parseInt( req.params.revision ) );
      req.webbit.save( function( err ){
        return res.json({ success: err === null, revision: revision });
      });
    } else
      res.json({ error: 'could not find webbit' })
  });

  app.delete( '/webbits/:id/revisions/:revision', ioco.plugins.auth.check, getWebbit, function( req, res ){
    if( req.webbit && req.params.revision ){
      var success = false;
      var version = req.webbit.deleteVersion( parseInt( req.params.revision ) );
      req.webbit.save( function( err ){
        return res.json({ success: err === null, revision: version });
      });
    } else
      res.json({ error: 'could not find webbit' })
  });


  app.get( '/webbits/:id/revisions.json', ioco.plugins.auth.check, getWebbit, function( req, res ){
    var revisions = req.webbit && req.webbit.versions || [];
    if( revisions.length > 0 )
      revisions = revisions.sort(function(a,b){
        if( a.revision < b.revision )
          return -1;
        if( a.revision > b.revision )
          return 1;
        return 0;
      });
    res.json( revisions );
  });

  /**
   * load all webbits
   * which are marked with
   * library
   */
  app.get( '/webbits/library.json', ioco.plugins.auth.check, function( req, res ){

    Webbit.find({ library: true }).sort({name: 1}).exec( function( err, webBits ){
      res.json( webBits );
    });
    
  });

  /**
   * load all webbits
   * which are marked with
   * library
   */
  app.get( '/webbits/templates.json', ioco.plugins.auth.check, function( req, res ){

    Webbit.find({ template: true }).sort({name: 1}).exec( function( err, webBits ){
      res.json( webBits );
    });
    
  });

  /**
   * show files of a webbit
   */
  app.get( '/webbits/:id/files', ioco.plugins.auth.check, getWebbit, function( req, res ){

    res.format({

      html: function(){
        res.render( ioco.view.lookup('/webbits/files.jade') );  
      },

      json: function(){

        if( !req.webbit ) return res.json({ error: 'not found'});
        ioco.db.model('File').find({ _labelIds: 'Webbit:'+req.webbit._id.toString() }).execWithUser( res.locals.currentUser, function( err, files ){
          res.json( files );
        });
      }

    })

  });

  /**
   * post a new file and attach it to the webbit
   * upload it to the server
   *
   */
  app.post('/webbits/:id/files', streambuffer, ioco.plugins.auth.check, getWebbit, function( req, res ){

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
        _labelIds: [ req.query.labelId ] };

      var file = new ioco.db.model('File')( fileOpts );
      file.publish( true );         // by default publish files attached to webbits and make them public
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
              if( file.contentType.indexOf('image') === 0 ) {
                resizeAndCopyImage( req, origName, function( err ){
                  if( err ) req.flash('error', err);
                  getInfoAndSave( file, origName, function( err ){
                    if( err )
                      req.flash('error', err );
                    else
                      req.flash('notice', req.i18n.t('files.success', {name: file.name}));
                    res.json({ success: err===null, flash: req.flash(), data: file });
                  });
                });
              } else {
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

  /**
   * get a webbit by its id as json
   *
   */
  app.get('/webbits/:id.json', ioco.plugins.auth.check, getWebbit, function( req, res ){
    res.json( webbit );
  });


}

function getWebbits( user, q, callback ){
  Webbit.find(q).sort({position: 1, name: 1}).execWithUser( user, callback );
}

function getWebbit( req, res, next ){
  Webbit.findById(req.params.id, function( err, webbit ){
    req.webbit = webbit;
    next();
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