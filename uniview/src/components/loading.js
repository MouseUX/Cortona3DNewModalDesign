/**
 * The UI component that is used to display the loading indicator.
 * @module components/loading
 */
define(function (require, exports, module) {
    require('css!./loading.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {object} options.i18n
     * @param {string} [options.i18n.loading="Loading"]
     * @param {string} [options.i18n.initializing="Initializing"]
     * @param {string} [options.i18n.failed="Failed"]
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * @listens module:components/loading~"start"
     * @listens module:components/loading~"init"
     * @listens module:components/loading~"success"
     * @listens module:components/loading~"failed"
     * @tutorial component-usage
     * @tutorial component-loading
     */
    module.exports = function (skin, options, solo) {
        var m_classList = skin.classList,
            i18n = options.i18n || {
                "loading": "Loading",
                "initializing": "Initializing",
                "failed": "Loading failed"
            };

        skin.css({
            '.loading': {
                '&:before': {
                    content: JSON.stringify(i18n.loading)
                },
                '&.init:before': {
                    content: JSON.stringify(i18n.initializing)
                },
                '&.error:before': {
                    content: JSON.stringify(i18n.failed)
                }
            }
        }).render();

        /**
         * It is used to indicate the start of the loading process.
         * @event module:components/loading~"start"
         */
        this.on('start', function () {
            m_classList.add('loading');
        });
        /**
         * It is used to indicate the start of the initialization process at the end of the loading process.
         * @event module:components/loading~"init"
         */
        this.on('init', function () {
            m_classList.add('init');
        });
        /**
         * It is used to indicate the successful completion of the loading and initialization process.
         * @event module:components/loading~"success"
         */
        this.on('success', function () {
            m_classList.remove('loading');
            m_classList.remove('init');
        });
        /**
         * It is used to indicate that the loading or initialization process did not complete successfully.
         * @event module:components/loading~"failed"
         */
        this.on('failed', function () {
            m_classList.add('error');
        });
    };
});