var ioco = require('ioco')
  , WebBit = require( __dirname + '/../models/web_bit' );

function getWebBits( req, res, next ){
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
  var q = WebBit.find(query);
  req.query.order ? q.sort(req.query.order) : q.sort('-createdAt');
  q.populate('_creator').execWithUser( res.locals.currentUser, function( err, webBits ){
    if( err ) return next( err );
    req.webBits = webBits
    next();
  })
}

function getPublicWebBit( req, res, next ){
  var q = {};
  if( req.params.id )
    q._id = ioco.db.Schema.Types.ObjectId( req.params.id );
  else if( req.params.slug )
    q.slug = '/' + qs.escape( req.params.slug );
  var user = res.locals.currentUser || ioco.db.model('User').anybody;
  WebBit.findOne( q ).execWithUser( user, function( err, webBit ){
    if( err ) req.flash('error', err);
    req.webBit = webBit;
    next();
  });
}

function getWebBit( req, res, next ){
  WebBit.findById(req.params.id).execWithUser( res.locals.currentUser, function( err, webBit ){
    if( err ){
      req.flash('error', req.i18n.t('not_found'))
      return next( err );
    }
    req.webBit = webBit;
    next();
  });
}
  

module.exports = exports = function( app ){
  
  /**
   * retreive all web_bits with
   * given query
   *
   */
  app.get('/web_bits:format?', ioco.plugins.auth.check, getWebBits, function( req, res ){

    if( req.webBits )
      res.json( { data: req.webBits, success: true } );
    else
      res.json( [] );
        
  });

  /**
   * create a web_bit
   */
  app.post('/web_bits', ioco.plugins.auth.check, function( req, res ){
    if( !res.locals.currentUser || (res.locals.currentUser && res.locals.currentUser.groups.indexOf('editor') < 0 && res.locals.currentUser.groups.indexOf('manager') < 0 ))
      return res.json( {flash: {error: req.i18n.t('insufficient_rights')}} );
    var attrs = { holder: res.locals.currentUser };
    for( var i in req.body.webBit )
      attrs[i] = req.body.webBit[i];
    var webBit = new WebBit( attrs );
    webBit.save( function( err ){
      if( err ){
        console.log(err);
        if( err.code === 11000 ) // duplicate key
          req.flash('error', req.i18n.t('duplicate_error', {name: webBit.name }) );
        else
          req.flash('error', err);
      }else
        req.flash('notice', req.i18n.t('saving.ok', {name: webBit.name}));
      res.json( {webBit: webBit, flash: req.flash(), success: ( err === null ) } );
    });
  });

  /**
   * get a web_bit
   */
  app.get('/web_bits/:id', ioco.plugins.auth.checkWithoutRedirect, getPublicWebBit, function( req, res ){
    res.json({ success: (typeof(req.webBit) === 'object'), webBit: req.webBit });
  });

  /**
   * update a web_bit
   */
  app.put('/web_bits/:id', ioco.plugins.auth.check, getWebBit, function( req, res ){
    if( req.webBit ){
      for( var i in req.body.webBit )
        if( !i.match(/_id|createdAt|_creator|_updater|updatedAt|deletedAt|acl/) )
          req.webBit[i] = req.body.webBit[i];
      req.webBit.markModified( 'properties' );
      req.webBit.save( function( err ){
        if( err )
          console.log(err);
        else
          req.flash('notice', req.i18n.t('saving.ok', {name: req.webBit.name}));
        res.json({ success: (err === null), flash: req.flash() });
      });
    } else{
      req.flash('error', req.i18n.t('not_found') );
      req.json({ success: false, flash: req.flash() });
    }
  });

}