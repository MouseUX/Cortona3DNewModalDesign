/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop helpAction {function}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-figure-toolbar.css');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;
        var procedure = solo.app.procedure,
            i18n = solo.uniview.i18n['solo-skin-procedure-toolbar'] || {};

        var uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        solo.expand(i18n, solo.uniview.i18n['solo-skin-trn-figure-toolbar']);

        var buttonSpinOnClick,
            buttonSpin = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'Spin',
            id: 'btn-nav-spin',
            label: __("UI_TXT_SPIN"),
            value: true,
            onchange: function (value) {
                if (value) {
                    buttonSpinOnClick = buttonSpin.onclick;
                    buttonSpin.onclick = null;
                    solo.app.setMouseDragMode(solo.app.MOUSE_DRAG_MODE_SPIN);
                    solo.uniview.settings.Pan = false;
                    solo.uniview.settings.Zoom = false;
                } else if (!buttonSpin.onclick) {
                    buttonSpin.onclick = buttonSpinOnClick;
                }
            }
        });
        
        var buttonPanOnClick,
            buttonPan = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'Pan',
            id: 'btn-nav-pan',
            label: __("UI_TXT_PAN"),
            onchange: function (value) {
                if (value) {
                    buttonPanOnClick = buttonPan.onclick;
                    buttonPan.onclick = null;
                    solo.app.setMouseDragMode(solo.app.MOUSE_DRAG_MODE_PAN);
                    solo.uniview.settings.Spin = false;
                    solo.uniview.settings.Zoom = false;
                } else if (!buttonPan.onclick) {
                    buttonPan.onclick = buttonPanOnClick;
                }
            }
        });
        
        var buttonZoomOnClick,
            buttonZoom = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'Zoom',
            id: 'btn-nav-zoom',
            label: __("UI_TXT_ZOOM"),
            onchange: function (value) {
                if (value) {
                    buttonZoomOnClick = buttonZoom.onclick;
                    buttonZoom.onclick = null;
                    solo.app.setMouseDragMode(solo.app.MOUSE_DRAG_MODE_ZOOM);
                    solo.uniview.settings.Pan = false;
                    solo.uniview.settings.Spin = false;
                } else if (!buttonZoom.onclick) {
                    buttonZoom.onclick = buttonZoomOnClick;
                }
            }
        });
        
        var buttonFit = skin.buttonImg({
            id: 'btn-nav-fit',
            title: __("UI_TXT_FIT"),
            onclick: function () {
                solo.app.fitSceneInView(true);
            },
        });

        var buttonSettings = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'Settings',
            label: __("UI_TXT_SETTINGS")
        });

        var buttonHelp = (options.helpAction || '') && skin.buttonImg({
            id: "btn-help",
            title: __("UI_TXT_HELP"),
            onclick: function () {
                if (typeof options.helpAction === 'function') {
                    options.helpAction();
                }
            }
        });

        var buttonSkipAnimation = skin.buttonImg({
            id: 'btn-skip-animation',
            classList: 'disabled',
            title: __("UI_BTN_SKIP_ANIMATION_TITLE"),
            onclick: function () {
                solo.app.procedure.setPlayPosition(solo.app.procedure.duration, true);
            },
        });

        var element = skin.toolbar('.main.bottom',
            skin.container('.left.navigation-buttons',
                skin.container('.left',
                    buttonSpin,
                    buttonZoom,
                    buttonPan
                ),
                skin.container('.left',
                    !solo.uniview.options.EnableFitButton ? '' : buttonFit
                )
            ),
            skin.container('.right',
                skin.container('.right',
                    buttonSkipAnimation
                ),
                skin.container('.right',
                    buttonSettings,
                    buttonHelp
                )
            )
        );

        solo.on('app.procedure.didPlay', function () {
            buttonSkipAnimation.classList.remove('disabled');
        });

        solo.on('app.procedure.didStop', function () {
            buttonSkipAnimation.classList.add('disabled');
        });

        solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
            skin.toggle(element, !drawingMode);
        });

        return this.exports(element);
    };
});