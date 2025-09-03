/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-tab-document.css');

    var ensureVisible = require('lib/ensure-visible');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['procedure-work-instructions'] || {};

        var element = skin.div('.job.document');

        var root = solo.rwi.interactivity.json,
            rwi = root.$('rwi').slice(-1)[0],
            m_completed = false;

        solo.on('rwi.didTaskActive', function (stepId, task) {
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

            if (solo.rwi.activeTask !== task) {
                if (task.inspect) {
                    setTimeout(function () {
                        if (solo.app.procedure.played) {
                            solo.dispatch('app.procedure.didFireEvent', -1, '', i18n.inspect, i18n.inspectMessage);
                            solo.once('uniview.didDismissModal', function () {
                                if (dl && solo.rwi.jobMode) {
                                    dl.classList.add('inspected');
                                    dl.dataset.inspected = i18n.inspected + ' ' + new Date().toLocaleString();
                                }
                            });
                        }
                    }, 0);
                }
            }

        });

        solo.on('rwi.didSignOff', function () {
            var dt = element.querySelector('.active');
            if (dt) {
                var dl = dt.parentNode.parentNode;
                dl.classList.add('signed');
                dl.dataset.signed = new Date().toLocaleString();
                if ((element.querySelectorAll('.skin-tree-item').length - element.querySelectorAll('.skin-tree-item.hidden-step').length) === element.querySelectorAll('.signed').length) {
                    solo.dispatch('rwi.didJobComplete');
                    solo.app.procedure.stop();
                } else {
                    solo.dispatch('uniview.activateRwiTab', 3); // instructions
                    setTimeout(function () {
                        solo.app.procedure.forward();
                        if (options.StartAfterNavigate) {
                            solo.app.procedure.play();
                        }
                    }, 0);
                }
            }
        });

        solo.on('rwi.didJobComplete', function () {
            m_completed = true;
        });

        solo.on('rwi.didResetJob', function () {
            m_completed = true;
        });

        solo.on('rwi.didChangeJobMode', function (jobMode) {
            if (jobMode && m_completed) {
                m_completed = false;
                element.querySelectorAll('.signed').forEach(function (node) {
                    node.classList.remove('signed');
                });
                element.querySelectorAll('.inspected').forEach(function (node) {
                    node.classList.remove('inspected');
                });
            }
        });

        solo.on('rwi.didStepActive', function (stepId, task) {
            document.querySelectorAll('.rwi-doc-step.current').forEach(function (node) {
                node.classList.remove('current');
            });
            document.querySelectorAll('.rwi-doc-step#' + stepId).forEach(function (node) {
                node.classList.add('current');
                ensureVisible(node);
            });
        });

        var processTaskContent = skin.create(require('./solo-skin-rwi-task')).processTaskContent;

        function docTaskContent(task, index) {
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
                        if (options.StartAfterNavigate !== false) {
                            solo.app.procedure.play();
                        }
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
});