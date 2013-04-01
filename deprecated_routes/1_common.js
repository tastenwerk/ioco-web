var ioco = require('ioco')
  , WebElement = require( __dirname + '/../models/web_element' )
  , common = require( __dirname + '/../lib/web_elements_common' );
  
module.exports = exports = function( app ){
  
  /**
   * retreive all webelements with
   * given query
   *
   */
  app.get('/webelements:format?', ioco.plugins.auth.check, common.getWebElements, function( req, res ){

    if( req.webElements )
      res.json( { data: req.webElements, success: true } );
    else
      res.json( [] );
        
  });

  /**
   * create a web_element
   */
  app.post('/webelements', ioco.plugins.auth.check, function( req, res ){
    if( !res.locals.currentUser || (res.locals.currentUser && res.locals.currentUser.groups.indexOf('editor') < 0 && res.locals.currentUser.groups.indexOf('manager') < 0 ))
      return res.json( {flash: {error: req.i18n.t('insufficient_rights')}} );
    var attrs = { holder: res.locals.currentUser };
    for( var i in req.body.webElement )
      attrs[i] = req.body.webElement[i];
    var webElement = new WebElement( attrs );
    webElement.save( function( err ){
      if( err ){
        console.log(err);
        if( err.code === 11000 ) // duplicate key
          req.flash('error', req.i18n.t('duplicate_error', {name: webElement.name }) );
        else
          req.flash('error', err);
      }else
        req.flash('notice', req.i18n.t('saving.ok', {name: webElement.name}));
      res.json( {webElement: webElement, flash: req.flash(), success: ( err === null ) } );
    });
  });

  /**
   * get a web_element, lookup if there is a layout to render it with
   * and render it
   */
  app.get('/webelements/:id', ioco.plugins.auth.checkWithoutRedirect, common.getPublicWebElement, function( req, res ){
    if( req.query.fio )
      return res.render( ioco.view.lookup('/webpages/index.jade'), {webElementId: req.params.id} );
    if( req.webElement )
      res.render( ioco.view.lookup( '/'+req.webElement._subtype.toLowerCase()+'s/layouts/'+( req.webElement.layout || 'default' )+'.jade' ), 
          {webElement: req.webElement} );
    else
      res.send(404)
  });

  /**
   * update a web_element
   */
  app.put('/webelements/:id', ioco.plugins.auth.check, common.getWebElement, function( req, res ){
    if( req.webElement ){
      for( var i in req.body.webElement )
        if( !i.match(/_id|createdAt|_creator|_updater|updatedAt|deletedAt|acl/) )
          req.webElement[i] = req.body.webElement[i];
      req.webElement.save( function( err ){
        if( err )
          console.log(err);
        else
          req.flash('notice', req.i18n.t('saving.ok', {name: req.webElement.name}));
        res.json({ success: (err === null), flash: req.flash() });
      });
    } else{
      req.flash('error', req.i18n.t('not_found') );
      req.json({ success: false, flash: req.flash() });
    }
  });

}