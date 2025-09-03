/**
 * :useUIPublishOptions
 * :TableBackgroundColor
 * :TableColor
 * :TableHeaderBackgroundColor
 * :TableHeaderColor
 * :ToolbarBackgroundColor
 * :ToolbarColor
 * :TableSelectedBackgroundColor
 * :TableSelectedColor
 * :SelectedFrameColor
 * :ShowSpeedSelection
 * :ShowFreezeCheckbox
 * :ShowAutostopBox
 * :ShowMessagesBox
 * :AutoNumbering
 * :TableFontSize
 * :EnableAutostop
 * :EnableWarnings
 */
define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        var uniview = solo.uniview || {},
            pub = uniview.options || {};

        if (options.useUIPublishOptions || !uniview.config.skipUIPublishOptions) {

            var tableBack = skin.color(pub.TableBackgroundColor || '#FFF'),
                tableText = skin.color(pub.TableColor || '#000'),
                contentBack = skin.color(pub.ContentBackgroundColor || tableBack || '#FFF'),
                contentText = skin.color(pub.ContentTextColor || tableText || '#000'),
                tableHeaderBack = skin.color(pub.TableHeaderBackgroundColor || '#FFF'),
                tableHeaderText = skin.color(pub.TableHeaderColor || '#000'),
                tableSelectedBack = skin.color(pub.TableSelectedBackgroundColor || '#FFEFD5'),
                tableSelectedText = skin.color(pub.TableSelectedColor || '#000'),
                padsBack = skin.color(pub.PadsBackgroundColor || '#F3F3F3'),
                padsText = skin.color(pub.PadsTextColor || '#000'),
                tableBorderColor = skin.color(pub.TableBorderColor || '#808080'),
                subHeadersBack = skin.color(pub.SubHeadersBackgroundColor || '#FFF'),
                subHeadersText = skin.color(pub.SubHeadersTextColor || '#000'),
                messageBodyBackgroundColor = skin.color(pub.MessageBodyBackgroundColor || '#FFF'),
                messageBodyColor = skin.color(pub.MessageBodyColor || '#FFF'),
                messageTextAreaBackgroundColor = skin.color(pub.MessageTextAreaBackgroundColor || '#FFF'),
                messageTextAreaColor = skin.color(pub.MessageTextAreaColor || '#FFF'),
                tableFontSize = 1,
                messageFontSize = 1;

            switch (pub.TableFontSize) {
                case 'Largest':
                    tableFontSize = 1.1;
                    break;
                case 'Larger':
                    tableFontSize = 1.05;
                    break;
                case 'Medium':
                    tableFontSize = 1;
                    break;
                case 'Smaller':
                    tableFontSize = 0.95;
                    break;
                case 'Smallest':
                    tableFontSize = 0.9;
                    break;
            }

            switch (pub.MessageTextAreaFontSize) {
                case 'Largest':
                    messageFontSize = 1.1;
                    break;
                case 'Larger':
                    messageFontSize = 1.05;
                    break;
                case 'Medium':
                    messageFontSize = 1;
                    break;
                case 'Smaller':
                    messageFontSize = 0.95;
                    break;
                case 'Smallest':
                    messageFontSize = 0.9;
                    break;
            }

            skin.css().render({
                '.procedure-alert .skin-modal-panel': {
                    backgroundColor: messageTextAreaBackgroundColor,
                    color: messageTextAreaColor
                },
                '.procedure-alert .skin-modal-title': {
                    backgroundColor: messageBodyBackgroundColor,
                    color: messageBodyColor
                },
                '.skin-rwi-header': {
                    backgroundColor: tableHeaderBack,
                    color: tableHeaderText
                },
                '.skin-tabs .skin-page-title, .skin-tabs .skin-tabs-body': {
                    borderColor: tableBorderColor
                },
                '.instructions-section h3': {
                    backgroundColor: subHeadersBack,
                    color: subHeadersText
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
                '.aux.panel, .aux.panel .skin-tree-item .collapse-button, .aux.panel .skin-tree-item .content': {
                    backgroundColor: contentBack,
                    color: contentText
                },
                '.aux.panel .job .skin-tree-item .content.active': {
                    backgroundColor: tableSelectedBack,
                    color: tableSelectedText
                },
                '.aux.panel .skin-tree-item .content.hoverable:hover, .aux.panel .skin-tree-item .content.hover': {
                    backgroundColor: tableSelectedBack.lighten(8),
                    color: tableSelectedText
                },
                '.aux.panel .skin-holder > .skin-container': {
                    fontSize: tableFontSize + 'em'
                },
                '.procedure-alert .skin-modal-content': {
                    fontSize: messageFontSize + 'em'
                }
            });
        }
    };
});