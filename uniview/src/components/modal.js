/**
 * The UI component that is used to display a modal panel.
 * @module components/modal
 */
define(function (require, exports, module) {
    require('css!./modal.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {string} [options.title]
     * @param {HTMLElement} [options.content]
     * @param {HTMLElement} [options.footerContent]
     * @param {boolean} [options.hideDismissButton=false]
     * @param {object} options.i18n
     * @param {string} [options.i18n.close="OK"]
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="skin-modal skin-container cortona3dsolo-popover">
     *      <div class="skin-modal-panel">
     *          <div class="skin-modal-title skin-container"></div>
     *          <div class="skin-modal-content skin-container"></div>
     *          <div class="skin-modal-footer skin-container"></div>
     *      </div>
     * </div>
     * ```
     * @listens UISkinController~event:"modal.close"
     * @listens module:components/modal~"close"
     * @fires module:components/modal~"closed"
     * @fires Cortona3DSolo~"uniview.component.modal.closed"
     * @tutorial component-usage
     * @tutorial component-modal
     */
    module.exports = function (skin, options, solo) {

        var getSvgAsset = require('lib/svg-assets');

        var component = this,

            i18n = options.i18n || {
                "close": "OK"
            },

            closeButton = options.hideDismissButton ? '' : skin.button({
                classList: 'role-close',
                onclick: close
            }, i18n.close),

            closeButtonMain = !options.enableCloseButton || options.hideDismissButton ? '' : skin.buttonImg({
                title: solo.uniview.i18n.ui.close,
                onclick: close
            }, getSvgAsset('cross'));
    
            footer = options.hideDismissButton && !options.footerContent ? '' : skin.container('.skin-modal-footer',
                options.footerContent,
                closeButton
            ),

            element = skin.container('.skin-modal.cortona3dsolo-popover',
                skin.create('.skin-modal-panel',
                    skin.container('.skin-modal-title', options.title || '', skin.create('.buttons', closeButtonMain)),
                    skin.container('.skin-modal-content', options.content || ''),
                    footer
                )
            );

        if (!options.disableAutoDismiss && options.hideDismissButton) {
            var dismiss = function (e) {
                element.removeEventListener('mousedown', dismiss);
                close();
            };
            element.addEventListener('mousedown', dismiss);
        }

        function close() {
            if (element) {
                component.remove();
                /**
                 * The event is fired when the modal panel is closed.
                 * @event module:components/modal~"closed"
                 */
                component.emit('closed');
                /**
                 * The event is fired when the modal panel is closed.
                 * @event Cortona3DSolo~"uniview.component.modal.closed"
                 * @type {arguments}
                 * @prop {UISkinComponent} component
                 */
                solo.dispatch('uniview.component.modal.closed', component);
                element = null;
            }
            component.removeListener('close', close);
            skin.removeListener('modal.close', close);
        }

        /**
         * It is used to close the modal panel opened in the skin.
         * @event UISkinController~event:"modal.close"
         */
        skin.once('modal.close', close);

        /**
         * It is used to close the modal panel. 
         * @event module:components/modal~"close"
         */
        this.once('close', close);

        var roleCloseButton = (footer && footer.querySelector('.role-close')) || closeButton;

        if (roleCloseButton) {
            element.setAttribute('tabindex', '-1');
            element.addEventListener('focus', function () {
                roleCloseButton.focus();
            });
        }

        element.addEventListener('keydown', function (e) {
            switch (e.keyCode) {
                case 27: // Esc
                    component.emit('close');
                    e.preventDefault();
                    break;
            }
            e.stopPropagation();
        });

        return this.exports(element);
    };
});