/**
 * :issue (!)
 */
define(function (require, exports, module) {
    require('css!./procedure-s1000d.css');

    module.exports = function (skin, options, solo) {
        var lang = solo.uniview.metadata.LANG || 'en';

        var cssName = "s1000d_" + options.issue.replace(/\./g, '_') + ".css";
        solo.app.util.requirePromise("css!static/i18n/" + lang + "/" + cssName)
            .catch(function () {
                return solo.app.util.requirePromise("css!static/i18n/en/" + cssName);
            });

        solo.on('app.procedure.didEnterSubstepWithName', options.univiewDocActivate || function (substepid) {
            var idStep = solo.app.procedure.getContextItemId(substepid),
                idSubstep = solo.app.procedure.getActiveItemId(substepid);
            solo.dispatch('uniview.doc.activate', idStep, idSubstep);
        });

        solo.on('uniview.doc.didLoadComplete', function () {

            var opt = options.components || {},

                uiDocumentFilter = opt.uiDocumentFilter || require('components/rococo/solo-skin-document-filter'),
                uiDocumentToolbar = opt.uiDocumentToolbar || require('components/rococo/solo-skin-toolbar-document'),
                uiDocumentQuestionToolbar = opt.uiDocumentQuestionToolbar || require('components/rococo/solo-skin-toolbar-document-question'),

                uiScoTabs = require('components/rococo/solo-skin-sco-tabs'),
                uiQuestionPreview = require('components/rococo/solo-skin-question-preview'),
                uiQuestionSCORM = require('components/rococo/solo-skin-question-scorm'),
                uiQuestionsAlertModal = opt.uiQuestionsAlertModal || require('components/rococo/solo-skin-question-alert-modal');

            var doc = solo.skin.get('doc') || solo.skin.get('aux');

            var hasQuestions,
                hasSCO;
            //test questions
            if (doc.element.querySelector('.assessmentQuestion'))
                hasQuestions = true;
            if (doc.element.querySelector('.scoContent'))
                hasSCO = true;
            var scormMode = (location.search.indexOf('mode=scorm') !== -1 || options.scormMode) ? true : false;

            if (hasSCO) {
                doc.render(uiScoTabs, options);
                if (!hasQuestions) {
                    doc.render(uiDocumentToolbar, options);
                }

                solo.on('uniview.sco.allTabsLoaded', function () {
                    if (hasQuestions) {

                        doc.render([{
                            component: uiDocumentQuestionToolbar
                        }]);

                        skin.create(uiQuestionPreview, options);
                        skin.create(uiQuestionSCORM, options);

                        solo.dispatch('uniview.component.tabs.activateByNumber', 0);
                        //scoTabs.activate(0);
                    }
                });
            }

            if (!hasSCO && hasQuestions) {
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

            if (hasQuestions && (hasSCO || scormMode)) {
                var modalAlert = skin.create(uiQuestionsAlertModal);
                doc.render([{
                    component: modalAlert
                }]);
            }

            if (!hasQuestions && !hasSCO) {

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

            doc.element.querySelectorAll('.footnote').forEach(function (footnote) {
                footnote.removeAttribute('title');
            });

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

                //hide identAndStatusSection
                var identAndStatusSection = doc.element.querySelector('.identAndStatusSection');
                if (identAndStatusSection) {
                    identAndStatusSection.style.display = 'none';
                }
            }

            if (scormMode && hasQuestions) {
                solo.uniview.css.render({
                    '.doc-container .dmodule:after': {
                        content: '""'
                    }
                });
            }

            doc.use(require('./s1000d-resolve-link'), solo.expand(options, {
                linkSelector: 'a.dmRef'
            }));

            var links = Array.prototype.slice.call(doc.element.querySelectorAll('.link[data-actuate="onLoad"]')),
                actuateLinkOnLoad = links.find(function (link) {
                    return link.dataset.show === 'other';
                });
            if (actuateLinkOnLoad) {
                actuateLinkOnLoad.click();
            }
            actuateLinkOnLoad = links.find(function (link) {
                return link.dataset.show !== 'other';
            });
            if (actuateLinkOnLoad) {
                actuateLinkOnLoad.click();
            }
        });

        var m_mainFigure = solo.uniview.with3D;

        function checkMainFigure() {
            if (!m_mainFigure) {
                m_mainFigure = true;
                solo.uniview.css.render({
                    '.main-content.panel': {
                        flexBasis: 'auto'
                    },
                    '.main-secondary.panel': {
                        flexBasis: 'auto'
                    }
                });
            }
        }

        solo.on('uniview.link2d', checkMainFigure);
        solo.on('uniview.linkMedia', checkMainFigure);

        if (!m_mainFigure) {
            solo.uniview.css.render({
                '.main-content.panel': {
                    flexBasis: '10%'
                },
                '.main-secondary.panel': {
                    flexBasis: '90%'
                }
            });
        }

        solo.on('uniview.secondaryFigure', function () {
            if (m_mainFigure) {
                document.querySelector('.main-content.panel').style.flexBasis = '';
                document.querySelector('.main-secondary.panel').style.flexBasis = '';
            }
        });

        if (options.link3DObjectWithHotspot && solo.uniview.with3D && solo.app.procedure) {
            skin.create(require('./link-3d-object-with-hotspot'));
        } else {
            skin.create(require('./links-from-2d-objects'));
        }

        return skin
            .use(require('uniview-procedure-with-document'), solo.expand({
                handlers: {
                    toggleStatus: function () {
                        var n = this.getElementsByClassName('dmStatus');
                        if (n.length) {
                            n[0].style.display = (n[0].style.display !== 'block') ? 'block' : 'none';
                        }
                    }
                },
                willSkipAlert: function (eventInfo) {
                    var el = document.getElementById(eventInfo.description);
                    if (!el) {
                        console.error('Element with ID "' + eventInfo.description + '" not found in document.');
                    }
                    return !el || (eventInfo.eventType === 'NOTE');
                },
                components: {
                    uiSecondaryFigurePanel: require('components/rococo/solo-skin-secondary-figure-panel'),
                    uiDocumentToolbar: function () { },
                    uiDocumentFilter: function () { }
                }
            }, options));
    };
});