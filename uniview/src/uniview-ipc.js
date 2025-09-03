/**
 * A function module to display the parts catalog created by Cortona3D RapidCatalog.
 * 
 * This is the default customization module to display any interactive catalog from the RapidCatalog program.
 * 
 * @module uniview-ipc
 * @requires module:addons/catalog
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');
    require('css!uniview-ipc.css');

    var toArray = require('lib/to-array');

    /**
     * A factory function.
     * @param {UISkinController} skin The `UISkinController` object that uses the module.
     * @param {object} options The configuration object of the module.
     * @param {object} options.components
     * @param {factory} options.components.uiIpcToolbar The factory function of the component used to display the catalog toolbar
     * @param {factory} options.components.uiIpcContextMenu The factory function of the component used to display the context menu
     * @param {factory} options.components.uiIpcToolbarPartSelection The factory function of the component used to display the toolbar to control the selected parts
     * @param {factory} options.components.uiToolbarSceneNavigation The factory function of the component used to display the toolbar that contains the navigation buttons
     * @param {factory} options.components.uiDpl A factory function of the {@link module:components/dpl components/dpl} component
     * @param {factory} options.components.uiDplHeader The factory function of the component used to display the DPL header
     * @param {factory} options.components.uiDplToolbar The factory function of the component used to display the DPL toolbar
     * @param {factory} options.components.uiDplAnchorCommands A factory function of the {@link module:components/dpl-anchor-commands components/dpl-anchor-commands} component
     * @param {factory} options.components.uiDplLegend The factory function of the component used to display the DPL legend
     * @param {factory} options.components.uiIpcApplyPublishOptions The factory function of the component used to apply the catalog specific publish options
     * @param {factory} options.components.uiApplyPublishOptions The factory function of the component used to apply the common publish options
     * @param {factory} options.components.uiIpcKeymap The factory function of the component to control the application using the keyboard
     * @param {factory} options.components.uiHashChangeHandler The factory function of the component used for control after the hash change
     * @param {factory} options.components.uiExternal3DPanel The factory function of the component used to display selected objects in an separate 3d window
     * @param {factory} options.components.uiIpcSettingsPanel The factory function of the component used to display the ipc settings pane
     * @param {factory} options.components.uiIpcTransitionFraction The factory function of the component used to display the range to control the ipc transition animation
     * @param {boolean} options.multiLink Enables support of the `multiLink` feature in the viewer application
     * @param {boolean} options.keep3DStructure Enables support of the `keep3DStructure` feature in the viewer application
     * @param {Cortona3DSolo} solo
     * @fires Cortona3DSolo~"uniview.showAllPanels"
     * @tutorial module-uniview-ipc
     * @tutorial module-usage
     */

    module.exports = function (skin, options, solo) {
        require('addons/catalog');

        var ixml = solo.uniview.ixml;

        function getVisibleLinkedObjectsCount(row, qty) {
            const objects = ixml.getObjectsNamesByRow(row);
            return !objects.length ? qty : objects
                .map(solo.app.getObjectWithName)
                .filter(handle => solo.app.getObjectVisibility(handle) === 0).length;
        }

        if (options.multiLink) {
            solo.catalog.useMultiLink(options);
        }
        if (options.keep3DStructure) {
            solo.catalog.keep3DStructure();
        }

        var opt = options.components || {},
            uiIpcToolbar = opt.uiIpcToolbar || require('components/rococo/solo-skin-ipc-toolbar'),
            uiIpcContextMenu = opt.uiIpcContextMenu || require('components/rococo/solo-skin-ipc-context-menu'),
            uiIpcToolbarPartSelection = opt.uiIpcToolbarPartSelection || require('components/rococo/solo-skin-ipc-toolbar-part-selection'),
            uiToolbarSceneNavigation = opt.uiToolbarSceneNavigation || require('components/rococo/solo-skin-toolbar-scene-navigation'),
            uiDpl = opt.uiDpl || require('components/dpl'),
            uiDplHeader = opt.uiDplHeader || require('components/rococo/solo-skin-ipc-dpl-header'),
            uiDplToolbar = opt.uiDplToolbar || require('components/rococo/solo-skin-ipc-dpl-toolbar'),
            uiDplAnchorCommands = opt.uiDplAnchorCommands || require('components/dpl-anchor-commands'),
            uiDplLegend = opt.uiDplLegend || require('components/rococo/solo-skin-ipc-dpl-legend'),
            uiIpcApplyPublishOptions = opt.uiIpcApplyPublishOptions || require('spec/lib/apply-pub-options-ipc'),
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options'),
            uiIpcKeymap = opt.uiIpcKeymap || require('components/rococo/solo-skin-ipc-keymap'),
            uiHashChangeHandler = opt.uiHashChangeHandler || require('spec/lib/catalog-hash-change-handler'),
            uiExternal3DPanel = opt.uiExternal3DPanel || require('components/rococo/solo-skin-external-3d-panel'),
            uiIpcSettingsPanel = opt.uiIpcSettingsPanel || require('components/rococo/solo-skin-ipc-settings-panel'),
            uiIpcTransitionFraction = opt.uiIpcTransitionFraction || require('components/rococo/solo-skin-ipc-transition-fraction');


        // load catalog add-on
        var fig = solo.skin.get('main'),
            dpl = solo.skin.get('aux'),
            view = solo.skin.get('view'),
            auxview = solo.skin.get('aux-secondary') || solo.skin.get('auxview');


        // side effect ????
        options.transformPrintHeader = options.transformPrintHeader || function () {
            var sheet = this.dismissSheetTitle ? [] : this.sheetLabel + ' ' + this.sheetInfo.description;
            this.subtitle = toArray(this.subtitle).concat(sheet);
            return this;
        };

        skin.create(uiHashChangeHandler, options);
        skin.create(uiApplyPublishOptions, options);

        dpl.create(uiDplAnchorCommands, options);

        fig.render([
            uiToolbarSceneNavigation,
            uiIpcToolbarPartSelection,
            uiIpcContextMenu,
            uiIpcToolbar
        ], options);

        dpl.render([
            uiDplToolbar,
            uiDplHeader,
            uiDpl,
            uiDplLegend
        ], options);

        auxview && auxview.render([
            solo.uniview.options.AllowSelectedObjectsExternal3DView ? uiExternal3DPanel : function () { }
        ], options);

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

        skin.create(uiIpcApplyPublishOptions, options);
        skin.create(uiIpcKeymap, options);

        if (solo.uniview.with3D) {
            solo.app.configureInstance(solo.app.ENABLE_AUTO_SWITCHING_DISPLAY_MODE);
        }

        solo.once('app.firstFrameDidArrive', function () {
            var mode2D = !!(!solo.uniview.with3D || (solo.app.ipc.currentSheetInfo.drawing && solo.uniview.options.Activate2DOnLoad));
            solo.app.ipc.toggleDrawingDisplayMode(mode2D);
        });

        var mode2D = !!(!solo.uniview.with3D || (solo.app.ipc.currentSheetInfo.drawing && solo.uniview.options.Activate2DOnLoad));
        solo.app.ipc.toggleDrawingDisplayMode(mode2D);

        solo.dispatch('uniview.showAllPanels');

        if (solo.uniview.options.TableAdaptiveQty) {
            var indexColQTY = ixml.getDPLColumnIndexById('QTY');

            if (indexColQTY < 0) {
                indexColQTY = ixml.getDPLColumnIndexById('UPA');
            }
    
            if (indexColQTY < 0) {
                indexColQTY = ixml.getDPLColumnIndexById('9CC5401735CB4b25953A9923B17289F4');
            }

            if (indexColQTY >= 0) {
                var css = {};
                css['.dpl-table.transition tbody tr td:nth-child(' + (indexColQTY + 1) + ')'] = {
                    color: solo.uniview.options.TableInactiveTextColor || 'gray'
                };
                solo.uniview.css.render(css);
    
                solo.on('app.ipc.dpl.didSetupTable', () => {
                    document.querySelector('.dpl-table').classList.add('transition');
                })
    
                solo.on('catalog.sheetChangeCompleted', () => {
                    setTimeout(() => {
                        // recalculate QTY
                        document.querySelectorAll('.dpl-table tbody tr[id]')
                            .forEach(function (tr, index) {
                                var row = ixml.getRowByIndex(index),
                                    pre = tr.cells[indexColQTY].children[0],
                                    qty = +pre.textContent;
                                if (qty) {
                                    pre.textContent = getVisibleLinkedObjectsCount(row, qty);
                                }
                            });
                        document.querySelector('.dpl-table').classList.remove('transition');
                    }, 0);
                });
            }
        }
    };
});
