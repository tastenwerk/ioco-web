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

    var pageDesigner = this;

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
     * initialize the iokit-page element to
     * be droppable
     */
    function setupPageContent(){
      if( $('.iokit-page:visible').length )
        $('.iokit-page:visible').droppable({
          accept: ".design-btn",
          activeClass: "ui-state-highlight",
          drop: function( event, ui ) {
            $(this).append( ui.draggable.data('pluginData').renderBox() );
          }
        });
    }

    $(this).addClass('iokit-page-designer')
      .append(
        $('<div/>').addClass('switch-btns')
          .append($('<a/>').attr('href', '#page-designer-text').text('Text'))
          .append($('<a/>').attr('href', '#page-designer-grid').text('Grid'))
          .append($('<a/>').attr('href', '#page-designer-tools').text('Tools'))
      )
      .append( buildToolsContainer() )
      .append(
        $('<div/>').addClass('page-designer-part').attr('id','page-designer-grid')
          .append(
            $('<div/>').addClass('design-btn small').append($('<span/>').addClass('icn icn-elem-float-none live-tipsy-l').attr('original-title', $.i18n.t('web.page_designer.float_none')))
          )
          .append(
            $('<div/>').addClass('design-btn small').append($('<span/>').addClass('icn icn-win-arrange-left live-tipsy-l').attr('original-title', $.i18n.t('web.page_designer.float_left_all_over')))
          )
          .append(
            $('<div/>').addClass('design-btn small').append($('<span/>').addClass('icn icn-win-arrange-right live-tipsy-l').attr('original-title', $.i18n.t('web.page_designer.float_right_all_over')))
          )
          .append(
            $('<div/>').addClass('design-btn small').append($('<span/>').addClass('icn icn-elem-float-left live-tipsy-l').attr('original-title', $.i18n.t('web.page_designer.float_left')))
          )
          .append(
            $('<div/>').addClass('design-btn small').append($('<span/>').addClass('icn icn-elem-float-right live-tipsy-l').attr('original-title', $.i18n.t('web.page_designer.float_right')))
          )
          .append(
            $('<div/>').addClass('design-btn small').append($('<span/>').addClass('icn icn-elem-absolute live-tipsy-l').attr('original-title', $.i18n.t('web.page_designer.position_absolute')))
          )
      )
      .append(
        $('<div/>').addClass('page-designer-part').attr('id','page-designer-text')
          .append(
            $('<div/>').addClass('text-btn').append($('<span/>').addClass('icn icn-bold'))
          )
          .append(
            $('<div/>').addClass('text-btn').append($('<span/>').addClass('icn icn-italic'))
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