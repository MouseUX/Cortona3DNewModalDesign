/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-tab-document.css');

    var ensureVisible = require('lib/ensure-visible');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;
        var ixml = solo.uniview.ixml,
            json = solo.training.interactivity.json,
            doc = solo.app.modelInfo || solo.uniview.doc || {};

        var docResolve = skin.create(require('components/doc-resolve'), solo.expand({
            disable3DLink: true
        }, options));

        var element = skin.div('.doc-container');

        docResolve.documentTemplateHtml()
            .then(function (syntax) {
                if (!solo.uniview.options.DisableTextSelection) {
                    solo.uniview.css.render({
                        ".skin-holder .doc-container": {
                            "user-select": "text",
                            "-moz-user-select": "text",
                            "-webkit-user-select": "text",
                            "-ms-user-select": "text"
                        }
                    });
                    window.addEventListener('mousedown', function (e) {
                        var Selection = window.getSelection();
                        Selection.removeAllRanges();
                    });
                }

                if (syntax) {
                    return skin.html(syntax);
                }
                // generic scenario document
                var scenarioElement = skin.div('.scenario-document'),
                    steps = skin.div('.steps');

                scenarioElement.append(
                    skin.create('.title', {}, json.$text('scenario/description')),
                    steps
                );

                json.$('scenario/steps/step').forEach(function (step) {
                    var text = step.$text('description');
                    var stepElement = skin.create('div.step', {
                        id: step.$attr('id')
                    }, text);

                    steps.append(stepElement);

                    step.$('//operation').forEach(function (operation) {
                        var text = operation.$text('description'),
                            alert = operation.$('alert')[0];
                        if (text) {
                            if (alert) {
                                var type = alert.$attr('type');
                                stepElement.append(
                                    skin.div('.operation.alert',
                                        skin.text('.alert-' + type, __("UI_ALERT_" + type.toUpperCase()), ': '),
                                        text
                                    )
                                );
                            } else {
                                stepElement.append(
                                    skin.div('.operation', text)
                                );
                            }
                        }
                    });
                });

                return [scenarioElement];
            })
            .then(function (docElements) {
                element.append.apply(element, docElements);
                docResolve.resolveImages(element);
                docResolve.resolveLinks(element);
                solo.dispatch('uniview.doc.didLoadComplete', element);
            });

        function resetActiveSteps() {
            Array.prototype.slice.call(element.querySelectorAll('.active'))
                .forEach(function (el) {
                    el.classList.remove('active');
                });
            resetActiveSubsteps();
        }

        function resetActiveSubsteps() {
            Array.prototype.slice.call(element.querySelectorAll('.active-substep'))
                .forEach(function (el) {
                    el.classList.remove('active-substep');
                });
        }

        solo.on('training.didCancelScenario', resetActiveSteps);
        solo.on('training.didFinishScenario', resetActiveSteps);
        solo.on('training.didFinishScenarioStep', resetActiveSteps);
        solo.on('training.didChangeExpectedOperations', resetActiveSubsteps);

        solo.on('training.didStartScenarioStep', function (step) {
            var el = document.getElementById(step.odfId);
            if (el) {
                el.classList.add('active');
                ensureVisible(el);
            }
        });

        solo.on('training.didScenarioOperations', function (operations, input) {
            operations
                .forEach(function (operation) {
                    if (operation.odfId) {
                        var el = document.getElementById(operation.odfId);
                        if (el) {
                            el.classList.add('active-substep');
                            ensureVisible(el);
                        }
                    }
                });
        });

        return this.exports(element);
    };
});