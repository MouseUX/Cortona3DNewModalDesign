/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop animated {boolean}
 * @prop clickObjectToPreferredView {boolean}
 * @prop ignoreTransparency {boolean}
 * @prop singleDisplayMode {boolean}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-ipc-toolbar.css');

    var escapeHTML = require('lib/escape-html');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['solo-skin-ipc-toolbar'] || {};

        var uiButtonExpand = require('./ui/btn-expand'),
            uiSettingsItem = require('components/rococo/solo-skin-settings-item');

        var m_viewHistory = [];

        var doc = solo.uniview.doc;
        if (doc.type !== "ipc") return;

        function showScreenTip(index) {
            var screenTip = "";
            if (index >= 0) {
                screenTip = ixml.getScreenTip(index);
                if (options.clickObjectToPreferredView) {
                    var id = ixml.getPrefferedSheetId(index);
                    if (id && id !== solo.app.ipc.getCurrentSheet().id) {
                        screenTip += '\n' + i18n.referTo + ' ' + ixml.getSheetInfo(id).description;
                    }
                }
            }
            document.body.title = screenTip;
        }

        var IllustrationTypeOpposite = {'1':2, '2':1, '0':-1}[solo.uniview.options.IllustrationType];

        var selectorSheets = skin.create(uiSettingsItem, {
            name: 'Sheet',
            label: i18n.labelSheet,
            type: 'select',
            choice: doc.sheets
                .filter(sheetInfo => +(sheetInfo.metadata || {}).IllustrationType !== IllustrationTypeOpposite)
                .map(function (sheet) {
                    return {
                        value: sheet.id,
                        description: new Array(sheet.indentationLevel + 1).join(i18n.indentationSymbol) + escapeHTML(sheet.description)
                    };
                }),
            onchange: function (value) {
                solo.app.ipc.setCurrentSheet(value, !solo.uniview.settings.SkipAnimation);
            }
        });

        var buttonToggle = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'DrawingDisplayMode',
            id: 'btn-2d-graphics',
            label: i18n.titleToggleDisplayMode,
            onchange: function (value) {
                solo.app.ipc.toggleDrawingDisplayMode(value);
            }
        });

        var sheetRevMark = skin.div('.sheet-rev-mark', 'R'),
            sheetRevExists = ixml.json.$('ipc/figure/views//view').some(function (view) {
                return +view.$attr('changed');
            });

        skin.toggle(sheetRevMark, sheetRevExists);

        function isSheetChanged(id) {
            var view = ixml.json.$('ipc/figure/views/view').filter(function (view) {
                return view.$attr('id') === id;
            })[0];
            return view ? +view.$attr('changed') : false;
        }

        function updateSheetRevMark(id) {
            if (isSheetChanged(id || solo.app.ipc.currentSheetInfo.id)) {
                skin.show(sheetRevMark);
            } else {
                skin.hide(sheetRevMark);
            }
        }

        function filterSheetSelector(drawingMode) {
            var select = selectorSheets.querySelector('select');
            if (!select) return;

            var IllustrationType = drawingMode === void 0 ? -1 : (drawingMode ? 1 : 2),
                currentSheetId = solo.app.ipc.currentSheetInfo.id;

            Array.prototype.slice.call(select.options).forEach(function (option) {
                var sheetInfo = ixml.getSheetInfo(option.value);
                var metadata = sheetInfo.metadata;
                if (+metadata.IllustrationType === IllustrationType || (drawingMode && !sheetInfo.drawing)) {
                    skin.hide(option, true);
                } else {
                    skin.show(option);
                }
            });

            var validSheets = doc.sheets.filter(sheetInfo => +(sheetInfo.metadata || {}).IllustrationType !== IllustrationType || sheetInfo.id === currentSheetId);
            var currentIndex = validSheets.findIndex(sheetInfo => sheetInfo.id === currentSheetId);
            var metadata = validSheets[currentIndex].metadata || {};
            if (+metadata.IllustrationType === IllustrationType || (drawingMode && !validSheets[currentIndex].drawing)) {
                if (currentIndex > 0) {
                    currentIndex--;
                } else if (currentIndex < (validSheets.length - 1)) {
                    currentIndex++;
                }
            }
            solo.app.ipc.setCurrentSheet(validSheets[currentIndex].id, false);
        }

        var buttonExpand = options.disableExpandButton ? '' : skin.create(uiButtonExpand, {
            id: 'btn-show-graphics-only',
            panelName: 'Main'
        }).$el;

        var buttonSkipAnimation = skin.create(uiSettingsItem, {
            type: 'buttonImg',
            name: 'SkipAnimation',
            id: "btn-skip-animation",
            value: (typeof options.animated === 'boolean') ? !options.animated : false,
            label: i18n.titleSkipAnimation,
            onchange: function (value) {
                solo.dispatch('app.ipc.didSkipAnimation', value);
            }
        });

        var buttonSettings = skin.create(uiSettingsItem, {
            name: "Settings",
            type: "buttonImg",
            label: i18n.settings
        });

        var element = skin.toolbar('#toolbar-ipc.main.top',
            skin.container('.left',
                sheetRevMark,
                selectorSheets,
                skin.buttonImg({
                    id: 'btn-reset',
                    title: i18n.titleReset,
                    onclick: function () {
                        var sheetInfo = m_viewHistory[m_viewHistory.length - 1];
                        if (solo.app.ipc.sheetTransition && m_viewHistory.length > 1) {
                            solo.app.ipc.setCurrentSheet(m_viewHistory[m_viewHistory.length - 2].id, false);
                            solo.app.ipc.setCurrentSheet(sheetInfo.id, false);
                            m_viewHistory.length -= 2;
                        } else {
                            sheetInfo && solo.dispatch('app.ipc.didSelectSheet', sheetInfo);
                            solo.app.ipc.resetCurrentSheet(true);
                        }
                        solo.dispatch('uniview.didReset');
                    }
                }),
                options.singleDisplayMode ? '' : buttonToggle
            ),
            skin.container('.right',
                skin.buttonImg({
                    id: "btn-print-graphics",
                    title: i18n.titlePrintGraphics,
                    onclick: function () {
                        require('actions/print-graphics').print(options);
                    }
                }),
                buttonSkipAnimation,
                (solo.uniview.with3D || options.customSettings || options.auxSettings) ? buttonSettings : '',
                buttonExpand
            )
        );

        solo.on('app.ipc.didSelectSheet', function (sheet) {
            if (m_viewHistory.length === 0 || sheet.id !== m_viewHistory[m_viewHistory.length - 1].id) {
                m_viewHistory.push(sheet);
            }
            solo.uniview.settings.Sheet = sheet.id;
            updateSheetRevMark(sheet.id);
            var IllustrationTypeOpposite = solo.uniview.settings.DrawingDisplayMode ? 1 : 2;
            var sheetInfo = ixml.getSheetInfo(sheet.id);
            var metadata = sheetInfo.metadata;
            if (+metadata.IllustrationType === IllustrationTypeOpposite || (solo.uniview.settings.DrawingDisplayMode && !sheet.drawing && !+solo.uniview.options.IllustrationType)) {
                solo.uniview.settings.DrawingDisplayMode = !solo.uniview.settings.DrawingDisplayMode;
            }
            var IllustrationType = solo.uniview.settings.DrawingDisplayMode ? 2 : 1;
            solo.dispatch('uniview.settings.disableDrawingDisplayMode', (!solo.uniview.settings.DrawingDisplayMode && !sheet.drawing) || +metadata.IllustrationType === IllustrationType);
        });

        solo.on('app.drawing.didFailLoadDrawing', function (url, status) {
            solo.dispatch('uniview.settings.disableDrawingDisplayMode', true);
        });

        solo.on('app.ipc.didDrawingDisplayMode', function (drawingMode) {
            solo.uniview.settings.DrawingDisplayMode = drawingMode;

            if (drawingMode) {
                skin.classList.add('display-mode-2d');
            } else {
                skin.classList.remove('display-mode-2d');
            }
            solo.dispatch("core.didChangeLayout");
        });

        // hover
        solo.on('catalog.didHoverItem', showScreenTip);

        // select
        solo.on('catalog.didSelectItem', function (index) {
            if (index >= 0) {
                if (options.clickObjectToPreferredView) {
                    var id = solo.uniview.ixml.getPrefferedSheetId(index);
                    if (id && id !== solo.app.ipc.getCurrentSheet().id) {
                        solo.app.ipc.setCurrentSheet(id, !solo.uniview.settings.SkipAnimation);
                    }
                }
            }
        });

        solo.on('uniview.filterSheetSelector', filterSheetSelector);

        solo.once('uniview.ready', function () {
            var sheetSelect = selectorSheets.querySelector('select');
            if (sheetSelect) {
                sheetSelect.options.selectedIndex = 0;
                sheetSelect.onchange();
            }
        });

        return this.exports(element);
    };
});