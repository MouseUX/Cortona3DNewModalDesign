/**
 * The UI component that is used to create an activity indicator.
 * @module components/wait
 */
define(function (require, exports, module) {
    require('css!./wait.css');
    require('css!./activity.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {string} [options.type] 
     * "win8" - The Windows 8 activity indicator style
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent}
     * Default
     * ```xml
     * <div class="cortona3dsolo-wait"
     *      <div class="activity-indicator"></div>
     * </div>
     * ```
     * Type=`"win8"`
     * ```xml
     * <div class="cortona3dsolo-wait"
     *      <div class="activity-indicator-win8"></div>
     * </div>
     * ```
     * @tutorial component-usage
     * @tutorial component-wait
     */
    module.exports = function (skin, options, solo) {
        /*
            <div class="activity-indicator-win8">
                <div id="wBall_1" class="wBall"><div class="wInnerBall"></div></div>
                <div id="wBall_2" class="wBall"><div class="wInnerBall"></div></div>
                <div id="wBall_3" class="wBall"><div class="wInnerBall"></div></div>
                <div id="wBall_4" class="wBall"><div class="wInnerBall"></div></div>
                <div id="wBall_5" class="wBall"><div class="wInnerBall"></div></div>
                <div id="wBall_6" class="wBall"><div class="wInnerBall"></div></div>
            </div>
            element = h('.activity-indicator-win8', '123456'.split('').map(function (n) { return h('.wBall#wBall_' + n, h('.wInnerBall')); }))
        */

        var h = skin.create,
            orbit = '<div><div></div></div>',
            indicator;

        switch (options.type) {
            case 'win8':
                indicator = h('.activity-indicator-win8', [
                    orbit, orbit, orbit, orbit, orbit, orbit
                ]);
                break;
            default:
                indicator = h('.activity-indicator', '<div><div><div></div></div></div>');
        }

        var element = h('.cortona3dsolo-wait', indicator);

        return this.exports(element);
    };
});