module.exports = exports = {

  ioco: {

    plugins: {
      webPages: {

        /**
         * depending
         */
        depends: [ 'ioco-pagedesigner' ],

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

        translations: __dirname+'/locales'

      }
    }
  }

};