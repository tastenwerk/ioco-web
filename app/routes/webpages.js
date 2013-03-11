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
          q = {paths: new RegExp('^'+req.query.parentId+':[a-zA-Z0-9]*$')};
        if( req.query.roots )
          q = {paths: []};
        getWebpages( res.locals.currentUser, q, function( err, webpages ){
          res.json( webpages );
        });
      }

    });
  });

  app.get('/webpages/:id/edit:format?', ioco.plugins.auth.check, getWebpage, function( req, res ){
    res.render( ioco.view.lookup( '/webpages/edit.jade' ), {flash: req.flash(), webpage: req.webPage });
  });

}

function getWebpages( user, q, callback ){
  WebPage.find(q).sort({position: 1, name: 1}).execWithUser( user, callback );
}

function getWebpage( req, res, next ){
  WebPage.findById(req.param.id).execWithUser( res.locals.currentUser || User.anybody, function( err, webPage ){
    req.webPage = webPage;
    next();
  });
}