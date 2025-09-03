/**
 */
define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var getSvgAsset = require('lib/svg-assets');
        var assets = {
            tr_down: '',
            tr_up: '',
            tr_left: '',
            tr_right: '',
            sq: '',
            hl: '',
            cross: '',
        };
        for (var key in assets) assets[key] = getSvgAsset(key);
        return assets;
    };
});