( function(){
  
  var PageDesignerCS = {};

  PageDesignerCS.addJSCSS = function addJSCSS( js, css ){
    if( js )
      if( !$('head script[src="'+js+'""]').length )
        $('head').append('<script type="text/javascript" src="'+js+'"></script>');
    if( css )
      if( !$('head link[href="'+css+'""]').length )
        $('head').append('<link rel="stylesheet" href="'+css+'">');
  }

  /**
   * decorate container with given actions and items
   * or nothing
   */
  PageDesignerCS._decorateNextAddon = function _decorateNextAddon( counter, $content, callback ){

    if( counter >= $content.find('[data-webbit-type]').length )
      return callback( null, $content );

    var $addonContent = $($content.find('[data-webbit-type]')[counter]);
    var addon = PageDesignerCS.addons[ $addonContent.attr('data-webbit-type') ];

    var self = this;
    $addonContent.attr('data-webbit-id', addon.name + '_'+(new Date().getTime().toString(36)));
    console.log('addon content', $addonContent);
    if( addon.decorate )
      addon.decorate( $addonContent, function(){ self._decorateNextAddon( ++counter, $content, callback ) } );

  }


  /**
   * style panelbar for addon
   *
   */
  PageDesignerCS._nextAddonControls = function _nextAddonControls( counter, $content, $addonContainer, callback ){

    if( counter >= $content.find('[data-webbit-type]').length )
      return callback( null );

    var $addonContent = $($content.find('[data-webbit-type]')[counter]);
    var addon = PageDesignerCS.addons[ $addonContent.attr('data-webbit-type') ];

    var self = this;
    if( typeof(addon.addControls) === 'function' ){

      var $addonBar = $('<ul/>').attr( 'data-addon-for-webbit', $addonContent.attr('data-webbit-id') );

      addon.addControls( $addonBar, $addonContent, function(){ 

        $addonContainer.append( $addonBar );
        $addonBar.kendoPanelBar({
          expandMode: 'single'
        });

        // activate panel and show it on mouse click
        $addonContent.on('click', function(e){
          $('ul[data-addon-for-webbit]').hide();
          $addonBar.show();
        });

        self._nextAddonControls( ++counter, $content, $addonContainer, callback ) 

      });

    }

  }

  /**
   * decorate this item's content
   * with addon specificas
   *
   * @param {Function} callback
   *
   * @api private
   */
  PageDesignerCS.decoratedContent = function decoratedContent( callback ){
    this._decorateNextAddon = PageDesignerCS._decorateNextAddon;

    var $content = $('<div/>').append(this.content);

    this._decorateNextAddon( 0, $content, callback );

  }

  /**
   * add controls of specific addons
   * which have the addControl property defined
   *
   * @api private
   */
  PageDesignerCS.addControls = function addControls( $addonContainer, $decoratedContent, callback ){

    callback = callback || function(){};

    this._nextAddonControls = PageDesignerCS._nextAddonControls;
    this._nextAddonControls( 0, $decoratedContent, $addonContainer, callback );

  }

  PageDesignerCS.addons = {};

  this.PageDesignerCS = PageDesignerCS;

})();