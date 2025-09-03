/**
 * The UI component that is used to show system alert message.
 * @module components/alert
 */
 define(function (require, exports, module) {
    require('css!./alert.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {string} [options.message] Alert body
     * @param {number} [options.autoCloseTimeout=0] Seconds
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent}
     * Default
     * ```xml
     * <div class="skin-alert">
     *  <span class="skin-alert-body">{{options.message}}</span>
     *  <span class="skin-alert-close-button"></span>
     * </div>
     * ```
     * @tutorial component-alert
     */
    module.exports = function (skin, options, solo) {
        var timeout,
            element = skin.create('span.skin-alert', 
            skin.create('span.skin-alert-body', options.message || ''),
            skin.create('span.skin-alert-close-button', {
                onclick: function () {
                    clearTimeout(timeout);
                    element.parentNode.removeChild(element);
                }
            })
        );

        if (+options.autoCloseTimeout > 0) {
            timeout = setTimeout(function () {
                element.parentNode.removeChild(element);
            }, options.autoCloseTimeout * 1000);
        }

        return this.exports(element);
    };
});