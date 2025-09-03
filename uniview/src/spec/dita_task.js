/**
 * =@app.procedure.didEnterSubstepWithName
 */
define(function (require, exports, module) {
    require('css!./dita/ditabase.css');
    require('css!./dita_task.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml;

        if (!options.skipDitaLocaleCss) {
            solo.on('uniview.doc.didLoadComplete', function (element) {
                var documentElement = element.querySelector('*[data-class~="topic/topic"][data-lang]');
                var lang = ((documentElement && documentElement.dataset.lang) || solo.uniview.options.SpecLang || 'en').split('-')[0];
                solo.app.util.requirePromise("css!static/i18n/" + lang + "/dita.css")
                    .catch(function () {
                        return solo.app.util.requirePromise("css!static/i18n/en/dita.css");
                    })
                    .catch(console.error.bind(console));
                solo.app.util.requirePromise("css!static/i18n/" + lang + "/dita_notes.css")
                    .catch(function () {
                        return solo.app.util.requirePromise("css!static/i18n/en/dita_notes.css");
                    })
                    .catch(console.error.bind(console));
            });
        }

        solo.on('app.procedure.didEnterSubstepWithName', options.univiewDocActivate || function (substepid) {
            var topic = document.querySelector('.doc-container [data-class~="topic/topic"]'),
                topic_id = topic ? topic.id : ixml.getProcedureId(),
                idStep = topic_id + '__' + solo.app.procedure.getContextItemId(substepid),
                idSubstep = topic_id + '__' + solo.app.procedure.getActiveItemId(substepid);
            solo.dispatch('uniview.doc.activate', idStep, idSubstep);
        });

        solo.on('app.procedure.didChangePlayableItemList', function (duration, items) {
            var topic = document.querySelector('.doc-container [data-class~="topic/topic"]'),
                topic_id = topic ? topic.id : ixml.getProcedureId();

            solo.uniview.css.render({
                '.hidden-step': {
                    display: 'none'
                }
            });

            document.querySelectorAll('.doc-container [data-class~="task/step"]').forEach(function (n) {
                var stepid = n.id.substring(n.id.lastIndexOf('__') + 2);
                if (items) {
                    if (items.indexOf(stepid) < 0) {
                        n.classList.add('hidden-step');
                    } else {
                        n.classList.remove('hidden-step');
                    }
                } else {
                    n.classList.remove('hidden-step');
                }
            });

            document.querySelectorAll('*[data-key="' + ixml.getProcedureId() + '"]').forEach(function (n) {
                n.classList.add('link3d-procedure');
            });

            document.querySelectorAll('.link3d-procedure').forEach(function (n) {
                n.dataset.key = (items && items.length) ? items[0] : ixml.getProcedureId();
            });

        });

        solo.on('uniview.doc.didLoadComplete', function () {

            var opt = options.components || {},

                uiDocumentFilter = opt.uiDocumentFilter || require('components/rococo/solo-skin-document-filter'),
                uiDocumentToolbar = opt.uiDocumentToolbar || require('components/rococo/solo-skin-toolbar-document'),
                uiDocumentQuestionToolbar = opt.uiDocumentQuestionToolbar || require('components/rococo/solo-skin-toolbar-document-question'),

                uiQuestionPreview = require('components/rococo/solo-skin-question-preview'),
                uiQuestionSCORM = require('components/rococo/solo-skin-question-scorm'),
                uiQuestionsAlertModal = opt.uiQuestionsAlertModal || require('components/rococo/solo-skin-question-alert-modal');

            var doc = solo.skin.get('doc') || solo.skin.get('aux');

            var hasQuestions;
            //test questions
            if (doc.element.querySelector('.assessmentQuestion'))
                hasQuestions = true;
            var scormMode = (location.search.indexOf('mode=scorm') !== -1 || options.scormMode) ? true : false;

            if (hasQuestions) {
                if (scormMode) {
                    doc.render([{
                        component: uiDocumentQuestionToolbar
                    }]);
                    skin.create(uiQuestionPreview, options);
                    skin.create(uiQuestionSCORM, options);
                } else {
                    doc.render([{
                        component: uiDocumentToolbar
                    }]);
                    skin.create(uiQuestionPreview, options);
                }
            }

            if (hasQuestions && scormMode) {
                var modalAlert = skin.create(uiQuestionsAlertModal);
                doc.render([{
                    component: modalAlert
                }]);
            }

            if (!hasQuestions) {

                var documentFilter = doc.create(uiDocumentFilter, options);

                doc.render([
                    documentFilter,
                    {
                        component: uiDocumentToolbar,
                        options: {
                            filterComponent: documentFilter
                        }
                    }
                ], options);

                if (solo.uniview.with3D) {
                    solo.dispatch('uniview.showAllPanels');
                }
            }

            if (scormMode) {

                console.log("*** SCORM mode switch ON ***");

                solo.training = {
                    sco: require('addons/training/sco'),
                    hasQuestions: (hasQuestions) ? true : false
                }

                solo.training.sco.loadPageExpand();

                if (window.parent && window.parent.Cortona3DSolo && window.parent.API_1484_11) {
                    window.parent.Cortona3DSolo.structure.rtsAPI.set('c3d.hasQuestions', (hasQuestions) ? true : false);
                }

                window.addEventListener('beforeunload', function () {
                    solo.training.sco.unloadPageExpand();
                });

            }
        });

        solo.on('uniview.doc.didLoadComplete', function (element) {
            var prc = element.querySelector('.Procedure'),
                topic = document.querySelector('.doc-container [data-class~="topic/topic"]'),
                topic_id = topic ? topic.id : ixml.getProcedureId();
            if (prc && !prc.id) {
                prc.id = topic_id + '__'  + topic_id;
            }
        });

        return skin.use(require('uniview-procedure-with-document'), solo.expand({
            handlers: {
                open: function () { }
            },
            willReturnAlertBody: function (eventInfo) {
                var topic = document.querySelector('.doc-container [data-class~="topic/topic"]'),
                    topic_id = topic ? topic.id : ixml.getProcedureId(),
                    el = document.getElementById(topic_id + '__' + eventInfo.description);
                return el && el.cloneNode(true);
            },
            willSkipAlert: function (eventInfo) {
                var topic = document.querySelector('.doc-container [data-class~="topic/topic"]'),
                    topic_id = topic ? topic.id : ixml.getProcedureId(),
                    el = document.getElementById(topic_id + '__' + eventInfo.description);
                if (!el) {
                    console.error('Element with ID "' + topic_id + '__' + eventInfo.description + '" not found in document.');
                }
                return !el;
            },
            willReturnAlertTitle: function (eventInfo) {
                var topic = document.querySelector('.doc-container [data-class~="topic/topic"]'),
                    topic_id = topic ? topic.id : ixml.getProcedureId(),
                    el = document.getElementById(topic_id + '__' + eventInfo.description),
                    type, 
                    othertype = '';

                    if (el) {
                        type = el.dataset.type;
                        if (type === 'other') {
                            othertype = el.dataset.othertype;
                        }
                    }
                    if (!type) {
                        type = eventInfo.eventType.toLowerCase();
                    }

                return [
                    skin.create('span.default-title', eventInfo.eventType), 
                    skin.create('span.' + type + '-title', othertype)
                ];
            },
            components: {
                uiDocumentToolbar: function () { },
                uiDocumentFilter: function () { }
            }
        }, options));
    };
});