/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-export-to-csv-button.css');

    module.exports = function (skin, options, solo) {
        var exportToCSV = require('actions/catalog-export-to-csv').exportToCSV.bind(solo, options),
            i18n = solo.uniview.i18n['solo-skin-ipc-dpl-toolbar'] || {};

        var element = skin.buttonImg({
            id: "btn-excel",
            title: i18n.titleExport,
            onclick: exportToCSV
        });

        return this.exports(element);
    };
});