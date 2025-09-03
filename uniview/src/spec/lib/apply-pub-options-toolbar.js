/**
 * :useUIPublishOptions
 * :ToolbarBackgroundColor
 * :ToolbarColor
 */
define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var uniview = solo.uniview || {},
            pub = uniview.options || {};

        if (options.useUIPublishOptions || !uniview.config.skipUIPublishOptions) {

            var toolbarBack = skin.color(pub.ToolbarBackgroundColor || '#D6D3CF'),
                toolbarText = skin.color(pub.ToolbarColor || '#000'),
                controlBack = toolbarBack.lighten(30),
                controlTextHsl = controlBack.desaturate().toHsl();

            controlTextHsl.l = controlBack.getLuminance() > 0.5 ? 5 : 95;

            var controlText = skin.color(controlTextHsl);

            var calculateDisabledText = function (textColor, backColor) {
                var delta = (backColor.getBrightness() - textColor.getBrightness() * 0.7 - backColor.grayscale().getBrightness() * 0.3) * 100 / 255 / 2;
                return backColor.grayscale().darken(delta / Math.abs(delta) * Math.max(5, Math.abs(delta)));
            }


            var css = {
                '.skin-holder': {
                    '&': {
                        '.skin-toolbar': {
                            backgroundColor: toolbarBack,
                            color: toolbarText
                        },
                        '.skin-control': {
                            backgroundColor: controlBack,
                            color: controlText
                        },
                        '.skin-control:disabled': {
                            color: calculateDisabledText(controlText, controlBack)
                        },
                        '.skin-toolbar.main': {
                            background: 'linear-gradient(to top, ' + toolbarBack + ', ' + toolbarBack.lighten(5) + ')'
                        },
                        '.skin-toolbar.disabled, .disabled .skin-toolbar, .skin-toolbar .disabled': {
                            color: calculateDisabledText(toolbarText, toolbarBack)
                        }
                    }
                }
            };

            skin.css(css).render();
        }
    };
});