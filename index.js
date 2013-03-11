module.exports = exports = {

  /*
   * WEBPAGES plugin
   */
  web_pages: {

    /**
     * routes for expressjs
     */
    routes: __dirname+'/routes',

    /**
     * iomapper (mongoosejs) models)
     */
    models: {
      WebElement: require( __dirname+'/models/web_element' ),
      WebPage: require( __dirname+'/models/web_page' ),
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

    viewPaths: [ __dirname + '/views' ],

    sidebarWidget: {
      limitSearch: [ 'WebPage' ],
      overrideName: 'web_pages'
    },

    allowedGroups: ['manager', 'editor'],

    translations: __dirname+'/locales'

  }

};