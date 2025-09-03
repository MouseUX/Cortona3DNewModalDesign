define(function(require, exports, module) {

    // hasScroller - snippet from StackOverflow:
    // http://stackoverflow.com/a/34700876
    var hasScroller = (function() {
        var getComputedStyle = document.body && document.body.currentStyle ? function(elem) {
            return elem.currentStyle;
        } : function(elem) {
            return document.defaultView.getComputedStyle(elem, null);
        };

        function getActualCss(elem, style) {
            return getComputedStyle(elem)[style];
        }

        function autoOrScroll(text) {
            return text === 'scroll' || text === 'auto';
        }

        function isXScrollable(elem) {
            return elem.offsetWidth < elem.scrollWidth &&
                autoOrScroll(getActualCss(elem, 'overflow-x'));
        }

        function isYScrollable(elem) {
            return elem.offsetHeight < elem.scrollHeight &&
                autoOrScroll(getActualCss(elem, 'overflow-y'));
        }

        return function(elem) {
            return isYScrollable(elem) || isXScrollable(elem);
        };
    })();

    // One of the element's parents is hopefully a scroller
    function recursiveFindClosestScroller(el) {
        if (hasScroller(el)) {
            return el;
        }

        if (el.parentNode === null) {
            return null;
        }

        return recursiveFindClosestScroller(el.parentNode);
    }


    module.exports = function(el, topOffset, bottomOffset) {
        if (!el) return;

        var parent = recursiveFindClosestScroller(el);

        if (!parent) return;

        var parentBox = parent.getBoundingClientRect(),
            elBox = el.getBoundingClientRect();

        var top = parseInt(parentBox.top),
            bot = parseInt(parentBox.bottom) - 16,
            height = bot - top,

            now_top = parseInt(elBox.top),
            now_bot = parseInt(elBox.bottom),
            el_height = now_bot - now_top,

            scroll_by = 0;

        try {
            var td = parent.querySelector('table thead td') || parent.querySelector('table thead th');
            if (window.getComputedStyle(td).position === 'sticky') {
                top += parent.querySelector('table thead').getBoundingClientRect().height;
            }
        } catch (e) {}

        if (topOffset) {
            top += topOffset;
        }
        if (bottomOffset) {
            bot += bottomOffset;
        }

        if (el_height > height) {
            scroll_by = now_top - top;
        } else if (now_top < top) {
            scroll_by = now_top - top;
        } else if (now_bot > bot) {
            scroll_by = now_bot - bot;
        }

        if (scroll_by !== 0) {
            parent.scrollTop += scroll_by;
        }

    };
});