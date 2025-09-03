/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop animated {boolean}
 * @prop helpAction {function}
 * @prop fitObjectFactor {number}
 */
define(function (require, exports, module) {

    var uiModal = require('components/modal'),
        uiContextMenu = require('components/context-menu');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['solo-skin-ipc-context-menu'] || {};

        var overlength = require('lib/overlength');

        var m_animated = true,
            m_isSomeItemHidden = false,
            m_drawingMode = false,
            m_aboutAction = function () {
                var opt = ixml.getOptions(),
                    lang = opt.SpecLang ? " (" + opt.SpecLang + ")" : "",
                    viewer = solo.uniview,
                    customization = (overlength(viewer.customization.description) + ' ' + viewer.customization.version).trim(),
                    isCatalog = ixml.json.$('/ipc/figure/ipc-table/table/tbody').length > 0;
                var modal = skin.create(uiModal, {
                    hideDismissButton: true,
                    title: viewer.description,
                    content: [
                        skin.p('.accent', isCatalog ? i18n.description : i18n.illustration),
                        skin.p('.about-section',
                            skin.div({}, opt.SpecID + " " + opt.SpecVersion + lang),
                            opt.PublisherVersion ? skin.div({}, i18n.publisher + " " + opt.PublisherVersion) : ''
                        ),
                        skin.create('hr'),
                        skin.p('.about-section',
                            skin.div({}, viewer.description + " " + viewer.version),
                            skin.div({}, "Cortona3D Solo " + solo.app.version()),
                            !customization ? '' : skin.div({}, customization)
                        )
                    ]
                });
                modal.classList.add('about');
                solo.skin.get('app').append(modal);
            };

        function getContextMenuOptions(row) {
            var menu = [],
                index = ixml.getIndexByRow(row),
                hidden = !solo.app.ipc.isItemVisible(row),
                nil = !ixml.getObjectsForRow(row).length;
            selected = solo.app.ipc.selectedItems.indexOf(row) >= 0;

            if (row >= 0) {

                var item = ixml.getItemByRow(row);

                if (item) {
                    menu.push({
                        description: i18n.item + ixml.getItemByRow(row)
                    });
                    menu.push(null);
                }

                // item functions
                if (solo.app.ipc.isItemActive(row)) {
                    if (!m_drawingMode) {
                        menu.push({
                            description: i18n.fit,
                            disabled: nil,
                            action: function (e) {
                                solo.app.ipc.fitItem(index, m_animated, options.fitObjectFactor);
                            },
                        });
                        menu.push({
                            description: hidden ? i18n.show : i18n.hide,
                            disabled: nil,
                            action: function (e) {
                                solo.app.ipc.toggleItemVisibility(index, hidden);
                            },
                        });
                    }
                    menu.push({
                        description: selected ? i18n.unselect : i18n.select,
                        action: function (e) {
                            solo.app.ipc.toggleSelection(index);
                            solo.dispatch('catalog.didChangeSelection', solo.app.ipc.selectedItems);
                        },
                    });
                    menu.push(null);
                }

                // sheet functions
                var sheets = ixml.getSheetsForRow(row);

                if (sheets.length) {
                    sheets.forEach(function (sheetInfo) {
                        var isCurrent = sheetInfo.id === solo.app.ipc.getCurrentSheet().id;
                        menu.push({
                            description: sheetInfo.description,
                            checked: isCurrent,
                            accent: sheetInfo.id === ixml.getPrefferedSheetId(index),
                            action: function (e) {
                                solo.app.ipc.setCurrentSheet(sheetInfo.id, m_animated);
                            }
                        });
                    });
                    menu.push(null);
                }
            }

            if (m_drawingMode) {
                menu = menu.concat(require('./context-menu-items-drawing'));
            } else {
                menu.push({
                    description: i18n.reset,
                    action: function (e) {
                        var btnReset = document.getElementById('btn-reset');
                        if (btnReset) {
                            btnReset.click();
                        }
                    },
                });
                menu.push({
                    description: i18n.showAll,
                    action: function (e) {
                        solo.app.ipc.restoreAllItemsVisibility();
                    },
                    disabled: !m_isSomeItemHidden
                });
            }

            menu.push(null);

            menu.push({
                disabled: !options.helpAction,
                description: i18n.help,
                action: options.helpAction
            });

            menu.push(null);

            menu.push({
                description: i18n.about,
                action: m_aboutAction
            });

            return menu;
        }

        var doc = solo.uniview.doc;
        if (doc.type !== "ipc") return;

        if (typeof options.animated === 'boolean') {
            m_animated = options.animated;
        }

        // use popup menu

        // on call context menu
        solo.on('catalog.didCallContextMenu', function (row, x, y, target) {
            var options = {
                    parent: document.body,
                    menu: getContextMenuOptions(row),
                    row: row,
                    x: x,
                    y: y,
                    target: target
                };
            solo.dispatch('uniview.didCallContextMenu', options);
            skin.create(uiContextMenu, options);
        });

        // on catalog.didChangeHiddenItems
        solo.on('catalog.didChangeHiddenItems', function (hiddenItems) {
            m_isSomeItemHidden = hiddenItems.length > 0;
        });

        solo.on('app.ipc.didDrawingDisplayMode', function (drawingMode) {
            m_drawingMode = drawingMode;
        });
    };
});