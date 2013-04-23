/**
 * web.js
 *
 * (c) TASTENWERK 2013
 *
 * web: http://iocojs.org/plugins/page-designer
 *
 */

( function(){

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
        published: kendo.observable( this.published ),
        hasChildren: function(){
          return this._childrenIds.length > 0;
        },
        decoratedContent: PageDesignerCS.decoratedContent,
        addControls: PageDesignerCS.addControls,
        currentRevision: '',
        currentView: 'default',
        currentLang: 'default',
        revisionsArray: [],
        viewsArray: [],
        langArray: [],
        hideForm: function(){
          $('.page-content,.page-form').hide();
          $('.click-for-details.no-item-form').show();
          $propertiesWin.data('kendoWindow').destroy();
        },
        submitForm: function(){
          $.ajax({ url: '/webpages/'+ this._id,
                   data: { _csrf: ioco._csrf, webpage: this.toJSON() },
                   type: 'put',
                   dataType: 'json',
                   success: function( json ){
                     ioco.notify(json.flash);
                   }
          });
        },
        toggleProperties: function(e){
          $propertiesWin.data('kendoWindow').open();
        },
        publish: function(e){
          var self = this;
          $.ajax({ url: '/documents/'+this._id+'/change_public_status',
                   dataType: 'json',
                   type: 'put',
                   data: { _csrf: ioco._csrf },
                   success: function( json ){
                    ioco.notify( json.flash );
                    self.set('published', json.published);
                    if( json.published )
                      $('.page-content .icn-locked').addClass('unlocked');
                    else
                      $('.page-content .icn-locked').removeClass('unlocked');
                   }
          });
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
                      $('.webpages-tree').data('kendoTreeView').select().remove();
                      //ioco.sources.webpages.remove( item );
                }
        });
      });
      $('.ioco-k-tree .icn-trash').closest('a').removeClass('enabled');
    }
  });

  kendo.bind( $('#ioco-webpages .k-menu.controls'), webpagesViewModel );

  var $propertiesWin;

  $('.webpages-tree').kendoTreeView({
    dataSource: ioco.sources.webpages,
    dataTextField: 'name',
    dragAndDrop: true,
    dataSpriteCssClassField: '_subtype',
    template: '#= item.name # <input type="hidden" data-ioco-id="#= item._id #"/>',
    dragend: function(){
      //console.log('new sort order', ioco.sources.webpages.sort() );
      ioco.sources.webpages.sync();
      //setTimeout( function(){ ioco.sources.webpages.cancelChanges()  }, 1000 );
    },
    select: function( e ){
      var item = kendo.observable( ioco.sources.webpages.getByUid( $(e.node).attr('data-uid') ) );
      if( item._type === 'Domain' )
        return;
      $('.ioco-k-tree .icn-trash').closest('a').addClass('enabled');
      $.getJSON( '/webpages/'+ item._id+'?pageDesignerView=true', function(json){
        
        item.content = json.content;
        item.tmpl = json.tmpl;

        item.currentRevision = json.config.activeRevision || 'master';

        item.revision = json.revisions[ item.currentRevision ];
        item.revisionsArray = Object.keys(json.revisions);
        item.viewsArray = Object.keys(item.revision.views);
        item.langArray = Object.keys(item.revision.views.default.content);

        PageDesignerCS.addJSCSS( item.tmpl.js, item.tmpl.css );

        kendo.bind( $('.page-form'), item );
        kendo.bind( $('.page-properties'), item );
        
        if( $propertiesWin && $propertiesWin.data && $propertiesWin.data('kendoWindow') )
          $propertiesWin.data('kendoWindow').destroy();

        $('.click-for-details.no-item-form').hide();
        $('.page-content,.page-form').show();

        $propertiesWin = $('.properties-win');
        $propertiesWin.kendoWindow({
          title: $.i18n.t('webpage.Properties'),
          width: 200,
          activate: function(){
            this.wrapper.css({
              top: 100,
              left: $(window).width()-this.wrapper.width()-15
            });
          }
        });

        var propertiesBar = $propertiesWin.find('.panelbar').kendoPanelBar({
          expandMode: 'single'
        });

        item.decoratedContent( function( err, $decoratedContent ){
          if( err )
            ioco.notice(err, 'error');

          $('.page-content').html('').append( $decoratedContent );
          if( item.tmpl.designer && item.tmpl.designer.width )
            $('.page-content').css({width: item.tmpl.designer.width});

          item.addControls( $propertiesWin.find('.addonbar-container'), $decoratedContent );

        });

      });
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
                   template: e.data.template.value,
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
            console.log( $item );
            $('.webpages-tree').data('kendoTreeView').select( $item );
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
    kendo.bind( e.sender.element, { templates: ioco.pageTemplates,
                                    template: ioco.pageTemplates[0],
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