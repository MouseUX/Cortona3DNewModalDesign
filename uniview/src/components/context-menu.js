/**
 * The UI component that is used to create a context pop-up menu.
 * @module components/context-menu
 */
define(function (require, exports, module) {
    require('css!./context-menu.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {HTMLElement} [options.parent=skin.$el] The parent node where the context menu will be added.
     * @param {number} options.x The X coordinate where the context menu will be created.
     * @param {number} options.y The Y coordinate where the context menu will be created.
     * @param {HTMLElement} [options.target] The target node in coordinates of which the context menu is created.
     * @param {MenuItemInfo[]} options.menu An array of context menu items descriptors. You can use `null` as a separator for menu items.
     * @param {string[]} [options.closeEvents=["mousedown", "wheel", "blur", "pointerdown", "touchstart"]] An array of window events that will close the context menu.
     * @param {Cortona3DSolo} solo
     * @returns {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="skin-popup-menu cortona3dsolo-popover">
     *      <ul></ul>
     * </div>
     * ```
     * @fires module:components/context-menu~"closed"
     * @fires Cortona3DSolo~"uniview.component.context-menu.closed"
     * @listens module:components/context-menu~"close"
     * @tutorial component-usage
     * @tutorial component-context-menu
     */
    module.exports = function (skin, options, solo) {
        var element,
            parent = options.parent || skin.$el,
            menu = options.menu || [],
            x = options.x,
            y = options.y,
            coordParent = options.target,
            m_closerEvents = options.closeEvents || ['mousedown', 'wheel', 'blur', 'pointerdown', 'touchstart'];

        var component = this;

        var ul = skin.create('ul');

        menu.forEach(function (item) {
            var el;
            if (!item) {
                el = skin.create('hr');
            } else {
                if (item.description && !item.label) {
                    item.label = item.description;
                }
                if (item.label) {
                    if (item.action) {

                        el = skin.create('li', {
                            ontouchstart: function (e) {
                                e.stopPropagation();
                            },
                            onpointerdown: function (e) {
                                e.stopPropagation();
                            },
                            onmousedown: function (e) {
                                e.stopPropagation();
                            },
                            onclick: function (e) {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!this.classList.contains('disabled')) {
                                    close();
                                    item.action.call(this, e);
                                }
                            }
                        }, item.label);

                        if (item.accent) {
                            el.classList.add('accent');
                        } else {
                            el.classList.remove('accent');
                        }

                        if (item.checked) {
                            el.classList.add('checked');
                        } else {
                            el.classList.remove('checked');
                        }

                    } else {
                        el = skin.create('.accent.li', {}, item.label);
                    }

                    if (item.disabled) {
                        el.classList.add('disabled');
                    } else {
                        el.classList.remove('disabled');
                    }
                }
            }
            ul.append(el);
        }, this);

        element = skin.create('div.skin-popup-menu.cortona3dsolo-popover', {}, ul);

        var style = element.style;
        style.position = 'absolute';
        style.visibility = 'hidden';
        parent.append(element);

        if (coordParent) {
            // recalculate x, y
            var rect = coordParent.getBoundingClientRect(),
                menuParentRect = parent.getBoundingClientRect();
            x += rect.left - menuParentRect.left;
            y += rect.top - menuParentRect.top;
        }

        var W = element.parentNode.clientWidth,
            H = element.parentNode.clientHeight,
            w = element.offsetWidth,
            h = element.offsetHeight;

        if (x + w <= W) {
            style.left = x + 'px';
        } else if (W >= w) {
            style.left = (W - w) + 'px';
        } else {
            style.left = 0;
        }

        if (y + h <= H) {
            style.top = y + 'px';
        } else if (y >= h) {
            style.top = (y - h) + 'px';
        } else {
            style.top = 0;
        }

        style.visibility = '';

        element.focus();

        m_closerEvents.forEach(function (name) {
            window.addEventListener(name, close);
        });

        function isSkinPopupMenuClass(n) {
            return n.classList && n.classList.contains('skin-popup-menu');
        }

        function getPath(n) {
            var a = [];
            while (n) {
                a.push(n);
                n = n.parentNode;
            }
            return a;
        }

        function close(e) {
            if (e && getPath(e.target).some(isSkinPopupMenuClass)) {
                return;
            }
            if (element) {
                element = null;
                component.remove();
                m_closerEvents.forEach(function (name) {
                    window.removeEventListener(name, close);
                });
                /**
                 * The event is fired when the context menu is closed
                 * @event module:components/context-menu~"closed"
                 */
                component.emit('closed');
                /**
                 * The event is fired when the context menu is closed
                 * @event Cortona3DSolo~"uniview.component.context-menu.closed"
                 * @type {arguments}
                 * @prop {UISkinComponent} component
                 */
                solo.dispatch('uniview.component.context-menu.closed', component);
            }
        }

        /**
         * It is used to close the menu
         * @event module:components/context-menu~"close"
         */
        this.once('close', close);

        return this.exports(element);
    };
});

/**
 * The object represents information about the menu item, for example:
 * ```javascript
 * {
 *      label: "Menu item",
 *      action: function () { alert("Menu item call"); },
 *      accent: true,
 *      checked: true,
 *      disabled: true
 * }
 * ```
 * @prop {string} label The label of the menu item.
 * @prop {function} action The function that will be called when the menu item is activated.
 * @prop {boolean} [accent=false] 
 * @prop {boolean} [checked=false]
 * @prop {boolean} [disabled=false]
 * @typedef {object} MenuItemInfo
 * @see {@link module:components/context-menu}
 */