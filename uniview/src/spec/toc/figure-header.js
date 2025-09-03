/**
 * :title
 */
define(function (require, exports, module) {
    require('css!./figure-header.css');

    module.exports = function (skin, options, solo) {
        return this.exports(
            skin.create('h1.figure-header.cortona3dsolo-popover', {}, options.title)
        );
    };
});