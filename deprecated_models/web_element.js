/**
 * the webpage model
 */

var iomapper = require('iomapper')
  , qs = require('querystring')
  , path = require('path');

var WebElementSchema = ioco.db.Schema({
  _subtype: String,
  navElem: { type: Boolean, default: false},
  layout: { type: String, default: 'default'},
  title: String,
  i18n: {
    title: ioco.db.Schema.Types.Mixed,
    subtitle: ioco.db.Schema.Types.Mixed,
    meta: {
      keywords: ioco.db.Schema.Types.Mixed,
      description: ioco.db.Schema.Types.Mixed
    }
  },
  hidden: { type: Boolean, default: false},
  noRobots: {type: Boolean, default: false},
  subtitle: String,
  slug: { type: String, required: true, index: { unique: true }, lowercase: true },
  settings: {type: ioco.db.Schema.Types.Mixed, default: { startpage: false } }, // OBSOLETE AND DEPRECATED
  preferences: {type: ioco.db.Schema.Types.Mixed, default: { startpage: false } },
  extra: {type: ioco.db.Schema.Types.Mixed, default: {} },
  _publicPerformance: {type: ioco.db.Schema.Types.ObjectId, ref: 'PublicPerformance' },
  rating: {type: Number, default: 0},
  stat: {type: ioco.db.Schema.Types.Mixed, default: {}},
  locales: {type: ioco.db.Schema.Types.Mixed },
  tags: {type: Array, default: []},
  content: String,
  bits: {type: ioco.db.Schema.Types.ObjectId, ref: 'WebBit' },
  shortContent: String
})

WebElementSchema.plugin( iomapper.plugin );

WebElementSchema.virtual('published').get( function WebElementPublished(){
  if( this._subtype === 'Article' )
    this.canRead( ioco.db.model('User').anybody ) && !this.waiting;
  else
    return this.canRead( ioco.db.model('User').anybody );
})

WebElementSchema.pre( 'validate', function createSlug( next ){

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


var WebElement = iomapper.mongoose.model( 'WebElement', WebElementSchema );

module.exports = exports = WebElement;
