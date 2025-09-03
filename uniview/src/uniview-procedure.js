/**
 * A function module to display the interactive procedure created by Cortona3D RapidManual.
 * 
 * This is the default customization module to display any interactive procedure from the RapidManual or RapidLearning program.
 * 
 * @module uniview-procedure
 * @requires module:addons/procedure
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');

    /**
     * A factory function.
     * @param {UISkinController} skin The `UISkinController` object that uses the module.
     * @param {object} options The configuration object of the module.
     * @param {object} options.components
     * @param {factory} options.components.uiApplyPublishOptions The factory function of the component used to apply common publish options
     * @param {factory} options.components.uiProcedureApplyPublishOptions The factory function of the component used to apply the procedure publish options
     * @param {factory} options.components.uiProcedureContextMenu The factory function of the component used to display the context menu
     * @param {factory} options.components.uiProcedureCommentPanel The factory function of the component used to display the comment pane
     * @param {factory} options.components.uiProcedureToolbar The factory function of the component used to display the procedure toolbar
     * @param {factory} options.components.uiProcedureMessageModal The factory function of the component used to display the message modal pane
     * @param {factory} options.components.uiProcedureSettingsPanel The factory function of the component used to display the procedure settings pane
     * @param {factory} options.components.uiProcedureToolbarPartSelection The factory function of the component used to display the toolbar to control the selected parts
     * @param {factory} options.components.uiToolbarSceneNavigation The factory function of the component used to display the toolbar that contains the navigation buttons
     * @param {factory} options.components.uiProcedureKeymap The factory function of the component to control the application using the keyboard
     * @param {factory} options.components.uiApplyProcedureHashParams The factory function of the component used to apply onHashChange handler 
     * @param {Cortona3DSolo} solo
     * @fires Cortona3DSolo~"uniview.toggleMainPanelOnlyMode"
     * @tutorial module-uniview-procedure
     * @tutorial module-usage
     */
    module.exports = function (skin, options, solo) {
        require('addons/procedure');

        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['procedure-with-document'] || {};

        var opt = options.components || {},
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options'),
            uiProcedureApplyPublishOptions = opt.uiProcedureApplyPublishOptions || require('spec/lib/apply-pub-options-procedure'),
            uiProcedureContextMenu = opt.uiProcedureContextMenu || require('components/rococo/solo-skin-procedure-context-menu'),
            uiProcedureCommentPanel = opt.uiProcedureCommentPanel || require('components/rococo/solo-skin-procedure-comment-panel'),
            uiProcedureToolbar = opt.uiProcedureToolbar || require('components/rococo/solo-skin-procedure-toolbar'),
            uiProcedureMessageModal = opt.uiProcedureMessageModal || require('components/rococo/solo-skin-procedure-message-modal'),
            uiProcedureSettingsPanel = opt.uiProcedureSettingsPanel || require('components/rococo/solo-skin-procedure-settings-panel'),
            uiProcedureToolbarPartSelection = opt.uiProcedureToolbarPartSelection || require('components/rococo/solo-skin-procedure-toolbar-part-selection'),
            uiProcedureKeymap = opt.uiProcedureKeymap || require('components/rococo/solo-skin-procedure-keymap'),
            uiToolbarSceneNavigation = opt.uiToolbarSceneNavigation || require('components/rococo/solo-skin-toolbar-scene-navigation'),
            uiApplyProcedureHashParams = opt.uiApplyProcedureHashParams || require('spec/lib/apply-procedure-hash-params');

        solo.dispatch('uniview.toggleMainPanelOnlyMode', true);

        var fig = solo.skin.get('main'),
            view = solo.skin.get('view');

        skin.create(uiApplyPublishOptions, options);

        view.render([
            uiProcedureCommentPanel,
            {
                component: uiProcedureSettingsPanel,
                options: {
                    enableAutoHide: true,
                    hideSelectionModeSetting: !solo.uniview.options.Enable3DPartSelection,
                    hideOutlineHoveredObjectsSetting: !solo.uniview.options.Enable3DPartSelection,
                    auxSettings: {
                        name: "Comment",
                        label: i18n.labelShowComments,
                        disabled: !ixml
                    },
                }
            }
        ], options);

        fig.render([
            uiProcedureContextMenu,
            uiToolbarSceneNavigation,
            solo.uniview.options.Enable3DPartSelection ? uiProcedureToolbarPartSelection : function () { },
            uiProcedureMessageModal,
            {
                component: uiProcedureToolbar,
                options: {
                    disableFastForward: solo.uniview.options.ShowPrevNextButtons === false,
                    disableSeekControl: solo.uniview.options.ShowSmoothControl === false,
                    disableDurationView: solo.uniview.options.ShowSmoothControl === false,
                    enableStopButton: false,
                    enableSoundIndicator: true,
                    disableExpandButton: true
                }
            }
        ], options);

        solo.app.procedure.defaultSeekMode = solo.app.procedure.SEEK_DEFAULT;

        // apply UI publish options
        skin.create(uiProcedureApplyPublishOptions, options);

        skin.create(uiProcedureKeymap, options);

        skin.create(uiApplyProcedureHashParams, options);

    };
});