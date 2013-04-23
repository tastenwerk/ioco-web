var ioco = require('ioco');

/**
 * render the teaser serverside by collecting
 * teaser immages associated with the
 * webbit's content (even language specifics are allowed)
 *
 * @param {String} content (the content which has been selected as
 * current revision, view and language to use)
 *
 * @param {cheerioObject} tmplContent - the content of the template, next to 
 * this file
 *
 * @param {object} locals from server like currentUser, ...
 *
 * @param {function} callback( err, content )
 *
 * @api public
 */
var render = function render( content, $tmplContent, locals, callback ){
  // fill $tmplContent with content
  $tmplContent.find('.images').append(content);
  callback( null, $tmplContent );
}

/**
 * decorate the client side
 * pagedesigner $box
 *
 * @param {Webbit} webbit ( subschema of webpage )
 * @param {Object} revision: 'master', view: 'default', lang: 'default'
 * @param {jQuery} box
 * @param {function} done
 *
 * @api public
 */
var decorate = function decorate( webbit, options, $box, done ){

  function initEditor(){
    CKEDITOR.disableAutoInline = true;
    CKEDITOR.basePath = '/javascripts/3rdparty/ckeditor/';
    $box.attr('contenteditable', true).attr('id', webbit._id );
    CKEDITOR.config.toolbar = [
      [ 'Cut','Copy','Paste','PasteText','PasteFromWord'],
      [ 'Undo','Redo' ],
      [ 'Bold','Italic','Underline','Strike','-','RemoveFormat', 'NumberedList','BulletedList','-',
'-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-', 'Link','Unlink','Anchor' ]
    ]
    $box.focus();
  }
  
  if( typeof(CKEDITOR) === 'undefined')
    $.getScript( '/javascripts/3rdparty/ckeditor/ckeditor.js', initEditor);
  else
    initEditor();

  done();
}

/**
 * add upload buttons to the properties
 * dialog
 *
 * @param {jquery} addon bar the panel bar item which can be styled with li html tags
 * @param {jquery} addon content the decorated content element
 *
 * @api public
 */
var addControls = function addControls( webbit, $addonBar, $addonContent, options, done ){
  $addonBar.append('<li class="k-state-active">Text<div class="text-control">'+
    '<p><a href="#" class="edit-text">'$.i18n.t('webpage.edit text')+'</a></p>'+
    '<p><a href="#" class="edit-source">'$.i18n.t('webpage.edit source')+'</a></p>'+
    '</div></li>');

  $addonBar.find('.edit-text').on('click', function(){
    CKEDITOR.inline( webbit._id, {
      on: {
        blur: function( event ) {
          webbit.revisions[options.revision].views[options.view].content[options.lang] = event.editor.getData();
          event.editor.destroy();
          $box.attr('contenteditable', false)
        }
      }
    });
  });

  $addonBar.find('.edit-source').on('click', function(){
    console.log('not yet');
  });

}

module.exports = exports = {
  
  defaultContent: [], // references to images
  
  decorate: decorate,
  render: render

}