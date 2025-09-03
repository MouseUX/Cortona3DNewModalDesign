/**
 * The UI component that is used to create a tab container. 
 * A tab container is a container that has multiple panels, but it shows only one panel at a time. 
 * There are a set of tabs corresponding to each panel, where each tab has the title of the panel.
 * @module components/tabs
 */
define(function (require, exports, module) {
    require('css!./tabs.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {module:components/tabs~TabsPageInfo[]} [options.pages]
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="skin-tabs skin-container cortona3dsolo-popover">
     *      <div class="skin-tabs-header">
     *          <span class="skin-page-title skin-text active"></span>
     *          <span class="skin-page-title skin-text"></span>
     *      </div>
     *      <div class="skin-tabs-body">
     *          <div class="skin-page-body skin-container active"></div>
     *          <div class="skin-page-body skin-container"></div>
     *      </div>
     * </div>
     * ```
     * @tutorial component-usage
     * @tutorial component-tabs
     * @fires module:components/tabs~"activated"
     * @fires Cortona3DSolo~"uniview.component.tab.activated"
     * @listens module:components/tabs~"append"
     * @listens module:components/tabs~"activate"
     */
    module.exports = function (skin, options, solo) {
        var m_tabsHeader = skin.container('.skin-tabs-header'),
            m_tabsBody = skin.container('.skin-tabs-body'),
            m_activeIndex = 0;

        var component = this;

        var element = skin.container('.skin-tabs.cortona3dsolo-popover',
            m_tabsHeader,
            m_tabsBody
        );

        if (options.pages && options.pages.forEach) {
            options.pages.forEach(function (page) {
                append(page.title, page.content);
            });
        }

        function append(pageInfo) {
            var title = pageInfo, 
                content = Array.prototype.slice.call(arguments, 1);

            if (typeof pageInfo === 'object') {
                title = pageInfo.title;
                content = pageInfo.content;
            }

            var index = m_tabsHeader.querySelectorAll('.skin-page-title').length,
                active = index == m_activeIndex ? '.active' : '',
                tab = skin.text('.skin-page-title' + active, title),
                tabBody = skin.container.apply(skin, ['.skin-page-body' + active].concat(content));

            tab.onclick = function () {
                component.emit('activate', index);
            };

            m_tabsHeader.append(tab);
            m_tabsBody.append(tabBody);
            return tabBody;
        }

        /**
         * It is used to append a new tab.
         * @event module:components/tabs~"append"
         * @type {module:components/tabs~TabsPageInfo}
         */

        /**
         * It is used to append a new tab.
         * @event module:components/tabs~"append"
         * @type {arguments}
         * @prop {string} title
         * @prop {HTMLElement|string|Array} [content]
         */
        this.on('append', append);

        /**
         * It is used to activate the page by its sequence number starting from 0.
         * @event module:components/tabs~"activate"
         * @type {number}
         */
        this.on('activate', function (pageNumber) {
            m_tabsHeader.querySelector('.skin-page-title.active').classList.remove('active');
            m_tabsBody.querySelector('.skin-page-body.active').classList.remove('active');

            var tab = m_tabsHeader.querySelectorAll('.skin-page-title').item(pageNumber),
                tabBody = m_tabsBody.querySelectorAll('.skin-page-body').item(pageNumber);

            if (tab && tabBody) {
                tab.classList.add('active');
                tabBody.classList.add('active');
            }

            /**
             * The event is fired when the tab page is activated.
             * @event module:components/tabs~"activated"
             * @type {number}
             */
            component.emit('activated', pageNumber);
            /**
             * The event is fired when the tab page is activated.
             * @event Cortona3DSolo~"uniview.component.tab.activated"
             * @type {arguments}
             * @prop {UISkinComponent} component
             * @prop {number} pageNumber
             */
             solo.dispatch('uniview.component.tab.activated', component, pageNumber);
        });

        return this.exports(element);
    };
});

/**
 * The object represents information about a tab, for example:
 * ```javascript
 * {
 *      title: "Page title",
 *      content: "Page content"
 * }
 * ```
 * @prop {string} title The title of the tab.
 * @prop {HTMLElement|string|Array} content The content of the tab.
 * @typedef {object} module:components/tabs~TabsPageInfo
 */