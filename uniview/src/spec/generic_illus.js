/**
 * 
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');
    require('css!./generic_illus.css');

    module.exports = function (skin, options, solo) {
        require('addons/catalog');

        var opt = options.components || {},
            uiIpcToolbar = opt.uiIpcToolbar || require('components/rococo/solo-skin-ipc-toolbar'),
            uiIpcToolbarPartSelection = opt.uiIpcToolbarPartSelection || require('components/rococo/solo-skin-ipc-toolbar-part-selection'),
            uiToolbarSceneNavigation = opt.uiToolbarSceneNavigation || require('components/rococo/solo-skin-toolbar-scene-navigation'),
            uiIpcContextMenu = opt.uiIpcContextMenu || require('components/rococo/solo-skin-ipc-context-menu'),
            uiIpcKeymap = opt.uiIpcKeymap || require('components/rococo/solo-skin-ipc-keymap'),
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options'),
            uiIpcApplyPublishOptions = opt.uiIpcApplyPublishOptions || require('spec/lib/apply-pub-options-ipc'),
            uiButtonHelp = require('components/rococo/ui/btn-help'),
            uiIpcSettingsPanel = opt.uiIpcSettingsPanel || require('components/rococo/solo-skin-ipc-settings-panel'),
            uiIpcTransitionFraction = opt.uiIpcTransitionFraction || require('components/rococo/solo-skin-ipc-transition-fraction'),
            uiExternal3DPanel = opt.uiExternal3DPanel || require('components/rococo/solo-skin-external-3d-panel');

        var stubDPL = {
            items: [],
            byName: {}
        };

        if (!solo.uniview.options.helpUrl) {
            solo.uniview.options.helpUrl = requirejs.toUrl(
                'static/help/illus/' + solo.uniview.config.lang + '/help.html'
            );
        }

        solo.expand(solo.app.ipc.interactivity, {
            getItemInfo: function (row) {
                return stubDPL.items[row];
            },
            getRowByObjectName: function (name) {
                if (!name) return -1;
                var info = stubDPL.byName[name];
                if (!info) {
                    info = {
                        row: stubDPL.items.length,
                        metadata: {},
                        objectNames: [name],
                        part: {},
                        roles: new Array(8),
                        screentip: name,
                        sheetId: "",
                        commands: []
                    };
                    stubDPL.byName[name] = info;
                    stubDPL.items.push(info);
                }
                return info.row;
            },
            getIndexByRow: function (row) {
                return row;
            },
            getRowByIndex: function (index) {
                return index;
            },
            getChildren: function () {
                return [];
            },
            getObjectsNamesByRow: function (row) {
                return stubDPL.items[row].objectNames;
            }
        });

        solo.expand(solo.app.ipc, {
            isItemActive: function () {
                return true;
            }
        });

        skin.create(uiApplyPublishOptions, options);
        skin.create(uiIpcApplyPublishOptions, options);

        solo.dispatch('uniview.toggleMainPanelOnlyMode', true);

        // load catalog add-on
        var fig = solo.skin.get('main'),
            view = solo.skin.get('view'),
            auxview = solo.skin.get('aux-secondary') || solo.skin.get('auxview');

        // load components
        if (solo.uniview.with3D || options.customSettings || options.auxSettings) {
            view.render([
                {
                    component: uiIpcSettingsPanel,
                    options: {
                        enableAutoHide: true
                    }
                },
                uiIpcTransitionFraction
            ], options);
        }

        fig.render([
            uiToolbarSceneNavigation,
            uiIpcToolbarPartSelection,
            uiIpcContextMenu,
            {
                component: uiIpcToolbar,
                options: {
                    disableExpandButton: true,
                    printHeader: {
                        description: solo.uniview.i18n['solo-skin-ipc-dpl-header'].title,
                        sheetLabel: solo.uniview.i18n['solo-skin-ipc-dpl-header'].sheet
                    }
                }
            }
        ], options);

        auxview && auxview.render([
            solo.uniview.options.AllowSelectedObjectsExternal3DView ? uiExternal3DPanel : function () { }
        ], options);

        if (options.helpAction) {
            document.querySelector('#toolbar-ipc .right').append(
                fig.create(uiButtonHelp, options).$el
            );
        }

        skin.create(uiIpcKeymap, options);

        solo.once('app.firstFrameDidArrive', function () {
            solo.app.ipc.toggleDrawingDisplayMode(!solo.uniview.with3D);
        });

        solo.app.ipc.toggleDrawingDisplayMode(!solo.uniview.with3D);

        if (solo.uniview.with3D) {
            solo.app.configureInstance(solo.app.ENABLE_AUTO_SWITCHING_DISPLAY_MODE);
        }

        solo.on('app.drawing.didEnterHotspot', function (name) {
            setTimeout(function () {
                solo.app.drawing.setHoveredObjects(name);
            }, 0);
        });
        solo.on('app.drawing.didLeaveHotspot', function (name) {
            solo.app.drawing.setHoveredObjects([]);
        });
        solo.on('app.drawing.didSelectHotspot', function (name) {
            solo.app.drawing.setSelectedObjects(name);
        });
        solo.on('uniview.didReset', function () {
            solo.app.drawing.setSelectedObjects([]);
        });

        solo.on('uniview.settings.changedSelectedObjectsExternalView', function (value) {
            solo.dispatch('uniview.toggleMainPanelOnlyMode', !value);
        });
    };
});