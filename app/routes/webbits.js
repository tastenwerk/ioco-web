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
      
      req.webbit.update( attrs, function( err ){
        res.json({ success: err === null, error: err, data: req.webbit });
      });
    }
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