/**
 * The UI component that is used to create a pop-up panel.
 * @module components/popup
 */
define(function (require, exports, module) {
    require('css!./popup.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {HTMLElement} [options.content] The inline HTML content of the pop-up panel
     * @param {number} options.x The X coordinate where the context menu will be created.
     * @param {number} options.y The Y coordinate where the context menu will be created.
     * @param {HTMLElement} [options.target] The target node in coordinates of which the context menu is created.
     * @param {boolean} [options.closable] The pop-up window can be closed using the ESC key.
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="skin-popup skin-container cortona3dsolo-popover"></div>
     * ```
     * @fires module:components/popup~"closed"
     * @fires Cortona3DSolo~"uniview.component.popup.closed"
     * @listens module:components/popup~"open"
     * @listens module:components/popup~"close"
     * @listens module:components/popup~"toggle"
     * @tutorial component-usage
     * @tutorial component-popup
     */
    module.exports = function (skin, options, solo) {
        var m_visible = false,
            m_options = solo.expand({}, options);

        var component = this;

        function applyOptions(element, options) {
            var style = element.style,
                parent = element.parentNode;

            if (!options) options = {};

            if (typeof options.content !== 'undefined') {
                skin.clear(element);
                element.append.apply(element, skin.create('div', options.content).childNodes);
            }

            if (typeof options.x !== 'undefined' && typeof options.y !== 'undefined') {
                style.position = 'absolute';
                style.visibility = 'hidden';

                if (options.target) {
                    // recalculate x, y
                    var rect = options.target.getBoundingClientRect(),
                        parentRect = parent.getBoundingClientRect();
                    options.x += rect.left - parentRect.left;
                    options.y += rect.top - parentRect.top;
                }

                var W = parent.clientWidth,
                    H = parent.clientHeight,
                    w = element.offsetWidth,
                    h = element.offsetHeight;

                if (options.x + w <= W) {
                    style.left = options.x + 'px';
                } else if (W >= w) {
                    style.left = (W - w) + 'px';
                } else {
                    style.left = 0;
                }

                if (options.y + h <= H) {
                    style.top = options.y + 'px';
                } else if (options.y >= h) {
                    style.top = (options.y - h) + 'px';
                } else {
                    style.top = 0;
                }

                style.visibility = '';
            }
        }

        var element = skin.container('.skin-popup.cortona3dsolo-popover');

        if (options.closable) {
            element.addEventListener('keydown', function (e) {
                switch (e.keyCode) {
                    case 27: // Esc
                        component.emit('close');
                        e.preventDefault();
                        e.stopPropagation();
                        break;
                    case 9: // Tab
                        e.preventDefault();
                        break;
                }
                //e.stopPropagation();
            });
            element.setAttribute('tabindex', '-1');
        }

        skin.toggle(element, false);

        /**
         * It is used to close the pop-up panel.
         * @event module:components/popup~"close"
         */
        this.on('close', function () {
            component.emit('toggle', false);
        });
        /**
         * It is used to open the pop-up panel with new parameters.
         * @event module:components/popup~"open"
         * @type options
         */
        this.on('open', function (options) {
            component.emit('toggle', true);
            if (options) {
                applyOptions(element, options);
            }
        });
        /**
         * It is used to toggle the visibility of the pop-up panel.
         * @event module:components/popup~"toggle"
         * @type boolean
         */
        this.on('toggle', function (visible) {
            m_visible = (typeof visible === 'undefined') ? !m_visible : !!visible;
            skin.toggle(element, m_visible);
            if (m_visible) {
                if (m_options) {
                    applyOptions(element, m_options);
                }
                m_options = null;
                if (options.closable) {
                    element.focus();
                }
            } else {
                /**
                 * The event is fired when the pop-up panel is closed.
                 * @event module:components/popup~"closed"
                 */
                component.emit('closed');
                /**
                 * The event is fired when the pop-up panel is closed.
                 * @event Cortona3DSolo~"uniview.component.popup.closed"
                 * @type {arguments}
                 * @prop {UISkinComponent} component
                 */
                solo.dispatch('uniview.component.popup.closed', component);
            }
        });

        return this.exports(element);
    };
});