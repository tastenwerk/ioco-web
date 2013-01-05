module.exports = exports = {

  /*
   * WEBPAGES plugin
   */
  webpages: {

    name: 'webpages',

    /**
     * routes for expressjs
     */
    routes: require(__dirname+'/routes'),

    /**
     * iomapper (mongoosejs) models)
     */
    models: {
      WebElement: require( __dirname+'/models/web_element' )
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

    sidebarWidget: {
      sidebarRemote: true
    },

    allowedRoles: ['manager', 'editor'],

    translations: __dirname+'/locales'

  },

  /**
   * ARTICLES plugin
   */

  articles: {

    name: 'articles',

    sidebarWidget: { 
      sidebarRemote: true 
    }

  }

};