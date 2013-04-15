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

  app.get('/p/:permaIdAndName', ioco.plugins.auth.checkWithoutRedirect, function( req, res ){
    var permaId = (req.params.permaIdAndName.indexOf('-') ? req.params.permaIdAndName.split('-')[0] : '0');
    Webpage.findOne({permaId: permaId}).execWithUser( res.locals.currentUser || User.anybody, function( err, webpage ){
    if( ! webpage )
        res.render( ioco.view.lookup('/defaults/404.jade') );
      else{
        
        populateChildrenOf( webpage, function(err, webpage){
        
          var pageDesigner = require('ioco-pagedesigner');
          var iocoWebpage = new pageDesigner.Webpage( webpage );
          
          res.render( ioco.view.lookup('/webpages/show.jade'), { 
            webpage: webpage, 
            currentUser: res.locals.currentUser || null,
            content: iocoWebpage.render({ revision: 'master' }),
            config: iocoWebpage.getRevision('master').config } );

        });

      }

    });
  })


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
      req.webpage.slug = req.body.webpage.slug;
      req.webpage.markModified( 'revisions' );

      WebbitsHelper.attachItems( req.webpage, req.body.webpage.items, function( err ){

        for( var i in req.webpage._insertedItems ){
          var match = false;
          for( var j in req.webpage.items )
            if( req.webpage.items[j].toString() === req.webpage._insertedItems[i]._id.toString() )
              match = true;
          if( !match )
            req.webpage.items.push( req.webpage._insertedItems[i]._id );
        }

        if( err )
          console.log('error', err);

        req.webpage.save( function( err ){
          if( err )
            return res.json( err );
          res.json(err);
        });

      });

    } else // no req.webpage
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

  app.get('/webpages/:id', ioco.plugins.auth.check, function( req, res ){
    Webpage.findById(req.params.id).execWithUser( res.locals.currentUser, function( err, webpage ){
      populateChildrenOf( webpage, function(err, webpage){
        res.json( webpage );
      });
    });
  });

}

function populateChildrenOf( item, callback ){
  var counter = 0
  console.log('got entered pop', item.name, item.items);
  function populateNextChild(){
    if( counter >= item.items.length )
      return callback( null, item );
    console.log('populating ', item.name, item.items, counter );
    Webbit.findById( item.items[counter], function( err, webbit ){
      if( err )
        console.log('error', err);
      item.items[counter] = webbit;
      populateChildrenOf( webbit, function( err, webbit ){
        counter++;
        populateNextChild();
      })
    });
  }
  populateNextChild();
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
