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
    transport: {
      read: {
        url: '/webpages',
        dataType: 'json'
      },
      update: {
        url: '/webpages/update',
        type: 'put',
        data: {_csrf: ioco._csrf}
      },
      destroy: {
        url: function(item ){ return '/webpages/order_children/'+getParent(item._id)._id },
        data: function(item){
          return { _csrf: ioco._csrf,
            childrenIds: getSiblingIds(item._id) 
          }
        },
        type: 'put'
      },
      create: {
        url: '/webpages',
        type: 'post',
        data: {_csrf: ioco._csrf}
      }
    },
    schema: {
      model: {
        hasChildren: function(){
          console.log('checking children');
          return this._childrenIds.length > 0;
        }
      }
    }
  });

  var webpagesViewModel = kendo.observable({
    showNewWebpageForm: showNewWebpageForm,
    refreshTree: function(){
      $('.ioco-k-tree .icn-trash').closest('a').removeClass('enabled');
      ioco.sources.webpages.read();      
    },
    deleteSelectedNodes: function(){
      getParents().forEach( function(item){
        $.ajax({ url: '/documents/'+item._id,
                 dataType: 'json',
                 type: 'delete',
                 data: {_csrf: ioco._csrf},
                 success: function( json ){
                  if( json.success )
                    ioco.sources.webpages.remove( item );
                }
        });
      });
      $('.ioco-k-tree .icn-trash').closest('a').removeClass('enabled');
    }
  });

  kendo.bind( $('#ioco-webpages .k-menu.controls'), webpagesViewModel );

  $('.webpages-tree').kendoTreeView({
    dataSource: ioco.sources.webpages,
    dataTextField: 'name',
    dragAndDrop: true,
    dataSpriteCssClassField: '_subtype',
    template: '#= item.name # <input type="hidden" data-ioco-id="#= item._id #"/>',
    dragend: function(){
      console.log('triggering sync');
      //console.log('new sort order', ioco.sources.webpages.sort() );
      ioco.sources.webpages.sync();
      //setTimeout( function(){ ioco.sources.webpages.cancelChanges()  }, 1000 );
    },
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

  //this.ioco.sources.webpages.fetch();

  function showNewWebpageForm( e ){
    $('#new-webpage-form').data('kendoWindow').open().center();
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

  function getParent(itemId){
    var $thisNode = $('.webpages-tree input[data-ioco-id='+itemId+']').closest('li');
    var thisNode = $('.webpages-tree').data('kendoTreeView').dataItem( $thisNode );
    console.log($thisNode, thisNode);
    return thisNode.parentNode();
  }

  function getSiblingIds(itemId){
    var $thisNode = $('.webpages-tree input[data-ioco-id='+itemId+']').closest('li');
    var tree = $('.webpages-tree').data('kendoTreeView');
    var $parent = tree.parent( $thisNode );
    var siblings = [];
    $parent.find('>ul>li').each( function(){
      siblings.push( tree.dataItem( $(this) )._id );
    });
    return siblings;
  }
  
  function appendWebpage( e ){
    e.preventDefault();
    var labelIds = [];
    getParents().forEach( function( item ){
      if( item._type !== 'Domain' )
        labelIds.push( item._type + ':' + item._id );
    });
    if( labelIds.length < 1 )
      $('.webpages-tree').data('kendoTreeView').select( $('.webpages-tree .k-item:first') );
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
    });
  }
  
  $('#new-webpage-form').kendoWindow({
    title: $.i18n.t('webpage.new'),
    center: true,
    width: 400,
    resizeable: false,
    visible: false,
    activate: setupNewForm
  });

  function setupNewForm( e ){
    e.sender.element.find('input[type=text]:first').focus();
    kendo.bind( e.sender.element, { templates: [''],
                                    template: '',
                                    appendLabel: appendLabel,
                                    appendWebpage: appendWebpage,
                                    name: '' } );
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

})();