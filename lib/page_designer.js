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
  , $ = require('cheerio');

/**
 * create a new instance of PageDesigner
 * and read webpage object
 *
 * @api public
 */
var PageDesigner = function PageDesigner( webpage, locals ){

  this._locals = locals || {};
  this._webpage = webpage;

}

/**
 * initializes a webpage. This reads the
 * webpage's templ, parses it for webbits
 * and creates them, if they do not exist
 *
 * @api public
 */
PageDesigner.prototype.init = function initWebpage( callback ){

  if( !this._webpage.config.template || 
    !ioco.web.templates[ this._webpage.config.template ] )
    return callback( 'no template found' );

  this.parseTmpl();

  callback( null, this._webpage );

}

/**
 * parses the template associated with the webpage for
 * webbits
 *
 * @api private
 */
PageDesigner.prototype.parseTmpl = function parseTmpl(){

  var tmpl = ioco.web.templates[ this._webpage.config.template ];
  var tmplStr = fs.readFileSync( tmpl._tmplFile, 'utf8' );

  var compiledTmpl = jade.compile( tmplStr, { filename: tmpl._tmplFile } );
  var tmplStr = compiledTmpl( this._locals );

  var $container = $('<div/>').append( tmplStr );

  var self = this;

  $container.find('div[data-webbit-type]').each( function(){
    var type = $(this).attr('data-webbit-type');
    if( type in ioco.web.addons )
      if( !$(this).attr('data-webbit-id') )
        self.createWebbit( type, ioco.web.addons[type] );
  })

}

/**
 * create a webbit with given type
 * and initialize addon's default
 * content
 *
 */
PageDesigner.prototype.createWebbit( type, addon ){
  var webbit = ioco.db.model('Webbit').create({ type: type, name: addon.name });
  var rev = webbit.revisions[ webbit.config.activeRevision ]
  rev.views = {};
  rev.views.default = {};
  rev.views.default.content = {};
  rev.views.default.content.default = addon.defaultContent;
}

module.exports = exports = PageDesigner;