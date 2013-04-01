# IOweb

plugin for ioco enabling webpages, articles, blogs and other web elements.

## INSTALLATION

    npm install ioweb

## CONFIGURATION

If you have created your application folder with the ioco
command, you simply drop the following lines into your app.js
file

    var ioweb = require('ioweb');
    for( var i=0, plugin; plugin=ioweb[i]; i++ )
      ioco.plugin( app, plugin );

## USAGE

If you login to your ioco now, you will see the web-elements tab on the
sidebar and new dashboard widgets you can use.

### Adapting your website's layout

1. Creating a default root route in app/routes/main.js
  
  app.get( '/', function( req, res ){
    res.render( ioco.view.lookup('index.jade') )
  })

2. Creating a index.jade (you can also use ejs, if you like)
  
    !!! 5
    html
      head
        title=(ioco.config.site.title + ' - ' + Hello)
      body
        h1 Hello ioco!

### [iocoPageDesigner](http://github.com/tastenwerk/ioweb/wiki/iopagedesigner)

Please refer to the wiki for this entirely new concept of building, 
templating and editing webpages.

### Overwriting default webElement layout

In the IOweb folder structure, you will find a default.jade file in
app/views/webpages/layouts/

This file will be overwritten if you place the same file in the same
directory structure within your application folder. So:

    app/views/webpages/layuts/default.jade

will overwrite IOweb's default.jade and you can adapt it to your needs.

#### Available objects in layouts.