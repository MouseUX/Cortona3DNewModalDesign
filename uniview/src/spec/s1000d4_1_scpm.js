/**
 * 
 */
define(function (require, exports, module) {
    require('css!./s1000d4_1_scpm.css');
    module.exports = function (skin, options, solo) {
        
        function initSCORMApi (solo) {
            var rtsAPI = require('addons/training/rts_api_wrapper');
            var api = rtsAPI.getAPI();
            api.isSoloStub = true;

            window.API_1484_11 = api;
            
            solo.on('structure.beforeItemLoad', function (descriptor) {
                rtsAPI.startLO(descriptor.id);
                console.log('Start LO: ' + descriptor.id);
            })

            solo.on('structure.beforeItemUnload', function (id, iframe) {
                
                if (!id)
                    return;
                
                var hasQuestions = rtsAPI.get('c3d.hasQuestions');
                
                if (id && !hasQuestions) {
                    rtsAPI.set("cmi.completion_status", "completed");
                    rtsAPI.set("cmi.success_status", "passed");
                }

                solo.structure.itemIndex[id].attemps++;

                //console.log('End LO: ' + id);
                solo.dispatch('structure.navigate.update');
                removeAllIframeEvents(iframe);
            })

            solo.on('structure.navigate.update', function () {

                var structureTreeElem = solo.structure.structureTreeElem;
                if (!structureTreeElem)
                    return;
                
                function changeItem(item) {
                    
                    var completion_status = rtsAPI.getValueForItemById('cmi.completion_status', item.id);
                    if (completion_status == 'completed') {
                        item.completed = 'completed';
                        if (item.sequence && item.sequence.objectives && item.sequence.objectives.length) {
                            item.sequence.objectives.forEach(function (objective) {
                                if (objective.writeSatisfiedStatus) {
                                    solo.structure.objectiveIndex[objective.objective] = 'satisfied';
                                }
                            })
                        }
                        if (solo.structure.objectiveIndex.hasOwnProperty(item.id)) {
                            solo.structure.objectiveIndex[item.id] = 'satisfied';
                        }
                    }

                    if (item.sequence && item.sequence.objectives && item.sequence.objectives.length) {
                        item.sequence.objectives.forEach(function (objective) {
                            if (objective.readSatisfiedStatus && solo.structure.objectiveIndex[objective.objective] == 'satisfied') {
                                item.completed = 'completed';
                                rtsAPI.setValueForItemById('cmi.completion_status', 'completed', item.id);
                            }
                        })
                    }

                    if (completion_status == 'completed') {
                        return;
                    }

                    if (item.sequence && item.sequence.sequencingRules) {
                        item.sequence.sequencingRules.forEach(function (sequencingRule) {
                            var disabledRuleAction = (sequencingRule.ruleAction == 'disabled') ? 'disabled' : 'unknown';
                            var results = sequencingRule.ruleCondition.map(function (ruleCondition) {
                                var result = false;
                                if (ruleCondition.condition == "attemptLimitExceeded") {
                                    if (+ruleCondition.limitConditions <= item.attemps) {
                                        result = true;
                                    }
                                }

                                if (ruleCondition.objective) {
                                    var objectiveState = solo.structure.objectiveIndex[ruleCondition.objective];
                                    if (ruleCondition.condition == "satisfied") {
                                        result = (ruleCondition.conditionOperator == 'not') ? !(objectiveState == ruleCondition.condition) : (objectiveState == ruleCondition.condition);
                                    } else if (ruleCondition.condition == "objectiveStatusKnown") {
                                        result = (ruleCondition.conditionOperator == 'not') ? false : true;
                                    }
                                }

                                return result;
                            })
                            if (sequencingRule.conditionCombination == 'and') {
                                if (results.indexOf(false) == -1) {
                                    if (disabledRuleAction == 'disabled') {
                                        item.disabled = true;
                                    }
                                } else {
                                    item.disabled = false;
                                }
                            } else {
                                if (results.indexOf(true) > -1) {
                                    if (disabledRuleAction == 'disabled') {
                                        item.disabled = true;
                                    }
                                } else {
                                    item.disabled = false;
                                }
                            }
                        })
                    }

                    if (item.sequence && item.sequence.rollupRules && item.sequence.rollupRules.length) {
                        completion_status = 'incomplete';
                        item.sequence.rollupRules.forEach(function (rollupRule) {
                            
                            if (completion_status == 'complete') {
                                return;
                            }
                            
                            var childsConditionEqState = [];
                            rollupRule.ids.forEach(function (id) {
                                var childState = rtsAPI.getValueForItemById('cmi.completion_status', id);
                                var finalChildState;
                                if (rollupRule.rollupConditions.conditionCombination == 'all') {
                                    finalChildState = true;
                                    rollupRule.rollupConditions.rollupCondition.forEach(function (condition) {
                                        if (!finalChildState)
                                            return;
                                        finalChildState = (childState == condition);
                                    })
                                }
                                if (rollupRule.rollupConditions.conditionCombination == 'any') {
                                    finalChildState = false;
                                    rollupRule.rollupConditions.rollupCondition.forEach(function (condition) {
                                        if (finalChildState)
                                            return;
                                        finalChildState = (childState == condition);
                                    })
                                }
                                if (finalChildState) {
                                    childsConditionEqState.push(id)
                                }
                                //(childState == rollupRule.rollupCondition) ? childsConditionEqState.push(id) : '';
                            });
                            if (rollupRule.childActivitySet == 'all' && rollupRule.ids.length == childsConditionEqState.length) {
                                completion_status = rollupRule.rollupAction;
                            }
                            if (completion_status == 'complete') {
                                return;
                            }
                            if (rollupRule.childActivitySet == 'any' && childsConditionEqState.length > 0) {
                                completion_status = rollupRule.rollupAction;
                            }
                        })

                        if (completion_status == 'completed') {
                            item.completed = 'completed';
                            rtsAPI.setValueForItemById('cmi.completion_status', 'completed', item.id);
                        }
                    }
                }

                for (var key in solo.structure.itemIndex) {
                    changeItem(solo.structure.itemIndex[key]);
                }
                //changeItem(solo.structure.tree[0]);
                //recurse(solo.structure.tree[0]);
            })
            
            solo.on('iframe.ready', function (descriptor, iframe) {
                
                var iframeSolo = iframe && iframe.window && iframe.window.Cortona3DSolo;
                if (iframeSolo) {
                    iframeSolo.on('uniview.doc.allSlidesPassed', iframeEvents_allSlidesPassed)
                }

                if (!rtsAPI.get('c3d.hasQuestions')) {
                    rtsAPI.set("cmi.completion_status", "completed");
                    rtsAPI.set("cmi.success_status", "passed");
                    solo.dispatch('structure.navigate.update');
                }
            })

            function iframeEvents_allSlidesPassed() {
                solo.dispatch('structure.navigate.update');
            }

            function removeAllIframeEvents(iframe) {
                var iframeSolo = iframe && iframe.window && iframe.window.Cortona3DSolo;
                if (iframeSolo) {
                    iframeSolo.removeListener('uniview.doc.allSlidesPassed', iframeEvents_allSlidesPassed);
                }
            }
            
            rtsAPI.initialize();
            rtsAPI.set("cmi.completion_status", "incomplete");
            rtsAPI.set("cmi.success_status", "unknown");
            rtsAPI.set("cmi.scaled_passing_score", "0.75");

            solo.structure = {
                'rtsAPI': rtsAPI
            }
        }
        
        var baseFileName = solo.uniview.ixml.json.$text('SimulationInteractivity/SimulationInformation/XMLFileName');
        var structureFileUri = encodeURI(baseFileName + '.structure.xml');
        
        var doc = solo.uniview.doc,
            src = doc.bundleURL ? solo.app.util.createResourceURL(structureFileUri) : solo.app.util.toUrl(structureFileUri, doc.baseURL);
        
        return solo.app.loadCompanionFile(src)
            .then(function (data) {
                try {
                    if (data.interactivity.json.structure.$attr('format') && (data.interactivity.json.structure.$attr('format') == 'map')) {
                        //do nothing
                    } else {
                        initSCORMApi(solo);
                    }
                } catch (e) {}
                return data;
            })
            .then(function (data) {
                return skin.use(require('uniview-structure'), solo.expand({
                    panel: solo.expand({
                        structure: options.panel.aux,
                        iframe: options.panel.main,
                    }, options.panel),
                    structureUrl: src,
                    structure: data
                }, options));
        });
        
    };
});