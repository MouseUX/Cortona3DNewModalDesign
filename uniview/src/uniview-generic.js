/**
 * A function module to display the file in the VRML97 file format.
 * 
 * This is the default customization module to display any VRML97 model. 
 * 
 * @module uniview-generic
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');

    /**
     * A factory function.
     * @param {UISkinController} skin The `UISkinController` object that uses the module.
     * @param {object} options The configuration object of the module.
     * @param {object} options.components
     * @param {factory} options.components.uiGenericContextMenu The factory function of the component used to display the context menu
     * @param {factory} options.components.uiToolbarSceneNavigation The factory function of the component used to display the toolbar that contains the navigation buttons
     * @param {factory} options.components.uiGenericKeymap The factory function of the component to control the application using the keyboard
     * @param {Cortona3DSolo} solo
     * @fires Cortona3DSolo~"uniview.toggleMainPanelOnlyMode"
     * @tutorial module-uniview-generic
     * @tutorial module-usage
     */
    module.exports = function (skin, options, solo) {
        var opt = options.components || {},
            uiGenericContextMenu = opt.uiGenericContextMenu || require('components/rococo/solo-skin-generic-context-menu'),
            uiToolbarSceneNavigation = opt.uiToolbarSceneNavigation || require('components/rococo/solo-skin-toolbar-scene-navigation'),
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options'),
            uiGenericKeymap = opt.uiGenericKeymap || require('components/rococo/solo-skin-generic-keymap');

        solo.dispatch('uniview.toggleMainPanelOnlyMode', true);

        options.helpAction = null;

        var fig = solo.skin.get('main');

        fig.render([
            uiGenericContextMenu,
            uiToolbarSceneNavigation
        ], options);

        skin.create(uiApplyPublishOptions, options);
        skin.create(uiGenericKeymap, options);

        if (options.useUIPublishOptions || !solo.uniview.config.skipUIPublishOptions) {
            skin.create(require('spec/lib/apply-pub-options-toolbar'), options);
        }

        if (!(solo.app.configureInstance(0, 0) & solo.app.DISABLE_DISCARDABLE_GEOMETRY_DATA)) {
            skin.remove('#btn-set-center');
        }
    };
});