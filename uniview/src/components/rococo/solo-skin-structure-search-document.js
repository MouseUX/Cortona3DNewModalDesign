define(function (require, exports, module) {
    'use strict';

    require('css!./solo-skin-rwi-search.css');

    var Mark = require('mark.js'),
        ensureVisible = require('lib/ensure-visible');

    module.exports = function (skin, options, solo) {
        
        //solo.skin.get('doc') || solo.skin.get('aux');
        
        var h = skin.create.bind(skin),
            context = '',
            instance = new Mark(context),
            references = [],
            currentIndex = -1,
            searchInput = h('input.skin-control', {
                oninput: function (e) {
                    search(this.value);
                }
            }),
            prevButton = h('button.skin-control', {
                disabled: true,
                onclick: function () {
                    jumpTo(--currentIndex);
                }
            }, '∧'),
            nextButton = h('button.skin-control', {
                disabled: true,
                onclick: function () {
                    jumpTo(++currentIndex);
                }
            }, '∨'),
            indexSpan = h('span'),
            totalSpan = h('span'),
            searchCounterContainer = h('.search-counter.skin-container', indexSpan, '/', totalSpan),
            element = h('.solo-skin-rwi-search.skin-container',
                h('.search-control.skin-container',
                    h('.skin-container',
                        h('label', 'Поиск:', searchInput),
                        h('.search-buttons.skin-container',
                            prevButton,
                            nextButton,
                            h('button.skin-control', {
                                onclick: function () {
                                    searchInput.value = '';
                                    instance.unmark();
                                    solo.dispatch('touch.didObjectClick');
                                    init();
                                }
                            }, '🗙')
                        )
                    ),
                    h('.skin-container.search-radio',
                        searchCounterContainer)
                )
            );

        function init() {
            references = [];
            currentIndex = -1;
            prevButton.disabled = true;
            nextButton.disabled = true;
            skin.hide(searchCounterContainer);
        }

        init();

        function search(keyword) {
            instance.unmark({
                done: function () {
                    init();
                    instance.mark(keyword, {
                        separateWordSearch: false,
                        done: function () {
                            references = context.querySelectorAll('mark');
                            afterSearch(references);
                        }
                    });
                }
            });
        }

        function afterSearch(result) {
            var isEmpty = result.length === 0;
            currentIndex = isEmpty ? -1 : 0;
            jumpTo(currentIndex);
            prevButton.disabled = isEmpty;
            nextButton.disabled = isEmpty;
            if (!isEmpty) {
                skin.show(searchCounterContainer);
                totalSpan.textContent = result.length;
                indexSpan.textContent = currentIndex + 1;
            }
        }

        function jumpTo(index) {
            context.querySelectorAll('mark.current').forEach(function (node) {
                node.classList.remove('current');
            });
            if (index < 0) {
                index = references.length - 1;
            }
            if (index >= references.length) {
                index = 0;
            }
            if (index >= 0 && index < references.length) {
                references[index].classList.add('current');
                ensureVisible(references[index]);
                currentIndex = index;
                indexSpan.textContent = currentIndex + 1;
            }
            
        }

        function activeteTab(markElement) {
            
            var parentNode = markElement
            
            while (!parentNode && !parentNode.classList.contains('slide')) {

            }
        }

        /*solo.on('uniview.component.tab.activated', function (component, n) {
            instance.unmark({
                done: function () {
                    context = document.querySelector('.rwi-tabs .skin-page-body.active');
                    instance = new Mark(context);
                    init();
                    search(searchInput.value);
                }
            });
        });*/

        solo.on('iframe.ready', function (descriptor, iframe, searchText) {
            
            var iframeSolo = iframe && iframe.window.Cortona3DSolo;
            var doc = iframeSolo.skin.get('doc') || iframeSolo.skin.get('aux');

            if (searchText) {
                searchInput.value = searchText;
            }

            instance.unmark({
                done: function () {
                    context = doc.$el;
                    instance = new Mark(context);
                    init();
                    search(searchInput.value);
                }
            });

            solo.dispatch('structure.search.after', references);
        })

        solo.on('structure.beforeItemUnload', function (previousId, iframe) {
            
            instance.unmark({
                done: function () {
                    instance = new Mark('');
                    init();
                    //search(searchInput.value);
                }
            });
        }) 

        solo.on('structure.search.jumpToIndex', function (index) {
            if (references[index])
                jumpTo(index);
        })

        return this.exports(element);
    };
});