/**
 * a WebPage is the basic
 * element for building a web content.
 *
 */

var qs = require('querystring');

var iomapper = require('iomapper');

var WebPageSchema = iomapper.mongoose.Schema({
  _subtype: String,
  slug: String,
  content: String,
  webBits: { type: [iomapper.mongoose.Schema.ObjectId], ref: 'WebBit' },
  properties: { type: iomapper.mongoose.Schema.Types.Mixed, default: {frontpage: false} },
})

WebPageSchema.plugin( iomapper.plugin );

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

})


var WebPage = iomapper.mongoose.model( 'WebPage', WebPageSchema );

module.exports = exports = WebPage;