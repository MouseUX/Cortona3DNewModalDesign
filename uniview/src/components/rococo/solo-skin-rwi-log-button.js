/**
 * @namespace Cortona3DSolo.uniview.options
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-log-button.css');

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n['solo-skin-rwi-toolbar'] || {},
            element = skin.buttonImg({
                id: "btn-rwi-log",
                title: i18n.downloadLog,
                onclick: function () {
                    solo.dispatch('rwi.didLogRequest');
                }
            });

        return this.exports(element);
    };
});

/**
 * @event Cortona3DSolo~"rwi.didLogRequest"
 */
