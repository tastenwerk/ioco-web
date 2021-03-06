module.exports = exports = {

  ioco: {

    plugins: {
      webPages: {

        /**
         * routes for expressjs
         */
        routes: __dirname+'/app/routes',

        /**
         * ioco models
         */
        models: {
          WebPage: require( __dirname+'/app/models/webpage' ),
          WebBit: require( __dirname+'/app/models/webbit' )
        },

        middleware: require( __dirname+'/app/middleware/web' ),

        /**
         * static paths to be added to expressjs globals
         */
        statics: {
          public: __dirname + '/public'
        },

        views: __dirname+'/app/views',

        viewPaths: [ __dirname + '/app/views' ],

        sidebarWidget: {
          limitSearch: [ 'WebPage' ],
          overrideName: 'webpages'
        },

        allowedGroups: ['manager', 'editor'],

        pageDesignerJSPlugins: [ '/javascripts/ioco/pageDesigner/plugins/image-gallery.js' ],

        translations: __dirname+'/locales'

      }
    }
  }

};