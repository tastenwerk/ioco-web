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
  type: String,
  revisions: { type: ioco.db.Schema.Types.Mixed, default: { master: {} } },
  config: { type: ioco.db.Schema.Types.Mixed, default: { locked: false, library: false, activeRevision: 'master' } },
  items: [ { type: ioco.db.Schema.Types.ObjectId, ref: 'Webbit' }],
})

ioco.db.model( 'Webbit', WebbitSchema );
//ioco.db.model( 'Webbit' ).setVersionAttrs([ 'name', 'properties', 'api', 'template', 'library', 'locked', 'root', 'content', 'category' ]);


module.exports = exports = ioco.db.model('Webbit');