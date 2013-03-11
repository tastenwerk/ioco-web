/**
 * uploads files and deals with file
 * representation
 */
ioco.uploader: function( modal, _id, webFilesViewModel ){

  var pathItem = ( $('#path-item:visible').length ? 
                    $('#path-item:visible') : 
                    $('.ioco-webpages-tree .tree-li[data-id='+_id+']') )
    , path = pathItem.attr('data-id') + ':' + pathItem.attr('data-_type');
  modal.find('.path-info')
        .find('span.lbl').text( pathItem.find('a').first().text() ).end()
        .show()
        .end()
        .find('input.parent').val( path );

  modal.find('#uploader').fineUploader({

    dragAndDrop: {
      hideDropzones: false
    },

    request: {
      endpoint: '/web_elements/'+_id+'/files',
      params: {
        _csrf: ioco._csrf,
        parent: path
      }
    },

    text: ioco.fineUploaderText()

  }).on('upload', function(){
    modal.find('#uploader').slideUp(200);
    modal.find('#upload-progress').show();
    modal.find('.qq-upload-list').remove();
  }).on('progress', function( e, id, fileName, uploadedBytes, totalBytes ){
    var percent = uploadedBytes / (totalBytes / 100);
    modal.find('#upload-progress .bar').css('width', percent+'%');
  }).on('complete', function( e, id, fileName, response ){

    if( response.flash.error && response.flash.error.length > 0 ){
      $('#ioco-modal form').slideDown(200);
      $('#upload-progress').hide();
      return;
    }

    modal.find('#uploader').slideDown(200);
    modal.find('#upload-progress').hide();

    var contentType = (response.data && (response.data.contentType.indexOf('image') === 0 ? 'images' : 'files'));

    modal.find('#web-'+contentType+'-container ul#web-'+contentType).append('<li class="loading"><div class="loader"><div class="circle" /><div class="circle" /><div class="circle" /><div class="circle" /><div class="circle" /></div>');

    if( contentType === 'images' )
      $(modal.find('.sidebar-nav li')[1]).click();
    else
      $(modal.find('.sidebar-nav li')[2]).click();
    setTimeout( function(){
      modal.find('#web-'+contentType+'-container ul li.loading:first').remove();
      webFilesViewModel.files.push( new WebFileModel( response.data ) );
    }, 4000 );

    modal.find('#upload-progress .bar').css('width', '100%');
    ioco.notify(response.flash);

    setTimeout( function(){ modal.find('#upload-progress').after('<p>'+$.i18n.t('finished')+'</p>'); }, 1500 );
  });
},

/**
 * shows details view (in sidebar) of this
 * file without loading anythign (just knockout technique)
 */
showFileDetails: function showFileDetails( fileElem, file, container ){
  ko.cleanNode( container.find('.modal-details-view').get(0) );
  ko.applyBindings( file, container.find('.modal-details-view > .file-details').get(0) );
},

/**
 * setup actions for file browser
 */
setupFileActions: function setupFileActions( modal, webFilesViewModel ){

  modal.find('.web-files,.web-images').on('click', 'li', function(e){
    var container = $(this).closest('.web-files-container');

    $(this).toggleClass('selected');

    if( $(this).hasClass('selected') )
      $(this).removeClass('opaque');
    else
      $(this).addClass('opaque');

    container.find('.selected-counter .counter').text( container.find('li.selected').length );
    if( $('.web-files,.web-images li.selected').length > 0 ){
      $('.web-files-control a.enableable').addClass('enabled');
      $('.web-files-control .selected-counter').show();
      $('.web-files li:not(.selected)').addClass('opaque');
    } else {
      $('.web-files-control a.enableable').removeClass('enabled');
      $('.web-files-control .selected-counter').hide();
      $('.web-files,.web-images li').removeClass('opaque');
    }

    container.find('.no-file-selected').hide();
    container.find('.file-details').hide();
    if( $(this).hasClass('selected') && (!e.ctrlKey && !e.metaKey) ){
      container.find('.selected').removeClass('selected');
      $(this).addClass('selected');
      ioco.web.showFileDetails( this, ko.dataFor(this), container );
      container.find('.file-details').fadeIn(200);
    } else if( container.find('.selected').length === 1 ){
      ioco.web.showFileDetails( container.find('.selected'), ko.dataFor(container.find('.selected').get(0)), container );
      container.find('.file-details').fadeIn(200);
    } else
      container.find('.no-file-selected').show();


  });

  $(modal).find('.web-files-control').on('click', '.refresh', function(e){
    e.preventDefault();
    webFilesViewModel.refresh();
  });

  $(modal).find('.web-files-control').on('click', '.delete-selected.enabled', function(e){
    e.preventDefault();
    var self = this
      , complete = 0
      , total = $(this).closest('.web-files-container').find('li.selected').length;
    
    function checkCompleteAndUpdate( data, elem ){
      complete++;
      if( data.success ){
        webFilesViewModel.files.remove( ko.dataFor( elem ) );
        if( complete === total ){

          data.flash.notice.push($.i18n.t('web.files.deleted', {count: complete}));
          $(self).closest('.web-files-container')
                .find('.web-files,.web-images li').removeClass('opaque').end()
                .find('.selected-counter').hide();
        }
      }
      ioco.notify( data.flash );
    }

    $(self).closest('.web-files-container').find('li.selected').each( function( index, fileElem ){
      $.ajax({ url: '/documents/'+$(fileElem).attr('data-id'),
               type: 'delete',
               data: {_csrf: $('#_csrf').val() },
               success: function( data ){ checkCompleteAndUpdate(data, fileElem); } 
      });
    });
  });

  $(modal).find('.web-files,.web-images').on('dragstart', 'li.web-file', function(e){
    var imgUrl = $(this).css('background-image').replace('url(','').replace(')','').replace(/\"/g,'');
    e.originalEvent.dataTransfer.setData('text/plain',imgUrl);
  })

}