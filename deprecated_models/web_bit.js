/**
 * a WebBit is a bit to be
 * used within a WebElement prefereably a webpage.
 *
 * with a bit you define e.g. a gallery space and store
 * pictures, or a color box with a bit of text
 * or a textbox or or or...
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

WebPageSchema.plugin( ioco.getSchemaPlugin('Default') );
WebPageSchema.plugin( ioco.getSchemaPlugin('Versioning') );

ioco.db.model( 'WebBit', WebBitSchema );