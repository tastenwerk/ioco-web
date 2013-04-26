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
  $tmplContent.append(content);
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
    CKEDITOR.config.toolbar = [
      [ 'Cut','Copy','Paste','PasteText','PasteFromWord'],
      [ 'Undo','Redo' ],
      [ 'Bold','Italic','Underline','Strike','-','RemoveFormat', 'NumberedList','BulletedList','-',
'-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-', 'Link','Unlink','Anchor' ]
    ];

    CKEDITOR.inline( $box.get(0), {
      on: {
        blur: function( event ) {
          webbit.revisions[options.revision].views[options.view].content[options.lang] = event.editor.getData();
          //event.editor.destroy();
          //$box.attr('contenteditable', false)
        },
        key: function( event ){
          webbit.revisions[options.revision].views[options.view].content[options.lang] = event.editor.getData();
        },
        click: function( event ){
          $('ul[data-addon-for-webbit]').hide();
          $('ul[data-addon-for-webbit=addon_'+webbit._id+']').show();
        }
      }
    });

    $box.attr('contenteditable', true).attr('id', 'ed_'+webbit._id );

  }
  
  if( typeof(CKEDITOR) === 'undefined')
    $.getScript( '/javascripts/3rdparty/ckeditor/ckeditor.js', function(){
      $.getScript( '/javascripts/3rdparty/ckeditor/plugins/link/dialogs/link.js', function(){
        $.getScript( '/javascripts/3rdparty/ckeditor/plugins/clipboard/dialogs/paste.js', initEditor);
      });
    });
  else
    initEditor();

  done();
}


module.exports = exports = {
  
  defaultContent: [], // references to images
  
  decorate: decorate,
  render: render

}