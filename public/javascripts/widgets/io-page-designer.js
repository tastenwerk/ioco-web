/**
 * IOedit
 * html5 inline editing
 *
 */

$(function(){

  iokit.pageDesigner = {
    _plugins: [],
    plugin: function( plugin ){
      this._plugins.push( plugin );
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
        pluginBtn.data('pluginData', plugin);
        toolsContainer.append(pluginBtn);
      }
      return toolsContainer;
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
      }
      activeBox = null;
      pageDesigner.find('.page-designer-part.active-box-required').addClass('disabled');
      pageDesigner.find('.page-designer-part.text-box-required').addClass('disabled')
    }

    /**
     * deactivates all currently activated boxes (should always be only
     * one) and activates the clicked one
     */
    function activateBox( e ){
      if( $(e.target).closest('.box-controls').length )
        return;
      if( activeBox && activeBox.attr('data-id') == $(this).attr('data-id') )
        return deactivateActiveBox();
      deactivateActiveBox();
      activeBox = $(this);
      activeBox.addClass('active');
      if( activeBox.data('pluginData').editorEnabled )
        pageDesigner.find('.page-designer-part.text-box-required').removeClass('disabled')
      pageDesigner.find('.page-designer-part.active-box-required').removeClass('disabled');
    }

    /**
     * removes a box
     * and it's content
     */
    function removeBox( box ){
      box.remove();
    }

    /**
     * generates an empty box with the plugin's title
     *
     * @param {object} [plugin] - the plugin holder of this new box
     *
     */
    function generateBox( plugin ){
      var box = $('<div/>').addClass('iokit-page-box float-left span2');
      var content = $('<div/>').addClass('box-content');
      var closeBtn = $('<a/>').addClass('box-control btn live-tipsy').html('&times;')
          .attr('original-title', $.i18n.t('web.page_designer.remove-box'))
          .on('click', function(e){
            removeBox( $(e.target).closest('.iokit-page-box') );
          })
      var moveBtn = $('<a/>').addClass('box-control move-btn btn live-tipsy')
        .append($('<span/>').addClass('icn icn-move'))
        .attr('original-title', $.i18n.t('web.page_designer.move') )
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
            controlBtn.on('click', controlDef.action);
          controls.append(controlBtn);
        });
      controls.append(closeBtn)

      var title = $('<span/>').addClass('no-text title').text( plugin.hoverTitle );
      content.append(title);
      box.append(content);
      box.append(controls);
      if( plugin.editorEnabled )
        box.find('.box-content').attr('contenteditable', true);
      if( typeof(plugin.renderBox) === 'function' )
        plugin.renderBox( box );
      box.data('pluginData', plugin);
      return box;
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
      if( $('.iokit-page:visible').length ){
        $('.iokit-page:visible').droppable({
          accept: ".design-btn",
          activeClass: "highlight",
          drop: function( event, ui ) {
            var box = generateBox( ui.draggable.data('pluginData') );
            $(this).append( box );
            setupBoxActions( box, ui.draggable.data('pluginData') );
          }
        });
        $('.iokit-page').css('width', $('.iokit-page').width()-100);
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
          .attr('original-title', $.i18n.t('web.page_designer.'+name));;
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
          //.append($('<a/>').attr('href', '#page-designer-library').text('Bibliothek'))
          //.append($('<a/>').attr('href', '#page-designer-templates').text('Vorlagen'))
          .append($('<a/>').attr('href', '#page-designer-text').text('Text'))
          .append($('<a/>').attr('href', '#page-designer-grid').text('Grid'))
          .append($('<a/>').attr('href', '#page-designer-tools').text('Tools'))
      )
      .append( buildToolsContainer() )
      .append( buildArrangeGridContainer() )
      .append(
        $('<div/>').addClass('page-designer-part text-box-required disabled').attr('id','page-designer-text')
          .append(
            $('<div/>').addClass('text-btn design-btn small')
              .append($('<span/>').addClass('icn icn-bold'))
              .on('click', function(e){
                document.execCommand('bold', false, null);
              })
          )
          .append(
            $('<div/>').addClass('text-btn design-btn small')
              .append($('<span/>').addClass('icn icn-italic'))
              .on('click', function(e){
                document.execCommand('italic', false, null);
              })
          )
      )
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