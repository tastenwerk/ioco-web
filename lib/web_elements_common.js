var qs = require('querystring')
  WebElement = require( __dirname + '/../models/web_element' )
  , iomapper = require('iomapper');

module.exports = exports = {

  getWebElements: function getWebElements( req, res, next ){
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
    var q = WebElement.find(query);
    req.query.order ? q.sort(req.query.order) : q.sort('-createdAt');
    q.populate('_creator').execWithUser( res.locals.currentUser, function( err, webElements ){
      if( err ) return next( err );
      req.webElements = webElements
      next();
    })
  },

  getPublicWebElement: function getPublicWebElement( req, res, next ){
    var q = {};
    if( req.params.id )
      q._id = ioco.db.Schema.Types.ObjectId( req.params.id );
    else if( req.params.slug )
      q.slug = '/' + qs.escape( req.params.slug );
    var user = res.locals.currentUser || ioco.db.model('User').anybody;
    WebElement.findOne( q ).execWithUser( user, function( err, webElement ){
      if( err ) req.flash('error', err);
      req.webElement = webElement;
      next();
    });
  },

  getWebElement: function getWebElement( req, res, next ){
    WebElement.findById(req.params.id).execWithUser( res.locals.currentUser, function( err, webElement ){
      if( err ){
        req.flash('error', req.i18n.t('not_found'))
        return next( err );
      }
      req.webElement = webElement;
      next();
    });
  }
  
};