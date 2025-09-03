define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        function isAncestorExist(node, testNode) {
            if (!node) return false;
            if (node === testNode) return true;
            return isAncestorExist(node.parentNode, testNode);
        }

        function isClickPrevented(e) {
            var Selection = window.getSelection();
            return !Selection.isCollapsed && (Selection.containsNode ? Selection.containsNode(e.target, true) : isAncestorExist(Selection.anchorNode, e.currentTarget) || isAncestorExist(Selection.focusNode, e.currentTarget));
        }

        solo.uniview.css.render({
            ".dpl-container .dpl-table": {
                "user-select": "text",
                "-moz-user-select": "text",
                "-webkit-user-select": "text",
                "-ms-user-select": "text"
            }
        });

        var m_preventClickOnMouseDown;

        // prevent clicking when text is selected
        solo.on('app.ipc.dpl.didSetupRow', function (row, index) {
            row.onmousedown = function (e) {
                m_preventClickOnMouseDown = isClickPrevented(e);
            };
            row.onclick = (function (handler) {
                return function (e) {
                    if (!m_preventClickOnMouseDown && !isClickPrevented(e)) {
                        return handler.apply(row, arguments);
                    }
                    e.stopPropagation();
                };
            })(row.onclick);
        });

        window.addEventListener('mousedown', function (e) {
            var Selection = window.getSelection();
            Selection.removeAllRanges();
        });
    };
});