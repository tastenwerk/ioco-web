= IOweb

plugin for IOkit enabling webpages, articles, blogs and other web elements.

== INSTALLATION

  npm install ioweb

== CONFIGURATION

If you have created your application folder with the iokit
command, you simply drop the following lines into your app.js
file

  var ioweb = require('ioweb');
  for( var i=0, plugin; plugin=ioweb[i]; i++ )
    iokit.plugin( app, plugin );

== USAGE

If you login to your IOkit now, you will see the web-elements tab on the
sidebar and new dashboard widgets you can use.

=== Adapting your website's layout

1. Creating a default root route in app/routes/main.js
  
  app.get( '/', function( req, res ){
    res.render( iokit.view.lookup('index.jade') )
  })

2. Creating a index.jade (you can also use ejs, if you like)
  
  !!! 5
  html
    head
      title=(iokit.config.site.title + ' - ' + Hello)
    body
      h1 Hello IOkit!

=== LAYOUTS

In IOweb, you use a layout string stored to the database to render
different layouts. This string causes IOweb to lookup for an associated
layout file in the app/views/<_subtype>/layouts folder. The _subtype for
webpages is "Webpage", therefore, the folder is called 
app/views/webpages/layouts

You configure your layout files in your app's config/iobox.json file:

  {
    ...,

    "layouts": [ "default", "front", "gallery" ],

    ...
  }

This means, IOweb will provide you with those 3 layouts in a select
box in the webpage's settings form. If the webpage is now rendered, let's
say a page with the "gallery"-layout, IOweb will lookup first in your
application folder strucutre (app/views/webpages/layouts/gallery.jade) and
then in all the other plugin's folder including IOweb's own.

==== Overwriting default webElement layout

In the IOweb folder structure, you will find a default.jade file in
app/views/webpages/layouts/

This file will be overwritten if you place the same file in the same
directory structure within your application folder. So:

app/views/webpages/layuts/default.jade

will overwrite IOweb's default.jade and you can adapt it to your needs.

==== Available objects in layouts.