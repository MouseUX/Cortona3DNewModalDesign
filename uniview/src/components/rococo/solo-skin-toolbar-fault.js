/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop filterComponent {UISkinComponent}
 */
define(function (require, exports, module) {

    require('css!./solo-skin-toolbar-fault.css');

    module.exports = function (skin, options, solo) {

        var i18nFault = solo.uniview.i18n['solo-skin-toolbar-fault'] || {};

        var ensureVisible = require('lib/ensure-visible');
        var docContainer = document.querySelector('.doc-container');

        var LINK_ANSWERS_CLASSES = '.choiceLink, .yesAnswerLink, .noAnswerLink',
            STEPS_CLASSES = ['.isolationStep', '.isolationStepQAContainer', '.isolationProcedureEnd', '.closeRqmts'].join(', ');
            LINK_DEFAULT_CLASSES = '.dmRefNew'; //.dmRef

        var showByStepsButton = skin.button({
            title: i18nFault.UI_BTN_SHOW_BY_STEPS_TITLE,
            onclick: function () {
                solo.dispatch('uniview.changeShowByStepsState');
            }
        }, i18nFault.UI_BTN_SHOW_BY_STEPS);

        var backButton = skin.button({
            title: i18nFault.UI_BTN_BACK,
            disabled: true,
            onclick: function () {
                solo.dispatch('uniview.activatePreviousFaultStep');
            }
        }, i18nFault.UI_BTN_BACK);

        backButton.style.display = 'none';

        var s1000dFault = {
            showByStepsState: false,
            activeStepId: undefined,
            activeStepNode: undefined,
            chain: [],

            activateStep: function (args) {

                var $step;

                if (args.id) {
                    $step = document.getElementById(args.id);
                }

                if (args.node) {
                    $step = args.node;
                }

                if (!$step) {
                    return;
                }

                docContainer.querySelectorAll('.activeFaultStep').forEach(function (el) {
                    el.classList.remove('activeFaultStep');
                })
                docContainer.querySelectorAll(LINK_ANSWERS_CLASSES).forEach(function (el) {
                    el.classList.add('disabled')
                })
                docContainer.querySelectorAll(LINK_DEFAULT_CLASSES).forEach(function (el) {
                    el.classList.add('disabled')
                })

                //$step.classList.add('activeFaultStep');
                $step.parentNode.classList.add('activeFaultStep');
                
                this.activeStepId = $step.id;
                this.activeStepNode = $step;
                //nextButton.disabled = false;

                ensureVisible($step);

                if ($step.classList.contains('isolationStepQAContainer')) {
                    //nextButton.disabled = true;
                    $step.querySelectorAll(LINK_ANSWERS_CLASSES).forEach(function (el) {
                        el.classList.remove('disabled');
                    })
                }

                if ($step.classList.contains('closeRqmts')) {
                    //nextButton.disabled = true;
                }

                $step.querySelectorAll(LINK_DEFAULT_CLASSES).forEach(function (el) {
                    el.classList.remove('disabled');
                })

                this.chain.push($step);
                backButton.style.display = '';
                if (this.chain.length > 1) {
                    backButton.disabled = false;
                }

            },

            activateStepNextStep: function () {

                if (this.activeStepNode.classList.contains('isolationProcedureEnd')) {
                    var $closeRqmts = docContainer.querySelector('.closeRqmts');
                    this.activateStep({ node: $closeRqmts });
                    return;
                }

                var nextSibling = this.activeStepNode.parentNode.nextSibling;
                while (nextSibling) {
                    if (nextSibling.nodeType == Node.ELEMENT_NODE && nextSibling.classList.contains('faultStep')){
                        break;
                    }
                    nextSibling = nextSibling.nextSibling;
                }

                var stepNode = nextSibling && nextSibling.querySelector(STEPS_CLASSES);
                this.activateStep({ node: stepNode })
            },

            switchShowByStepsState: function () {

                this.showByStepsState = !this.showByStepsState;

                function clickAnswer(e) {
                    if (s1000dFault.showByStepsState) {
                        e.preventDefault();
                        var href = e.target.getAttribute('href');
                        var tragetId = href && href.slice(1);
                        s1000dFault.activateStep({ id: tragetId });
                        return;
                    }
                }

                if (!this.showByStepsState) {
                    
                    this.activeStepId = undefined;
                    this.activeStepNode = undefined;
                    docContainer.querySelectorAll('.activeFaultStep').forEach(function (el) {
                        el.classList.remove('activeFaultStep');
                    })
                    docContainer.querySelectorAll(LINK_ANSWERS_CLASSES).forEach(function (el) {
                        el.classList.remove('disabled');
                        el.removeEventListener('click', clickAnswer);
                    })
                    docContainer.querySelectorAll(LINK_DEFAULT_CLASSES).forEach(function (el) {
                        el.classList.remove('disabled')
                    })
                    docContainer.querySelectorAll('.controls').forEach(function (el) {
                        el.remove();
                    })

                    showByStepsButton.classList.remove('checked');

                    docContainer.querySelectorAll('.faultStep').forEach(function (el) {
                        var $step = el.querySelector(STEPS_CLASSES);
                        el.parentNode.replaceChild($step, el);
                        el.remove();
                    })

                    this.chain = [];
                    backButton.style.display = 'none';

                    return;
                }

                var steps = document.querySelectorAll(STEPS_CLASSES);
                
                docContainer.querySelectorAll(LINK_ANSWERS_CLASSES).forEach(function (el) {
                    el.classList.add('disabled');
                    el.addEventListener('click', clickAnswer);
                })
                docContainer.querySelectorAll(LINK_DEFAULT_CLASSES).forEach(function (el) {
                    el.classList.add('disabled')
                })
                
                steps.forEach(function ($step) {

                    var nextButton;
                    
                    if ($step.classList.contains('closeRqmts')) {
                        nextButton = skin.button({
                            title: i18nFault.UI_BTN_FINISH_TITLE,
                            onclick: function () {
                                solo.dispatch('uniview.changeShowByStepsState');
                            }
                        }, i18nFault.UI_BTN_FINISH);
                    } else if ($step.classList.contains('isolationStepQAContainer')) {
                        /*nextButton = skin.button({
                            title: i18nFault.UI_BTN_ANSWER_TITLE,
                            disabled: true,
                            onclick: function () {
                                solo.dispatch('uniview.showNextFaultStep');
                            }
                        }, i18nFault.UI_BTN_ANSWER);*/
                    } else {
                        nextButton = skin.button({
                            title: i18nFault.UI_BTN_NEXT_TITLE,
                            onclick: function () {
                                solo.dispatch('uniview.showNextFaultStep');
                            }
                        }, i18nFault.UI_BTN_NEXT);
                    }

                    var $stepContainer = skin.create('.faultStep');
                    $step.parentNode.replaceChild($stepContainer, $step);
                    $stepContainer.append($step);
                    
                    if (nextButton) {
                        var $btnContainer = skin.create('.controls');
                        $btnContainer.append(nextButton);
                        $stepContainer.append($btnContainer);
                    }
                })

                showByStepsButton.classList.add('checked');

                var firstID = steps[0] && steps[0].id;
                if (firstID) {
                    solo.dispatch('uniview.showNextFaultStep', firstID);
                }
            },

            activatePreviousStep: function () {
                this.chain.pop();
                var $step = this.chain.pop();
                if (!$step) {
                    return;
                }

                this.activateStep({ node: $step });
                if (this.chain.length < 2) {
                    backButton.disabled = true;
                }
            }
        }

        solo.on('uniview.showNextFaultStep', function (nextId) {
            if (nextId) {
                s1000dFault.activateStep({ id: nextId });
            } else {
                s1000dFault.activateStepNextStep();
            }
        })

        solo.on('uniview.changeShowByStepsState', function () {
            s1000dFault.switchShowByStepsState();
        })

        solo.on('uniview.activatePreviousFaultStep', function () {
            s1000dFault.activatePreviousStep();
        })

        var container = skin.create();
        container.append(backButton, showByStepsButton);
        
        return container;
    };
});