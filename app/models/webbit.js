/*
 * ioco-web / Webbit model
 *
 * (c) 2013 by TASTENWERK
 *
 * license: GPLv3
 *
 */

var ioco = require('ioco')
  , pageDesigner = require('ioco-pagedesigner');

var WebbitSchema = ioco.db.Schema({
  pluginName: String,
  revisions: { type: ioco.db.Schema.Types.Mixed, default: { master: {} } },
  config: { type: ioco.db.Schema.Types.Mixed, default: { locked: false, library: false } },
  items: [ { type: ioco.db.Schema.Types.ObjectId, ref: 'Webbit' }],
})

WebbitSchema.plugin( ioco.getSchemaPlugin('Default') );
WebbitSchema.plugin( ioco.getSchemaPlugin('Label') );
WebbitSchema.plugin( ioco.getSchemaPlugin('Versioning') );

ioco.db.model( 'Webbit', WebbitSchema );
ioco.db.model( 'Webbit' ).setVersionAttrs([ 'name', 'properties', 'api', 'template', 'library', 'locked', 'root', 'content', 'category' ]);


module.exports = exports = ioco.db.model('Webbit');