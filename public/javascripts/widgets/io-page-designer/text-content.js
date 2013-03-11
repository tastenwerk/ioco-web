$(function(){
  ioco.pageDesigner.plugin({
    name: 'text-content',
    icon: 'icn-justifyFull', // use an icon from ioco-sprites
    iconImg: null, // a full image url to be used as 16x16 icon
    hoverTitle: $.i18n.t('web.page_designer.plugins.text-content.title'),
    addControls: [
      {
        editorId: null,
        icon: 'icn-pencil',
        hoverTitle: $.i18n.t('web.page_designer.plugins.text-content.edit'),
        editorId: 'editor-'+(new Date()).getTime().toString(36),
        action: function( box, e ){

          var editorId = this.editorId;

          function initEditor(){
            CKEDITOR.disableAutoInline = true;
            CKEDITOR.basePath = ioco.host.native+'/javascripts/3rdparty/ckeditor/';
            box.find('.box-content').attr('contenteditable', true).attr('id', editorId );
            CKEDITOR.config.toolbar = [
              [ 'Cut','Copy','Paste','PasteText','PasteFromWord'],
              [ 'Undo','Redo' ],
              [ 'Bold','Italic','Underline','Strike','-','RemoveFormat', 'NumberedList','BulletedList','-',
  '-','JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock','-', 'Link','Unlink','Anchor' ]
            ]
            CKEDITOR.inline( editorId, {
              on: {
                blur: function( event ) {
                  box.data('webBit').content = event.editor.getData();
                  box.find('.box-content').html( event.editor.getData() );
                  this.destroy();
                }
              }
            });
            box.find('.box-content').focus();
          }
          if( typeof(CKEDITOR) === 'undefined')
            $.getScript( '/javascripts/3rdparty/ckeditor/ckeditor.js', initEditor);
          else
            initEditor();
        }
      }
    ],
    addProperties: [
      {
        title: $.i18n.t('web.page_designer.plugins.text-content.languages'),
        html: 'lang plugin'
      }
    ],
    onDeactivate: function( box ){
      if( typeof( CKEDITOR ) === 'object' )
        CKEDITOR.remove( this.addControls[0].editorId );
    },
    onActivate: function( box ){
    }
  })
})