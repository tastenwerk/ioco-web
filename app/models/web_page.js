/*
 * ioco-web / WebPage model
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco');

var WebPageSchema = ioco.db.Schema({
  _type: { type: String, default: 'WebPage' },
  slug: { type: String, required: true, index: { unique: true }, lowercase: true },
  stat: {type: ioco.db.Schema.Types.Mixed, default: {}},
  plugin: String,
  content: String,
  category: String,
  properties: { type: ioco.db.Schema.Types.Mixed },
})

WebPageSchema.plugin( ioco.getSchemaPlugin('Default') );
WebPageSchema.plugin( ioco.getSchemaPlugin('Versioning') );
WebPageSchema.plugin( ioco.getSchemaPlugin('Label') );
WebPageSchema.plugin( ioco.getSchemaPlugin('Access') );

/**
 * create or update the webpage's slug
 * to keep it up-to-date with webpage's
 * name
 *
 * This routine only applies, if the slug has not been
 * changed manually
 */
WebPageSchema.pre( 'validate', function createSlug( next ){

  var self = this;
  if( self.slug && self.slug.length > 0 )
    return next();
  
  this.ancestors( function( err, ancestors ){
    self.slug = '';
    if( ancestors ){
      ancestors.forEach( function( ancestor ){
        self.slug += ('/'+qs.escape(ancestor.name));
      });
    }
    self.slug += ('/' + qs.escape(self.name));
    next();
  });

});

ioco.db.model( 'WebPage', WebPageSchema );