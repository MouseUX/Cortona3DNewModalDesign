define(function (require, exports, module) {
    'use strict';

    require('css!./solo-skin-rwi-search.css');

    var Mark = require('mark.js'),
        ensureVisible = require('lib/ensure-visible');

    module.exports = function (skin, options, solo) {
        var h = skin.create.bind(skin),
            context = document.querySelector('.rwi-tabs .skin-page-body.active'),
            instance = new Mark(context),
            m_textMode = true,
            references = [],
            steps = [],
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
                        searchCounterContainer,
                        h('.skin-container',
                            h('label', h('input', {
                                checked: true,
                                name: 'search-type',
                                type: 'radio',
                                onclick: function () {
                                    m_textMode = true;
                                    search(searchInput.value);
                                }
                            }), 'в тексте'),
                            h('label', h('input', {
                                name: 'search-type',
                                type: 'radio',
                                onclick: function () {
                                    m_textMode = false;
                                    search(searchInput.value);
                                }
                            }), 'в процедуре')
                        )
                    )
                )
            );

        function init() {
            steps = [];
            references = [];
            currentIndex = -1;
            prevButton.disabled = true;
            nextButton.disabled = true;
            skin.hide(searchCounterContainer);
        }

        init();

        function findDocId(keyword) {
            return !keyword ? [] : solo.app.procedure.interactivity.getDocItems().filter(function (docid) {
                var info = solo.app.procedure.interactivity.getDocItemInfo(docid);
                var partNumber = (info.metadata._F0CF006A8AC54725A80D5DC19077CD1D || '').toLowerCase();
                var description = (info.metadata._6A7337C8022746BA8C02F29B0FC2257F || '').toLowerCase();
                var lcKeyword = keyword.toLowerCase();
                return partNumber === lcKeyword || description === lcKeyword;
            });
        }

        function findTasks(keyword) {
            var docids = findDocId(keyword);

            return solo.rwi.interactivity.json
                .$('//task')
                .filter(function (task) {
                    return task.$('//xref').some(function (xref) {
                        return docids.indexOf(xref.$attr('xrefid')) >= 0;
                    });
                })
                .map(function (task) {
                    return task.$attr('id');
                });
        }

        function getSearchDocItemsInTask(id) {
            var docids = findDocId(searchInput.value);
            return solo.rwi.interactivity.json
                .$('//task')
                .filter(function (task) {
                    return task.$attr('id') === id;
                })[0]
                .$('//xref')
                .filter(function (xref) {
                    return docids.indexOf(xref.$attr('xrefid')) >= 0;
                })
                .map(function (xref) {
                    return xref.$attr('xrefid');
                });
        }

        function search(keyword) {
            instance.unmark({
                done: function () {
                    init();
                    if (m_textMode) {
                        instance.mark(keyword, {
                            separateWordSearch: false,
                            done: function () {
                                references = context.querySelectorAll('mark');
                                afterSearch(references);
                            }
                        });
                    } else {
                        steps = findTasks(keyword);
                        afterSearch(steps);
                    }
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
            if (m_textMode) {
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
            } else {
                if (index < 0) {
                    index = steps.length - 1;
                }
                if (index >= steps.length) {
                    index = 0;
                }
                if (index >= 0 && index < steps.length) {
                    solo.app.procedure.seekToSubstep(steps[index], solo.app.procedure.SEEK_TO_END);
                    solo.dispatch('procedure.didObjectClick', getSearchDocItemsInTask(steps[index]));
                    currentIndex = index;
                    indexSpan.textContent = currentIndex + 1;
                }
            }
        }

        solo.on('uniview.component.tab.activated', function (component, n) {
            instance.unmark({
                done: function () {
                    context = document.querySelector('.rwi-tabs .skin-page-body.active');
                    instance = new Mark(context);
                    init();
                    search(searchInput.value);
                }
            });
        });

        return this.exports(element);
    };
});