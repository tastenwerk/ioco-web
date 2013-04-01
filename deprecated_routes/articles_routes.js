var ioco = require('ioco')
  , WebElement = require( __dirname + '/../models/web_element' )
  , common = require( __dirname + '/../lib/web_elements_common' );

module.exports = exports = function( app ){
  
  app.get('/articles', function( req, res ){
    res.render( ioco.view.lookup('/articles/index.jade') )
  });

  app.get('/articles/sidebar_content', ioco.plugins.auth.check, function( req,res ){
    res.render( __dirname + '/../views/articles/sidebar_content' );
  });

  /**
   * new article
   */
  app.get('/articles/new', ioco.plugins.auth.check, function( req, res ){
    res.render( ioco.view.lookup( 'articles/edit.ejs' ), { web_element: null} );
  });

  /**
   * show article (in form)
   */
  app.get('/articles/:id', ioco.plugins.auth.check, common.getWebElement, function( req, res ){
    if( !req.web_element )
      req.flash('error', req.i18n.t('not_found') );
    res.render( ioco.view.lookup( '/articles/edit.ejs' ), {flash: req.flash(), web_element: req.web_element });
  });


}