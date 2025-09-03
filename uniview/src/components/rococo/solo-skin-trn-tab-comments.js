/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-tab-comments.css');

    module.exports = function (skin, options, solo) {
        var element = skin.div('.instructions-container');
        return this.exports(element);
    };
});