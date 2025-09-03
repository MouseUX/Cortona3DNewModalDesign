/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop dplLegendArray {object}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-dpl-legend.css');

    var escapeHTML = require('lib/escape-html');

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n['solo-skin-ipc-dpl-legend'] || {};

        var doc = solo.uniview.doc;
        if (doc.type !== "ipc") return;

        var a = options.dplLegendArray || solo.uniview.metadata.LEGEND;

        var element;

        if (Array.isArray(a)) {
            element = skin.create('.dpl-legend.skin-container');
            a.map(escapeHTML).forEach(text => element.append(skin.create('.dpl-legend-item', text)));
        }

        return this.exports(element);
    };
});