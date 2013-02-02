/**
 * ioPageDesigner
 * extensive page designer
 *
 * (c) TASTENWERK 2013
 *
 * wiki:
 *
 * http://github.com/tastenwerk/ioweb/wiki/ioPageDesigner
 *
 * usage:
 *
 * $(<mySelector>).ioPageDesigner( options );
 *
 * available options:
 *   created: function( plugin, box, done ) // invoked after box is created
 *            but before box is appended to the mySelector-dom.
 *
 */

$(function(){

  iokit = typeof(iokit) !== 'undefined' && iokit || {};

  iokit.pageDesigner = {
    _plugins: [],
    plugin: function( plugin ){
      this._plugins.push( plugin );
    },
    getPlugin: function( name ){
      for( var i in this._plugins )
        if( this._plugins[i].name === name )
          return this._plugins[i];
    },
    allowedProperties: new RegExp('^_id$|^name$|^content$|^webBits$|^properties$|^plugin$'),
    models: {
      WebPage: function( attrs ){
        for( var i in attrs )
          if( i.match(iokit.pageDesigner.allowedProperties) )
            if( typeof(attrs[i]) === 'function' )
              this[i] = attrs[i]();
            else
              this[i] = attrs[i];
      },
      WebBit: function( attrs ){
        for( var i in attrs )
          if( i.match(iokit.pageDesigner.allowedProperties) )
            if( typeof(attrs[i]) === 'function' )
              this[i] = attrs[i]();
            else
              this[i] = attrs[i];
      },
      WebPropertiesCollection: function( attrs ){
        for( var i in attrs )
          this[i] = attrs[i];
      }
    },
    cleanup: function( webBit ){
      if( webBit.content && webBit.content.length > 0 ){
        var tmpElem = $( webBit.content )
          , tmpWebBits = [];
        if( webBit.webBits && webBit.webBits instanceof Array )
          for( var i=0, wB; wB=webBit.webBits[i]; i++ )
            if( typeof( wB ) === 'object' )
              tmpWebBits.push( wB._id.toString() )
            else if( typeof( wB ) === 'string' )
              tmpWebBits.push( wB )
            else
              throw('not recognized WebBit', wB);
        webBit.webBits = tmpWebBits;
        tmpElem.find('.iokit-web-bit').each( function(){
          var found = false;
          for( var i in webBit.webBits )
            if( webBit.webBits[i] === $(this).attr('data-id') )
              found = true;
          if( !found )
            webBit.webBits.push( $(this).attr('data-id') );
          $(this).html('').removeAttr('class').removeAttr('style');
        });
        webBit.content = tmpElem.html();
      }
    }
  };

  $.fn.ioPageDesigner = function ioPageDesigner( options ){

    options = options || {};

    var pageDesigner = this
      , activeBox = null;

    if( $(this).hasClass('iokit-page-designer-initialized') )
      return;

    $(this).addClass('iokit-page-designer-initialized');


    /**
     * looks up for plugins which have been
     * added to iokit.pageDesigner via
     * the plugin() method
     * and appends them to a container
     * @returns jquery dom elem
     *
     */
    function buildToolsContainer(){
      var toolsContainer = $('<div/>').addClass('page-designer-part').attr('id','page-designer-tools');

      for( var i=0,plugin; plugin=iokit.pageDesigner._plugins[i]; i++ ){
        var pluginBtn = $('<div/>').addClass('design-btn')
                          .append($('<span/>').addClass('icn').addClass(plugin.icon ? plugin.icon : plugin.iconImg));
        if( plugin.hoverTitle )
          pluginBtn.attr('original-title', plugin.hoverTitle).addClass('live-tipsy-l');
        setupToolActions( plugin, pluginBtn );
        pluginBtn.data('plugin', plugin);
        toolsContainer.append(pluginBtn);
      }
      return toolsContainer;
    }

    /**
     * remotely loads library into this container
     */
    function buildLibraryContainer(){
      var libContainer = $('<div/>').addClass('page-designer-part').attr('id','page-designer-library');
      return libContainer;
    }

    /**
     * remotely loads templates into this container
     */
    function buildTemplatesContainer(){
      var templContainer = $('<div/>').addClass('page-designer-part').attr('id','page-designer-templates');
      return templContainer;
    }

    /**
     * builds arrangement container for
     * grid arrangement
     */
    function buildArrangeGridContainer(){
      var container = $('<div/>').addClass('page-designer-part active-box-required disabled').attr('id','page-designer-grid')
        .append( renderDesignBtn('float-none', 'arrange') )
        .append( renderDesignBtn('float-left', 'arrange') )
        .append( renderDesignBtn('float-right', 'arrange') )
        .append( renderDesignBtn('float-left-all-over', 'arrange') )
        .append( renderDesignBtn('float-right-all-over', 'arrange') )
        .append( renderDesignBtn('position-absolute', 'arrange')
                  .on('click', function(e){
                    activeBox.find('.move-btn').toggleClass('move-enabled')
                    activeBox.draggable({ trigger: '.move-enabled' });
                  })
                )
        .append($('<div/>').addClass('spacer ui-helper-clearfix'));

      for( var i=1; i<=(options.gridSize || 8); i++ )
        container.append( renderDesignBtn('span'+i, 'grid-x') );

      return container;

    }

    /**
     * setup all actions for the given
     * plugin
     */
    function setupToolActions( plugin, tool ){
      tool.draggable({
        cursor: "move",
        cursorAt: { top: -12, left: -20 },
        helper: function( event ) {
          return $( "<div class='ui-widget-header'>"+plugin.hoverTitle+"</div>" );
        }
      })
    }

    /**
     * deactivates currently activated box
     *
     */
    function deactivateActiveBox(){
      if( activeBox ){
        activeBox.removeClass('active');
        var plugin = activeBox.data('plugin');
        if( typeof(plugin.onDeactivate) === 'function' )
          plugin.onDeactivate( activeBox );
      }
      activeBox = null;
      pageDesigner.find('.page-designer-part.active-box-required').addClass('disabled');
    }

    /**
     * deactivates all currently activated boxes (should always be only
     * one) and activates the clicked one
     */
    function activateBox( e ){
      if( $(e.target).closest('.box-controls').length )
        return;
      if( activeBox && activeBox.attr('data-id') == $(this).attr('data-id') )
        return;
      deactivateActiveBox();
      activeBox = $(this);
      activeBox.addClass('active');
      pageDesigner.find('.page-designer-part.active-box-required').removeClass('disabled');
      var plugin = activeBox.data('plugin');
      if( typeof(plugin.onActivate) === 'function' )
        plugin.onActivate( activeBox );
    }

    /**
     * removes a box
     * and it's content
     */
    function removeBox( box ){
      if( options && typeof(options.on) === 'object' && typeof(options.on.delete) === 'function' )
        options.on.delete( box.data('plugin'), box.data('webBit'), box, function(){ box.remove(); }  );
      else
        box.remove();
    }

    /**
     * generates an empty box with the plugin's title
     *
     * @param {object} [plugin] - the plugin holder of this new box
     *
     */
    function createBox( parent, box, webBit, plugin ){

      var content = $('<div/>').addClass('box-content');
      var closeBtn = $('<a/>').addClass('box-control btn live-tipsy').html('&times;')
          .attr('original-title', (options.i18n ? $.i18n.t('web.page_designer.remove-box') : 'Remove box'))
          .on('click', function(e){
            removeBox( $(e.target).closest('.iokit-web-bit') );
          })
      var moveBtn = $('<a/>').addClass('box-control move-btn btn live-tipsy')
        .append($('<span/>').addClass('icn icn-move'))
        .attr('original-title', (options.i18n ? $.i18n.t('web.page_designer.move') : 'Move') )
        .on('click', function(e){
          console.log('storing a move is not implemented yet')
        })
      var controls = $('<div/>').addClass('box-controls')
            .append(moveBtn);
      if( plugin.addControls && plugin.addControls instanceof Array )
        plugin.addControls.forEach( function(controlDef){
          var controlBtn = $('<a/>').addClass('box-control btn')
          if( controlDef.icon )
            controlBtn.append($('<span/>').addClass('icn '+controlDef.icon));
          else if( controlDef.title )
            controlBtn.text( controlDef.title )
          if( controlDef.hoverTitle )
            controlBtn.addClass('live-tipsy').attr('original-title', controlDef.hoverTitle);
          if( typeof(controlDef.action) === 'function' )
            controlBtn.on('click', function( e ){ controlDef.action( box, e ) });
          controls.append(controlBtn);
        });
      controls.append(closeBtn)

      var title = $('<span/>').addClass('no-text title').text( plugin.hoverTitle );
      content.append(title);
      box.append(content);
      box.append(controls);
      box.data('plugin', plugin);
      box.data('webBit', webBit);

      // setup actions
      setupBoxActions( box, plugin );

      // if a parent is given, the webBit is new, otherwise
      // it has been loaded and exists already in the database
      if( parent ){

        if( options && typeof(options.on) === 'object' && typeof(options.on.create) === 'function' )
          options.on.create( plugin, webBit, box, function(){ parent && parent.append( box ); } );
        else
          $.ajax({ url: '/web_bits',
                 type: 'post',
                 data: { webBit: webBit,
                         _csrf: ( options.csrf || null ) },
                 success: function( json ){
                   if( json.success ){
                     webBit = json.webBit; // override webBit with server json data
                     box.data('webBit', webBit);
                     box.attr('data-id', webBit._id);
                   }
                   if( typeof(options.after) === 'object' && typeof(options.after.create) === 'function' )
                     options.after.create( plugin, webBit, box, json, function(){ parent && parent.append( box ); } );
                   else
                     parent && parent.append( box );
                 }
        });
      } else {

        if( options && typeof(options.after) === 'object' && typeof(options.after.load) === 'function' )
          options.after.load( plugin, webBit, box, function(){} );

      }
    }

    /**
     * setup default box actions (selecting, ...)
     *
     */
    function setupBoxActions( box, plugin ){
      box.hover( function(e){
        $(this).addClass('hovered');
      }, function(e){
        $(this).removeClass('hovered')
      }).on('click', activateBox);
      if( typeof(plugin.setupBoxActions) === 'function' )
        plugin.setupBoxActions( box );
    }

    /**
     * initialize the iokit-page element to
     * be droppable
     */
    function setupPageContent(){

      function setupWebBit( domElem ){
        if( domElem.attr('data-id').length < 1 )
          return;
        var webBitId = domElem.attr('data-id');
        domElem.addClass('iokit-web-bit float-left span2');
        for( var i=0, wB; wB=options.webPage.webBits[i]; i++ ){
          if( typeof( wB ) === 'object' ){
            if( webBitId === wB._id.toString() )
              createBox( null, domElem, wB.content, iokit.pageDesigner.getPlugin( wB.plugin ) );
          } else if( typeof( wB ) === 'string' ){
            $.getJSON( (options.webBitUrl || '/web_bits/')+wB, function( json ){
              if( json.success ){
                var webBit = new iokit.pageDesigner.models.WebBit( json.webBit );
                options.webPage.webBits.splice(i,1);
                options.webPage.webBits.unshift( webBit );
                createBox( null, domElem, webBit.content, iokit.pageDesigner.getPlugin( webBit.plugin ) );
              } else
                throw('unsuccessful json request at')
            });
          } else
            console.log('cannot understand webBit',wB);
        }
      }

      var page = $(pageDesigner).prev('.iokit-page');
      if( !page.length )
        page = $(pageDesigner).next('.iokit-page');
      if( page.length ){
        page.droppable({
          accept: ".design-btn",
          activeClass: "highlight",
          drop: function( event, ui ) {
            var plugin = ui.draggable.data('plugin');
            var boxName = prompt((options.i18n ? $.i18n.t('web_bit.name') : 'WebBit Name') );
            if( boxName.length < 1 )
              return alert('no name given. aborted');
            var webBit = new iokit.pageDesigner.models.WebBit({ name: boxName, 
                                                                properties: {},
                                                                plugin: plugin.name,
                                                                content: (plugin.defaultContent ? plugin.defaultContent : '') });
            console.log(webBit, plugin);
            createBox( $(this), $('<div/>').addClass('iokit-web-bit float-left span2'), webBit, plugin );
          }
        });
        page.find('div[data-id]').each(function(){
          setupWebBit( $(this) );
        });
      } else
        alert('.iokit-page element not found!');
    }

    var knownArrangementClasses = ['float-left', 'float-right', 'float-left-all-over', 'float-right-all-over', 'position-absolute'];
    var knownGridXClasses = [ 'span1', 'span2', 'span3', 'span4', 'span5', 'span6', 'span7', 'span8' ];

    /**
     * renders a grid / arrangement design button
     * with icons and tooltip
     */
    function renderDesignBtn( name, type ){
      var div = $('<div/>').addClass('design-btn small live-tipsy-l')
          .attr('original-title', ( options.i18n ? $.i18n.t('web.page_designer.'+name) : name ) );
      if( type !== 'arrange' )
        div.addClass('text');

      var icon = $('<span/>');
      if( type === 'arrange' )
        icon.addClass('icn icn-box-'+name+'');
      else
        icon.text(name.replace('span',''));

      return div
        .append( icon )
        .on('click', function(e){
          if( !activeBox )
            return;
          if( type === 'arrange' )
            knownArrangementClasses.forEach( function(clss){
              activeBox.removeClass(clss);
            })
          else if( type === 'grid-x' )
            knownGridXClasses.forEach( function(clss){
              activeBox.removeClass(clss);
            })
          activeBox.addClass(name);
        });
    }

    $(this).addClass('iokit-page-designer')
      .append(
        $('<div/>').addClass('switch-btns')
          .append($('<a/>').attr('href', '#page-designer-library').text('Bibliothek'))
          .append($('<a/>').attr('href', '#page-designer-templates').text('Vorlagen'))
          .append($('<a/>').attr('href', '#page-designer-grid').text('Grid'))
          .append($('<a/>').attr('href', '#page-designer-tools').text('Tools'))
      )
      .append( buildLibraryContainer() )
      .append( buildTemplatesContainer() )
      .append( buildToolsContainer() )
      .append( buildArrangeGridContainer() )
      .draggable()
      .find('.switch-btns a').on('click', function(e){
        e.preventDefault();
        $(pageDesigner).find('.page-designer-part').hide().end()
          .find($(this).attr('href')).fadeIn(200).end()
          .find('.switch-btns .active').removeClass('active');
        $(this).addClass('active');
      }).last().click();

    setupPageContent();

  }
});