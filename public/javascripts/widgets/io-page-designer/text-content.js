$(function(){
  iokit.pageDesigner.plugin({
    name: 'text-content',
    icon: 'icn-justifyFull', // use an icon from iokit-sprites
    iconImg: null, // a full image url to be used as 16x16 icon
    hoverTitle: $.i18n.t('web.page_designer.plugins.text-content.title'),
    addControls: [
      {
        editorId: null,
        icon: 'icn-pencil',
        hoverTitle: $.i18n.t('web.page_designer.plugins.text-content.edit'),
        action: function( box, e ){

          this.editorId = 'editor-'+(new Date()).getTime().toString(36);
          var editorId = this.editorId;

          function initEditor(){
            CKEDITOR.disableAutoInline = true;
            CKEDITOR.basePath = iokit.host.native+'/javascripts/3rdparty/ckeditor/';
            box.find('.box-content').attr('contenteditable', true).attr('id', editorId );
            CKEDITOR.config.toolbar = [
              [ 'Cut','Copy','Paste','PasteText','PasteFromWord'],
              [ 'Undo','Redo' ],
              [ 'Bold','Italic','Underline','Strike','-','RemoveFormat', 'NumberedList','BulletedList','-',
  '-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-', 'Link','Unlink','Anchor' ]
            ]
            CKEDITOR.inline( editorId );
          }
          if( typeof(CKEDITOR) === 'undefined')
            $.getScript( '/javascripts/3rdparty/ckeditor/ckeditor.js', initEditor);
          else
            initEditor();
        }
      }
    ],

    onDeactivate: function( box ){
      CKEDITOR.remove( this.editorId );
    },
    onActivate: function( box ){
      if( typeof( CKEDITOR ) === 'object' )
        CKEDITOR.inline( editorId );
    }
  })
})