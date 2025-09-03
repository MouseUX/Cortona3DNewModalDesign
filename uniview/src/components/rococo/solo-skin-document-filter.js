/**
 * @close
 * @toggle
 */
define(function (require, exports, module) {
    require('css!./solo-skin-document-filter.css');

    var uiPopup = require('components/popup'),
        uiTabs = require('components/tabs');

    module.exports = function (skin, options, solo) {

        var i18n = solo.uniview.i18n['solo-skin-document-filter'] || {},
            defineClass = solo.app.util.defineClass,
            m_drawingUrl;

        // group regular expression 
        // groupName(value value)
        var reGroup = /([^\s\(\)]+)\(([^\)]+)\)/g;


        solo.on('app.drawing.didFinishLoadDrawing', function (url) {
            m_drawingUrl = url;
        });

        var applicResources = require('spec/s1000d/applic/applicResources');
        applicResources.initialize(solo.uniview.metadata);

        var ApplicClass = require('spec/s1000d/applic/Applic'),
            PCT = require('spec/s1000d/applic/PCT');

        /*ApplicClass.defineConvertedRules({
            'versrank': {
                enumerated: true,
                optimize: true,
                toComparedValues: function (value) {
                    return parseInt(value.replace(/\D/, ''));
                },
                toS1000DValues: function (value) {
                    return '' + value;
                }
            },
            'serial': {
                enumerated: true,
                optimize: true,
                toComparedValues: function (value) {
                    return +(value.replace(/\D/, ''))
                },
                toS1000DValues: function (value) {
                    return ('000' + value).slice(-4);
                }
            }
        });*/

        var Filter = defineClass(null, function (filterObject) {
            this.inline = undefined;
            this.global = undefined;
        }, {
            add: function (args) {
                if (args.type == 'inline' && args.filter) {
                    this.inline = args.filter;
                }
                if (args.type == 'global' && args.filter) {
                    this.global = args.filter;
                }
            }
        });

        var FilterItem = defineClass(null, function (node) {
            this.attribute = node.getAttribute('data-filter-attr');
            this.value = node.getAttribute('data-filter-value');
            this.action = node.getAttribute('data-filter-action');
        }, {});

        var FilterObject = defineClass(null, function () {
            this.HTMLElement = document.createElement('div');
            this.HTMLElement.classList.add('filter');
            this.setDefaultValue(this.HTMLElement);
        }, {
            isEmpty: function () {
                return true;
            },
            fill: function () {
                throw new Error('Must be override');
            },
            get: function () {
                throw new Error('Must be override');
                //return [];
            },
            getExcludeNodes: function () {
                throw new Error('Must be override');
                //return [];
            },
            setApplyHandler: function (handler) {
                this.applyHandler = handler;
            },
            setDefaultValue: function (div) {
                div = div || this.HTMLElement;

                var applyHandler = this.applyHandler;

                while (div.firstChild) {
                    div.removeChild(div.firstChild);
                }
                this.fill();
                this.get().forEach(function (item) {
                    div.appendChild(item.toHTMLFilter(applyHandler));
                });
                return div;
            }
        });

        var ProductConditionTable = defineClass(FilterObject, function () {
            this.products = [];
            this.constructor.superClass.call(this);
        }, {
            isEmpty: function () {
                return this.products.length === 0;
            },
            get: function () {
                return this.products;
            },
            fill: function () {

                this.products = [];

                var referencedApplicGroup = document.querySelector('.referencedApplicGroup');

                var self = this;

                if (referencedApplicGroup) {
                    skin.toggle(referencedApplicGroup, false);

                    referencedApplicGroup.querySelectorAll('.applic').forEach(function (el) {
                        self.addProduct(new ApplicObject(el));
                    });
                }
            },
            addProduct: function (applic) {
                if (applic.id) {
                    this.products.push(applic);
                }
            },
            getExcludeNodes: function () {
                var rows = this.HTMLElement.querySelectorAll('.filter__row');
                var nodesExclude = [];

                for (var i = 0; i < rows.length; i++) {
                    var filterItem = new FilterItem(rows[i]);
                    if (filterItem.action == 'exclude') {
                        var query = '*[' + filterItem.attribute + '="' + filterItem.value + '"]';
                        var nodes = document.querySelectorAll(query);
                        for (var j = 0; j < nodes.length; j++) {
                            nodesExclude.push(nodes[j]);
                        }
                    }
                }

                return nodesExclude;
            }
        });

        var FilterObjectItem = defineClass(null, function () {
            this.displayText = "";
        }, {
            toHTMLFilter: function (applyHandler) {
                throw new Error('Must be override');
            },
            toString: function () {
                return 'id: ' + this.id + ' value: ' + this.expression;
            }
        });

        var ApplicObject = defineClass(FilterObjectItem, function (div) {
            this.constructor.superClass.call(this);
            if (!div.id) return;

            this.applic = new ApplicClass(div);

            this.id = this.applic.id;
        }, {
            toHTMLFilter: function (applyHandler) {

                function createElement(elementName, classStr, content) {
                    var element = document.createElement(elementName);
                    if (classStr) {
                        var classArray = classStr.replace(/\s+/, ' ').split(' ');
                        for (var i = 0; i < classArray.length; i++) {
                            element.classList.add(classArray[i]);
                        }
                    }
                    if (content)
                        element.innerHTML = content;
                    return element;
                }

                function changeAction() {
                    var index = select.selectedIndex;
                    var value = select.options[index].value;
                    div.setAttribute('data-filter-action', value);
                    if (applyHandler) {
                        applyHandler();
                        solo.dispatch('uniview.doc.filterChanged', div.dataset);
                    }
                }

                var DEFAULT_ACTION = 'include';

                var div = createElement('div', 'filter__row');
                div.setAttribute('data-filter-attr', 'data-applicrefid');
                div.setAttribute('data-filter-value', this.id);
                div.setAttribute('data-filter-action', DEFAULT_ACTION);

                var div_id = createElement('div', 'filter__attribute', this.id);
                var div_displayText = createElement('div', 'filter__value', this.applic.resolve());
                var div_action = createElement('div', 'filter__action');

                var select = document.createElement('select');

                var option_exclude = new Option(i18n.exclude, 'exclude');
                var option_include = new Option(i18n.include, 'include');

                if (DEFAULT_ACTION == 'include') {
                    option_include.defaultSelected = true;
                    option_include.selected = true;
                } else {
                    option_exclude.defaultSelected = true;
                    option_exclude.selected = true;
                }

                select.appendChild(option_exclude);
                select.appendChild(option_include);
                select.addEventListener('change', changeAction);

                div_action.appendChild(select);

                div.appendChild(div_id);
                div.appendChild(div_displayText);
                div.appendChild(div_action);

                return div;
            }
        });

        var Ditaval = defineClass(FilterObject, function () {
            this.ATTRIBUTES = ['audience', 'product', 'platform', 'props', 'otherprops'];
            this.props = [];
            this.constructor.superClass.call(this);
        }, {
            isEmpty: function () {
                return this.props.length === 0;
            },
            get: function () {
                return this.props;
            },
            fill: function () {
                var that = this;

                this.props = [];

                this.ATTRIBUTES.forEach(function (name) {
                    document.querySelectorAll('*[data-' + name + ']').forEach(function (node) {
                        node.dataset[name].replace(reGroup, function (match, groupName, groupValues) {
                            groupValues.trim().split(/\s+/).forEach(function (value) {
                                that.addProp(new Property_ditaval(groupName, value, ''));
                            });
                            return '';
                        }).trim().split(/\s+/).forEach(function (value) {
                            that.addProp(new Property_ditaval(name, value, ''));
                        });
                    });
                });

                this.props.sort(function (a, b) {
                    if (a.attr > b.attr) return 1;
                    if (a.attr < b.attr) return -1;
                    return 0;
                });
            },
            addProp: function (prop) {
                if (!prop.value) return;
                var exist = this.props.find(function(p) {
                    return (p.attr === prop.attr) && (p.value === prop.value) && (p.action === prop.action);
                });
                if (!exist) {
                    this.props.push(prop);
                }
            },
            getExcludeNodes: function () {

                function AttributeMap() {
                    this.map = [];
                    this.addToMap = function (filterItem) {
                        this.map.push(filterItem);
                    };
                    this.getActionForAttrAndValue = function (attr, value) {
                        var filterItem = this.map.find(function (filterItem) {
                            return filterItem.attribute === attr && filterItem.value === value;
                        });
                        return (filterItem && filterItem.action) || '';
                    };
                }

                var attributeMap = new AttributeMap();
                this.HTMLElement.querySelectorAll('.filter__row').forEach(function (row) {
                    attributeMap.addToMap(new FilterItem(row));
                });

                var query = this.ATTRIBUTES.map(function (name) { return '*[data-' + name + ']' }).join(', ');

                var nodes = document.querySelectorAll(query);
                var nodesExclude = [];

                loop:
                    for (var i = 0; i < nodes.length; i++) {
                        var node = nodes[i];
                        var groups = {};
                        for (var j = 0; j < this.ATTRIBUTES.length; j++) {
                            var name = this.ATTRIBUTES[j];
                            if (node.dataset[name]) {
                                var attrStatus = node.dataset[name].replace(reGroup, function (match, groupName, groupValues) {
                                    var values = groupValues.trim().split(/\s+/);
                                    if (values) {
                                        groups[groupName] = groups[groupName] ? groups[groupName].concat(values) : values;
                                    }
                                    return '';
                                }).trim().split(/\s+/).every(function (value) {
                                    return !value || attributeMap.getActionForAttrAndValue(name, value) === 'include';
                                });
                                if (!attrStatus) {
                                    nodesExclude.push(node);
                                    continue loop;
                                }
                            }
                        }
                        for (var name in groups) {
                            var attrStatus = groups[name].every(function (value) {
                                return !value || attributeMap.getActionForAttrAndValue(name, value) === 'include';
                            });
                            if (!attrStatus) {
                                nodesExclude.push(node);
                                continue loop;
                            }
                        }
                    }

                return nodesExclude;
            }
        });

        var Property_ditaval = defineClass(FilterObjectItem, function (attr, value, action) {
            this.constructor.superClass.call(this);

            var ALLOW_ACTIONS = {
                'include': true,
                'exclude': true
            };

            this.DEFAULT_ACTION = 'include';

            this.attr = attr;
            this.value = value;
            this.action = (action && ALLOW_ACTIONS[action]) ? action : this.DEFAULT_ACTION;

        }, {
            toHTMLFilter: function (applyHandler) {

                function createElement(elementName, classStr, content) {
                    var element = document.createElement(elementName);
                    if (classStr) {
                        var classArray = classStr.replace(/\s+/, ' ').split(' ');
                        for (var i = 0; i < classArray.length; i++) {
                            element.classList.add(classArray[i]);
                        }
                    }
                    if (content)
                        element.innerHTML = content;
                    return element;
                }

                function changeAction() {
                    var index = select.selectedIndex;
                    var value = select.options[index].value;
                    div.setAttribute('data-filter-action', value);
                    if (applyHandler) {
                        applyHandler();
                        solo.dispatch('uniview.doc.filterChanged', div.dataset);
                    }
                }

                var div = createElement('div', 'filter__row');
                div.setAttribute('data-filter-attr', this.attr);
                div.setAttribute('data-filter-value', this.value);
                div.setAttribute('data-filter-action', this.action);

                var div_attr = createElement('div', 'filter__attribute', this.attr);
                var div_value = createElement('div', 'filter__value', this.value);
                var div_action = createElement('div', 'filter__action');

                var select = document.createElement('select');

                var option_exclude = new Option(i18n.exclude, 'exclude');
                var option_include = new Option(i18n.include, 'include');

                if (this.DEFAULT_ACTION == 'include') {
                    option_include.defaultSelected = true;
                    option_include.selected = true;
                } else {
                    option_exclude.defaultSelected = true;
                    option_exclude.selected = true;
                }

                select.appendChild(option_exclude);
                select.appendChild(option_include);
                select.addEventListener('change', changeAction);

                div_action.appendChild(select);

                div.appendChild(div_attr);
                div.appendChild(div_value);
                div.appendChild(div_action);
                return div;
            }
        });

        function checkGraphicStateAfterFilter(src) {

        }

        var filterObjectInline,
            filterObjectGlobal;

        var doc = document.querySelector('.doc-container');

        filterObjectInline = new ProductConditionTable();
        if (filterObjectInline.isEmpty()) {
            filterObjectInline = new Ditaval();
            if (filterObjectInline.isEmpty()) {
                doc.classList.remove('app-filter');
            }
        }

        filterObjectInline.setApplyHandler(function () {
            document.querySelectorAll('.filterHide').forEach(function (el) {
                el.classList.remove('filterHide');
            });
            filterObjectInline.getExcludeNodes().forEach(function (el) {
                el.classList.add('filterHide');
            });

            buttonClearFilter.disabled = false;
            
            var state = true;

            if (m_drawingUrl) {
                var node = document.querySelector('.graphic[data-src *= "' + m_drawingUrl.replace(/\.[^.]+$/, '') + '"]');
                if (!node) {
                    return state;
                }
                do {
                    state = !node.classList.contains('filterHide');
                    node = node.parentNode;
                } while (node.parentNode && state);
            }

            if (!state) {
                if (solo.app.drawing.isVisible()) {
                    if (solo.core) {
                        solo.app.procedure.toggleDrawingDisplayMode(false);
                    } else {
                        solo.dispatch('uniview.toggleAuxPanelOnlyMode', true);
                    }
                }
            }
        });

        var popupContent = filterObjectInline.HTMLElement;

        try {

            var pct = applicResources.getResource('pct');
            
            if (pct && pct.products) {
                
                var ProductConditionTable_Global = defineClass(FilterObject, function (pct) {
                    this.products = [];
                    this.pctObject = pct
                    this.inlineApplics = (function () {
                        var res = [];
                        var $inlineApplics = doc.querySelectorAll('.referencedApplicGroup .applic');
                        
                        for (var i = 0; i < $inlineApplics.length; i++) {
                            var $inlineApplic = $inlineApplics.item(i);
                            var inlineApplic = new ApplicClass($inlineApplic);
                            res.push(inlineApplic);
                        }

                        return res;
                    })();
                    this.constructor.superClass.call(this);
                }, {
                    isEmpty: function () {
                        return (this.pctObject && this.pctObject.products.length === 0);
                    },
                    get: function () {
                        return this.products;
                    },
                    fill: function () {
                        this.products = [];
                        this.addProduct(new Product_Global(this.pctObject));
                    },
                    addProduct: function (applic) {
                        this.products.push(applic);
                    },
                    getExcludeNodes: function (globalPCTData) {
                        
                        var product;
                        
                        if (globalPCTData) {
                            var pctObject = new PCT({ data: globalPCTData });
                            product = pctObject.getProductByArgs({
                                count: 1
                            });
                        } else {
                            var productId = this.HTMLElement.querySelectorAll('.pct__table')[0].getAttribute('data-filter-action');
                            product = this.pctObject.getProductByArgs({
                                id: productId
                            })
                        }

                        var nodesExclude = [];

                        for (var i = 0; i < this.inlineApplics.length; i++) {
                            var filteredInlineApplic = this.inlineApplics[i].filteredByProduct(product);
                            if (filteredInlineApplic && !filteredInlineApplic.state) {
                                var query = '*[data-applicRefId="' + filteredInlineApplic.id + '"]';
                                var nodes = document.querySelectorAll(query);
                                for (var j = 0; j < nodes.length; j++) {
                                    nodesExclude.push(nodes[j]);
                                }
                            }
                        }
                        return nodesExclude;
                    }
                });

                var Product_Global = defineClass(FilterObjectItem, function (pctObject) {
                    this.pctObject = pctObject;
                    this.constructor.superClass.call(this);
                }, {
                    toHTMLFilter: function (applyHandler) {
        
                        
                        function changePCT() {
                            
                            document.querySelectorAll('.pct__table .pct__row').forEach(function (el) {
                                el.classList.remove('applied');
                            })
                            
                            //this -> htmlEventNode
                            var productId = this.getAttribute('data-productId');
                            this.classList.add('applied');
                            selectPCT.setAttribute('data-filter-action', productId);
                            if (applyHandler) {
                                applyHandler();
                            }
                            solo.dispatch('uniview.doc.filterChanged', selectPCT.dataset)
                        }
                        
                        var selectPCT = skin.create('.pct__table');

                        for (var i = 0; i < this.pctObject.products.length; i++) {
                            var $productDescription = skin.create('.pct__description');
                            var $product = skin.create('.pct__row', $productDescription);
                            var product = this.pctObject.products[i];
                            $productDescription.appendChild(skin.create('', product.resolve('%resolveStr')));
                            selectPCT.appendChild($product);
                            $product.setAttribute('data-productId', product.id);
                            $product.addEventListener('click', changePCT);
                        }
                        
                        return selectPCT;
                    }
                });
                
                filterObjectGlobal = new ProductConditionTable_Global(pct);
                filterObjectGlobal.setApplyHandler(function (globalPCTData) {
                    document.querySelectorAll('.filterHide').forEach(function (el) {
                        el.classList.remove('filterHide');
                    });
                    filterObjectGlobal.getExcludeNodes(globalPCTData).forEach(function (el) {
                        el.classList.add('filterHide');
                    });
        
                    buttonClearFilter.disabled = false;
                    
                    var state = true;

                    if (m_drawingUrl) {
                        var node = document.querySelector('.graphic[data-src *= "' + m_drawingUrl.replace(/\.[^.]+$/, '') + '"]');
                        if (!node) {
                            return state;
                        }
                        do {
                            state = !node.classList.contains('filterHide');
                            node = node.parentNode;
                        } while (node.parentNode && state);
                    }
        
                    if (!state) {
                        if (solo.app.drawing.isVisible()) {
                            if (solo.core) {
                                solo.app.procedure.toggleDrawingDisplayMode(false);
                            } else {
                                solo.dispatch('uniview.toggleAuxPanelOnlyMode', true);
                            }
                        }
                    }
                });

                if (pct.products.length) {
                    var tabs = skin.create(uiTabs);
                    popupContent = skin.container('.filter-tabs');
                    popupContent.append(tabs.element);
                    tabs.emit('append', i18n["UI_TXT_TAB_PCT"], filterObjectGlobal.HTMLElement);
                    if (!filterObjectInline.isEmpty()) {
                        tabs.emit('append', i18n["UI_TXT_TAB_INLINE"], filterObjectInline.HTMLElement);
                    }
                }
            }
        } catch (e) {}

        var buttonClearFilter = skin.button({
            onclick: function () {
                clearFilter();
                solo.dispatch('uniview.doc.filterChanged', {});
            },
            disabled: true
        }, i18n.clear);

        function clearFilter() {
            document.querySelectorAll('.filterHide').forEach(function (el) {
                el.classList.remove('filterHide');
            });

            filterObjectInline && filterObjectInline.setDefaultValue();
            filterObjectInline && filterObjectInline.HTMLElement.classList.add('applied');
            filterObjectGlobal && filterObjectGlobal.setDefaultValue();
            filterObjectGlobal && filterObjectGlobal.HTMLElement.classList.remove('applied');

            buttonClearFilter.disabled = true;
        }
        
        var popup = skin.create(uiPopup, {
            closable: true,
            content: [
                popupContent,
                skin.container('.footer',
                    buttonClearFilter,
                    skin.button({
                        onclick: function () {
                            popup.emit('close');
                        }
                    }, i18n.close)
                )
            ]
        });

        popup.classList.add('panel-filter');

        var filter = new Filter();
        filter.add({
            type: 'inline',
            filter: filterObjectInline
        });
        filter.add({
            type: 'global',
            filter: filterObjectGlobal
        })

        filterObjectInline && filterObjectInline.setDefaultValue();
        filterObjectInline && filterObjectInline.HTMLElement.classList.add('applied');
        filterObjectGlobal && filterObjectGlobal.setDefaultValue();
        
        if (filterObjectInline || filterObjectGlobal) {
            doc.classList.add('app-filter');
        }

        solo.on('uniview.applyPCTFilter', function (pctFilter) {
            clearFilter();
            if (pctFilter) {
                filterObjectGlobal.applyHandler(pctFilter);
                solo.dispatch('uniview.doc.filterChanged', {});
                solo.dispatch('uniview.doc.filter.setDocumentFilterState', false);
            } else {
                solo.dispatch('uniview.doc.filter.setDocumentFilterState', true);
            }
        })

        solo.on('uniview.doc.filterChanged', function (dataset) {
            if (dataset.filterAttr) {
                filterObjectGlobal && filterObjectGlobal.setDefaultValue();
                filterObjectGlobal && filterObjectGlobal.HTMLElement.classList.remove('applied');
                filterObjectInline && filterObjectInline.HTMLElement.classList.add('applied');
            } else {
                filterObjectInline && filterObjectInline.setDefaultValue();
                filterObjectInline && filterObjectInline.HTMLElement.classList.remove('applied');
                filterObjectGlobal && filterObjectGlobal.HTMLElement.classList.add('applied');
            }
        })

        solo.dispatch('uniview.applyPCTFilter', options.pctFilter);

        popup.isEmpty = (!filterObjectInline || filterObjectInline.isEmpty()) && (!filterObjectGlobal || filterObjectGlobal.isEmpty());
        
        /*
        if (doc.querySelector('.dmodule')) {
            (new (require('spec/s1000d/applic/InlineApplics'))).show()
        }*/

        return popup;
    };
});

/**
 * The event is called when the applicability filter has changed in the document.
 * @event Cortona3DSolo~"uniview.doc.filterChanged"
 * @type {arguments}
 * @prop {DOMStringMap} dataset - The data set for the filter:
 * ```javascript
 * {
 *      filterAttr: 'data-applicrefid', // attribute name
 *      filterValue: value, // attribute value
 *      filterAction: 'include' | 'exclude' // filter action
 * }
 * ```
 */
