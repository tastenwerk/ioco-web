/*
 * ioco-web / Webpage model
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco')
  , qs = require('querystring')
  , pageDesigner = require('ioco-pagedesigner');

var WebpageSchema = ioco.db.Schema({
  _type: { type: String, default: 'Webpage' },
  slug: { type: String, required: true, index: { unique: true }, lowercase: true },
  stat: {type: ioco.db.Schema.Types.Mixed, default: {}},
  template: {type: Boolean, default: false },
  frontpage: {type: Boolean, default: false },
  hidden: {type: Boolean, default: false },
  rootWebBitId: { type: ioco.db.Schema.Types.ObjectId, ref: 'WebBit' }
})

WebpageSchema.plugin( ioco.getSchemaPlugin('Default') );
WebpageSchema.plugin( ioco.getSchemaPlugin('Versioning') );
WebpageSchema.plugin( ioco.getSchemaPlugin('Label') );
WebpageSchema.plugin( ioco.getSchemaPlugin('Access') );

/**
 * create or update the Webpage's slug
 * to keep it up-to-date with Webpage's
 * name
 *
 * This routine only applies, if the slug has not been
 * changed manually
 */
WebpageSchema.pre( 'validate', function createSlug( next ){

  var self = this;
  if( self.slug && self.slug.length > 0 )
    return next();
  
  function checkUniquenessOfSlug(){
    ioco.db.model('Webpage').findOne({slug: self.slug}, function( err, item ){
      var num = parseInt(self.name.substr( self.name.length-1, 1 ));
      if( item ){
        self.name = isNaN(num) ? self.name + ' 1' : self.name.substr(0, self.name.length-1) + (num+1).toString();
        self.slug = isNaN(num) ? self.slug + '1' : self.slug.substr(0, self.slug.length-1) + (num+1).toString();
        checkUniquenessOfSlug();
      } else
        next();
    });
  }
  this.ancestors( function( err, ancestors ){
    self.slug = '';
    if( ancestors ){
      ancestors.forEach( function( ancestor ){
        self.slug += ('/'+qs.escape(ancestor.name));
      });
    }
    self.slug += ('/' + qs.escape(self.name));
    checkUniquenessOfSlug()
  });

});

// pageDesigner extensions
WebpageSchema.method( 'getRevision', pageDesigner.renderer.getRevision );
WebpageSchema.method( 'getView', pageDesigner.renderer.getRevision );
WebpageSchema.method( 'getLang', pageDesigner.renderer.getRevision );
WebpageSchema.method( 'renderStyles', pageDesigner.renderer.renderStyles );
WebpageSchema.method( 'render', pageDesigner.renderer.render );

ioco.db.model( 'Webpage', WebpageSchema );

ioco.db.model( 'Webpage' ).setVersionAttrs([ 'name', 'properties' ]);