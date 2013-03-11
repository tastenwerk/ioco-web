module.exports = exports = {

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
      WebPage: require( __dirname+'/app/models/web_page' ),
      WebBit: require( __dirname+'/app/models/web_bit' )
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
      overrideName: 'web_pages'
    },

    allowedGroups: ['manager', 'editor'],

    translations: __dirname+'/locales'

  }

};