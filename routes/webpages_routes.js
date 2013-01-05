var iokit = require('iokit')
  , WebElement = require( __dirname + '/../models/web_element' )
  , common = require( __dirname + '/../lib/web_elements_common' );

module.exports = exports = function( app ){

  /**
   * the webpages tree can be used in any location
   * inside and outside the backend to maintain and CRUD webpages.
   *
   * calling 
   *  $.getScript('/webpages/tree', function(){ ko.applyBindings( WebpagesTreeViewModel, '#mytreecontainer-id') }
   * will invoke the tree on mytreecontainer-id
   */
  app.get('/webpages/tree', iokit.plugins.auth.check, function( req, res ){
    res.render( iokit.view.lookup( 'webpages/tree.ejs' ) );
  });

  /**
   * new webpage
   */
  app.get('/webpages/new', iokit.plugins.auth.check, function( req, res ){
    var webElement = new WebElement( { _subtype: 'Webpage', holder: res.locals.currentUser, name: '' })
    res.render( iokit.view.lookup( 'webpages/new.ejs'), { webElement: webElement } );
  });

  app.get('/webpages:format?', iokit.plugins.auth.check, function( req, res ){

    res.format({

      html: function(){
        res.render( iokit.view.lookup('/webpages/index.jade'))
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

  app.get('/webpages/:id/edit:format?', iokit.plugins.auth.check, common.getWebElement, function( req, res ){
    res.render( iokit.view.lookup( '/webpages/edit.jade' ), {flash: req.flash(), webpage: req.webElement });
  });

  app.get( '/p/:slug*', iokit.plugins.auth.checkWithoutRedirect, common.getPublicWebElement, function( req, res ){
    if( req.webElement )
      WebElement.update({_id: req.webElement._id}, {$inc: {'stat.views': 1}}, {safe: true}, function( err ){
        if( err ) console.log('error: ', err);
        res.render( 
          iokit.view.lookup( '/webpages/layouts/'+( req.webElement.layout || 'default' )+'.jade' ), 
          {webElement: req.webElement} 
        );
      });
    else
      res.send(404);
  });

}

function getWebpages( user, q, callback ){
  q._subtype = 'Webpage';
  WebElement.find(q).execWithUser( user, callback );
}