/**
 * :options.panel.structure contains structure panel for insert tree
 * :options.structure contains json XML
 */
define(function (require, exports, module) {

    require('css!components/rococo/rococo.css');
    require('css!uniview-structure.css');

    var uiTabs = require('components/tabs'),
        ensureVisible = require('lib/ensure-visible'),
        ApplicClass = require('spec/s1000d/applic/Applic'),
        PCT = require('spec/s1000d/applic/PCT');

    module.exports = function (skin, options, solo) {

        var isRestricted = !!solo.uniview.doc.bundleURL;

        var i18n = solo.uniview.i18n['uniview-structure'] || {},
            uiModal = options.uiModal || require('components/modal');

        var applicResources = require('spec/s1000d/applic/applicResources');
        applicResources.initialize(solo.uniview.metadata);
        
        var itemNodesLevel1,
            snsItemNodesLevel1;

        if (options.structure.interactivity.json.$('structure/item').length) {
            itemNodesLevel1 = options.structure.interactivity.json.$('structure/item');
        }
        if (options.structure.interactivity.json.$('structure/entryStructure/item').length) {
            itemNodesLevel1 = options.structure.interactivity.json.$('structure/entryStructure/item');
        }
        if (options.structure.interactivity.json.$('structure/snsStructure/item').length) {
            snsItemNodesLevel1 = options.structure.interactivity.json.$('structure/snsStructure/item');
        }

        if (!itemNodesLevel1) {
            console.log('Structure.xml doesn\'t contain structure items.');
        }

        var baseFileName = solo.uniview.ixml.json.$text('SimulationInteractivity/SimulationInformation/XMLFileName');
        var indexFileName = baseFileName + '.index.xml';

        var initial = {},
            indexUrl = solo.app.getResourceUrl(indexFileName);

        var panel = options.panel,
            iframe = solo.skin.get('main').render(require('components/iframe'));

        if (isRestricted) {
            skin.hide(iframe.$el, true);
        }

        function Structure(rootItemElements, structureTreeElem) {

            if (!rootItemElements)
                return;

            this.structureTreeElem = (structureTreeElem) ? structureTreeElem : skin.create('.structure-tree');
            this.tree = [];
            this.objectiveIndex = {};
            this.uriIndex = {};
            this.itemIndex = {};
            this.itemNavigateIndex = [];

            this.tree = rootItemElements.map(this.convertStructureItem2TreeItems, this);
            this.tree.forEach(this.addParentsAndSiblings2treeItem, this);

            /*for (var i = 0; i < this.tree.length; i++) {
                this.addParentsAndSiblings2treeItem(this.tree[i]);
            }*/
        };

        Structure.prototype.convertStructureItem2TreeItems = function (structureItem) {

            var res = {},
                params = {},
                structureTreeElem = this.structureTreeElem;

            var parametersAttr = structureItem.$attr('parameters') || '';

            var _params = (parametersAttr) ? parametersAttr.split('&') : [];
            _params.forEach(function (item) {
                var p = item.split('=');
                params[p[0]] = (p.length > 1) ? p[1] : p[0];
            });

            var disabled = false;
            var completed = false;
            var choose = false;

            res.id = structureItem.$attr('id');
            res.href = structureItem.$attr('href');
            res.type = structureItem.$attr('type');
            res.uri = structureItem.$attr('uri');
            res.parameters = params;
            res.parametersAttr = parametersAttr;
            res.attemps = 0;

            if (structureItem.$('applic')[0]) {
                /*
                var applic = {
                    displayText: ['...', '...'],
                    expression: {
                        applicPropertyIdent: '',
                        applicPropertyType: '',
                        applicPropertyValues: ''
                    }
                }

                var applic = {
                    id: '',
                    displayText: ['...', '...'],
                    expression: {
                        andOr: '',
                        range: [
                            {
                                applicPropertyIdent: '',
                                applicPropertyType: '',
                                applicPropertyValues: ''
                            }        
                        ]
                    }
                }*/
                res.applic = new ApplicClass(structureItem.$('applic')[0]);
            }

            if (isRestricted && res.href) {
                res.href = 'about:blank';
                res.type = 'html';
            }

            Object.defineProperty(res, 'disabled', {

                get: function () {
                    return disabled;
                },
                set: function (bool) {
                    disabled = bool;
                    var el = structureTreeElem.querySelector('[data-id="' + res.id + '"]');
                    if (!el)
                        return;
                    if (disabled) {
                        el.classList.add('disabled');
                        if (!res.href) {
                            el.parentNode.parentNode.classList.add('disabled');
                        }
                    } else {
                        el.classList.remove('disabled');
                        if (!res.href) {
                            el.parentNode.parentNode.classList.remove('disabled');
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(res, 'completed', {

                get: function () {
                    return completed;
                },
                set: function (bool) {
                    completed = bool;
                    var el = structureTreeElem.querySelector('[data-id="' + res.id + '"]');
                    if (!el) {
                        return;
                    }
                    (completed) ? el.classList.add('completed') : '';
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(res, 'choose', {

                get: function () {
                    return choose;
                },
                set: function (bool) {
                    choose = bool;
                    var el = structureTreeElem.querySelector('[data-id="' + res.id + '"]');
                    if (!el)
                        return;
                    (choose) ? el.classList.add('choose') : el.classList.remove('choose');
                },
                enumerable: true,
                configurable: true
            });

            var sequence = this.getSequencingRulesFromStructureItem(structureItem);
            if (sequence) {
                res.sequence = sequence;
            }

            /*
            <div class="icon item"></div>
            <div class="main">
                <div class="title">
                    <div class="techName"></div>
                    <div class="infoName"></div>
                </div>
                <div class="code"></div>
            </div>
            */

            var iconType = (res.href) ? 'file' : 'folder';
            var iconContent = '<div class="icon $1"></div>'.replace(/\$1/, iconType);

            var HTMLContent = '';
            if (structureItem.$attr('techName') || structureItem.$attr('infoName') || structureItem.$attr('pmTitle')) {
                var code = '<div class="code">$1</div>'.replace(/\$1/, structureItem.$attr('content'));
                var subTitle = '';
                if (structureItem.$attr('techName')) {
                    subTitle += '<div class="techName">$1</div>'.replace(/\$1/, structureItem.$attr('techName'));
                }
                if (structureItem.$attr('infoName')) {
                    subTitle += '<div class="infoName">$1</div>'.replace(/\$1/, structureItem.$attr('infoName'));
                }
                if (structureItem.$attr('pmTitle')) {
                    subTitle += structureItem.$attr('pmTitle');
                }
                var title = '<div class="title">$1</div>'.replace(/\$1/, subTitle);
                HTMLContent = title + code;
            } else {
                HTMLContent = structureItem.$attr('content');
            }
            HTMLContent = '<div class="main">$1</div>'.replace(/\$1/, HTMLContent);
            res.content = iconContent + HTMLContent;

            if (res.href) {
                if (!initial.href) {
                    initial = res;
                }

                res.onclick = function () {
                    if (res.disabled)
                        return;
                    solo.dispatch('structure.didStructureItemClick', {
                        descriptor: res
                    });
                };

                res.onmouseover = function () {
                    if (res.disabled)
                        return;
                    this.classList.add('hover');
                    solo.dispatch('structure.didStructureItemHover', res);
                };

                res.onmouseout = function () {
                    if (res.disabled)
                        return;
                    this.classList.remove('hover');
                    solo.dispatch('structure.didStructureItemOut', res);
                };
            }

            this.itemNavigateIndex.push(res);

            if (structureItem.$('item')[0]) {
                res.children = structureItem.$('item').map(function (item) {
                    return this.convertStructureItem2TreeItems(item, res);
                }, this);
            }

            if (res.uri && !this.uriIndex[res.uri]) {
                this.uriIndex[res.uri] = res;
            }

            this.itemIndex[res.id] = res;

            return res;
        }

        Structure.prototype.getSequencingRulesFromStructureItem = function (structureItem) {
            /*
            sequence: {
                rollupRules: [
                    {
                        ids : [id, id, id],
                        childActivitySet: any,
                        rollupCondition: completed,
                        rollupConditions: {
                            conditionCombination: all,
                            rollupCondition: ['completed']
                        },
                        rollupAction: incomplete
                    }, {
                        ids : [id, id, id],
                        childActivitySet: all,
                        rollupConditions: {
                            conditionCombination: any,
                            rollupCondition: ['completed', 'satisfied']
                        },
                        rollupAction: completed
                    } 
                ],
                sequencingRules: [
                    {
                        ruleCondition: {
                            condition: attemptLimitExceeded,
                            limitConditions: 1
                        }, 
                        ruleAction: disabled
                    }, {
                        ruleCondition: [
                            {
                                objective: posttest-TEXT-A-00-00-00-00A-040A-D,
                                conditionOperator: not,
                                condition: satisfied,
                            }, {
                                objective: posttest-TEXT-A-00-00-00-00A-040A-D,
                                conditionOperator: not,
                                condition: objectiveStatusKnown,
                            }, {
                                objective: posttest-PROCEDURE-A-DA2-20-00-00AA-520A-A,
                                conditionOperator: not,
                                condition: satisfied,
                            }, {
                                objective: posttest-PROCEDURE-A-DA2-20-00-00AA-520A-A,
                                conditionOperator: not,
                                condition: objectiveStatusKnown,
                            }
                        ],
                        ruleAction: disabled
                    }
                ],
                objectives: []
            }
            */

            if (structureItem && structureItem.$('imsss:sequencing').length) {

                var sequence = {};

                var rollupRules = structureItem.$('imsss:sequencing/imsss:rollupRules/imsss:rollupRule');
                if (rollupRules.length) {

                    sequence.rollupRules = rollupRules.map(function (elem) {
                        if (elem.$attr('childActivitySet') && structureItem.$('item')) {

                            var res = {};

                            res.ids = structureItem.$('item').map(function (elem) {
                                return elem.$attr('id');
                            })

                            res.childActivitySet = elem.$attr('childActivitySet');

                            var rollupConditions = elem.$('imsss:rollupConditions')[0];
                            if (rollupConditions) {
                                var rollupCondition = rollupConditions.$('imsss:rollupCondition').map(function (elem) {
                                    return elem.$attr('condition');
                                });
                                var conditionCombination = (rollupConditions.$attr('conditionCombination')) ? rollupConditions.$attr('conditionCombination') : 'all';
                                res.rollupConditions = {
                                    conditionCombination: conditionCombination,
                                    rollupCondition: rollupCondition
                                }
                            }

                            var rollupAction = elem.$('imsss:rollupAction')[0];
                            if (rollupAction.$attr('action')) {
                                res.rollupAction = rollupAction.$attr('action');
                            }

                            return res;
                        }
                    })
                }

                var preConditionRules = structureItem.$('imsss:sequencing/imsss:sequencingRules/imsss:preConditionRule');
                if (preConditionRules.length) {

                    sequence.sequencingRules = preConditionRules.map(function (elem) {

                        var res = {};

                        var ruleCondition = elem.$('imsss:ruleConditions/imsss:ruleCondition');
                        if (ruleCondition) {
                            res.ruleCondition = ruleCondition.map(function (elem1) {
                                var res1 = {};

                                if (elem1.$attr('condition') == 'attemptLimitExceeded') {
                                    res1.condition = 'attemptLimitExceeded';
                                    res1.limitConditions = structureItem.$('imsss:sequencing/imsss:limitConditions')[0].$attr('attemptLimit');
                                }
                                if (elem1.$attr('referencedObjective')) {
                                    var current = elem1.$attr('referencedObjective');
                                    var objectives = structureItem.$('imsss:sequencing/imsss:objectives')[0];
                                    var primaryObjective = objectives.$('imsss:primaryObjective')[0];
                                    if (primaryObjective.$attr('objectiveID') == current) {
                                        res1.objective = primaryObjective.$('imsss:mapInfo')[0].$attr('targetObjectiveID');
                                    } else {
                                        objectives.$('imsss:objective').forEach(function (elem2) {
                                            if (elem2.$attr('objectiveID') == current)
                                                res1.objective = elem2.$('imsss:mapInfo')[0].$attr('targetObjectiveID');
                                        });
                                    }

                                    res1.condition = elem1.$attr('condition');
                                    if (elem1.$attr('operator')) {
                                        res1.conditionOperator = elem1.$attr('operator');
                                    }
                                }
                                return res1;
                            })
                        }

                        var ruleAction = elem.$('imsss:ruleAction')[0];
                        if (ruleAction.$attr('action')) {
                            res.ruleAction = ruleAction.$attr('action');
                        }

                        var ruleConditions = elem.$('imsss:ruleConditions')[0];
                        if (ruleConditions && ruleConditions.$attr('conditionCombination')) {
                            res.conditionCombination = elem.$('imsss:ruleConditions')[0].$attr('conditionCombination');
                        }
                        return res;
                    })
                }

                var objectives = structureItem.$('imsss:sequencing/imsss:objectives')[0];
                if (objectives) {

                    function getObjFromMapInfo(mapInfo, itemObj) {

                        if (!mapInfo)
                            return;

                        var objectiveID = mapInfo.$attr('targetObjectiveID');
                        var writeSatisfiedStatus = (mapInfo.$attr('writeSatisfiedStatus') == 'true') ? true : false;
                        var readSatisfiedStatus = (mapInfo.$attr('readSatisfiedStatus') == 'true') ? true : false;
                        itemObj.objectiveIndex[objectiveID] = false;
                        return {
                            objective: objectiveID,
                            writeSatisfiedStatus: writeSatisfiedStatus,
                            readSatisfiedStatus: readSatisfiedStatus
                        }
                    }

                    var resObjectives = [];

                    var primaryObjective = objectives.$('imsss:primaryObjective')[0];
                    if (primaryObjective) {
                        var arr_item = getObjFromMapInfo(primaryObjective.$('imsss:mapInfo')[0], this);
                        if (arr_item) {
                            resObjectives.push(arr_item);
                        }
                    }

                    if (objectives.$('imsss:objective')) {

                        var objective_arr = [];
                        objectives.$('imsss:objective').forEach(function (objective) {
                            var obj = getObjFromMapInfo(objective.$('imsss:mapInfo')[0], this);
                            if (obj) {
                                obj.readSatisfiedStatus = false;
                                objective_arr.push(obj);
                            }
                        }, this)

                        resObjectives.concat(objective_arr);
                    }

                    if (resObjectives.length) {
                        sequence.objectives = resObjectives;
                    }
                }

                return sequence;
            }

            return;
        }

        Structure.prototype.addParentsAndSiblings2treeItem = function (treeItem, parent, previousSibling, followingSibling) {

            if (parent) {
                treeItem.parent = parent;
            }

            if (previousSibling) {
                treeItem.previousSibling = previousSibling;
            }

            if (followingSibling) {
                treeItem.followingSibling = followingSibling;
            }

            if (treeItem.children && treeItem.children.length) {
                treeItem.children.forEach(function (item, i, arr) {
                    var parent = treeItem;
                    var previousSibling = (i == 0) ? undefined : arr[i - 1];
                    var followingSibling = ((i + 1) == arr.length) ? undefined : arr[i + 1];
                    this.addParentsAndSiblings2treeItem(item, parent, previousSibling, followingSibling);
                }, this)
            }
        }

        Structure.prototype.getChooseTreeItem = function () {
            if (!this.structureTreeElem)
                return;

            var el = this.structureTreeElem.querySelector('.choose');
            if (!el)
                return;

            return (el.dataset.id) ? this.itemIndex[el.dataset.id] : false;
        }

        Structure.prototype.chooseItemById = function (id) {
            var item = this.itemIndex && this.itemIndex[id];
            if (!item)
                return;

            item.choose = true;

            var el = this.structureTreeElem.querySelector('[data-id="' + id + '"]');
            var parent = el;
            while (parent && !(parent.classList.contains('structure-tree'))) {
                parent.classList.remove('collapsed');
                parent = parent.parentNode;
            }

            ensureVisible(el);

            return true;
        }

        Structure.prototype.getFollowingAvailableItem = function () {

            var currentItem = this.getChooseTreeItem();
            if (!currentItem)
                return;

            for (var i = 0; i < this.itemNavigateIndex.length; i++) {
                if (this.itemNavigateIndex[i].id == currentItem.id)
                    break;
            }

            for (var k = i + 1; k < this.itemNavigateIndex.length; k++) {
                if (!this.itemNavigateIndex[k].disabled && this.itemNavigateIndex[k].href)
                    return this.itemNavigateIndex[k];
            }

            return;
        }

        Structure.prototype.getPreviousAvailableItem = function () {

            var currentItem = this.getChooseTreeItem();
            if (!currentItem)
                return;

            for (var i = 0; i < this.itemNavigateIndex.length; i++) {
                if (this.itemNavigateIndex[i].id == currentItem.id)
                    break;
            }

            for (var k = i - 1; k >= 0; k--) {
                if (!this.itemNavigateIndex[k].disabled && this.itemNavigateIndex[k].href)
                    return this.itemNavigateIndex[k];
            }

            return;
        }

        Structure.prototype.render = function () {
            if (!this.structureTreeElem)
                return;

            this.structureTreeElem.append(
                skin.create(require('components/tree'), {
                    items: this.tree,
                    collapsed: true
                }).$el
            );
        }

        function StructureCollection() {
            this.structureCollection = [];
            this.activateIndex = 0;
        }

        StructureCollection.prototype.add = function (structureObj, pageNumber) {
            if (!structureObj)
                return;
            this.structureCollection[pageNumber] = structureObj;
        }

        StructureCollection.prototype.getStructureObjByPageNumber = function (pageNumber) {
            if (!this.structureCollection.length)
                return;
            return this.structureCollection[solo.uniview.settings.NavigationPanel ? pageNumber : 0];
        }

        StructureCollection.prototype.getPreviousFollowingState = function () {

            var res = {
                previous: false,
                following: false
            }

            var structure = this.getStructureObjByPageNumber(this.activateIndex);
            if (!structure)
                return res;

            if (structure.getPreviousAvailableItem()) {
                res.previous = true;
            }
            if (structure.getFollowingAvailableItem()) {
                res.following = true;
            }

            return res;
        }

        StructureCollection.prototype.getPreviousAvailableItem = function () {
            var structure = this.getStructureObjByPageNumber(this.activateIndex);
            if (!structure)
                return;
            return structure.getPreviousAvailableItem();
        }

        StructureCollection.prototype.getFollowingAvailableItem = function () {
            var structure = this.getStructureObjByPageNumber(this.activateIndex);
            if (!structure)
                return;
            return structure.getFollowingAvailableItem();
        }

        StructureCollection.prototype.applyPCTFilter = function () {

            function getChildrenVisibleState (children) {
                
                var childrenVisibleStates = [];
                
                for (var i = 0; i < children.length; i++) {
                    var item = children[i];
                    var itemState = (item.href) ? !item.disabled : getChildrenVisibleState(item.children);
                    childrenVisibleStates.push(itemState);
                    if (!item.href && !itemState) {
                        item.disabled = true;
                    }
                }

                var visibleState = false;
                for (var i = 0; i < childrenVisibleStates.length; i++) {
                    if (childrenVisibleStates[i] == true) {
                        visibleState = true;
                        break;
                    }
                }

                return visibleState;
            }

            function filterStructure (structure) {
                for (var i = 0; i < structure.tree.length; i++) {
                    var item = structure.tree[i];
                    if (!item.href) {
                        var visibleState = getChildrenVisibleState(item.children);
                        if (!visibleState) {
                            item.disabled = true;
                        }
                    }
                }
            }

            function reloadChoosingItem (reloadState) {
                if (reloadState.navigation) {
                    solo.dispatch('structure.navigate.changeBtnState', _structureCollection.getPreviousFollowingState());
                }
                if (reloadState.content) {
                    solo.dispatch('structure.didStructureItemClick', {
                        descriptor: _structure.getChooseTreeItem(),
                        reload: true
                    });
                } else {
                    var iframeSolo = getIframeSolo();
                    if (iframeSolo) {
                        iframeSolo.dispatch('uniview.applyPCTFilter', appliedPCTFilter);
                    }
                }
            }

            var reloadState = {};
            reloadState.navigation = true;
            reloadState.content = false; //false if not reload choose item

            var chooseItem = _structure.getChooseTreeItem();
            if (!chooseItem) return;
                
            var previousApplicState = chooseItem.stateByPCTFilter;
            
            for (var i = 0; i < _structureCollection.structureCollection.length; i++) {
                var struc = _structureCollection.structureCollection[i];
                for (var key in struc.itemIndex) {
                    var item = struc.itemIndex[key];
                    item.disabled = false;
                    if (item.href) {
                        item.stateByPCTFilter = 'visible';
                    }
                }
            }
            
            if (!appliedPCTFilter) {
                
                if (previousApplicState == 'hide') {
                    reloadState.content = true;
                }

                reloadChoosingItem(reloadState);
                return;
            }

            var pctObject = new PCT({ data: appliedPCTFilter });

            //filter items with href (real DM or topics)
            for (var i = 0; i < _structureCollection.structureCollection.length; i++) {
                var struc = _structureCollection.structureCollection[i];
                for (var key in struc.itemIndex) {
                    var item = struc.itemIndex[key];
                    if (item && item.applic) {
                        var filteredApplic = item.applic.filteredByProduct(pctObject.products[0]);
                        if (filteredApplic && !filteredApplic.state) {
                            item.disabled = true;
                            item.stateByPCTFilter = 'hide';
                        }
                    }
                }
            }

            //filter folder-items
            for (var i = 0; i < _structureCollection.structureCollection.length; i++) {
                filterStructure(_structureCollection.structureCollection[i]);
            }

            if (chooseItem.stateByPCTFilter == 'hide') {
                var loadingItem = _structure.getFollowingAvailableItem() || _structure.getPreviousAvailableItem() || 'unload';
                
                if (loadingItem == 'unload') {
                    iframe
                        .unload()
                        .then(function () {
                            solo.dispatch('structure.navigate.changeBtnState', _structureCollection.getPreviousFollowingState());
                        });
                } else {
                    solo.dispatch('structure.didStructureItemClick', {
                        descriptor: loadingItem
                    });
                }
            } else if (previousApplicState == 'hide') {
                reloadState.content = true;
                reloadChoosingItem(reloadState);
            } else {
                reloadChoosingItem(reloadState);
            }
        }

        var _structure = new Structure(itemNodesLevel1);
        var _snsStructure = new Structure(snsItemNodesLevel1);
        var _structureCollection = new StructureCollection();

        var structureNavigationBar = skin.create(require('components/rococo/solo-skin-structure-navigate-toolbar')),
            history = skin.create(require('components/rococo/solo-skin-structure-history')),
            pctFilter = skin.create(require('components/rococo/solo-skin-structure-pct')),
            pages = [];

        var appliedPCTFilter;
        
        if (_structure.structureTreeElem) {
            var tabsElem = [];
            if (pctFilter.element)
                tabsElem.push(pctFilter.element);
            tabsElem.push(_structure.structureTreeElem);
            pages.push({
                title: i18n.UI_TXT_TAB_STRUCTURE,
                content: skin.create('.navigation', tabsElem)
            })
            var pageIndex = pages.length - 1;
            _structureCollection.add(_structure, pageIndex);
        }

        if (_snsStructure.structureTreeElem) {
            pages.push({
                title: i18n.UI_TXT_TAB_SNS,
                content: skin.create('.snsNavigation', [
                    _snsStructure.structureTreeElem
                ])
            })
            var pageIndex = pages.length - 1;
            _structureCollection.add(_snsStructure, pageIndex);
        }

        if (!isRestricted) {
            pages.push({
                title: i18n.UI_TXT_TAB_HISTORY,
                content: history.element
            });
        }


        solo.app.util.loadResource(indexUrl)
            .then(function (data) {
                if (!isRestricted && data.responseXML) {
                    pages.push({
                        title: i18n.UI_TXT_TAB_SEARCH,
                        content: [
                            skin.render(require('components/rococo/solo-skin-structure-search'), {
                                indexUrl: indexUrl
                            }).element
                        ]
                    })
                }
            })
            .catch(function (e) {
                console.log('Search index not found: ' + e);
            })
            .then(function () {

                //create structure layout

                panel.header.append(structureNavigationBar.$el);

                var tabs = skin.create(uiTabs, {
                    pages: pages
                });

                tabs.on('activated', function (pageNumber) {
                    _structureCollection.activateIndex = pageNumber;
                    var state = _structureCollection.getPreviousFollowingState();
                    solo.dispatch('structure.navigate.changeBtnState', state);
                });

                _structure.render();
                _snsStructure.render();

                solo.expand(solo, {
                    'structure': _structure
                });

                solo.expand(solo.uniview.options, options);

                tabs.classList.add('navigation-tabs');
                solo.skin.get('aux').render(tabs);

                if (isRestricted) {
                    skin.hide('#btn-navigationpanel', true);
                    solo.uniview.css.render({
                        '.solo-uniview-content': {
                            '& .aux.panel': {
                                flexBasis: '34%'
                            },
                            '& .main.panel': {
                                flexBasis: '66%'
                            }
                        } 
                    });
                }

                solo.dispatch('uniview.toggleStructurePanelOnlyMode', true);
                solo.dispatch('structure.navigate.update');

                if (!initial.disabled) {
                    solo.dispatch('structure.didStructureItemClick', {
                        descriptor: initial
                    });
                }

                if (isRestricted) {
                    solo.skin.get('main').render(skin.create('.structure-restricted-message',
                        skin.create('span', i18n.restrictedMessage),
                        skin.create('a', {
                            href: solo.uniview.doc.bundleURL,
                            download: (solo.uniview.metadata.TITLE || 'book') + '.vmb',
                            target: '_blank'
                        }, i18n.downloadLink)
                    ));
                }
            });

        solo.on('structure.didStructureItemClick', function (obj) {

            var descriptor = obj.descriptor,
                searchText = obj.searchText;
            
            if (!descriptor || !descriptor.href)
                return;

            var chooseItem = _structure.getChooseTreeItem();
            var previousId;
            if (chooseItem) {
                previousId = chooseItem.id;
                chooseItem.choose = false;
            }

            var snsChooseElem = _snsStructure.getChooseTreeItem();
            if (snsChooseElem) {
                snsChooseElem.choose = false;
            }

            solo.dispatch('structure.beforeItemUnload', previousId, iframe);

            _structure.chooseItemById(descriptor.id);
            _snsStructure.chooseItemById(descriptor.id);

            var reloadFrame = (previousId !== descriptor.id) ? true : false;

            var url = solo.app.getResourceUrl(descriptor.href, options.structureUrl);

            var opt = {};
            opt.reloadFrame = reloadFrame;
            opt.uriIndex = _structure.uriIndex;
            opt.pctFilter = appliedPCTFilter;

            if (options.lang) {
                opt.lang = options.lang;
            } else if (options.SpecLang) {
                opt.lang = options.SpecLang;
            }

            if (descriptor.stateByPCTFilter == 'hide') {
                opt.reloadFrame = true;
                opt.stateByPCTFilter = 'hide';
            }

            if (obj.reload) {
                opt.reloadFrame = true;
            }

            if (solo.uniview.options.SCORM || (solo.uniview.options.SCORM === '0')) {
                opt.SCORM = solo.uniview.options.SCORM;
            }

            if (descriptor.parameters['mode'] == 'scorm') {
                opt.scormMode = true;
            } else {
                var trainingMode = parseInt(descriptor.parameters['mode'])
                if (trainingMode >= 0 && trainingMode <= 2) {
                    opt.mode = trainingMode;
                }
            }

            opt.handlers = {
                toggleStatus: function () {
                    if (this.classList.contains('full')) {
                        this.classList.remove('full');
                        this.classList.add('short');
                    } else if (this.classList.contains('short')) {
                        this.classList.remove('short');
                        this.classList.add('full');
                    }
                }
            }

            var childOptions = {};
            if (solo.uniview.options.InternalPublicationsSettings) {
                try {
                    solo.expand(childOptions, JSON.parse(solo.uniview.options.InternalPublicationsSettings));
                } catch(e) {
                    console.log('Invalid JSON syntax for "InternalPublicationsSettings" option: \n' + solo.uniview.options.InternalPublicationsSettings + '\n' + e.message);
                }
            }
            solo.expand(childOptions, options.childOptions || {});

            solo.dispatch('structure.beforeItemLoad', descriptor);

            if (descriptor.type === 'html' || /\.html?(\?.*)?$/i.test(descriptor.href)) {

                if (descriptor.parametersAttr) {
                    if (descriptor.href.indexOf('?') == -1) {
                        url += '?' + descriptor.parametersAttr;
                    } else {
                        url += '&' + descriptor.parametersAttr;
                    }
                }

                iframe
                    .load(url, opt)
                    .then(function () {
                        solo.dispatch('iframe.ready', descriptor, iframe);
                    });
            } else {

                opt.totalMemory = options.totalMemory;
                opt.features = options.features;

                iframe
                    .loadSoloResource(url, solo.expand({
                        treatSrcAsCompanionFile: /\.interactivity\.xml$/i.test(descriptor.href)
                    }, childOptions, opt))
                    .then(function () {
                        solo.dispatch('iframe.ready', descriptor, iframe, searchText);
                    });
            }

            var state = _structureCollection.getPreviousFollowingState();
            solo.dispatch('structure.navigate.changeBtnState', state);

            history.addItem2History(descriptor);
        });

        function iframeEvents_openLink(descriptor) {
            solo.dispatch('structure.didStructureItemClick', {
                descriptor: descriptor
            });
        }

        function getIframeSolo() {
            var iframeSolo = null;
            try {
                iframeSolo = iframe.window && iframe.window.Cortona3DSolo;
            } catch (e) { }
            return iframeSolo;
        }

        function removeAllIframeEvents(iframe) {
            var iframeSolo = getIframeSolo();

            if (iframeSolo) {
                iframeSolo.removeListener('doc.openLink', iframeEvents_openLink);
            }
        }

        solo.on('iframe.ready', function (descriptor, iframe) {

            var iframeSolo = iframe.window.Cortona3DSolo;
            if (iframeSolo) {
                iframeSolo.on('doc.openLink', iframeEvents_openLink);

                if (iframeSolo.uniview.options && (iframeSolo.uniview.options.stateByPCTFilter == 'hide')) {
                    var iframeSkin = iframeSolo.skin.get('app');
                    var modal = iframeSkin.render(uiModal, {
                        hideDismissButton: true,
                        disableAutoDismiss: true,
                        content: iframeSkin.create('',
                            iframeSkin.create('p.message',
                                iframeSkin.create('pre', solo.uniview.i18n["uniview-structure"].MESSAGE_PCT_HIDE)
                            )
                        )
                    });
                    modal.$el.focus();
                }
            }

            if (solo.structure) {
                //modify identAndStatusSection
                var iframeDocument = iframe.window.document;
                var identAndStatusSection = iframeDocument.querySelector('.identAndStatusSection');
                if (identAndStatusSection) {
                    identAndStatusSection.classList.add('short');
                }
            }
        })

        solo.on('structure.beforeItemUnload', function (previousId, iframe) {
            removeAllIframeEvents(iframe);
        });

        solo.on('structure.navigate.previous', function () {

            var previousItem = _structureCollection.getPreviousAvailableItem();
            if (previousItem) {
                solo.dispatch('structure.didStructureItemClick', {
                    descriptor: previousItem
                });
            }
        });

        solo.on('structure.navigate.following', function () {
            var followingItem = _structureCollection.getFollowingAvailableItem();
            if (followingItem) {
                solo.dispatch('structure.didStructureItemClick', {
                    descriptor: followingItem
                });
            }
        });

        solo.on('uniview.settings.changedNavigationPanel', function (value) {
            solo.dispatch('structure.navigate.changeBtnState', _structureCollection.getPreviousFollowingState());
        })

        solo.on('structure.applyPCTFilter', function (pctFilter) {
            appliedPCTFilter = pctFilter;
            _structureCollection.applyPCTFilter();
        })

        /** 
         * Test structure click 
         */

        /*
        var testAttemps = 20;
        var currentAttemp = 1;
        
        solo.on('iframe.ready', function () {
            
            setTimeout(function () {
                if (currentAttemp <= testAttemps) {
                    var item = _structure.getFollowingAvailableItem();
                    if (!item) {
                        item = initial;
                    }
                    solo.dispatch('structure.didStructureItemClick', {
                        descriptor: item
                    });
                } else {
                    console.log('========================== Test done ==========================');
                }
                currentAttemp++;
            }, 1000);
        });
        */
    };
});