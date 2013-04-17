/*
 * ioco-web / Webpage routes
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var sanitize = require('validator').sanitize;
var qs = require('querystring');

var ioco = require('ioco')
  , User = ioco.db.model('User')
  , Webbit = ioco.db.model('Webbit')
  , Webpage = ioco.db.model('Webpage')
  , WebbitsHelper = require( __dirname+'/../helper/webbits_helper')
  , Label = ioco.db.model('Label');

module.exports = exports = function( app ){


  app.get( '/webpages:format?', ioco.plugins.auth.check, function( req, res ){

    res.format({

      html: function(){
        res.locals.pageTemplates = Object.keys( ioco.web.templates ).map(function(tmpl){ return { value: tmpl, text: ioco.web.templates[tmpl].name } });
        res.render( ioco.view.lookup('/webpages/index.jade'))
      },

      json: function(){
        var q = {};
        if( req.query.id && req.query.id !== '000000' )
          q = {_labelIds: new RegExp('^[a-zA-Z0-9]*:'+req.query.id+'$')};
        else
          q = { _labelIds: [] };
        getWebpages( res.locals.currentUser, q, function( err, webpages ){
          if( !req.query.id )
            webpages = [ { name: ioco.config.site.title, _subtype: 'Domain', _childrenIds: [1], _type: 'Domain', expanded: true, _id: '000000', id: '000000' } ];
          res.json( webpages );
        });
      }

    });
  });

  app.get('/p/:nameAndPermaId', ioco.plugins.auth.checkWithoutRedirect, function( req, res ){
    var permaId = (req.params.nameAndPermaId.indexOf('-') ? req.params.nameAndPermaId.split('-')[req.params.nameAndPermaId.split('-').length-1] : '0');
    Webpage.findOne({permaId: permaId}).populate('webbits').execWithUser( res.locals.currentUser || User.anybody, function( err, webpage ){
    if( ! webpage )
        res.render( ioco.view.lookup('/defaults/404.jade') );
      else
        
        res.render( ioco.view.lookup('/webpages/show.jade'), { 
          webpage: webpage, 
          currentUser: res.locals.currentUser || null } );

    });
  })

  app.post('/webpages', ioco.plugins.auth.check, function( req, res ){
    
    var webpage = new Webpage( { name: req.body.webpage.name, config: { template: req.body.webpage.template, frontpage: false, hidden: false }, holder: res.locals.currentUser } );
    
    if( req.body.webpage._labelIds && req.body.webpage._labelIds.length > 0 )
      webpage.addLabel( req.body.webpage._labelIds[0] );
    if( req.body._subtype )
      webpage._subtype = req.body._subtype;

    webpage.save( function( err, webpage ){
      res.json( webpage );
    });

  });

  /**
   * update a webpage (this is only done by the pagedesigner implementation)
   * therefore the response is exptected to be null if successful.
   *
   * # Parameters
   *  * webpage
   *  * * name, revisions, slug
   *  * * items ( webbits array )
   *
   * @api public
   */
  app.put('/webpages/:id', ioco.plugins.auth.check, getWebpage, function( req, res ){
    if( req.webpage ){
      req.webpage.name = req.body.webpage.name;
      req.webpage.revisions = req.body.webpage.revisions;
      req.webpage.markModified( 'revisions' );

      req.webpage.save( function( err ){
        if( err )
          req.flash('error', err);
        else
          req.flash('notice', req.i18n.t('saving.ok', {name: req.webpage.name}) );
        res.json({ success: err===null, flash: req.flash() });
      });

    } else // no req.webpage
      res.json({ success: false, error: 'could not find webpage' });
  });

/**
 * change order of webpage's children
 *
 * @api public
 */
app.put( '/webpages/order_children/:id', ioco.plugins.auth.check, getWebpage, function( req, res ){

  reorderChildren( 0, req.body.childrenIds, req.webpage, function( err ){
    res.json( err )
  });

});

  /**
   * get a webpage by it's id
   *
   * @api public
   */
  app.get('/webpages/:id', ioco.plugins.auth.check, function( req, res ){
    Webpage.findById(req.params.id).populate('webbits').execWithUser( res.locals.currentUser, function( err, webpage ){
      webpage.content = webpage.render();
      res.json( webpage );
    });
  });

}

function reorderChildren( count, children, parent, callback ){
  if( count >= children.length )
    return callback(null);
  Webpage.findById( children[count], function( err, child ){
    if( err )
      return callback( err );
    child.pos = count;
    child.clearLabels();
    if( parent )
      child.addLabel( parent );
    child.save( function( err ){
      if( err )
        return callback( err );
      if( parent && !parent.hasChild( child ) ){
        parent.addChild( child );
        parent.save( function( err ){
          if( err )
            return callback( err );
          reorderChildren( ++count, children, parent, callback );          
        });
      } else
        reorderChildren( ++count, children, parent, callback );
    });
  });
}

function getWebpages( user, q, callback ){
  Webpage.find(q).sort({pos: 1, name: 1}).execWithUser( user, callback );
}

function getWebpage( req, res, next ){
  Webpage.findById(req.params.id).execWithUser( res.locals.currentUser || User.anybody, function( err, webpage ){
    req.webpage = webpage;
    next();
  });
}

function getPublicWebpage( req, res, next ){
  var q = {};
  if( req.params.id )
    q._id = ioco.db.Schema.Types.ObjectId( req.params.id );
  else if( req.params.slug )
    q.slug = '/' + qs.escape( req.params.slug );
  var user = res.locals.currentUser || ioco.db.model('User').anybody;
  Webpage.findOne( q ).execWithUser( user, function( err, webpage ){
    if( err ) req.flash('error', err);
    req.webpage = webpage;
    next();
  });
}
