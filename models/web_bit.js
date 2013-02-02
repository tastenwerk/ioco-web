/**
 * a WebBit is a bit to be
 * used within a WebElement prefereably a webpage.
 *
 * with a bit you define e.g. a gallery space and store
 * pictures, or a color box with a bit of text
 * or a textbox or or or...
 *
 */

var iomapper = require('iomapper');

var WebBitSchema = iomapper.mongoose.Schema({
  plugin: String,
  content: { type: iomapper.mongoose.Schema.Types.Mixed },
  webBits: { type: [iomapper.mongoose.Schema.ObjectId], ref: 'WebBit' },
  properties: { type: iomapper.mongoose.Schema.Types.Mixed },
})

WebBitSchema.plugin( iomapper.plugin );

var WebBit = iomapper.mongoose.model( 'WebBit', WebBitSchema );

module.exports = exports = WebBit;