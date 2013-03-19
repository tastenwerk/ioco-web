/*
 * ioco-web / WebPage routes
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */
var ioco = require('ioco')
  , User = ioco.db.model('User')
  , WebPage = ioco.db.model('WebPage');

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

  app.post('/webpages', ioco.plugins.auth.check, function( req, res ){
    if( req.body.webpage && req.body.webpage.name.length > 1 ){
      WebPage.create( { name: req.body.webpage.name, holder: res.locals.currentUser }, function( err, webpage ){
        res.json({ success: err === null, error: err, webpage: webpage });
      });
    }
  });

  app.put('/webpages/:id', ioco.plugins.auth.check, getWebpage, function( req, res ){
    if( req.webpage )
      req.webpage.update( req.body.webpage, function( err ){
        res.json({ success: err === null, error: err, webpage: req.webpage });
      });
    else
      res.json({ success: false });
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