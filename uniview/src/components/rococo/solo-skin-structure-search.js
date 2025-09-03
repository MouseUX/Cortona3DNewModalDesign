/**
 * 
 */
define(function (require, exports, module) {

    require('css!./solo-skin-structure-search.css');

    var Mark = require('mark.js'),
        ensureVisible = require('lib/ensure-visible');

    module.exports = function (skin, options, solo) {

        var iframeSolo,
            i18n = solo.uniview.i18n['uniview-structure'] || {};


        var lunrSearch = skin.create(require('static/lunr-search'), options),
            waitContainer,
            searchResultTree;

        searchButton = skin.button({
            title: i18n.UI_BTN_SEARCH_TITLE,
            disabled: true,
            onclick: doSearch
        }, i18n.UI_BTN_SEARCH),

            inputSearchField = skin.create('input.skin-control.search-input', {
                oninput: function () {
                    searchButton.disabled = !this.value;
                },
                onchange: function () {
                    if (this.value) doSearch();
                }
            }),

            clearSearchButton = skin.button({
                title: i18n.UI_BTN_CLEAR_SEARCH_TITLE,
                onclick: function () {
                    clearSearch();
                    inputSearchField.value = '';
                    searchButton.disabled = true;
                    lunrSearch.cancel();
                }
            }, i18n.UI_BTN_CLEAR),

            toolbar = skin.toolbar('.search-toolbar.main',
                skin.container('.left', inputSearchField),
                skin.container('.right', [
                    searchButton,
                    clearSearchButton
                    /*,
                    skin.button({
                        onclick: function () {
                            findPrevious(inputSearchField.value);
                        }
                    }, '<'),
                    skin.button({
                        onclick: function () {
                            findNext(inputSearchField.value);
                        }
                    }, '>')*/
                ])
            ),

            searchResultContainer = skin.create('.searchResult'),

            element = skin.create('.search', toolbar, searchResultContainer);


        var context = '',
            references = [],
            currentIndex = -1,
            currentResultId,
            marker = initMarker(context),
            currentKeyword;

        function clearWait() {
            if (waitContainer) {
                waitContainer.parentElement.removeChild(waitContainer);
                waitContainer = null;
            }
        }

        function wait() {
            waitContainer = skin.create(require('components/wait')).$el;
            searchResultContainer.append(waitContainer);
        }

        function clearSearch() {
            clearWait();
            skin.clear(searchResultContainer);
            searchResultTree = null;
            unmark();
        }

        function convertResult2Items(arr) {
            return arr.map(item => {
                var count = 0,
                    searchFullText = '',
                    searchKeyWords = [];

                for (var key in item.matchData.metadata) {
                    count += item.matchData.metadata[key].text.position.length;
                    searchFullText += '' + key + ' ';
                    searchKeyWords.push(key);
                }

                searchFullText = searchFullText.slice(0, -1);

                return {
                    id: item.id,
                    content: [
                        skin.create('.search-item-content', item.content),
                        skin.create('.search-counter', { dataset: { count: count } }, count)
                    ],
                    onclick: (function (searchKeyWords) {
                        return function () {
                            solo.dispatch('structure.search.didSearchResultClick', {
                                element: this,
                                descriptor: item,
                                searchText: searchKeyWords
                            });
                        };
                    })(searchKeyWords),
                    onmouseover: function () { }
                };
            })
        }

        function initMarker(context) {
            references = [];
            currentIndex = -1;
            return new Mark(context || '');
        }

        function initReferences() {
            references = Array.prototype.slice.call(context.querySelectorAll('mark'))
                .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
            //afterSearch(references);
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
                searchResultTree.emit('unselect');
                searchResultTree.emit('select', [currentResultId, 'id_mark_' + index]);
    
                references[index].classList.add('current');
                ensureVisible(references[index]);
                activateTabSlide(references[index]);
                currentIndex = index;
                //indexSpan.textContent = currentIndex + 1;
            }
        }

        function activateTabSlide(el) {

            var parent = el;
            while (parent && !parent.classList.contains('slide')) {
                parent = parent.parentElement;
            }

            if (parent && parent.classList.contains('hide')) {

                var hideSlide = parent;

                hideSlide.parentElement.querySelectorAll('.slide.show').forEach(function (slide) {
                    slide.classList.remove('show');
                    slide.classList.add('hide');
                });

                hideSlide.classList.remove('hide');
                hideSlide.classList.add('show');

                iframeSolo.dispatch('uniview.doc.getAndChangeQuestionSlide', hideSlide);
            }

            parent = el;
            while (parent && !parent.classList.contains('skin-page-body')) {
                parent = parent.parentElement;
            }

            if (parent && !parent.classList.contains('active')) {
                var n = 0;
                var prev = parent.previousElementSibling;
                while (prev) {
                    if (prev.classList.contains('skin-page-body')) {
                        n++;
                    }
                    prev = prev.previousSibling
                }
                iframeSolo.dispatch('uniview.component.tabs.activateByNumber', n);
            }
        }

        function doSearch() {
            clearSearch();
            wait();

            lunrSearch
                .search(inputSearchField.value)
                .then(result => {
                    result.forEach(item => solo.expand(item, solo.structure.itemIndex[item.ref]));

                    result.sort(function (a1, a2) {
                        var pos1 = solo.structure.itemNavigateIndex.findIndex(item => a1.id == item.id),
                            pos2 = solo.structure.itemNavigateIndex.findIndex(item => a2.id == item.id);
                        return pos1 - pos2;
                    });

                    var searchResultItems = convertResult2Items(result),
                        searchResultElement;

                    if (searchResultItems.length) {
                        searchResultTree = skin.create(require('components/tree'), {
                            items: searchResultItems
                        });
                        searchResultElement = searchResultTree.$el;
                    } else {
                        searchResultElement = skin.create('p', i18n.UI_TXT_TEXT_NOT_FOUND.replace(/%s/, inputSearchField.value));
                    }

                    searchResultContainer.append(searchResultElement);
                })
                .catch(function (e) {
                    if (typeof e !== 'undefined') {
                        searchResultContainer.append(skin.create('p', 'Incorrect search string, ', e.message));
                    }
                })
                .finally(clearWait);
        }

        solo.on('structure.search.didSearchResultClick', function (obj) {
            if (obj.searchText && obj.descriptor && obj.element) {
                var id = obj.element.dataset.id;

                if (currentResultId) {
                    searchResultTree.emit('removeAll', currentResultId);
                }

                currentResultId = id;

                searchResultTree.emit('unselect');
                searchResultTree.emit('select', id);

                var counter = obj.element.querySelector('.search-counter');
                if (counter) {
                    counter.classList.remove('from');
                    counter.innerHTML = counter.dataset.count;
                }
            }
            solo.dispatch('structure.didStructureItemClick', obj);
        });

        function recalculateMatchedText(searchText) {
            var current = context ? context.querySelector('mark.current') : null;

            marker.unmark({
                done: function () {
                    var doc = (iframeSolo.skin.get('doc') || iframeSolo.skin.get('aux')).$el;
                    context = doc.querySelector('.sco-tabs') || doc.querySelector('.doc-container') || doc;
                    marker = initMarker(context);
                    currentIndex = 0;
                    currentKeyword = searchText;
                    marker.mark(currentKeyword, {
                        exclude: ['button', '.skin-control', 'label', '.label-text'],
                        separateWordSearch: false,
                        done: initReferences
                    });
                }
            });

            var searchResultItem = searchResultTree.$el.querySelector('[data-id="' + currentResultId + '"]'),
                counter = searchResultItem && searchResultItem.querySelector('.search-counter');
            if (counter) {
                counter.classList.add('actual');
                if (references.length < counter.dataset.count) {
                    counter.classList.add('from');
                } else {
                    counter.classList.remove('from');
                }
                counter.innerHTML = references.length;
            }

            searchResultTree.emit('removeAll', currentResultId);

            if (!references.length)
                return;

            var items = references.map((node, i) => {
                var count = 10;

                var prefix = (node.previousSibling) ? node.previousSibling.textContent : '';
                var postfix = (node.nextSibling) ? node.nextSibling.textContent : '';

                if (prefix.slice((-1) * count) != prefix)
                    prefix = '...' + prefix.slice((-1) * count);

                if (postfix.slice((-1) * count) != postfix)
                    postfix = postfix.slice(0, count) + '...';

                return {
                    id: 'id_mark_' + i,
                    content: skin.create('div', prefix, skin.create('b', node.textContent), postfix),
                    onclick: function () {
                        jumpTo(i);
                    },
                    onmouseover: function () { }
                };
            });

            searchResultTree.emit('insert', items, currentResultId);

            //jumpTo(currentIndex);
        }

        function unmark() {
            marker.unmark({
                done: function () {
                    marker = initMarker();
                }
            });
        }

        var doRecalculate;

        solo.on('iframe.ready', function (descriptor, iframe, searchText) {

            if (!searchText) {
                //console.log('Search text not found');
                return;
            }

            if (doRecalculate) {
                // common
                iframeSolo.removeListener('uniview.contentChanged', doRecalculate);
                // rwi
                iframeSolo.removeListener('uniview.component.tab.activated', doRecalculate);
                iframeSolo.removeListener('uniview.tabActivated', doRecalculate);
                iframeSolo.removeListener('uniview.component.tabs.tabIsActivated', doRecalculate);
                // document
                iframeSolo.removeListener('uniview.doc.filterChanged', doRecalculate);
                iframeSolo.removeListener('uniview.doc.didActivateLink', doRecalculate);
                // catalog
                iframeSolo.removeListener('catalog.didChangeFilterValue', doRecalculate);
                iframeSolo.removeListener('catalog.sheetChangeCompleted', doRecalculate);
                iframeSolo.removeListener('app.ipc.dpl.didSetupTable', doRecalculate);
                //iframeSolo.removeListener('app.ipc.didSelectSheet', unmark);
            }

            iframeSolo = iframe && iframe.window.Cortona3DSolo;
            doRecalculate = function () {
                setTimeout(recalculateMatchedText.bind(null, searchText), 10);
            };

            iframeSolo.on('uniview.contentChanged', doRecalculate);
            iframeSolo.on('uniview.component.tab.activated', doRecalculate);
            iframeSolo.on('uniview.tabActivated', doRecalculate);
            iframeSolo.on('uniview.component.tabs.tabIsActivated', doRecalculate);
            iframeSolo.on('uniview.doc.filterChanged', doRecalculate);
            iframeSolo.on('uniview.doc.didActivateLink', doRecalculate);
            iframeSolo.on('catalog.didChangeFilterValue', doRecalculate);
            iframeSolo.on('catalog.sheetChangeCompleted', doRecalculate);
            iframeSolo.on('app.ipc.dpl.didSetupTable', doRecalculate);
            //iframeSolo.on('app.ipc.didSelectSheet', unmark);

            doRecalculate();
        })

        solo.on('structure.beforeItemUnload', unmark);

        return this.exports(element);
    };
});