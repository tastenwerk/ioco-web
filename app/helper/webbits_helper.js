/*
 * ioco-web / Webbits Helper
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco');

var $ = require('cheerio');

var WebbitsHelper = {};

/**
 * attach items ( more like: associate them ) with given
 * webpage|webbit.
 *
 * If items have a valid _id, they are expected as known to
 * the database. If not, they will be created.
 *
 * Items will also be double-checked in given webbit|webpage
 * root
 *
 * @param {Webbit|Webpage}
 * @param {[Webbit]} array of webbits
 * @param {function(err)} callback with error parameter
 *
 * @api private
 */
function attachItems( root, webbits, callback ){

  var count = 0
  var errors = null;

  function parseNextWebbit(){
    if( errors )
      return callback( errors );
    if( !webbits || count >= webbits.length )
      return callback( errors );
    if( !webbits[count] )
      return callback( 'webbit invalid', webbits[count] );
    if( !webbits[ count ]._id )
      return callback( 'webbit has no _id attribute set', webbits[count] );
    if( webbits[count]._id.length < 24 )
      createWebbit();
    else
      updateWebbit();
  }

  parseNextWebbit();

  function createWebbit(){

    console.log( 'getting in webbit', webbits[count].name, webbits[count].revisions.master.views );
    var webbitHash = webbits[count];
    var clonedItems = createClone( webbitHash );

    //console.log('creating webbit with id', webbitHash._id, webbitHash._id.toString().length )

    attachItems( webbitHash, clonedItems, function( err ){
      if( err ) return callback( err );
      console.log('inserted items', webbitHash._insertedItems);
      ioco.db.model('Webbit').create( {name: webbitHash.name, pluginName: webbitHash.pluginName, revisions: webbitHash.revisions, items: (webbitHash._insertedItems || [])}, function( err, webbit ){
        root._insertedItems = root._insertedItems || [];
        root._insertedItems.push( webbit );
        for( var i in root.revisions )
          for( var j in root.revisions[i].views )
            for( var k in root.revisions[i].views[j].content ){
               var $content = $( '<div>'+root.revisions[i].views[j].content[k]+'</div>' );
               $content.find('[data-ioco-id='+webbitHash._id+']').each( function(){
                $(this).attr('data-ioco-id', webbit._id);
              });
              console.log('new content is', $content.html())
              root.revisions[i].views[j].content[k] = $content.html();
            }
        root._hasChanges = true;
        count++;
        parseNextWebbit();
      });
    });
  }

  function updateWebbit(){
    console.log( 'getting in webbit', webbits[count].name, webbits[count].revisions.master.views );
    var webbitHash = webbits[count];
    var clonedItems = createClone( webbitHash );
    attachItems( webbitHash, clonedItems, function( err ){
      if( err ) return callback( err );
      ioco.db.model('Webbit').findById( webbitHash._id, function( err, webbit ){
        console.log('updating webbit', webbitHash.name, ' ', webbitHash.revisions.master.views.default.content.default, webbitHash.items );



        for( var i in webbitHash._insertedItems ){
          var match = false;
          for( var j in webbit.items )
            if( webbit.items[j].toString() === webbitHash._insertedItems[i]._id.toString() )
              match = true;
          if( !match )
            webbit.items.push( webbitHash._insertedItems[i]._id );
        }

        webbit.revisions = webbitHash.revisions;
        webbit.name = webbitHash.name;
        webbit.config = webbitHash.config;
        webbit.markModified( 'revisions' );
        webbit.markModified( 'config' );
        webbit.save( function( err ){
          root.items = root.items || [];
          var match = false;
          for( var i in root.items )
            if( root.items[i].toString() === webbit._id.toString() )
              match = true;
          if( !match )
            root.items.push( webbit );
          count++;
          parseNextWebbit();
        });
      });
    }); 
  }

}

function createClone( hsh ){
  var clonedItems = []
  if( hsh.items && hsh.items.length > 0 )
    for( var i=0,bit;bit=hsh.items[i];i++ ){
      var hshcpy = {};
      for( var j in bit )
        hshcpy[j] = bit[j];
      clonedItems.push(hshcpy);
     }
  return clonedItems;
}

WebbitsHelper.attachItems = attachItems;

module.exports = exports = WebbitsHelper;