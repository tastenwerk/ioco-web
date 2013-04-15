/**
 * web.js
 *
 * (c) TASTENWERK 2013
 *
 * web: http://iocojs.org/plugins/page-designer
 *
 */

( function(){

  ioco.require('/javascripts/jquery.ioco.page-designer.js'); // this can also be done through a script tag.
  ioco.pageDesigner.registerPlugin('empty-container');

  this.ioco.sources.webpages =  new kendo.data.HierarchicalDataSource({
    autoSync: false,
    transport: {
      read: function( options ){
        $.getJSON( '/webpages', options.data, function(json){
          options.success(json);
        });
      },
      update: function( options ){
        console.log('update not yet');
      },
      destroy: function( options ){
        $.ajax({ url: '/webpages/'+options.data._id,
                 dataType: 'json',
                 type: 'delete',
                 data: {_csrf: ioco._csrf},
                 success: function(){
                    $('.ioco-k-tree .icn-trash').closest('a').removeClass('enabled');
                 }
        });
      },
      create: function( options ){
        var labelIds = [];
        getParents().forEach( function( item ){
          labelIds.push( item._type + ':' + item._id );
        });
        $.ajax({
          url: '/webpages',
          data: { _csrf: ioco._csrf, 
            webpage: { name: e.data.name,
                       template: e.data.template,
                     _labelIds: labelIds }
          },
          type: 'post',
          dataType: 'json',
          success: function( json ){
            var parent = $('.webpages-tree').data('kendoTreeView').select();
            parent = parent.length ? parent[0] : null;
            $('.webpages-tree').data('kendoTreeView').append( json, parent && $(parent) );
            $('#new-label-form').data('kendoWindow').close();
          }
        })
      }
    },
    schema: {
      model: {
        id: '_id',
        hasChildren: true
      }
    }
  });

  var webpagesViewModel = kendo.observable({
    showNewWebpageForm: showNewWebpageForm,
    showNewLabelForm: showNewLabelForm,
    refreshTree: function(){
      $('.ioco-k-tree .icn-trash').closest('a').removeClass('enabled');
      ioco.sources.webpages.read();      
    },
    deleteSelectedNodes: function(){
      getParents().forEach( function(item){
        $('.webpages-tree').data('kendoTreeView').remove( $('.webpages-tree').data('kendoTreeView').findByUid( item.uid ) );
      });
      ioco.sources.webpages.sync();
    }
  });

  kendo.bind( $('#ioco-webpages .k-menu.controls'), webpagesViewModel );

  $('.webpages-tree').kendoTreeView({
    dataSource: ioco.sources.webpages,
    dataTextField: 'name',
    dragAndDrop: true,
    dataSpriteCssClassField: '_type',
    select: function( e ){
      $('.ioco-k-tree .icn-trash').closest('a').addClass('enabled');
      var item = ioco.sources.webpages.getByUid( $(e.node).attr('data-uid') );
      if( item._type === 'Webpage' ){
        $('.click-for-details.no-item-form').hide();
        $.getJSON( '/webpages/'+ item._id, function(json){

          $('#ioco-webpages .pd-content').iocoPageDesigner({
            webpage: json,
            save: function( webpage, callback ){
              $.ajax({ url: '/webpages/'+ webpage._id,
                       type: 'put',
                       dataType: 'json',
                       data: { _csrf: ioco._csrf, webpage: webpage.toJSON() },
                       success: function( err ){
                          if( !err )
                            ioco.notify($.i18n.t('saving.ok', {name: webpage.name})+' WARNING: RELOAD BEFORE SAVE AGAIN (BUG)');
                          callback( err );
                       }
              });
            }
          });
        });

      }
    }
  });

  this.ioco.sources.webpages.fetch();

  function showNewWebpageForm( e ){
    $('#new-webpage-form').data('kendoWindow').open().center();
  }

  function showNewLabelForm( e ){
    $('#new-label-form').data('kendoWindow').open().center();
  }

  function getParents(){
    if( $('.webpages-tree').length && $('.webpages-tree').data('kendoTreeView') ){
      var selectedNodes = $('.webpages-tree').data('kendoTreeView').select();
      var parents = [];
      selectedNodes.each( function(){
        parents.push( ioco.sources.webpages.getByUid( $(this).attr('data-uid') ) );
      });
      return parents;
    } else
      return [];
  }
  
  function appendWebpage( e ){
    e.preventDefault();
    var labelIds = [];
    getParents().forEach( function( item ){
      labelIds.push( item._type + ':' + item._id );
    });
    $.ajax({
      url: '/webpages',
      data: { _csrf: ioco._csrf, 
        webpage: { name: e.data.name,
                   template: e.data.template,
                 _labelIds: labelIds }
      },
      type: 'post',
      dataType: 'json',
      success: function( json ){
        if( getParents().length )
          getParents().forEach( function( item ){
            item.append( json );
            var $item = $('.webpages-tree').data('kendoTreeView').findByUid( item.uid );
            $('.webpages-tree').data('kendoTreeView').expand( $item );
          });
        else
          ioco.sources.webpages.add( json );
        $('#new-webpage-form').data('kendoWindow').close();
      }
    })
  }

  function appendLabel( e ){
    e.preventDefault();
    var labelIds = [];
    getParents().forEach( function( item ){
      labelIds.push( item._type + ':' + item._id );
    });
    $.ajax({
      url: '/webpage_labels',
      data: { _csrf: ioco._csrf, 
        label: { name: e.data.name,
                 _labelIds: labelIds }
      },
      type: 'post',
      dataType: 'json',
      success: function( json ){
        if( getParents().length )
          getParents().forEach( function( item ){
            item.append( json );
            var $item = $('.webpages-tree').data('kendoTreeView').findByUid( item.uid );
            $('.webpages-tree').data('kendoTreeView').expand( $item );
          });
        else
          ioco.sources.webpages.add( json );
        $('#new-label-form').data('kendoWindow').close();
      }
    })
  }
  
  $('#new-webpage-form').kendoWindow({
    title: $.i18n.t('webpage.new'),
    center: true,
    resizeable: false,
    visible: false,
    activate: setupNewForm
  });

  $('#new-label-form').kendoWindow({
    title: $.i18n.t('label.new'),
    center: true,
    resizeable: false,
    visible: false,
    activate: setupNewForm
  });

  function setupNewForm( e ){
    e.sender.element.find('input[type=text]:first').focus();
    kendo.bind( e.sender.element, { templates: [''],
                                    template: '',
                                    _type: '',
                                    appendLabel: appendLabel,
                                    appendWebpage: appendWebpage,
                                    name: '' } );
  }

})();