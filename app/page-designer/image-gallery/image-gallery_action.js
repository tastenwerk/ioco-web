module.exports = exports = function getPictures( webbit, callback ){

  console.log('processing inside');
  require('ioco').db.model('File').find({ _labelIds: 'WebBit:'+webbit._id }).exec( function( err, pics ){
    callback( { pictures: pics } );
  });

}