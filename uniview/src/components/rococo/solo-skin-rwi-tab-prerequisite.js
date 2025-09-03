/**
 */
define(function (require, exports, module) {
    //require('css!./solo-skin-rwi-tab-prerequisite.css');

    module.exports = function (skin, options, solo) {
        var root = solo.rwi.interactivity.json,
            rwi = root.$('rwi').slice(-1)[0],
            para = rwi.$('preq/para');

        var element = skin.create('div', para.map(function (node) {
            return skin.p('', node.$text());
        }));

        if (!element.textContent.trim() && !options.persistentTab) return {};

        return this.exports(element);
    };
});