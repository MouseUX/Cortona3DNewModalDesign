/**
 * 
 */
define(function (require, exports, module) {
    
    module.exports = function (skin, options, solo) {

        var i18n = solo.uniview.i18n['uniview-structure'] || {};

        var HISTORY_BUFFER = 10;

        var element = skin.create('.history'),
            historyIndexArr = [];
        
        var clearButton = skin.button({
            title: i18n.UI_BTN_CLEAR_HISTORY_TITLE,
            onclick: function () {
                clearHistory();
            }
        }, i18n.UI_BTN_CLEAR)

        var toolbar = skin.toolbar('.history-toolbar.main', 
            skin.container('.left'),
            skin.container('.right', clearButton)
        );

        element.append(toolbar);

        function getTimestampString() {
            var now = new Date();
            return '' + now.getFullYear() + '-' + _00(now.getMonth() + 1) + '-' + _00(now.getDate()) + ' ' + _00(now.getHours()) + ':' + _00(now.getMinutes()) + ':' + _00(now.getSeconds());
        }
            
        function _00(n) {
            n = n || 0;
            return n < 10 ? '0' + n : n;
        }

        function clearHistory() {
            element.querySelectorAll('.historyResult').forEach(function (el) {
                el.parentElement.removeChild(el);
            });
            clearButton.disabled = true;
            historyIndexArr = [];
        }

        function addItem2History(item) {
            
            if (clearButton.disabled)
                clearButton.disabled = false;

            if (!historyIndexArr.length || historyIndexArr[0].item.id !== item.id) {
                historyIndexArr.unshift({
                    time: getTimestampString(),
                    item: item
                });
                historyIndexArr.length = HISTORY_BUFFER;
            }

            updateHistoryView();
        }

        function updateHistoryView() {

            element.querySelectorAll('.historyResult').forEach(function (el) {
                el.parentElement.removeChild(el);
            })

            var historyItems = historyIndexArr.map(function (historyItem) {

                var res = {
                    content: historyItem.item.content + '<div class="time">' + historyItem.time + '</div>'
                };

                res.onclick = function () {
                    solo.dispatch('structure.didStructureItemClick', {
                        descriptor: historyItem.item
                    });
                };

                res.onmouseover = function () {
                    this.classList.add('hover');
                };

                res.onmouseout = function () {
                    this.classList.remove('hover');
                };

                return res;
            })

            var historyContainer = skin.create('.historyResult'),
                result;

            if (historyItems.length) {
                result = skin.create(require('components/tree'), {
                    items: historyItems
                }).$el;
            } else {
                result = skin.create('p', 'Empty history');
            }

            historyContainer.append(result);
            element.append(historyContainer);

        }

        Object.defineProperties(this, {
            'clearHistory': {
                value: clearHistory,
                enumerable: true
            },
            'addItem2History': {
                value: addItem2History,
                enumerable: true
            },
            'updateHistoryView': {
                value: updateHistoryView,
                enumerable: true
            }
        })

        return this.exports(element);
    };
});