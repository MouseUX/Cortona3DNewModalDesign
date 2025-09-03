/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop disableFastForward {boolean}
 * @prop enableStopButton {boolean}
 * @prop disableSeekControl {boolean}
 * @prop disableExpandButton {boolean}
 * @prop helpAction {function}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-procedure-toolbar.css');

    module.exports = function (skin, options, solo) {

        var uiButtonExpand = require('./ui/btn-expand'),
            uiProcedureSeekControl = require('./solo-skin-procedure-seek'),
            uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        var procedure = solo.app.procedure,
            i18n = solo.uniview.i18n['solo-skin-procedure-toolbar'] || {};

        var buttonPlay = skin.buttonImg({
            id: 'btn-play',
            title: i18n.play,
            onclick: function () {
                procedure[procedure.played ? 'pause' : 'play']();
            },
        });

        var buttonBack = options.disableFastForward ? '' : skin.buttonImg({
            id: 'btn-bwd',
            title: i18n.back,
            onclick: procedure.backward
        });

        var buttonNext = options.disableFastForward ? '' : skin.buttonImg({
            id: 'btn-fwd',
            title: i18n.next,
            onclick: procedure.forward
        });

        var buttonStop = !options.enableStopButton ? '' : skin.buttonImg({
            id: 'btn-stop',
            title: i18n.stop,
            onclick: procedure.stop
        });

        var seekControl = options.disableSeekControl ? '' : skin.create(uiProcedureSeekControl, options).$el;

        var buttonSettings = skin.create(uiSettingsItem, {
            name: "Settings",
            type: "buttonImg",
            label: i18n.settings
        });

        var buttonExpand = options.disableExpandButton ? '' : skin.create(uiButtonExpand, {
            panelName: 'Main'
        }).$el;

        var element = skin.toolbar('.main.top',
            skin.container('.left',
                buttonPlay,
                buttonStop,
                buttonBack,
                buttonNext
            ),
            seekControl,
            skin.container('.right',
                buttonSettings,
                (options.helpAction || '') && skin.buttonImg({
                    id: "btn-help",
                    title: i18n.titleHelp,
                    onclick: function () {
                        if (typeof options.helpAction === 'function') {
                            options.helpAction();
                        }
                    }
                }),
                buttonExpand
            )
        );

        solo.on('app.procedure.didEnableForward', function (enabled) {
            if (buttonNext) {
                buttonNext.disabled = !enabled;
                if (enabled) {
                    buttonNext.classList.remove('disabled');
                } else {
                    buttonNext.classList.add('disabled');
                }

            }
        });

        solo.on('app.procedure.didEnableBackward', function (enabled) {
            if (buttonBack) {
                buttonBack.disabled = !enabled;
                if (enabled) {
                    buttonBack.classList.remove('disabled');
                } else {
                    buttonBack.classList.add('disabled');
                }
            }
        });

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

        return this.exports(element);
    };
});