$(function(){
  iokit.pageDesigner.plugin({
    name: 'image-browser',
    icon: 'icn-image', // use an icon from iokit-sprites
    iconImg: null, // a full image url to be used as 16x16 icon
    hoverTitle: $.i18n.t('web.page_designer.plugins.image-browser.title'),
    addControls: [
      {
        icon: 'icn-image',
        hoverTitle: $.i18n.t('web.page_designer.plugins.image-browser.choose'),
        action: function( box, e ){
          iokit.modal({ 
              title: $.i18n.t('web.files.manage'),
              windowControls: {
                moveLeft: {
                  icn: 'icn-win-arrange-left',
                  callback: function( modal ){
                    $(modal).toggleClass('arrange-left');
                    $('#iokit-modal-overlay').toggle(200);
                  }
                }
              },
              url: '/webelements/files.html',
              before: function( modal ){
                var webFilesViewModel = new WebFilesViewModel( '/webelements/'+'IDHERE'+'/files.json' );
                modal.data('webFilesViewModel', webFilesViewModel);

                iokit.uploader.init( 'id', 'id:path', 'parentname', modal, webFilesViewModel );
                ko.applyBindings( webFilesViewModel, modal.find('#web-images-container .offset-details-view').get(0) );
                ko.applyBindings( webFilesViewModel, modal.find('#web-files-container .offset-details-view').get(0) );
                iokit.uploader.setupFileActions( modal, webFilesViewModel );

              }
            });
            e.preventDefault();
        }
      }
    ]
  })
})