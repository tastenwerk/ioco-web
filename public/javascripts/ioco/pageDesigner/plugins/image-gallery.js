(function(){

  var root = this;

  var imageGallery = {
    name: 'image-gallery',
    iconClass: 'icn-image', // use an icon from ioco-sprites
    addControls: [
      {
        iconClass: 'icn-image',
        title: 'choose image',
        action: function( box, e ){
          var webBitId = $('.ioco-web-bit.active:visible').attr('data-web-bit-id');
          ioco.modal({ 
              title: 'manage images',
              windowControls: {
                moveLeft: {
                  icn: 'icn-win-arrange-left',
                  callback: function( $modal ){
                    $modal.toggleClass('arrange-left');
                    $('#ioco-modal-overlay').toggle(200);
                  }
                }
              },
              url: '/webbits/'+webBitId+'/files',
              before: function( $modal ){
                var webFilesViewModel = new WebFilesViewModel( '/webbits/'+webBitId+'/files' );
                $modal.data('webFilesViewModel', webFilesViewModel);

                ioco.uploader.init( { url: '/webbits/'+webBitId+'/files',
                                      model: webFilesViewModel,
                                      $modal: $modal,
                                      _labelId: 'WebBit:'+webBitId } );

                ko.applyBindings( webFilesViewModel, $modal.find('#web-images-container .offset-details-view').get(0) );
                ko.applyBindings( webFilesViewModel, $modal.find('#web-files-container .offset-details-view').get(0) );
                ioco.uploader.setupFileActions( $modal, webFilesViewModel );

              }
            });
            e.preventDefault();
        }
      }
    ]
  };

  // expose imageGallery to the global namespace
  // or export it if within nodejs
  //
  if (typeof(module) !== 'undefined' && module.exports) {
    // nodejs
    module.exports = imageGallery;
  } else {
    if( !root.ioco.pageDesigner )
      throw new Error('ioco.pageDesigner is not defined. Load this plugin AFTER ioco.pageDesigner has been loaded!')
    root.ioco.pageDesigner.addPlugin( imageGallery );
  }

})();