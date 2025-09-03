/**
 * :PadsBackgroundColor
 * :PadsTextColor
 * :TableBorderColor
 */
 define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var uniview = solo.uniview || {},
            pub = uniview.options || {};

        if (options.useUIPublishOptions || !uniview.config.skipUIPublishOptions) {

            var padsBack = skin.color(pub.PadsBackgroundColor || '#F3F3F3'),
                padsText = skin.color(pub.PadsTextColor || '#000'),
                tableBorderColor = skin.color(pub.TableBorderColor || '#808080');

            skin.css().render({
                '.skin-tabs .skin-page-title, .skin-tabs .skin-tabs-body': {
                    borderColor: tableBorderColor
                },
                '.skin-tabs .skin-page-title': {
                    backgroundColor: padsBack,
                    color: padsText
                },
                '.skin-tabs .skin-page-title.active': {
                    borderBottomColor: padsBack
                },
                '.skin-tabs .skin-page-body': {
                    backgroundColor: padsBack,
                },
                '.message, .action': {
                    borderColor: tableBorderColor
                }
            });
        }
    };
});