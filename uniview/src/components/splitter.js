/**
 * The UI component that is used to create a pane splitter control.
 * @module components/splitter
 */
define(function (require, exports, module) {
    require('css!./splitter.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {HTMLElement} [options.firstPane] Previous sibling element by default
     * @param {HTMLElement} [options.lastPane] Next sibling element by default
     * @param {boolean} [options.minPaneSize=10] Percent 0-50
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="skin-split-pane"></div>
     * ```
     * @fires module:components/splitter~"started"
     * @fires module:components/splitter~"finished"
     * @fires module:components/splitter~"moved"
     * @fires Cortona3DSolo~"uniview.component.splitter.started"
     * @fires Cortona3DSolo~"uniview.component.splitter.finished"
     * @fires Cortona3DSolo~"uniview.component.splitter.moved"
     * @tutorial component-usage
     * @tutorial component-splitter
     */
    module.exports = function (skin, options, solo) {
        var element = skin.createElement('.skin-split-pane', skin.createElement('.skin-split-pane-inner')),
            firstPane = options.firstPane,
            lastPane = options.lastPane,
            component = this,
            minPaneSize = Math.max(0, Math.min(50, +options.minPaneSize || 10)),
            row,
            reverse,
            cursorType,
            m_deltaFirst,
            m_deltaLast;

        var getComputedStyle = document.body && document.body.currentStyle ? function (elem) {
            return elem.currentStyle;
        } : function (elem) {
            return document.defaultView.getComputedStyle(elem, null);
        };

        function getActualCss(elem, style) {
            return getComputedStyle(elem)[style];
        }

        function updateSplitterOrientation() {
            var direction = getActualCss(element.parentNode, 'flex-direction');
            row = direction.substr(0, 3) === 'row';
            reverse = /reverse/.test(direction);
            element.classList.remove('col');
            element.classList.remove('row');
            element.classList.add(!row ? 'row' : 'col');
        }

        solo.on('core.didChangeLayout', updateSplitterOrientation);

        function onEnter(event) {
            updateSplitterOrientation();
            cursorType = (!row ? 'row' : 'col') + '-resize';
            element.style.cursor = cursorType;
            firstPane = firstPane || element.previousSibling;
            lastPane = lastPane || element.nextSibling;
        }

        function onStart(event) {
            var rect = element.parentNode.getBoundingClientRect();
            var W = row ? rect.width : rect.height,
                X = row ? event.clientX - rect.left : event.clientY - rect.top,
                firstPaneW = row ? firstPane.clientWidth : firstPane.clientHeight,
                lastPaneW = row ? lastPane.clientWidth : lastPane.clientHeight;

            m_deltaFirst = X - (reverse ? lastPaneW : firstPaneW);
            m_deltaLast = W - X - (reverse ? firstPaneW : lastPaneW);

            element.parentNode.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onEnd);
            element.style.cursor = cursorType;
            element.parentNode.style.cursor = cursorType;
            element.parentNode.classList.add('splitter-active');
            /**
             * @event module:components/splitter~"started"
             */
            component.emit('started');
            /**
             * @event Cortona3DSolo~"uniview.component.splitter.started"
             * @type {arguments}
             * @prop {UISkinComponent} component
             */
            solo.dispatch('uniview.component.splitter.started', component);
        }

        function onEnd(event) {
            element.parentNode.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onEnd);
            element.parentNode.style.cursor = '';
            element.parentNode.classList.remove('splitter-active');
            /**
             * @event module:components/splitter~"finished"
             */
             component.emit('finished');
            /**
             * @event Cortona3DSolo~"uniview.component.splitter.finished"
             * @type {arguments}
             * @prop {UISkinComponent} component
             */
             solo.dispatch('uniview.component.splitter.finished', component);
            }

        function onMove(event) {
            var rect = event.currentTarget.getBoundingClientRect();
            var X = row ? event.clientX - rect.left : event.clientY - rect.top,
                firstPaneW = row ? firstPane.clientWidth : firstPane.clientHeight,
                lastPaneW = row ? lastPane.clientWidth : lastPane.clientHeight,
                firstW = Math.max(minPaneSize, Math.min(100 - minPaneSize, (X - m_deltaFirst) * 100 / (firstPaneW + lastPaneW))),
                lastW = 100 - firstW;

            firstPane.style.flexBasis = (reverse ? lastW : firstW) + '%';
            lastPane.style.flexBasis = (reverse ? firstW : lastW) + '%';
            /**
             * @event module:components/splitter~"moved"
             */
             component.emit('moved');
            /**
             * @event Cortona3DSolo~"uniview.component.splitter.moved"
             * @type {arguments}
             * @prop {UISkinComponent} component
             */
             solo.dispatch('uniview.component.splitter.moved', component);
        }

        element.addEventListener('pointerdown', onStart);
        element.addEventListener('pointerenter', onEnter);

        return this.exports(element);
    };
});