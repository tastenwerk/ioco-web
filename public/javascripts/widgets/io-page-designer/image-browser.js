$(function(){
  ioco.pageDesigner.plugin({
    name: 'image-browser',
    icon: 'icn-image', // use an icon from ioco-sprites
    iconImg: null, // a full image url to be used as 16x16 icon
    hoverTitle: $.i18n.t('web.page_designer.plugins.image-browser.title'),
    addControls: [
      {
        icon: 'icn-image',
        hoverTitle: $.i18n.t('web.page_designer.plugins.image-browser.choose'),
        action: function( box, e ){
          ioco.modal({ 
              title: $.i18n.t('web.files.manage'),
              windowControls: {
                moveLeft: {
                  icn: 'icn-win-arrange-left',
                  callback: function( modal ){
                    $(modal).toggleClass('arrange-left');
                    $('#ioco-modal-overlay').toggle(200);
                  }
                }
              },
              url: '/webelements/files.html',
              before: function( modal ){
                var webFilesViewModel = new WebFilesViewModel( '/webelements/'+'IDHERE'+'/files.json' );
                modal.data('webFilesViewModel', webFilesViewModel);

                ioco.uploader.init( 'id', 'id:path', 'parentname', modal, webFilesViewModel );
                ko.applyBindings( webFilesViewModel, modal.find('#web-images-container .offset-details-view').get(0) );
                ko.applyBindings( webFilesViewModel, modal.find('#web-files-container .offset-details-view').get(0) );
                ioco.uploader.setupFileActions( modal, webFilesViewModel );

              }
            });
            e.preventDefault();
        }
      }
    ]
  })
})