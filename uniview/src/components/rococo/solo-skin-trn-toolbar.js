/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop fixedMode {number}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-toolbar.css');

    module.exports = function (skin, options, solo) {
        var component = this;
        var __ = solo.uniview.i18n.__;

        var i18n = solo.uniview.i18n['solo-skin-trn-toolbar'] || {},
            isFixed = typeof options.fixedMode !== 'undefined',
            m_mode = options.fixedMode || 0,
            radioName = 'mode';

        function radioHandler(mode) {
            return function () {
                m_mode = mode;
                solo.dispatch('training.showActHelp', [__("MSG_ACTIVATED_DEMO"), __("MSG_ACTIVATED_STUDY"), __("MSG_ACTIVATED_EXAM")][mode]);
                var checked = this.parentNode.parentNode.querySelector('label.checked');
                if (checked) {
                    checked.classList.remove('checked');
                }
                this.parentNode.classList.add('checked');
                this.checked = true;
            };
        }

        var radioDemoMode = skin.input({
            type: 'radio',
            dataset: {
                mode: 0
            },
            name: radioName,
            disabled: isFixed,
            onclick: radioHandler(0)
        });

        var radioStudyMode = skin.input({
            type: 'radio',
            dataset: {
                mode: 1
            },
            name: radioName,
            disabled: isFixed,
            onclick: radioHandler(1)
        });

        var radioExamMode = skin.input({
            type: 'radio',
            dataset: {
                mode: 2
            },
            name: radioName,
            disabled: isFixed,
            onclick: radioHandler(2)
        });

        var allModesDisabled = !solo.uniview.options.EnableDemoMode && !solo.uniview.options.EnableStudyMode && !solo.uniview.options.EnableExamMode;

        var radio = skin.container('.left.radio',
                skin.text('', __("UI_TXT_SELECT_MODE")),
                !solo.uniview.options.EnableDemoMode ? '' : skin.label('', radioDemoMode, __("UI_TXT_MODE_DEMO")),
                !solo.uniview.options.EnableStudyMode ? '' : skin.label('', radioStudyMode, __("UI_TXT_MODE_STUDY")),
                !solo.uniview.options.EnableExamMode ? '' : skin.label('', radioExamMode, __("UI_TXT_MODE_EXAM"))
            ),
            element = skin.toolbar('.main.bottom',
                allModesDisabled ? '' : radio,
                allModesDisabled ? '' : skin.container('.right',
                    skin.button({
                        title: __("UI_BTN_START_TITLE"),
                        disabled: options.fixedMode === solo.training.MODE_EXAM,
                        onclick: function () {
                            skin.hide(element, true);
                            solo.dispatch('training.ui.activateMode', m_mode);
                        }
                    }, __("UI_BTN_START"))
                )
            );

        var firstInput = radio.querySelector('label > input');
        if (firstInput) {
            m_mode = firstInput.dataset.mode;
            radioHandler(m_mode).call(firstInput);
        }

        return this.exports(element);
    };
});