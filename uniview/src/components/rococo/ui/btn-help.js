/**
 * :helpAction <f()>
 */
define(function (require, exports, module) {
    require('css!./btn-help.css');

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n.ui || {};

        var element = skin.buttonImg({
            id: "btn-help",
            title: i18n.help,
            onclick: function () {
                if (typeof options.helpAction === 'function') {
                    options.helpAction();
                }
            }
        });

        return this.exports(element);
    };
});