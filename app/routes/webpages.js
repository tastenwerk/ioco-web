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
  , Label = ioco.db.model('Label');

module.exports = exports = function( app ){


  app.get( '/webpages:format?', ioco.plugins.auth.check, function( req, res ){

    res.format({

      html: function(){
        res.render( ioco.view.lookup('/webpages/index.jade'))
      },

      json: function(){
        var q = {};
        if( req.query._id )
          q = {_labelIds: new RegExp('^[a-zA-Z0-9]*:'+req.query._id+'$')};
        else
          q = { _labelIds: [] };
        getWebpages( res.locals.currentUser, q, function( err, webpages ){
          getWebpageLabels( res.locals.currentUser, q, function( err, folders ){
            var all = webpages.concat( folders );
            all = all.sort( function( a, b ){
              if( a.pos < b.pos )
                return -1;
              if( a.pos > b.pos )
                return 1;
              if( a.name < b.name )
                return -1;
              if( a.name > b.name )
                return 1;
              return 0;
            })
            res.json( all );
          });
        });
      }

    });
  });


  /**
   * find a web_page by it's slug
   * name
   *
   */
  app.get( '/p/:slug*', ioco.plugins.auth.checkWithoutRedirect, getPublicWebpage, function( req, res ){

    var attrs = {$inc: {'stat.views': 1}};

    if( req.webpage )
      Webpage.update({_id: req.webpage._id}, attrs, {safe: true}, function( err ){
        if( err ) console.log('error: ', err);

        var webBits = [];
        var counter = 0;

        var webpage = new pageDesigner.Webpage( req.webpage );
        webpage.initialize( req, res, function( err, webpage ){
          var rwb = webpage.rootWebbit;
          res.render( __dirname + '/../views/webpages/show.jade', { includeCSS: rwb.properties.includeCSS && rwb.properties.includeCSS.replace(/ /g,'').split(','),
                                                                    includeJS: rwb.properties.includeJS && rwb.properties.includeJS.replace(/ /g,'').split(','),
                                                                    webpage: webpage,
                                                                    currentUser: res.locals.currentUser || null,
                                                                    renderedContent: webpage.render() } );
        });

      });
    else
      res.send(404);
  });

  app.post('/webpages', ioco.plugins.auth.check, function( req, res ){
    function createWebpage( newWebbitId ){
      var webpage = new Webpage( { name: req.body.webpage.name, holder: res.locals.currentUser, rootWebbitId: newWebbitId } );
      if( req.body.webpage._labelIds && req.body.webpage._labelIds.length > 0 )
        webpage.addLabel( req.body.webpage._labelIds[0] );
      webpage.save( function( err, webpage ){
        res.json( webpage );
      });
    }

    if( req.body.webpage && req.body.webpage.name.length > 1 ){
      if( req.body.templateId )
        Webbit.deepCopy( req.body.templateId, function( err, webbit ){
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

  app.post('/webpage_labels', ioco.plugins.auth.check, function( req, res ){

    var label = new Label( { name: req.body.label.name, holder: res.locals.currentUser, _subtype: 'WebLabel' } );
    if( req.body.label._labelIds && req.body.label._labelIds.length > 0 )
      label.addLabel( req.body.label._labelIds[0] );
    label.save( function( err, label ){
      res.json( label );
    });

  });

  app.put('/webpages_reorder', ioco.plugins.auth.check, getWebpage, getLabel, function( req, res ){
    res.set('Content-Type', 'application/json');
    if( req.webpage ){
      console.log( req.body )
    }
    res.json(null);
  });

  app.put('/webpages/:id', ioco.plugins.auth.check, getWebpage, function( req, res ){
    if( req.webpage ){
      req.webpage.name = req.body.webpage.name || req.webpage.name;
      req.webpage.config = req.body.webpage.config || req.webpage.config;
      req.webpage.revisions = req.body.webpage.revisions || req.webpage.revisions;
      req.webpage.slug = req.body.webpage.slug || req.webpage.slug;
      req.webpage.markModified( 'config' );
      req.webpage.markModified( 'revisions' );
      req.webpage.createVersion();
      console.log( req.body.webpage.items );
      req.webpage.save( function( err ){
        if( err )
          req.flash('error', err);
        else
          req.flash('notice', req.i18n.t('saving.ok', {name: req.webpage.name}));
        if( req.webpage.rootWebbitId ){
          Webbit.findById( req.webpage.rootWebbitId, function( err, webbit ){
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

  app.delete('/webpages/:id', ioco.plugins.auth.check, getWebpage, getLabel, function( req, res ){
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

  app.get('/webpages/:id', ioco.plugins.auth.check, getWebpage, function( req, res ){
    res.json( req.webpage );
  });

}

function getWebpages( user, q, callback ){
  Webpage.find(q).sort({position: 1, name: 1}).execWithUser( user, callback );
}

function getWebpageLabels( user, q, callback ){
  Label.find(q).where('_subtype', 'WebLabel').sort({position: 1, name: 1}).execWithUser( user, callback );
}

function getWebpage( req, res, next ){
  Webpage.findById(req.params.id).populate('items').execWithUser( res.locals.currentUser || User.anybody, function( err, webpage ){
    req.webpage = webpage;
    next();
  });
}

/**
 * get a webLabel, if no webpage with given
 * id was found
 */
function getLabel( req, res, next ){
  if( req.webpage )
    return next();
  Label.findById(req.params.id).execWithUser( res.locals.currentUser || User.anybody, function( err, webpage ){
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
