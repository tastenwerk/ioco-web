/*
 * ioco-web / WebBit model
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco');

var WebBitSchema = ioco.db.Schema({
  plugin: String,
  content: String,
  category: String,
  webBits: { type: [ioco.db.Schema.ObjectId], ref: 'WebBit' },
  properties: { type: ioco.db.Schema.Types.Mixed },
})

WebBitSchema.plugin( ioco.getSchemaPlugin('Versioning') );

ioco.db.model( 'WebBit', WebBitSchema );