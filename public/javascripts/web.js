/**
 * web.js
 *
 * (c) TASTENWERK 2013
 *
 * web: http://iocojs.org/plugins/page-designer
 *
 */

( function(){

  kendo.data.binders.css = kendo.data.Binder.extend( {
      refresh: function() {
        if( this.bindings.css ){
          var path = this.bindings.css.path;
          for( var i in path ){
            if( this.bindings.css.source[path[i]]() )
              $(this.element).addClass(i);
            else
              $(this.element).removeClass(i);
          }
        }

      }
  });

  this.ioco.sources.webpages =  new kendo.data.HierarchicalDataSource({
    transport: {
      read: {
        url: '/webpages.json?root=true',
        dataType: 'json'
      }
    }
  });

  var webpagesViewModel = {
    webpages: this.ioco.sources.webpages,
    showNewForm: function( e ){
      console.log(e);
    },
    refreshTree: function(){
      ioco.sources.webpages.fetch();      
    },
    deleteSelectedNodes: function(){
      console.log('delete not implemented');
    },
    anyNodeSelected: function(){
      return false;
    }
  }

  kendo.bind( $('#ioco-webpages .ioco-k-tree'), webpagesViewModel );

  this.ioco.sources.webpages.fetch();

})();