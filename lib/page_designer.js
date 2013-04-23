/*
 * pageDesigner
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco')
  , fs = require('fs')
  , jade = require('jade')
  , stylus = require('stylus')
  , $ = require('cheerio');

var PageDesigner = {};

PageDesigner.revisionSchemaTemplate = function(){
  return { 
        master: { 
          config: {}, 
          views: { 
            default: {
              content: {
                default: ''
              }
            } 
          } 
        }
      };
}

PageDesigner.proto = {};

/**
 * render the webpage
 *
 * @param {Object} locals
 * @param {Object} options
 *
 *
 */
PageDesigner.proto.render = function renderWebpage( locals, options, callback ){

  var self = this;

  if( typeof(options) === 'function' ){
    callback = options;
    options = {};
  }

  this.currentRevision = options.revision || this.config.activeRevision;
  this.currentView = options.view || 'default';
  this.currentLang = options.lang || 'default';

  if( ! (this.config.template in ioco.web.templates) )
    return '<h1>template'+this.config.template+' not known</h1>';

  this.tmpl = ioco.web.templates[this.config.template];

  // add locals if tmpl has a compile function
  if( typeof( this.tmpl.compile ) === 'function' ){
    this.tmpl.compile( locals, options, function( err, addLocals ){
      if( typeof( addLocals) !== 'object' )
        ioco.log.throwError('compiling of '+this.config.template+' did not return a valid object');
      for( var i in addLocals ){
        locals[i] = addLocals[i];
      }
      var compiledJade = jade.compile( fs.readFileSync( self.tmpl._tmplFile ), { filename: self.tmpl._tmplFile } );
      var tmplRes = compiledJade( locals );
      self.parseWebbits( tmplRes, locals, callback );
    });
  } else {
    var compiledJade = jade.compile( fs.readFileSync( this.tmpl._tmplFile ), { filename: this.tmpl._tmplFile } );
    var tmplRes = compiledJade( locals );
    this.parseWebbits( this.tmplRes, locals, callback );
  }

}

PageDesigner.proto.processWebbit = function processWebbit( count, locals, callback ){

  if( count >= this.$container.find('div[data-webbit-name]').length ){
    this.content = this.$container.html();
    return callback( null, locals, this.content );
  }

  var $webbit = $(this.$container.find('div[data-webbit-name]')[count]);
  var type = $webbit.attr('data-webbit-type');
  var name = $webbit.attr('data-webbit-name');
  
  if( ! (type in ioco.web.addons ) )
    return ioco.log.error('addon ' + type + ' not found for webpage ' + this.name );

  var webbit = this.getWebbitByName( name );
  if( !webbit )
    return ioco.log.throwError('webbit ' + name + ' was not found in webpage ' + this.name );
  
  var self = this;
  this.renderWebbit( webbit, locals, function( err, content ){
    $webbit.append( content );
    self.processWebbit( ++count, locals, callback );
  });

}


/**
 * renders a webbit by consulting the webbit's
 * addon
 *
 * @param {Webbit}
 * @param {Object} locals from initial render method
 * @param {function} callback( err, content )
 *
 * @api private
 */
PageDesigner.proto.renderWebbit = function renderWebbit( webbit, locals, callback ){

  if( ! (webbit.type in ioco.web.addons) )
    ioco.log.throwError('no addon with type', webbit.type, 'for webbit', webbit.name);

  var addon = ioco.web.addons[webbit.type];
  var selectedContent = webbit.revisions[ this.currentRevision ].views[ this.currentView ].content[ this.currentLang ];
  var $tmplContent;

  if( typeof(addon._tmplFile) === 'string' ){
    var compiledTmpl = jade.compile( fs.readFileSync( addon._tmplFile ), { filename: addon._tmplFile } );
    $tmplContent = $(compiledTmpl( locals ));
  }

  if( typeof(addon.render) === 'function' )
    addon.render( selectedContent, $('<div class="wrapper">').append($tmplContent), locals, function( err, $newTmplContent ){
      callback( err, $newTmplContent.children() );
    });
  else
    callback( null, $tmplContent.append( selectedContent ) );
}

/**
 * parses webbits and calls render actions
 * of according addons
 *
 * @api private
 */
PageDesigner.proto.parseWebbits = function parseWebbits( tmplStr, locals, callback ){

  this.$container = $('<div/>').append( tmplStr );

  this.processWebbit( 0, locals, callback );

}

PageDesigner.proto.getWebbitByName = function getWebbitByName( name ){
  for( var i in this.webbits )
    if( this.webbits[i].name === name )
      return this.webbits[i];
}


/**
 * initializes a webpage. This reads the
 * webpage's templ, parses it for webbits
 * and creates them, if they do not exist
 *
 * @api public
 */
PageDesigner.proto.initWebbits = function initWebbits( callback ){

  if( !this.config.template || 
    !ioco.web.templates[ this.config.template ] )
    return callback( 'no template found' );

  this.getRevision().views.default.webbits = {};

  this.parseTmpl();

  callback( null, this );

}

/**
 * parses the template associated with the webpage for
 * webbits
 *
 * @api private
 */
PageDesigner.proto.parseTmpl = function parseTmpl(){

  var tmpl = ioco.web.templates[ this.config.template ];
  var tmplStr = fs.readFileSync( tmpl._tmplFile, 'utf8' );

  var compiledTmpl = jade.compile( tmplStr, { filename: tmpl._tmplFile } );
  tmplStr = compiledTmpl( this._locals );

  var $container = $('<div/>').append( tmplStr );

  var self = this;

  $container.find('div[data-webbit-type]').each( function(){
    var type = $(this).attr('data-webbit-type');
    if( type in ioco.web.addons )
      self.createWebbit( type, $(this).attr('data-webbit-name'), ioco.web.addons[type] );
  })

}

PageDesigner.proto.getRevision = function( rev ){
  return this.revisions[ rev || this.config.activeRevision ];
}

/**
 * create a webbit with given type
 * and initialize addon's default
 * content
 *
 * @param {String} type
 * @param {String} name
 * @param {Addon} the addon
 *
 * @api private
 */
PageDesigner.proto.createWebbit = function createWebbit( type, name, addon ){

  var webbit = { type: type, name: name, revisions: PageDesigner.revisionSchemaTemplate() };
  var rev = webbit.revisions.master;
  rev.views.default.content.default = addon.defaultContent || '';

  this.getRevision().views.default.webbits[name] = { revision: 'master' };
  this.webbits.push( webbit );

  this.markModified( 'revisions' );
    /*
    if( addon.defaultContent )
      if( addon.defaultContent === 'useTemplate' ){
        var tmplStr = fs.readFileSync( addon._tmplFile, 'utf8' );
        var compiledTmpl = jade.compile( tmplStr, { filename: addon._tmplFile } );
        tmplStr = compiledTmpl( this._locals );
      }
    */
}

module.exports = exports = PageDesigner;