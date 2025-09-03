define(function (require, exports, module) {

    require('css!./rwi_step.css');

    module.exports = function (skin, options, solo) {

        var ensureVisible = require('lib/ensure-visible'),
            ixml = solo.uniview.ixml;

        function getActionsForProcedureItem(id) {
            var info = ixml.getProcedureItemInfo(id);
            if (info.type === 'action') {
                return info.id;
            }
            return (info.children || []).reduce(function (a, child) {
                return a.concat(getActionsForProcedureItem(child));
            }, (info.actions || []).map(getActionsForProcedureItem));
        }

        var processTaskContent = skin.create(require('components/rococo/solo-skin-rwi-task')).processTaskContent;

        var uiRwiTabDocument = function (skin, options, solo) {
            require('css!components/rococo/solo-skin-rwi-tab-document.css');

            var ixml = solo.uniview.ixml;

            var element = skin.div('.job.document');

            var root = solo.rwi.interactivity.json,
                rwi = root.$('rwi').slice(-1)[0];

            solo.on('app.procedure.didEnterSubstepWithName', function (id) {
                var actionInfo = ixml.getProcedureItemInfo(id),
                    stepId = actionInfo.parent;

                element.querySelectorAll('.active').forEach(function (node) {
                    node.classList.remove('active');
                });
                var dt = element.querySelector('.content[data-id="' + stepId + '"]'),
                    dl;
                if (dt) {
                    dt.classList.add('active');

                    dl = dt.parentNode.parentNode;
                    ensureVisible(dl);
                }
            });

            solo.on('rwi.didChangeJobMode', function (jobMode) {
                if (jobMode) {
                    element.querySelectorAll('.signed').forEach(function (node) {
                        node.classList.remove('signed');
                    });
                    element.querySelectorAll('.inspected').forEach(function (node) {
                        node.classList.remove('inspected');
                    });
                }
            });

            solo.on('rwi.didSignOff', function () {
                var dt = element.querySelector('.active');
                if (dt) {
                    var dl = dt.parentNode.parentNode;
                    dl.classList.add('signed');
                    dl.dataset.signed = new Date().toLocaleString();
                    solo.dispatch('rwi.nextStep');
                }
            });


            function docTaskContent(task, index) {
                var id = task.$attr('id');
                return !task.step ? docStepContent(task, index) : {
                    id: id,
                    content: [!solo.uniview.options.AutoNumbering ? '' : skin.div('.task-number', '' + (index + 1)),
                        skin.div('.task', (task['@children'] || []).filter(function (item) {
                            return item['@name'] !== 'step';
                        }).map(processTaskContent))
                    ],
                    onclick: function (event) {
                        if (!solo.rwi.jobMode) {
                            solo.dispatch('uniview.showAllPanels');
                            solo.app.procedure.toggleDrawingDisplayMode(false);
                            solo.app.procedure.seekToSubstep(id);
                            solo.app.procedure.play();
                        }
                    },
                    onmouseover: function (event) {},
                    onmouseout: function (event) {},
                    children: task.$('step').map(docTaskContent)
                };
            }

            function docStepContent(task, index) {
                var id = task.$attr('id');
                return {
                    id: id,
                    content: [!solo.uniview.options.AutoNumbering ? '' : skin.div('.task-number', '' + (index + 1)),
                        skin.div('.step', (task['@children'] || []).map(processTaskContent))
                    ],
                    onclick: function (event) {
                        if (!solo.rwi.jobMode) {
                            solo.dispatch('uniview.showAllPanels');
                            solo.app.procedure.toggleDrawingDisplayMode(false);
                            solo.app.procedure.seekToSubstep(id);
                            solo.app.procedure.play();
                        }
                    },
                    onmouseover: function (event) {},
                    onmouseout: function (event) {}
                };
            }

            element.append(skin.create(require('components/tree'), {
                items: rwi.$('job/task').map(docTaskContent)
            }).$el);

            element.querySelectorAll('.skin-tree-item-leaf').forEach(function (dl) {
                if (solo.uniview.options.DocumentStyle == 1) {
                    dl.classList.add('collapsed');
                }
                dl.insertBefore(skin.create('.skin-tree-item-button', {
                    onmousedown: function (e) {
                        e.stopPropagation();
                    },
                    onclick: function (e) {
                        dl.classList.toggle('collapsed');
                    }
                }), dl.firstChild);
            });

            return this.exports(element);
        };

        var uiRwiFigure = function (skin, options, solo) {
            var ixml = solo.uniview.ixml;

            function getOperations(node) {
                if (!node.step) return node.$attr('id');
                return node.$('step').reduce(function (a, step) {
                    return a.concat(getOperations(step));
                }, []);
            }

            var rwiRoot = solo.rwi.interactivity.json.rwi.slice(-1)[0],
                steps = rwiRoot.$('job/task').reduce(function (a, task) {
                    return a.concat(getOperations(task));
                }, []),
                currentStepIndex;

            solo.on('procedure.didObjectEnter', function (docId) {
                solo.core.canvas.parentNode.title = ixml.getDocItemInfo(docId).screentip || '';
                solo.app.procedure.hoverItem(docId, true);
            });

            solo.on('procedure.didObjectOut', function (docId) {
                solo.core.canvas.parentNode.title = '';
                solo.app.procedure.hoverItem(docId, false);
            });

            solo.on('rwi.didChangeJobMode', function (jobMode) {
                if (jobMode) {
                    solo.dispatch('uniview.showAllPanels');
                    solo.app.procedure.toggleDrawingDisplayMode(false);
                    solo.app.procedure.stop();
                }
                if (!jobMode) {
                    solo.uniview.settings.Locked = false;
                    solo.app.procedure.stop();
                } else {
                    currentStepIndex = -1;
                    solo.dispatch('rwi.nextStep');
                }
            });

            solo.on('uniview.settings.enablePMI', function (enabled) {
                solo.rwi.togglePMI(enabled);
            });

            solo.on('rwi.nextStep', function () {
                if (++currentStepIndex >= steps.length) {
                    solo.dispatch('rwi.didJobComplete');
                } else {
                    var actions = getActionsForProcedureItem(steps[currentStepIndex]);
                    solo.uniview.settings.Locked = false;
                    solo.uniview.settings.Locked = {
                        start: actions[0],
                        end: actions[actions.length - 1]
                    };
                    solo.dispatch('uniview.activateRwiTab', 3); // instructions
                    solo.app.procedure.seekToSubstep(steps[currentStepIndex]);
                    if (options.StartAfterNavigate) {
                        solo.app.procedure.play();
                    }
                }
            });

        };

        var uiRwiTabInstructions = function (skin, options, solo) {
            require('css!components/rococo/solo-skin-rwi-tab-instructions.css');

            var ixml = solo.uniview.ixml,
                i18n = solo.uniview.i18n['solo-skin-rwi-tab-instructions'] || {};

            var meta = solo.uniview.metadata,
                root = solo.rwi.interactivity.json,
                rwi = root.$('rwi').slice(-1)[0];

            var element = skin.container('.instructions');

            function docStepContent(task) {
                var id = task.$attr('id');
                return {
                    id: id,
                    content: [
                        skin.div('.step', (task['@children'] || []).map(processTaskContent))
                    ]
                };
            }

            solo.on('app.procedure.didEnterSubstepWithName', function (id) {
                var actionInfo = ixml.getProcedureItemInfo(id),
                    task = rwi.$('job/task').concat(rwi.$('job//step')).filter(function (task) {
                        return task.$attr('id') === actionInfo.parent && !task.step;
                    })[0];

                element.innerHTML = '';

                if (!task) return;

                var localBom = task.$('//xref')
                    .reduce(function (a, xref) {
                        var xrefid = xref.$attr('xrefid');
                        return (a.indexOf(xrefid) < 0) ? a.concat(xrefid) : a;
                    }, [])
                    .map(function (xrefid) {
                        return {
                            id: xrefid,
                            type: (solo.rwi.interactivity.getBomItemByDocId(xrefid) || {}).type,
                            children: []
                        };
                    }),
                    job = skin.div('.job');

                var uiRwiTabBom = require('components/rococo/solo-skin-rwi-tab-bom');

                job.append(skin.create(require('components/tree'), {
                    items: [docStepContent(task)]
                }).$el);

                element.append(
                    skin.div('.instructions-section',
                        skin.create('h3', {}, i18n.currentTask),
                        job
                    ),
                    skin.div('.instructions-section',
                        skin.create('h3', {}, i18n.requiredParts),
                        skin.create(uiRwiTabBom, {
                            bom: localBom,
                            filter: function (item) {
                                return item.type !== 'resource';
                            }
                        }).$el
                    ),
                    skin.div('.instructions-section',
                        skin.create('h3', {}, i18n.requiredResources),
                        skin.create(uiRwiTabBom, {
                            bom: localBom,
                            filter: function (item) {
                                return item.type === 'resource';
                            }
                        }).$el
                    )
                );
            });

            return this.exports(element);
        };

        return skin
            .use(require('uniview-procedure-work-instruction'), solo.expand({
                disableRwiLogButton: true,
                components: {
                    uiRwiTabDocument: uiRwiTabDocument,
                    uiRwiTabInstructions: uiRwiTabInstructions,
                    uiRwiFigure: uiRwiFigure,
                    uiRwiDocumentInput: function () {}
                }
            }, options));
    };
});