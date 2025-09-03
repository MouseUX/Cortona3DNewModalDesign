/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop scenarioTitle {string}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-header.css');

    module.exports = function (skin, options, solo) {
        var element = skin.create('h1.header', {}, options.scenarioTitle || solo.training.interactivity.json.$text('scenario/description'));
        return this.exports(element);
    };
});