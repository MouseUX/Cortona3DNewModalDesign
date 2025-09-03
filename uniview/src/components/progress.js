/**
 * The UI component that is used to create a progress indicator.
 * @module components/progress
 */
define(function (require, exports, module) {
    require('css!./progress.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {string} [options.color="#2F4F4F"] The color of the progress indicator
     * @param {string} [options.height="2em"] The height of the progress indicator
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="skin-progress-bar"></div>
     * ```
     * @listens Cortona3DSolo~"app.onProgress"
     * @listens module:components/progress~"set"
     * @tutorial component-usage
     * @tutorial component-progress
     */
    module.exports = function (skin, options, solo) {
        var element = skin.createElement('.skin-progress-bar');

        if (options.color) element.style.backgroundColor = options.color;
        if (options.height) element.style.height = options.height;

        function set(value) {
            value = (value || 0);
            if (value == 100) value = 0;
            element.style.width = value + "%";
        }

        solo.on("app.onProgress", function (position, total) {
            set(Math.floor(position * 100 / total));
        });

        /**
         * It is used to set the progress value in percents from 0 to 100.
         * @event module:components/progress~"set"
         * @type {number}
         */
        this.on('set', set);

        return this.exports(element);
    };
});