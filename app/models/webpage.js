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
  , fs = require('fs')
  , pageDesigner = require('ioco-pagedesigner')
  , jade = require('jade');

require( __dirname+'/webbit' );

var WebpageSchema = ioco.db.Schema({
  _type: { type: String, default: 'Webpage' },
  slug: { type: String, required: true, index: { unique: true }, lowercase: true },
  stat: {type: ioco.db.Schema.Types.Mixed, default: {}},
  permaId: { type: String, index: { unique: true } },
  revisions: { type: ioco.db.Schema.Types.Mixed, default: { master: { config: { includeCss: '', includeJs: ''}, views: { default: { content: { default: '' } } } } } },
  config: { type: ioco.db.Schema.Types.Mixed, default: { template: '', frontpage: false, hidden: false } },
  webbits: [ { type: ioco.db.Schema.Types.ObjectId, ref: 'Webbit' }]
});

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

WebpageSchema.pre( 'save', function createPermaId( next ){
  if( this.isNew )
    this.permaId = (new Date()).getTime().toString(36);
  next();
});

WebpageSchema.virtual('content').get(function(){ return this._content }).set(function(val){ this._content = val; });

WebpageSchema.method('render', function render ( options ){
  options = options || {};
  options.locals = options.locals || {};

  if( ! (this.config.template in ioco.web.templates) )
    return '<h1>template'+this.config.template+' not known</h1>';

  var tmpl = ioco.web.templates[this.config.template];

  // add locals if tmpl has a compile function
  if( typeof( tmpl.compile ) === 'function' ){
    var addLocals = tmpl.compile( options );
    if( typeof( addLocals) !== 'object' )
      ioco.log.throwError('compiling of '+this.config.template+' did not return a valid object');
    for( var i in addLocals )
      options.locals[i] = addLocals[i];
  }

  var compiledJade = jade.compile( fs.readFileSync( tmpl._tmplFile ), { filename: tmpl._tmplFile } );
  return compiledJade( options.locals );
});

ioco.db.model( 'Webpage', WebpageSchema );

ioco.db.model( 'Webpage' ).setVersionAttrs([ 'name', 'config', 'revisions' ]);

module.exports = exports = ioco.db.model('Webpage');