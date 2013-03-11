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
 * $(<mySelector>).ioPageDesigner( _options );
 *
 * available _options:
 *   created: function( plugin, box, done ) // invoked after box is created
 *            but before box is appended to the mySelector-dom.
 *
 */

$(function(){

  ioco = typeof(ioco) !== 'undefined' && ioco || {};

  ioco.pageDesigner = {
    _plugins: [],
    plugin: function( plugin ){
      this._plugins.push( plugin );
    },
    getPlugin: function( name ){
      for( var i in this._plugins )
        if( this._plugins[i].name === name )
          return this._plugins[i];
    },
    allowedProperties: new RegExp('^_id$|^name$|^content$|^webBits$|^properties$|^plugin$|^category$'),
    models: {
      WebPage: function( attrs ){
        this.content = '';
        this.webBits = [];
        this.properties = {};
        for( var i in attrs )
          if( i.match(ioco.pageDesigner.allowedProperties) )
            if( typeof(attrs[i]) === 'function' )
              this[i] = attrs[i]();
            else
              this[i] = attrs[i];
        this.getClean = ioco.pageDesigner.getClean;
        this.refresh = ioco.pageDesigner.refresh;
        this.updateOrigContent = function( content ){
          attrs.content( content );
        }
      },
      WebBit: function( attrs ){
        this.content = '';
        this.webBits = [];
        this.properties = {};
        this.category = '';
        for( var i in attrs )
          if( i.match(ioco.pageDesigner.allowedProperties) )
            if( typeof(attrs[i]) === 'function' )
              this[i] = attrs[i]();
            else
              this[i] = attrs[i];
        this.getClean = ioco.pageDesigner.getClean;
        this.refresh = ioco.pageDesigner.refresh;
      }
    },
    /**
     * cleans up a web bit or web page
     * and returns the webBit with references in the html content
     */
    getClean: function(){
      var clean = {};
      for( var i in this )
        if( typeof(this[i]) !== 'function' )
        clean[i] = this[i];
      clean.content = $('<div/>').append(this.content);
      clean.content.find('.ioco-web-bit').each(function(){ 
        $(this).attr('class', '').addClass('ioco-web-bit').attr('style','').html('');
      });
      clean.content = clean.content.html();
      return clean;
    },
    /**
     * cleans up this webBit
     * from inner WebBits
     */
    cleanup: function( webBit ){
      if( webBit.content && webBit.content.length > 0 ){
        var tmpElem = $('<div/>').append( webBit.content )
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
        tmpElem.find('.ioco-web-bit').each( function(){
          var found = false;
          for( var i in webBit.webBits )
            if( webBit.webBits[i] === $(this).attr('data-id') )
              found = true;
          if( !found )
            webBit.webBits.push( $(this).attr('data-id') );
          $(this).html('').removeAttr('class').addClass('ioco-web-bit').removeAttr('style');
        });
        webBit.content = tmpElem.html();
      }
    },
    /**
     * refresh this WebBit / WebPage's content
     * from html wysiwyg
     *
     */
    refresh: function(){
      this.content = $('.ioco-page:visible').find('[data-id='+this._id+']').length ? 
                        $('.ioco-page:visible').find('[data-id='+this._id+']:first .box-content').html() :
                        $('.ioco-page:visible').html()
    }
  };

  $.fn.ioPageDesigner = function ioPageDesigner( _options ){

    _options = _options || {};

    var pageDesigner = this
      , activeBox = null;

    if( $(this).hasClass('ioco-page-designer-initialized') )
      return;

    $(this).addClass('ioco-page-designer-initialized');


    /**
     * looks up for plugins which have been
     * added to ioco.pageDesigner via
     * the plugin() method
     * and appends them to a container
     * @returns jquery dom elem
     *
     */
    function buildToolsContainer(){
      var toolsContainer = $('<div/>').addClass('page-designer-part').attr('id','page-designer-tools');

      var sourceBtn = $('<div/>').addClass('source-btn live-tipsy-l')
        .append($('<span/>').addClass('icn icn-source'))
        .attr('original-title', (_options.i18n ? $.i18n.t('web.page_designer.edit_page_source') : 'Edit Source'))
        .on('click', function( e ){
          if( typeof(ioco.modal) === 'function' ){
            ioco.modal({ 
              title: _options.i18n ? $.i18n.t('web.page_designer.edit_page_source') : 'Edit WebPage Source',
              html: renderPropertiesModal( pageDesigner._page, _options.webPage, (_options.plugins || {}) ),
              completed: function( html ){      
                html.find('#cssEditor').css({ height: html.find('.sidebar-content').height() - 125});
                html.find('#htmlEditor').css({ height: html.find('.sidebar-content').height() - 65, top: 60});
                html.find('#jsEditor').css({ height: html.find('.sidebar-content').height() - 65, top: 60});
              },
              windowControls: {
                save: {
                  icn: 'icn-save',
                  title: (_options.i18n ? $.i18n.t('web.source.save') : 'save'),
                  callback: function( modal ){
                    _options.webPage.properties = _options.webPage.properties || {};
                    _options.webPage.properties.cssStyles = ace.edit(modal.find('#cssEditor').get(0)).getValue();
                    _options.webPage.properties.js = ace.edit(modal.find('#jsEditor').get(0)).getValue();
                    _options.webPage.content = ace.edit(modal.find('#htmlEditor').get(0)).getValue();

                    ioco.pageDesigner.cleanup( _options.webPage );

                    _options.webPage.properties.cssClasses = modal.find('#cssClasses').val();
                    _options.webPage.properties.metaDesc = modal.find('input[name=metaDesc]').val();
                    _options.webPage.properties.metaKeys = modal.find('input[name=metaKeys]').val();
                    _options.webPage.properties.noRobots = modal.find('input[name=noRobots]').val();
                    //
                    // TODO
                    // update source code on _page.content as well here
                    $.ajax({ url: (_options.webPageUrl || '/webpages')+'/'+_options.webPage._id,
                             type: 'put',
                             data: { _csrf: (_options.csrf || null), webPage: _options.webPage },
                             success: function( json ){
                              if( json.success ){
                                _options.webPage.updateOrigContent( _options.webPage.content );
                                setupPageContent();
                                //applyProperties( pageDesigner._page, _options.webPage )
                                ioco.modal('close');
                              }
                              if( typeof(ioco.notify) === 'function' )
                                ioco.notify( json.flash );
                             }
                    })
                  }
                }
              }
            })
          } else
            throw( 'only ioco.modal is suppoerted for modal views right now')
        });
      toolsContainer.append(sourceBtn).append('<div class="spacer"/>');

      for( var i=0,plugin; plugin=ioco.pageDesigner._plugins[i]; i++ ){
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
      var libContainer = $('<div/>').addClass('page-designer-part').attr('id','page-designer-library')
        .attr('data-expand-width', '150px')
        .append($('<h1>').text( _options.i18n ? $.i18n.t('web.page_designer.library') : 'Library' ))
        .append($('<p class="desc">').text( _options.i18n ? $.i18n.t('web.page_designer.library_desc') : 'Drag and Drop a WebBit into a container' ))
        .append($('<div class="overflow-area"/>').data('subtract-from-height', 103));

      $.getJSON( (_options.webBitUrl || '/web_bits'), function(json){
        if( json.success && json.data ){

          // sort the array by category
          json.data.sort( function(a,b){
            if( typeof( b.category ) === 'undefined' || b.category === '' || a.category < b.category )
               return -1;
            if( typeof( a.category ) === 'undefined' || a.category === '' || a.category > b.category )
              return 1;
            return 0;
          });

          var curCategory = null;
          for( var i=0,webBit; webBit=json.data[i]; i++ ){
            if( curCategory === null || (webBit.category !== curCategory )){
              libContainer.find('.overflow-area').append($('<h2/>').text( webBit.category || (_options.i18n ? $.i18n.t('web.page_designer.uncategorized') : 'uncategorized') ))
                .append('<ul/>');
              curCategory = webBit.category;
            }
            var li = $('<li/>')
                .addClass('web-bit-from-library').attr('data-id', webBit._id)
                .text(webBit.name).draggable({ helper: 'clone' });
            libContainer.find('ul:last').append( li );
          }
        }
      });
      return libContainer;
    }

    /**
     * remotely loads templates into this container
     */
    function buildTemplatesContainer(){
      var templContainer = $('<div/>').addClass('page-designer-part').attr('id','page-designer-templates')
        .append($('<ul/>'));
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
                    //activeBox.find('.move-btn').toggleClass('move-enabled')
                    //activeBox.draggable({ trigger: '.move-enabled' });
                  })
                )
        .append($('<div/>').addClass('spacer small'));

      for( var i=1; i<=(_options.gridSize || 8); i++ )
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
        if( plugin && typeof(plugin.onDeactivate) === 'function' )
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
      e.stopPropagation();
      if( $(e.target).closest('.box-controls').length )
        return;
      if( $(this).hasClass('active') )
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
      if( _options && typeof(_options.on) === 'object' && typeof(_options.on.delete) === 'function' )
        _options.on.delete( box.data('plugin'), box.data('webBit'), box, function(){ box.remove(); activeBox = null; }  );
      else{
        box.remove();
        activeBox = null;
      }
    }

    /**
     * saves a WebBit
     * to the specified webBitURL
     */
    function saveWebBit( box, webBit ){
      ioco.pageDesigner.cleanup( webBit );
      $.ajax({ url: (_options.webBitUrl || '/web_bits')+'/'+webBit._id,
               type: 'put',
               data: { _csrf: (_options.csrf || null), webBit: webBit },
               success: function( json ){
                if( json.success )
                  $(pageDesigner._page).find('.ioco-web-bit[data-id='+webBit._id+']').each(function(){
                    $(this).data('webBit', webBit);
                    applyProperties( $(this), webBit, box.data('plugin') ) && ioco.modal('close');
                  });
                if( typeof(ioco.notify) === 'function' )
                  ioco.notify( json.flash );
               }
      })
    }

    /**
     * show dialog box with properties
     *
     */
    function openPropertiesDialog( box, webBit, plugin ){
      if( typeof(ioco.modal) === 'function' ){
        ioco.modal({ 
          title: _options.i18n ? $.i18n.t('web.page_designer.web_bit-properties') : 'WebBit properties',
          html: renderPropertiesModal( box, webBit, plugin ),
          completed: function( html ){
            html.find('#cssEditor').css({ height: html.find('.sidebar-content').height() - 125});
            html.find('#htmlEditor').css({ height: html.find('.sidebar-content').height() - 65, top: 60});
            html.find('#jsEditor').css({ height: html.find('.sidebar-content').height() - 65, top: 60});
          },
          windowControls: {
            save: {
              icn: 'icn-save',
              title: (_options.i18n ? $.i18n.t('web.source.save') : 'save'),
              callback: function( modal ){
                webBit.properties = webBit.properties || {};
                webBit.properties.cssStyles = ace.edit(modal.find('#cssEditor').get(0)).getValue();
                webBit.properties.js = ace.edit(modal.find('#jsEditor').get(0)).getValue();
                webBit.name = modal.find('input[name=name]').val();
                webBit.category = modal.find('input[name=category]').val();
                webBit.content = ace.edit(modal.find('#htmlEditor').get(0)).getValue();
                webBit.properties.cssClasses = modal.find('#cssClasses').val();
                saveWebBit( box, webBit );
              }
            }
          }
        })
      } else
        throw( 'only ioco.modal is suppoerted for modal views right now')
    }

    /**
     * applys properties to a box
     * applys css classes
     * and executes javascript
     */
    function applyProperties( box, webBit, plugin ){
      if( webBit.properties ){
        if( webBit.properties.cssClasses )
          box.attr('class', 'ioco-web-bit '+webBit.properties.cssClasses);
        if( webBit.properties.cssStyles ){
          box.css(JSON.parse(webBit.properties.cssStyles));
        }
        if( webBit.properties.js && webBit.properties.js.length > 1 ){
          var fnName = 'webBitFn'+webBit._id
          var fnStr = 'function '+fnName+'( boxDom, webBit, plugin ){' + webBit.properties.js + '}';
          eval( fnStr );
          eval(fnName+'( box, webBit, plugin )');
        }
        if( webBit.content )
          box.find('.box-content').html( webBit.content );
        box.attr('data-web-bit-name', webBit.name);

        if( webBit instanceof ioco.pageDesigner.models.WebBit )
          box.find('div[data-id]').each(function(){
            setupWebBit( webBit, $(this) );
          });

      }
      return true;
    }

    /**
     * generates an empty box with the plugin's title
     *
     * @param {object} [options] - options for creating this box
     *
     * required:
     * - box: a boxDom element which is used as a base
     * - plugin: the plugin for this box to be used
     * - webBit: the WebBit object for this box
     * 
     * optional:
     * - append: the parent this new box should be appended to
     * - before: the element this box should be added before 
     * - create: this element should be stored to the database after attached
     *
     */
    function attachBox( options ){
      var content = $('<div/>').addClass('box-content');
      var closeBtn = $('<a/>').addClass('box-control live-tipsy').html('&times;')
          .attr('original-title', (_options.i18n ? $.i18n.t('web.page_designer.detach-web_bit') : 'Detach WebBit'))
          .on('click', function(e){
            removeBox( $(e.target).closest('.ioco-web-bit') );
          });
      var saveBtn = $('<a/>').addClass('box-control save-btn live-tipsy')
        .append($('<span/>').addClass('icn icn-save'))
        .attr('original-title', (_options.i18n ? $.i18n.t('save') : 'save') )
        .on('click', function(e){
          options.webBit.content = options.box.find('.box-content').html();
          saveWebBit( options.box, options.webBit );
        });
      var propBtn = $('<a/>').addClass('box-control live-tipsy').append($('<span/>').addClass('icn icn-properties'))
          .attr('original-title', (_options.i18n ? $.i18n.t('web.page_designer.web_bit-properties') : 'WebBit properties'))
          .on('click', function(e){
            openPropertiesDialog( options.box, options.webBit, options.plugin );
          });
      var moveBtn = $('<a/>').addClass('box-control move-btn move-enabled live-tipsy')
        .append($('<span/>').addClass('icn icn-move'))
        .attr('original-title', (_options.i18n ? $.i18n.t('web.page_designer.move') : 'Move') )
        .on('click', function(e){
          console.log('storing a move is not implemented yet')
        });
      var controls = $('<div/>').addClass('box-controls')
            .append(moveBtn)
            .append(propBtn);
      if( options.plugin.addControls && options.plugin.addControls instanceof Array )
        options.plugin.addControls.forEach( function(controlDef){
          var controlBtn = $('<a/>').addClass('box-control')
          if( controlDef.icon )
            controlBtn.append($('<span/>').addClass('icn '+controlDef.icon));
          else if( controlDef.title )
            controlBtn.text( controlDef.title )
          if( controlDef.hoverTitle )
            controlBtn.addClass('live-tipsy').attr('original-title', controlDef.hoverTitle);
          if( typeof(controlDef.action) === 'function' )
            controlBtn.on('click', function( e ){ controlDef.action( options.box, e ) });
          controls.append(controlBtn);
        });
      controls
        .append(saveBtn)
        .append(closeBtn);

      var title = $('<h1/>').addClass('no-text title').text( options.webBit.name );
      content.append(title);
      options.box.html('').append(content)
                .append(controls)
                .data('plugin', options.plugin)
                .data('webBit', options.webBit)
                .draggable({ 
                  handle: '.move-enabled', 
                  opacity: 0.3,
                  revert: 'invalid',
                  drag: function( e, ui ){
                    var droppable = $(this).data('current-droppable');
                    if( droppable ){
                      var leftArea = Math.round(droppable.offset().left + droppable.width() / 3);
                      $(pageDesigner._page).removeClass('highlight').removeClass('highlight-left');
                      if( e.pageX <= leftArea )
                        droppable.addClass('highlight-left');
                      else
                        droppable.addClass('highlight');
                    }
                  }
                })
                .droppable({
                  accept: ".design-btn,.web-bit-from-library,.ioco-web-bit",
                  greedy: true,
                  over: function( e, ui ){
                    console.log('over', this);
                    ui.draggable.data("current-droppable", $(this));
                  },
                  out: function( e, ui ){
                    $(this).removeClass('highlight').removeClass('highlight-left');
                  },
                  drop: droppedBox
                });

      // setup actions
      setupBoxActions( options.box, options.plugin );

      function refreshParent(){
        if( options.append || options.before ){
          options.box.attr('data-web-bit-name', options.webBit.name);
        }
        if( options.append )
          $(options.append).append( options.box );
        else if( options.before )
          $(options.before).before( options.box );
        applyProperties( options.box, options.webBit, options.plugin );
        if( typeof(options.completed) === 'function' )
          options.completed( options.box );
      }

      // if a parent is given, the webBit is new, otherwise
      // it has been loaded and exists already in the database
      if( options.create ){
        if( _options && typeof(_options.on) === 'object' && typeof(_options.on.create) === 'function' )
          _options.on.create( options.plugin, options.webBit, options.box, refreshParent);
        else{
          $.ajax({ url: '/web_bits',
                 type: 'post',
                 data: { webBit: options.webBit.getClean(),
                         _csrf: ( _options.csrf || null ) },
                 success: function( json ){
                   if( json.success ){
                     options.webBit = new ioco.pageDesigner.models.WebBit( json.webBit ); // override webBit with server json data
                     options.box.data('webBit', options.webBit);
                     options.box.attr('data-id', options.webBit._id);
                   }
                   if( typeof(_options.after) === 'object' && typeof(_options.after.create) === 'function' )
                     _options.after.create( options.plugin, options.webBit, options.box, json, refreshParent );
                   else
                     refreshParent();
                 }
          });
        }
      } else {

        if( _options && typeof(_options.after) === 'object' && typeof(_options.after.load) === 'function' )
          _options.after.load( options.plugin, options.webBit, options.box, function(){
            refreshParent();
          });
        else
          refreshParent();

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

    function droppedBox( e, ui ) {
      var dropTarget = $(this);
      $(pageDesigner._page).find('.highlight').removeClass('highlight').end().find('.highlight-left').removeClass('highlight-left');
      if( ui.draggable.hasClass('web-bit-from-library') ){
        $.getJSON( (_options.webBitUrl || '/web_bits')+'/'+ui.draggable.attr('data-id'), function( json ){
          var webBit = new ioco.pageDesigner.models.WebBit( json.webBit );
          attachBox({
            append: $(dropTarget).hasClass('ioco-web-bit') ? $(dropTarget).find('>.box-content:first') : $(dropTarget), 
            box: $('<div/>').addClass('ioco-web-bit').attr('data-id', webBit._id), 
            webBit: webBit, 
            plugin: ioco.pageDesigner.getPlugin( webBit.plugin ) 
          });
        })
      } else if( ui.draggable.hasClass('ioco-web-bit') ){
        var plugin = ui.draggable.data('plugin');
        var webBit = ui.draggable.data('webBit');
        var attachOptions = {
          box: $('<div/>').addClass('ioco-web-bit').attr('data-id', $(ui.draggable).data('webBit')._id), 
          webBit: webBit, 
          plugin: plugin
        };
        if( $(this).hasClass('highlight-left') )
          attachOptions.before = $(this);
        else
          attachOptions.append = $(this).hasClass('ioco-web-bit') ? $(this).find('>.box-content:first') : $(this);
        attachBox(attachOptions)

      } else {
        // creation from toolbox
        var plugin = ui.draggable.data('plugin');
        var boxName = prompt((_options.i18n ? $.i18n.t('web_bit.name') : 'WebBit Name') );
        if( !boxName || boxName.length < 1 )
          return;
        var webBit = new ioco.pageDesigner.models.WebBit({ name: boxName, 
                                                            properties: { js: '{\n\n}', 
                                                                          cssClasses: 'float-left span2',
                                                                          cssStyles: '{\n}' },
                                                            plugin: plugin.name,
                                                            category: '',
                                                            content: (plugin.defaultContent ? plugin.defaultContent : '') });
        attachBox({
          append: $(this).hasClass('ioco-web-bit') ? $(this).find('>.box-content:first') : $(this), 
          box: $('<div/>').addClass('ioco-web-bit'), 
          webBit: webBit, 
          plugin: plugin, 
          create: true
        });
      }
    }

    /**
     * setup a webBit and
     * initialize it's children
     */
    function setupWebBit( parent, domElem ){
      if( domElem.attr('data-id').length < 1 )
        return;
      domElem.addClass('ioco-web-bit');
      var webBitId = domElem.attr('data-id');
      for( var i=0, wB; wB=parent.webBits[i]; i++ ){
        if( webBitId === wB ){
          $.getJSON( (_options.webBitUrl || '/web_bits/')+wB, function( json ){
            if( json.success ){
              var webBit = new ioco.pageDesigner.models.WebBit( json.webBit );
              attachBox({
                box: domElem, 
                webBit: webBit, 
                plugin: ioco.pageDesigner.getPlugin( webBit.plugin ),
                completed: function( attachedBox ){
                  setupWebBit( webBit, attachedBox );
                }
              });
            } else
              throw('unsuccessful json request at')
          });
        }
      }
    }

    /**
     * initialize the ioco-page element to
     * be droppable
     */
    function setupPageContent(){

      var page = $(pageDesigner).prev('.ioco-page');
      if( !page.length )
        page = $(pageDesigner).next('.ioco-page');
      if( page.length ){
        pageDesigner._page = page;
        page.droppable({
          accept: ".design-btn,.web-bit-from-library,.ioco-web-bit",
          hoverClass: "highlight",
          drop: droppedBox
        });
        page.find('div[data-id]').each(function(){
          setupWebBit( _options.webPage, $(this) );
        });
      } else
        alert('.ioco-page element not found!');
    }

    var knownArrangementClasses = ['float-left', 'float-right', 'float-left-all-over', 'float-right-all-over', 'position-absolute'];
    var knownGridXClasses = [ 'span1', 'span2', 'span3', 'span4', 'span5', 'span6', 'span7', 'span8' ];

    /**
     * renders a grid / arrangement design button
     * with icons and tooltip
     */
    function renderDesignBtn( name, type ){
      var div = $('<div/>').addClass('design-btn small live-tipsy-l')
          .attr('original-title', ( _options.i18n ? $.i18n.t('web.page_designer.'+name) : name ) );
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

    $(pageDesigner).addClass('ioco-page-designer')
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
        var container = $(pageDesigner).find($(this).attr('href'));
        $(pageDesigner).find('.page-designer-part').hide().end()
          .find($(this).attr('href')).fadeIn(200).end()
          .find('.switch-btns .active').removeClass('active');
        $(this).addClass('active');
        if( container.attr('data-expand-width') )
          $(pageDesigner.addClass('expanded'));
        else
          $(pageDesigner).removeClass('expanded');
      })
      .last().click();

    $(pageDesigner).find('.overflow-area').each(function(){
      $(this).css({ height: $(pageDesigner).height() - $(this).data('subtract-from-height') });
    });

    setupPageContent();


    function renderPropertiesModal( box, webBit, plugin ){
      if( typeof(ace) === 'object' ){
        ace.config.set("modePath", "/javascripts/3rdparty/ace");
        ace.config.set("workerPath", "/javascripts/3rdparty/ace");
        ace.config.set("themePath", "/javascripts/3rdparty/ace");
      }

      var cssDiv = $('<div class="web-bit-props"/>')
                    .append($('<h1 class="title"/>').text('Style definitions'))
                    .append($('<p/>')
                      .append($('<label/>').text('CSS Classes'))
                      .append('<br />')
                      .append($('<input type="text" id="cssClasses" placeholder="e.g.: span2 float-left" value="'+(webBit.properties.cssClasses || '')+'" />'))
                    ).append($('<p/>')
                      .append($('<label/>').text('CSS Rules for the box (not for children) in JSON notation'))
                      .append('<br />')
                      .append($('<div id="cssEditor" class="ace-editor"/>'))
                    );

      // set ace editor for textareas if ace option is enabled
      if( typeof(ace) === 'object' ){
        aceEditor = ace.edit( cssDiv.find('#cssEditor').get(0) );
        aceEditor.getSession().setMode("ace/mode/json");
        aceEditor.getSession().setUseWrapMode(true);
        aceEditor.getSession().setWrapLimitRange(80, 80);
        if( webBit.properties.cssStyles )
          aceEditor.setValue( webBit.properties.cssStyles );
      }

      var htmlDiv = $('<div class="web-bit-props"/>')
                    .append($('<h1 class="title"/>').text('HTML'))
                    .append($('<p/>')
                      .append($('<label/>').text('edit the html source'))
                      .append('<br />')
                      .append($('<div id="htmlEditor" class="ace-editor" />'))
                    );

      var metaDiv = $('<div class="web-bit-props"/>')
                    .append($('<h1 class="title"/>').text(_options.i18n ? $.i18n.t('web.page_designer.meta') : 'META'))
                    .append($('<p/>')
                      .append($('<label/>').text( _options.i18n ? $.i18n.t('name') : 'Name' ))
                      .append('<br />')
                      .append($('<input type="text" name="name" class="fill-width" />').val( webBit.name ))
                    );
      if( webBit instanceof ioco.pageDesigner.models.WebPage ){
        metaDiv.append($('<p/>')
                      .append($('<label/>').text(_options.i18n ? $.i18n.t('web.page_designer.meta_keys') : 'Meta Keywords' ))
                      .append('<br />')
                      .append($('<input type="text" name="metaKeys" class="fill-width" />').val( webBit.properties.metaKeys ))
                    );
      } else {
        metaDiv.append($('<p/>')
                      .append($('<label/>').text(_options.i18n ? $.i18n.t('web.page_designer.category') : 'Category' ))
                      .append('<br />')
                      .append($('<input type="text" name="category" class="fill-width" />').val( webBit.category ))
                    );
      }

      // set ace editor for textareas if ace option is enabled
      if( typeof(ace) === 'object' ){
        aceEditor = ace.edit( htmlDiv.find('#htmlEditor').get(0) );
        aceEditor.getSession().setMode("ace/mode/html");
        aceEditor.getSession().setUseWrapMode(true);
        aceEditor.getSession().setWrapLimitRange(80, 80);
        webBit.refresh();
        if( webBit.content )
          aceEditor.setValue( webBit.getClean().content );
      }

      var jsDiv = $('<div class="web-bit-props"/>')
                    .append($('<h1 class="title"/>').text('Javascript'))
                    .append($('<p/>')
                      .append($('<label/>').text('Custom Code. Available vars: boxDom, webBit, plugin'))
                      .append('<br />')
                      .append($('<div id="jsEditor" class="ace-editor" />'))
                    );

      // set ace editor for textareas if ace option is enabled
      if( typeof(ace) === 'object' ){
        aceEditor = ace.edit( jsDiv.find('#jsEditor').get(0) );
        aceEditor.getSession().setMode("ace/mode/javascript");
        aceEditor.getSession().setUseWrapMode(true);
        aceEditor.getSession().setWrapLimitRange(80, 80);
        if( webBit.properties.js )
          aceEditor.setValue( webBit.properties.js );
      }

      var revisionsDiv = $('<div class="web-bit-props"/>')
                    .append($('<h1 class="title"/>').text('Revisions'));

      var accessDiv = $('<div class="web-bit-props"/>')
                    .append($('<h1 class="title"/>').text('ACL'));

      var sidebar = $('<ul class="sidebar-nav"/>')
          .append($('<li/>').text( 'HTML' ))
          .append($('<li/>').text(_options.i18n ? $.i18n.t('web.page_designer.meta') : 'META'))
          .append($('<li/>').text( 'CSS' ))
          .append($('<li/>').text( 'JS' ));

      var sidebarContent = $('<div class="sidebar-content"/>')
          .append(htmlDiv)
          .append(metaDiv)
          .append(cssDiv)
          .append(jsDiv)

      if( plugin.addProperties && plugin.addProperties instanceof Array )
        for( var i=0,propertyPlugin; propertyPlugin=plugin.addProperties[i]; i++ ){
          sidebar.append($('<li/>').text( propertyPlugin.title ));
          if( propertyPlugin.html )
            sidebarContent.append( $('<div class="web-bit-props">').html(propertyPlugin.html) );
          else if( propertyPlugin.remoteHtml )
            $.get( propertyPlugin.remoteHtml, function( html ){
              sidebarContent.append( $('<div class="web-bit-props">').html(html) );
            });
        }

      sidebar
        .append($('<li/>').text( 'Revisions' ))
        .append($('<li/>').text( 'Access' ))

      sidebarContent
        .append(revisionsDiv)
        .append(accessDiv)
        
      var html = $('<div class="modal-sidebar"/>')
        .append(sidebar)
        .append(sidebarContent);
      
      return html;
    }

  }
});