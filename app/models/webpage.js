/*
 * ioco-web / WebPage model
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco')
  , qs = require('querystring');

var WebPageSchema = ioco.db.Schema({
  _type: { type: String, default: 'WebPage' },
  slug: { type: String, required: true, index: { unique: true }, lowercase: true },
  stat: {type: ioco.db.Schema.Types.Mixed, default: {}},
  template: {type: Boolean, default: false },
  rootWebBitId: { type: ioco.db.Schema.Types.ObjectId, ref: 'WebBit' },
  properties: { type: ioco.db.Schema.Types.Mixed, default: { frontpage: false } },
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
  
  function checkUniquenessOfSlug(){
    ioco.db.model('WebPage').findOne({slug: self.slug}, function( err, item ){
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

ioco.db.model( 'WebPage', WebPageSchema );