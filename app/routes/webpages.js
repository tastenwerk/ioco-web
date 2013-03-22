/*
 * ioco-web / WebPage routes
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */


var cheerio = require('cheerio');
var sanitize = require('validator').sanitize;
var qs = require('querystring');

var ioco = require('ioco')
  , User = ioco.db.model('User')
  , WebPage = ioco.db.model('WebPage')
  , WebBit = ioco.db.model('WebBit');

module.exports = exports = function( app ){

  /**
   * the webpages tree can be used in any location
   * inside and outside the backend to maintain and CRUD webpages.
   *
   * calling 
   *  $.getScript('/webpages/tree', function(){ ko.applyBindings( WebpagesTreeViewModel, '#mytreecontainer-id') }
   * will invoke the tree on mytreecontainer-id
   */
  app.get( '/webpages/tree', ioco.plugins.auth.check, function( req, res ){
    res.render( ioco.view.lookup( 'webpages/tree.ejs' ) );
  });

  app.get( '/webpages:format?', ioco.plugins.auth.check, function( req, res ){

    res.format({

      html: function(){
        res.render( ioco.view.lookup('/webpages/index.jade'))
      },

      json: function(){
        var q = {};
        if( req.query.parentId )
          q = {_labelIds: new RegExp('^'+req.query.parentId+':[a-zA-Z0-9]*$')};
        if( req.query.roots )
          q = {_labelIds: []};
        getWebpages( res.locals.currentUser, q, function( err, webpages ){
          res.json({ success: err === null, data: webpages });
        });
      }

    });
  });


  /**
   * find a web_page by it's slug
   * name
   *
   */
  app.get( '/p/:slug*', ioco.plugins.auth.checkWithoutRedirect, getPublicWebPage, function( req, res ){

    if( req.webpage )
      WebPage.update({_id: req.webpage._id}, {$inc: {'stat.views': 1}}, {safe: true}, function( err ){
        if( err ) console.log('error: ', err);

        var webBits = [];
        var counter = 0;

        var webpage = new pageDesigner.WebPage( req.webpage );
        webpage.initialize( function( err, webpage ){
          var rwb = webpage.rootWebBit;
          res.render( __dirname + '/../views/webpages/show.jade', { includeCSS: rwb.properties.includeCSS && rwb.properties.includeCSS.replace(/ /g,'').split(','),
                                                                    includeJS: rwb.properties.includeJS && rwb.properties.includeJS.replace(/ /g,'').split(','),
                                                                    webpage: webpage,
                                                                    renderedContent: webpage.render() } );
        });

      });
    else
      res.send(404);
  });

  app.post('/webpages', ioco.plugins.auth.check, function( req, res ){
    function createWebpage( newWebbitId ){
      WebPage.create( { name: req.body.webpage.name, holder: res.locals.currentUser, rootWebBitId: newWebbitId }, function( err, webpage ){
        res.json({ success: err === null, error: err, webpage: webpage });
      });
    }

    if( req.body.webpage && req.body.webpage.name.length > 1 ){
      if( req.body.templateId )
        WebBit.deepCopy( req.body.templateId, function( err, webbit ){
          if( err )
            res.json({ success: false, error: err });
          console.log('[webpage] got: ', webbit);
          if( webbit )
            createWebpage( webbit._id );
        });
      else
        createWebpage();
    }
  });

  app.put('/webpages/:id', ioco.plugins.auth.check, getWebpage, function( req, res ){
    if( req.webpage ){
      req.webpage.name = req.body.webpage.name || req.webpage.name;
      req.webpage.properties = req.body.webpage.properties || req.webpage.properties;
      req.webpage.slug = req.body.webpage.slug || req.webpage.slug;
      req.webpage.template = sanitize(req.body.webpage.template || req.webpage.template).toBoolean();
      req.webpage.markModified( 'properties' );
      req.webpage.save( function( err ){
        if( err )
          req.flash('error', err);
        else
          req.flash('notice', req.i18n.t('saving.ok', {name: req.webpage.name}));
        if( req.webpage.rootWebBitId ){
          WebBit.findById( req.webpage.rootWebBitId, function( err, webbit ){
            if( err ) return res.json({ success: false, error: err });
            if( webbit )
              webbit.update({ template: req.webpage.template, name: req.webpage.name }, function( err ){
                res.json({ success: err === null, error: err, webpage: req.webpage, flash: req.flash() });        
              });
          });
          res.json({ success: err === null, error: err, webpage: req.webpage, flash: req.flash() });
        } else
          res.json({ success: err === null, error: err, webpage: req.webpage, flash: req.flash() });
      });
    } else
      res.json({ success: false, error: 'could not find webpage' });
  });


  app.delete('/webpages/:id', ioco.plugins.auth.check, getWebpage, function( req, res ){
    if( req.webpage )
      req.webpage.remove( function( err ){
        res.json({ success: err === null, error: err, webpage: req.webpage });
      });
    else
      res.json({ success: false, error: 'not found' });
  });

  app.get('/webpages/:id/edit:format?', ioco.plugins.auth.check, getWebpage, function( req, res ){
    res.render( ioco.view.lookup( '/webpages/edit.jade' ), {flash: req.flash(), webpage: req.webpage });
  });

}

function getWebpages( user, q, callback ){
  WebPage.find(q).sort({position: 1, name: 1}).execWithUser( user, callback );
}

function getWebpage( req, res, next ){
  WebPage.findById(req.params.id).execWithUser( res.locals.currentUser || User.anybody, function( err, webpage ){
    req.webpage = webpage;
    next();
  });
}

function getPublicWebPage( req, res, next ){
  var q = {};
  if( req.params.id )
    q._id = ioco.db.Schema.Types.ObjectId( req.params.id );
  else if( req.params.slug )
    q.slug = '/' + qs.escape( req.params.slug );
  var user = res.locals.currentUser || ioco.db.model('User').anybody;
  WebPage.findOne( q ).execWithUser( user, function( err, webpage ){
    if( err ) req.flash('error', err);
    req.webpage = webpage;
    next();
  });
}

    
var pageDesigner = require('ioco-pagedesigner').lib;

/**
 * overrides jquery method
 */
pageDesigner.WebBit.loadById = function loadWebBitById( id, callback ){
  WebBit.findById( id, function( err, webbit ){
    if( err ) return callback( err );
    if( !webbit ) return callback( 'webbit not found' );
    callback( null, new pageDesigner.WebBit( webbit ) );
  });
}
