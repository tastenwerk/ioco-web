/*
 * ioco-web / WebBit routes
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */
var ioco = require('ioco')
  , User = ioco.db.model('User')
  , WebBit = ioco.db.model('WebBit');

module.exports = exports = function( app ){

  /**
   * look up for a webbit
   *
   * @param {String} - ?name=<name>
   *
   */
  app.get( '/webbits.json', ioco.plugins.auth.check, function( req, res ){

    var q = {};
    if( req.query.parentId )
      q = {paths: new RegExp('^'+req.query.parentId+':[a-zA-Z0-9]*$')};
    if( req.query.roots )
      q = {paths: []};
    getWebbits( res.locals.currentUser, q, function( err, webbits ){
      res.json( webbits );
    });

  });

  /**
   * create a new webbit
   */
  app.post('/webbits', ioco.plugins.auth.check, function( req, res ){
    if( req.body.webbit && req.body.webbit.name.length > 1 ){
      WebBit.create( req.body.webbit, function( err, webbit ){
        res.json({ success: err === null, error: err, data: webbit });
      });
    }
  });

  /**
   * load all webbits
   * which are marked with
   * library
   */
  app.get( '/webbits/library.json', ioco.plugins.auth.check, function( req, res ){

    WebBit.find().sort({name: 1}).execWithUser( res.locals.currentUser, function( err, webBits ){
      res.json( webBits );
    });
    
  });

  app.get('/webbits/:id/edit:format?', ioco.plugins.auth.check, getWebbit, function( req, res ){
    res.render( ioco.view.lookup( '/webbits/edit.jade' ), {flash: req.flash(), webbit: req.webPage });
  });

}

function getWebbits( user, q, callback ){
  WebBit.find(q).sort({position: 1, name: 1}).execWithUser( user, callback );
}

function getWebbit( req, res, next ){
  WebBit.findById(req.param.id).execWithUser( res.locals.currentUser || User.anybody, function( err, webPage ){
    req.webPage = webPage;
    next();
  });
}