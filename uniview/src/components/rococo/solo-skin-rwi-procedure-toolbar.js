/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop enableStopButton {boolean}
 * @prop enableSignOffButton {boolean}
 * @prop disableSeekControl {boolean}
 * @prop disableExpandButton {boolean}
 * @prop helpAction {function}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-procedure-toolbar.css');

    module.exports = function (skin, options, solo) {
        var procedure = solo.app.procedure,
            i18n = solo.uniview.i18n['solo-skin-procedure-toolbar'] || {};

        solo.expand(i18n, solo.uniview.i18n['solo-skin-rwi-procedure-toolbar']);

        var uiButtonExpand = require('./ui/btn-expand'),
            uiProcedureSeekControl = require('./solo-skin-procedure-seek'),
            uiSettingsItem = require('components/rococo/solo-skin-settings-item');


        var buttonPlay = skin.buttonImg({
            id: 'btn-play',
            title: i18n.play,
            onclick: function () {
                procedure[procedure.played ? 'pause' : 'play']();
            },
        });

        var buttonStop = !options.enableStopButton ? '' : skin.buttonImg({
            id: 'btn-stop',
            title: i18n.stop,
            onclick: procedure.stop
        });

        var buttonSignOff = !options.enableSignOffButton ? '' : skin.button({
            id: 'btn-sign-off',
            disabled: true,
            title: i18n.titleSignOff,
            onclick: function () {
                solo.dispatch('rwi.didSignOff');
            }
        }, i18n.signOff);

        var seekControl = options.disableSeekControl ? '' : skin.create(uiProcedureSeekControl, options).$el;

        var buttonSettings = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'Settings',
            label: i18n.settings
        });

        var buttonHelp = (options.helpAction || '') && skin.buttonImg({
            id: "btn-help",
            title: i18n.titleHelp,
            onclick: function () {
                if (typeof options.helpAction === 'function') {
                    options.helpAction();
                }
            }
        });

        var buttonExpand = options.disableExpandButton ? '' : skin.create(uiButtonExpand, {
            panelName: 'Main'
        }).$el;

        var element = skin.toolbar('.main.bottom',
            skin.container('.left',
                skin.container('.left',
                    buttonPlay,
                    buttonStop
                ),
                skin.container('.right',
                    buttonSignOff
                )
            ),
            seekControl,
            skin.container('.right',
                buttonSettings,
                buttonHelp,
                buttonExpand
            )
        );

        solo.on('app.procedure.didPlaySound', function (state) {
            solo.app.ui.toggleSpeakerIcon(state);
        });

        solo.on('app.procedure.didStop', function () {
            buttonPlay.classList.remove('played');
            buttonPlay.title = i18n.play;
        });

        solo.on('app.procedure.didPlay', function () {
            buttonPlay.classList.add('played');
            buttonPlay.title = i18n.pause;
        });

        solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
            skin.toggle(element, !drawingMode);
        });

        solo.on('rwi.didChangeJobMode', function (jobMode) {
            buttonSignOff.disabled = !jobMode;
        });

        solo.on('rwi.didJobComplete', function () {
            buttonSignOff.disabled = true;
        });

        return this.exports(element);
    };
});