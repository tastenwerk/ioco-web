module.exports = exports = {

  /*
   * WEBPAGES plugin
   */
  webpages: {

    /**
     * routes for expressjs
     */
    routes: __dirname+'/routes',

    /**
     * iomapper (mongoosejs) models)
     */
    models: {
      WebElement: require( __dirname+'/models/web_element' ),
      WebBit: require( __dirname+'/models/web_bit' )
    },

    /**
     * expressjs middleware
     */
    middleware: require(__dirname+'/middleware/register_paths'),

    /**
     * static paths to be added to expressjs globals
     */
    statics: {
      public: __dirname + '/public'
    },

    views: __dirname+'/views',

    sidebarWidget: {
      limitSearch: [ 'WebElmenet' ],
      overrideName: 'webelements'
    },

    allowedRoles: ['manager', 'editor'],

    translations: __dirname+'/locales',

    pageDesignerJSPlugins: [ '/javascripts/widgets/io-page-designer/image-browser.js',
                              '/javascripts/widgets/io-page-designer/text-content.js' ]

  },

  /**
   * ARTICLES plugin
   */

  articles: {

    sidebarWidget: false,

    views: __dirname+'/views',

  }

};