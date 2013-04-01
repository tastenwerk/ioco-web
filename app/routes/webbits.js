/*
 * ioco-web / WebBit routes
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */
var ioco = require('ioco')
  , User = ioco.db.model('User')
  , WebBit = ioco.db.model('WebBit');

var sanitize = require('validator').sanitize;

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
        root: sanitize( req.body.webbit.root ).toBoolean(),
        library: sanitize( req.body.webbit.library ).toBoolean()
      };
      if( req.body.webbit.category )
        attrs.category = req.body.webbit.category;
      WebBit.create( attrs, function( err, webbit ){
        res.json({ success: err === null, error: err, data: webbit });
      });
    }
  });

  app.get('/webbits/:id/edit:format?', ioco.plugins.auth.check, getWebbit, function( req, res ){
    res.render( ioco.view.lookup( '/webbits/edit.jade' ), {flash: req.flash(), webbit: req.webbit });
  });
  
  /**
   * get a webbit freshly rendered
   * with api settings
   *
   * but don't save the webbit
   * to the database
   */
  app.put('/webbits/:id/preview.json', ioco.plugins.auth.check, function( req, res ){

    pageDesigner.WebBit.loadById( req.params.id, { api: req.body.api }, function( err, webbit ){

      if( err )
        return res.json({ error: [ err.toString() ] });

      var webbitJSON = webbit.toObject();
      if( webbit.serverProcContent )
        webbitJSON.serverProcContent = webbit.serverProcContent;

      res.json( webbitJSON );

    })

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

    WebBit.find({ library: true }).sort({name: 1}).exec( function( err, webBits ){
      res.json( webBits );
    });
    
  });

  /**
   * load all webbits
   * which are marked with
   * library
   */
  app.get( '/webbits/templates.json', ioco.plugins.auth.check, function( req, res ){

    WebBit.find({ template: true }).sort({name: 1}).exec( function( err, webBits ){
      res.json( webBits );
    });
    
  });

  /**
   * get a specific webbit
   *
   */
  app.get('/webbits/:id.json', ioco.plugins.auth.check, getWebbit, function( req, res ){
    res.json( req.webbit );
  });

}

function getWebbits( user, q, callback ){
  WebBit.find(q).sort({position: 1, name: 1}).execWithUser( user, callback );
}

function getWebbit( req, res, next ){
  WebBit.findById(req.params.id, function( err, webbit ){
    req.webbit = webbit;
    next();
  });
}

var pageDesigner = require( __dirname + '/../helper/page_designer_ext' );