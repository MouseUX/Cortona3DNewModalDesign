/**
 * The component that is used to define the global keyboard map.
 * @module components/keymap
 */
define(function (require, exports, module) {
    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance. The object defines keys and their corresponding handler functions. 
     * The key is a string in the following format `"{ctrlKey}{altKey}{shiftKey}{metaKey}:{keyCode}"`, where `ctrlKey`, `shiftKey`, `altKey` and `metaKey` are set to `0` or `1`.
     * An argument to a handler function is an object that contains two boolean properties:
     * ```javascript
     * {
     *      isCanvasVisible: <boolean>,
     *      isDrawingVisible: <boolean>
     * }
     * ```
     *  
     * Example:
     * ```javascript
     * {
     *      // Alt + Shift + 0, keyCode=48
     *      '0110:48' : function (context) {
     *          if (context.isCanvasVisible) {
     *              // code if 3D window visible
     *          }
     *          if (context.isDrawingVisible) {
     *              // code if 2D window visible
     *          }
     *      },
     * 
     *      // Esc, keyCode=27
     *      '0000:27': function (context) {
     *          // ...
     *      }
     * }
     * ```
     * @param {Cortona3DSolo} solo
     * @return {object}
     * @tutorial component-usage
     * @tutorial component-keymap
     */
    module.exports = function (skin, options, solo) {

        /**
         * Prohibits setting keyboard focus on the element.
         * 
         * @memberof module:components/keymap
         * @param {HTMLElement} element 
         */
        function prohibitKeyboardFocusForElement(element) {
            element.setAttribute('tabindex', '-1');
        }

        function stopPropagation(e) {
            e.stopPropagation();
        }

        var hasInput = {
            button: false,
            checkbox: false,
            color: false,
            date: false,
            datetime: true,
            'datetime-local': false,
            email: true,
            file: false,
            hidden: false,
            image: false,
            month: false,
            number: true,
            password: true,
            radio: false,
            range: false,
            reset: false,
            search: true,
            submit: false,
            tel: true,
            text: true,
            time: false,
            url: true,
            week: false
        };

        /**
         * Prohibits setting keyboard focus on all input elements.
         * 
         * @memberof module:components/keymap
         */
        function prohibitKeyboardFocus() {
            document.querySelectorAll('.skin-control, .btn-2d-graphics').forEach(prohibitKeyboardFocusForElement);
            document.querySelectorAll('a, button').forEach(prohibitKeyboardFocusForElement);
            document.querySelectorAll('input').forEach(function (el) {
                prohibitKeyboardFocusForElement(el);
                if (hasInput[el.type]) {
                    el.addEventListener('keydown', stopPropagation);
                }
            });
        }

        if (options && (typeof options === 'object')) {
            window.addEventListener('keydown', function (e) {
                if (!e.repeat) {
                    var key = [e.ctrlKey, e.altKey, e.shiftKey, e.metaKey].map(function (bool) {
                        return bool ? '1' : '0';
                    }).join('') + ':' + e.keyCode;
                    var context = {
                        isCanvasVisible: solo.core && solo.core.canvas && solo.app.ui.isCanvasVisible(),
                        isDrawingVisible: solo.app.drawing && solo.app.drawing.isVisible()
                    };
                    if (typeof options[key] === 'function') {
                        options[key](context);
                        e.preventDefault();
                    }
                    solo.dispatch('uniview.didKeyDown', key, context);
                }
            });
        }

        solo.on('uniview.didCreateInputElement', prohibitKeyboardFocus);

        return {
            prohibitKeyboardFocusForElement: prohibitKeyboardFocusForElement,
            prohibitKeyboardFocus: prohibitKeyboardFocus
        };
    };
});