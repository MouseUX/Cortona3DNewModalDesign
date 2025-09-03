/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop disableFastForward {boolean}
 * @prop disableStopButton {boolean}
 * @prop enableFailIndicator {boolean}
 * @prop fixedMode {number}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-procedure-toolbar.css');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;
        var component = this;

        var procedure = solo.app.procedure,
            i18n = solo.uniview.i18n['solo-skin-procedure-toolbar'] || {};

        var buttonPlay = skin.buttonImg({
            id: 'btn-play',
            title: __("UI_BTN_STEP_PLAY"),
            onclick: function () {
                solo.dispatch(buttonPlay.classList.contains('played') ? 'training.ui.pause' : 'training.ui.play');
            },
        });

        var buttonBack = options.disableFastForward ? '' : skin.buttonImg({
            id: 'btn-bwd',
            title: __("UI_BTN_STEP_PREV"),
            onclick: function () {
                solo.dispatch('training.ui.backward');
            }
        });

        var buttonNext = options.disableFastForward ? '' : skin.buttonImg({
            id: "btn-fwd",
            title: __("UI_BTN_STEP_NEXT"),
            onclick: function () {
                solo.dispatch('training.ui.forward');
            }
        });

        var buttonStop = options.disableStopButton ? '' : skin.buttonImg({
            id: 'btn-stop',
            title: __("UI_BTN_STEP_STOP"),
            onclick: function () {
                solo.dispatch('training.ui.stop');
            }
        });

        var indicator = skin.div(),
            element = skin.toolbar('.main.bottom',
                skin.container('.left.vcr-container',
                    skin.container('.left',
                        buttonPlay,
                        buttonStop
                    ),
                    buttonBack,
                    buttonNext
                ),
                skin.container('.left.indicator-container',
                    options.enableFailIndicator ? [
                        __("UI_TXT_FAIL_LEVEL"),
                        skin.container('.indicator', indicator)
                    ] : ''
                ),
                skin.container('.right',
                    options.fixedMode === solo.training.MODE_EXAM ? '' : skin.button({
                        title: __("UI_BTN_CANCELMODE_TITLE"),
                        onclick: function () {
                            solo.dispatch('training.ui.switchOffMode');
                        }
                    }, __("UI_BTN_CANCELMODE"))
                )
            );

        solo.on('training.didEnableForward', function (enabled) {
            if (buttonNext) {
                buttonNext.disabled = !enabled;
                if (enabled) {
                    buttonNext.classList.remove('disabled');
                } else {
                    buttonNext.classList.add('disabled');
                }

            }
        });

        solo.on('training.didEnableBackward', function (enabled) {
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
            buttonPlay.title = __("UI_BTN_STEP_PLAY");
        });

        solo.on('app.procedure.didPlay', function () {
            buttonPlay.classList.add('played');
            buttonPlay.title = __("UI_BTN_STEP_PAUSE");
        });

        solo.on('training.didStartScenarioStep', function (score) {
            indicator.style.left = '';
        });

        solo.on('training.didChangeFailedStepScaledScore', function (score) {
            indicator.style.left = (1 - score) * 100 + '%';
        });

        this.on('hide', function () {
            skin.hide(element, true);
        });

        this.on('show', function () {
            skin.show(element);
        });

        return this.exports(element);
    };
});