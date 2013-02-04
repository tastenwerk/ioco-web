var qs = require('querystring');

var iokit = require('iokit')
  , WebPage = require( __dirname + '/../models/web_page' );

function getWebPages( req, res, next ){
  var query = {};
  if( req.query.parentId )
    query = {paths: new RegExp('^'+req.query.parentId+':[a-zA-Z0-9]*$')};
  if( req.query.roots )
    query = {paths: []};
  if( req.query._subtype ) 
    query = (req.query._subtype.indexOf('|') > 0 ? 
      { $or: 
        req.query._subtype.split('|').map(function( elem ){
          return {_subtype: elem};
        }) 
      } :
      req.query._subtype);
  if( req.query.navElem ) query.navElem = true;
  if( req.query.waiting ) query.waiting = req.query.waiting === 'true';
  if( req.query.mine ) query._creator = res.locals.currentUser._id.toString();
  var q = WebPage.find(query);
  req.query.order ? q.sort(req.query.order) : q.sort('-createdAt');
  q.populate('_creator').execWithUser( res.locals.currentUser, function( err, webPages ){
    if( err ) return next( err );
    req.webPages = webPages
    next();
  })
}

function getPublicWebPage( req, res, next ){
  var q = {};
  if( req.params.id )
    q._id = iomapper.mongoose.Types.ObjectId( req.params.id );
  else if( req.params.slug )
    q.slug = '/' + qs.escape( req.params.slug );
  var user = res.locals.currentUser || iomapper.mongoose.models.User.anybody;
  WebPage.findOne( q ).populate('WebBit').execWithUser( user, function( err, webPage ){
    if( err ) req.flash('error', err);
    req.webPage = webPage;
    next();
  });
}

function getWebPage( req, res, next ){
  WebPage.findById(req.params.id).execWithUser( res.locals.currentUser, function( err, webPage ){
    if( err ){
      req.flash('error', req.i18n.t('not_found'))
      return next( err );
    }
    req.webPage = webPage;
    next();
  });
}
  

module.exports = exports = function( app ){
  
  /**
   * retreive all web_pages with
   * given query
   *
   */
  app.get('/web_pages:format?', iokit.plugins.auth.check, getWebPages, function( req, res ){

    res.format({

      html: function(){
        res.render( iokit.view.lookup('/web_pages/index.jade'))
      },
      json: function(){
        if( req.webPages )
          res.json( { data: req.webPages, success: true } );
        else
          res.json( [] );
      }
      
    });
        
  });

  /**
   * create a web_page
   */
  app.post('/web_pages', iokit.plugins.auth.check, function( req, res ){
    if( !res.locals.currentUser || (res.locals.currentUser && res.locals.currentUser.roles.indexOf('editor') < 0 && res.locals.currentUser.roles.indexOf('manager') < 0 ))
      return res.json( {flash: {error: req.i18n.t('insufficient_rights')}} );
    var attrs = { holder: res.locals.currentUser };
    for( var i in req.body.webPage )
      attrs[i] = req.body.webPage[i];
    var webPage = new WebPage( attrs );
    webPage.save( function( err ){
      if( err ){
        console.log(err);
        if( err.code === 11000 ) // duplicate key
          req.flash('error', req.i18n.t('duplicate_error', {name: webPage.name }) );
        else
          req.flash('error', err);
      }else
        req.flash('notice', req.i18n.t('saving.ok', {name: webPage.name}));
      res.json( {webPage: webPage, flash: req.flash(), success: ( err === null ) } );
    });
  });

  /**
   * get a web_page, lookup if there is a layout to render it with
   * and render it
   *
  app.get('/web_pages/:id', iokit.plugins.auth.checkWithoutRedirect, getPublicWebPage, function( req, res ){
    if( req.query.fio )
      return res.render( iokit.view.lookup('/web_pages/index.jade'), {webPageId: req.params.id} );
    if( req.webPage )
      res.render( iokit.view.lookup( '/'+req.webPage._subtype.toLowerCase()+'s/layouts/'+( req.webPage.layout || 'default' )+'.jade' ), 
          {webPage: req.webPage} );
    else
      res.send(404)
  });
  /*

  /**
   * find a web_page by it's slug
   * name
   */
  app.get( '/pub/:slug*', iokit.plugins.auth.checkWithoutRedirect, getPublicWebPage, function( req, res ){
    if( req.webPage )
      WebPage.update({_id: req.webPage._id}, {$inc: {'stat.views': 1}}, {safe: true}, function( err ){
        if( err ) console.log('error: ', err);
        res.render( 
          iokit.view.lookup( '/web_pages/show.jade' ), 
          {webPage: req.webPage} 
        );
      });
    else
      res.send(404);
  });

  /**
   * update a web_page
   */
  app.put('/web_pages/:id', iokit.plugins.auth.check, getWebPage, function( req, res ){
    if( req.webPage ){
      for( var i in req.body.webPage )
        if( !i.match(/_id|createdAt|_creator|_updater|updatedAt|deletedAt|acl/) )
          req.webPage[i] = req.body.webPage[i];
      req.webPage.save( function( err ){
        if( err )
          console.log(err);
        else
          req.flash('notice', req.i18n.t('saving.ok', {name: req.webPage.name}));
        res.json({ success: (err === null), flash: req.flash() });
      });
    } else{
      req.flash('error', req.i18n.t('not_found') );
      req.json({ success: false, flash: req.flash() });
    }
  });


    app.delete('/web_pages/:id', iokit.plugins.auth.check, getWebPage, function( req, res ){

      if( !req.webPage.canDelete() ){
          req.flash('error', req.i18n.t('removeing.denied', {name: req.webPage.name}) );
          res.json( {flash: req.flash() } );
      } else {
        if( req.query.permanent ){
          req.webPage.remove( function( err ){
            if( err )
              req.flash('error', req.i18n.t('removing.permanent.failed', {name: req.webPage.name}));
            else
              req.flash('notice', req.i18n.t('removing.permanent.ok', {name: req.webPage.name}));
            res.json( { flash: req.flash(), success: ( err === null ) } );
          })
        } else {
          req.webPage.deletedAt = new Date();
          req.webPage.save( function( err ){
            if( err )
              req.flash('error', req.i18n.t('removing.failed', {name: req.webPage.name}));
            else
              req.flash('notice', req.i18n.t('removing.ok', {name: req.webPage.name}) + ' ' + 
                '<a href="/documents/'+req.webPage_id+'/undo" data-remote="true" class="undo" data-method="post">' +
                req.i18n.t('removing.undo') + '</a>');
            res.json( { flash: req.flash(), success: ( err === null ) } );
          });
        }
      }

    });


}