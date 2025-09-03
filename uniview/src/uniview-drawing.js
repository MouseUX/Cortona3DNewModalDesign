/**
 * A function module to display an interactive illustration.
 * 
 * This is the default customization module to display any interactive illustration. 
 * 
 * @module uniview-drawing
 */
define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');

    /**
     * A factory function.
     * @param {UISkinController} skin The `UISkinController` object that uses the module.
     * @param {object} options The configuration object of the module.
     * @param {object} options.components
     * @param {factory} options.components.uiDrawingContextMenu The factory function of the component used to display the context menu
     * @param {Cortona3DSolo} solo
     * @fires Cortona3DSolo~"uniview.toggleMainPanelOnlyMode"
     * @listens Cortona3DSolo~"uniview.ready"
     * @listens Cortona3DSolo~"app.drawing.didHoverHotspot"
     * @tutorial module-uniview-drawing
     * @tutorial module-usage
     */
    module.exports = function (skin, options, solo) {
        var opt = options.components || {},
            uiDrawingContextMenu = opt.uiDrawingContextMenu || require('components/rococo/solo-skin-drawing-context-menu'),
            uiApplyPublishOptions = opt.uiApplyPublishOptions || require('spec/lib/apply-pub-options');

        solo.dispatch('uniview.toggleMainPanelOnlyMode', true);

        options.helpAction = null;

        solo.on('app.drawing.didHoverHotspot', function (name, hover) {
            document.body.title = hover ? name : '';
        });

        solo.on('app.drawing.didSelectHotspot', function (name, key) {
            solo.app.drawing.setSelectedObjects(key === 0 ? name : []);
        });

        skin.render(uiDrawingContextMenu, options);
        skin.create(uiApplyPublishOptions, options);

        solo.once('uniview.ready', function () {
            // recalculate scale limits in FF
            solo.app.drawing.show(false);
            solo.app.drawing.show(true);
        });
    };
});