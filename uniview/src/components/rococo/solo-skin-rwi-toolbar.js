/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop disableExpandButton {boolean}
 * @prop disableRwiLogButton {boolean}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-toolbar.css');

    var uiButtonExpand = require('./ui/btn-expand');

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n['solo-skin-rwi-toolbar'] || {};

        var opt = options.components || {},
            uiRwiLogButton = opt.uiRwiLogButton || require('./solo-skin-rwi-log-button'),
            uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        var radioMode = skin.create(uiSettingsItem, {
            name: 'Mode',
            type: 'radio',
            choice: [{
                description: i18n.previewMode,
                selected: true
            }, {
                description: i18n.jobMode
            }],
            onchange: function (value) {
                solo.rwi.jobMode = +value > 0;
            }
        });

        radioMode.classList.add('left');
        radioMode.classList.add('radio');
        radioMode.classList.add('skin-container');

        var buttonExpand = options.disableExpandButton ? '' : skin.create(uiButtonExpand, {
            panelName: 'Aux'
        }).$el;

        var buttonLog = options.disableRwiLogButton ? '' : skin.create(uiRwiLogButton, options).$el;

        var element = skin.toolbar('.main.bottom',
            radioMode,
            skin.container('.right',
                buttonLog,
                buttonExpand
            )
        );

        return this.exports(element);
    };
});