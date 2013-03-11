function WebFileModel( data ){

  var self = this;

  $.extend( this, DocumentBaseModel(self) );

  for( var i in data )
    if( i.match(/_id|acl|createdAt|updatedAt|holder|tags/) )
      self[i] = data[i];
    else
      self[i] = ko.observable(data[i]);

  self.saveChanges = function saveChanges(){
    $.ajax({ url: '/documents/'+self._id,
             data: { _csrf: $('#_csrf').val(), doc: {
              name: self.name, 
              description: self.description, 
              copyright: self.copyright,
              tags: self.tags} 
             },
             type: 'put',
             success: function( data ){
               ioco.notify( data.flash ); 
             }
    });
  };

  self.calcFileSize = ko.computed( function calcFileSize(){
    return filesize( self.fileSize() );
  }, self );


  self.extensionName = ko.computed( function extensionName(){
    var extname = self.name().split('.');
    if( extname.length > 1 )
      return extname[1];
    return extname[0];
  });

  self.contentTypeTrunc = ko.computed( function(){
    if( self.contentType().length > 30 )
      return self.contentType().substr(0,30);
    return self.contentType();
  }, self)


  self.loadHumanReadablePath();

}

function WebFilesViewModel( url ){

  var self = this;

  self.files = ko.observableArray([]);

  self.refresh = function refresh(){
    self.files.removeAll();
    $.getJSON( url, function( data ){
      for( var i in data )
        self.files.push( new WebFileModel(data[i]) );
    })
  };

  self.sortFunction = function sortFunction(a, b) {
    try{
      return a.pos > b.pos ? 1 : -1
    }catch(e){ return 1 }
  };

  self.saveChanges = function saveChanges(){
    console.log('saving');
  }

  self.total = ko.computed( function() {
    return self.files().length;
  }, self);

  self.totalImages = ko.computed( function(){
    var total = 0;
    for( var i=0,file; file=self.files()[i];i++ )
      if( file.isImage() ) total++;
    return total;
  }, self);

  self.totalFiles = ko.computed( function(){
    var total = 0;
    for( var i=0,file; file=self.files()[i];i++ )
      if( !file.isImage() ) total++;
    return total;
  }, self);

  self.refresh();

};

