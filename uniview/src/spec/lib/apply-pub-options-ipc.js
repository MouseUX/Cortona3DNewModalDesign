/**
 * :useUIPublishOptions
 * :TableBackgroundColor ="#FFF"
 * :TableBackgroundColorSel ="#FFF"
 * :TableBackgroundColorHL ="#C8E8FF"
 * :TableBackgroundColorHLNotIll ="#FFE4E1"
 * :TableTextColor ="#000"
 * :ContextMenuBackgroundColor ="#FFF"
 * :TableInactiveTextColor ="gray"
 */

define(function (require, exports, module) {

    module.exports = function (skin, options, solo) {
        var uniview = solo.uniview || {},
            pub = uniview.options || {};

        function hookAutoDPLTableWidth() {
            var dplTable = document.querySelector('.dpl-table'),
                dplContainer = document.querySelector('.dpl-container');
            if (dplTable.offsetWidth > dplContainer.offsetWidth) {
                solo.removeListener('uniview.component.splitter.moved', hookAutoDPLTableWidth);
                solo.uniview.css.render({
                    '@media (orientation: landscape)': {
                        '.aux.panel': {
                            minWidth: dplTable.offsetWidth + 18 + 'px'
                        }
                    }
                });
            }
        }

        if (solo.uniview.options.LockDPLTableWidth) {
            solo.on('uniview.component.splitter.moved', hookAutoDPLTableWidth);
        }

        if (options.useUIPublishOptions || !uniview.config.skipUIPublishOptions) {

            skin.create(require('./apply-pub-options-toolbar'));

            var contentBack = skin.color(pub.ContentBackgroundColor || '#FFF'),
                contentText = skin.color(pub.ContentTextColor || '#000'),
                tableBack = skin.color(pub.TableBackgroundColor || '#FFF'),
                tableBackDark = tableBack.darken(),
                tableSelected = skin.color(pub.TableBackgroundColorSel || '#FFF'),
                tableSelectedLight = tableSelected.lighten(),
                tableHover = skin.color(pub.TableBackgroundColorHL || '#C8E8FF'),
                tableHoverNil = skin.color(pub.TableBackgroundColorHLNotIll || '#FFE4E1'),
                tableText = skin.color(pub.TableTextColor || '#000'),
                tableHeaderBack = skin.color(pub.TableHeaderBackgroundColor || '#FFF'),
                tableHeaderText = skin.color(pub.TableHeaderColor || '#000'),
                contextMenuBack = skin.color(pub.ContextMenuBackgroundColor || '#FFF'),
                borderColor = skin.color(pub.TableBorderColor || '#808080'),
                tableSelectedTextHsl = tableSelected.desaturate().toHsl();

            tableSelectedTextHsl.l = tableSelected.getLuminance() > 0.5 ? 5 : 95;

            var tableSelectedText = skin.color(pub.TableTextColorSel || tableSelectedTextHsl);


            skin.css().render({
                ".solo-uniview-content": {
                    backgroundColor: contentBack,
                    color: contentText
                },
                ".skin-ipc-dpl-header": {
                    backgroundColor: tableHeaderBack,
                    color: tableHeaderText
                },
                ".dpl-table": {
                    borderColor: borderColor,
                    "& tr": {
                        backgroundColor: tableBack,
                        color: tableText
                    },
                    "& thead td": {
                        background: 'linear-gradient(to bottom, ' + tableBack + ' 0%, ' + tableBackDark + ' 100%)',
                        borderColor: borderColor,
                    },
                    ".dpl-container.dpl-header-sticky & thead tr:first-child td": {
                        borderTopColor: borderColor,
                        borderBottomColor: borderColor
                    },
                    "& tbody td": {
                        borderColor: borderColor,
                        borderTopColor: borderColor,
                        borderBottomColor: borderColor,
                    },
                    "& tbody .disabled td": {
                        color: pub.TableInactiveTextColor || 'gray'
                    },
                    "& tbody tr.selected": {
                        background: 'linear-gradient(to bottom, ' + tableSelectedLight + ' 0%, ' + tableSelected + ' 100%)',
                        color: tableSelectedText
                    },
                    "& tbody tr:hover, & tbody tr.hover": {
                        backgroundColor: tableHover
                    },
                    "& tbody tr.nil:hover, & tbody tr.nil.hover": {
                        backgroundColor: tableHoverNil
                    }
                },
                ".skin-popup-menu": {
                    backgroundColor: contextMenuBack
                }
            });
        }

        if (solo.catalog) {
            solo.catalog.options.enableGhostItems = !!pub.EnableGhostItems;
            solo.catalog.options.disableMultipleSelections = !!pub.DisableMultipleSelections;
        }

        if (uniview.with3D) {
            if (solo.uniview.options.UpRight) {
                Cortona3DSolo.app.addObjects(
                    Cortona3DSolo.app.createObjectsFromString('NavigationInfo { type [ "UPRIGHT", "EXAMINE", "ANY" ] }')
                );
            }
        }

        solo.app.ipc.sheetTransitionRate = +pub.TransitionRate || 1;
    };
});