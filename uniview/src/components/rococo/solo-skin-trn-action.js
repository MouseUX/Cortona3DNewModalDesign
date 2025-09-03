/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-action.css');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;

        var element = skin.container('.action');

        function checkOperationConfirmStage() {
            return solo.training.expected.some(function (operation) {
                var activity = operation.activity;
                return (activity && activity._type == "Activity" && activity.isActive() && activity.objects.length > 0);
            });
        }

        function randomSort() {
            var random = Math.random();
            if (random < 0.333) return 1;
            if (random > 0.666) return -1;
            return 0;
        }

        if (!skin.radio) {
            skin.radio = function (options, items) {
                function radioChangeHandler(option) {
                    return function () {
                        var checked = this.parentNode.parentNode.querySelector('label.checked');
                        if (checked) {
                            checked.classList.remove('checked');
                        }
                        this.parentNode.classList.add('checked');
                        this.checked = true;
                        if (typeof options.onchange === 'function') {
                            options.onchange.call({
                                value: option.value || option.description
                            });
                        }
                    };
                }
                var ts = new Date().valueOf(),
                    el = skin.create('.skin-container.radio-container', items.map(function (option, index) {
                        var o = option;
                        if (typeof option === 'string') {
                            o = {
                                description: option
                            };
                        }
                        return skin.label('', skin.create('input', {
                            checked: (typeof option.selected === 'undefined') ? index === 0 : !!option.selected,
                            type: 'radio',
                            name: options.name || 'radio' + ts,
                            onchange: radioChangeHandler(o)
                        }), o.description);
                    }));
                return el;
            };
        }

        solo.on('training.showActHelp', function (text) {
            if (typeof text === 'undefined') throw new Error();
            skin.clear(element);
            element.append(
                skin.text('.action-help', skin.html(text))
            );
        });

        solo.on('training.buildActForms', function (state) {
            skin.clear(element);

            var locateObjectExamFlag = false,
                alert_activity = null,
                isOperationConfirmStage = checkOperationConfirmStage(),
                isExam = (solo.training.isExam()) || (solo.training.isStudy() && !state.options.enableDirectHints);

            solo.dispatch('training.willChangeActForms', solo.training.expected);

            solo.training.expected.forEach(function (operation, index) {
                var activity = operation.activity;
                if (!activity) return;

                solo.dispatch('training.didChangeActivity', activity);

                var isObjectActivity = (activity._type == "Activity" && activity.objects.length),
                    isSelectActivity = (activity._type == "Activity" && activity.lists.length),
                    isRequestActivity = (activity._type == "RequestVariable"),
                    isAlertActivity = (activity._type == "Alert"),
                    isStudyWithExpectedOperations = (state.options.enableDirectHints && solo.training.isStudy());

                if (isObjectActivity && !activity.isActive() && isExam && !isOperationConfirmStage) {
                    locateObjectExamFlag = true;
                }

                var container;

                if (activity.isActive() || (isStudyWithExpectedOperations && !isOperationConfirmStage)) {
                    if ((isObjectActivity || isSelectActivity) && !solo.training.isDemo()) {

                        if (activity.isActive()) {
                            var description = activity.description || operation.description || "<No description>";

                            element.append(
                                skin.text('.descr', description)
                            );

                            if (isSelectActivity) {
                                element.append(
                                    skin.text('.action-help', skin.html(__(isExam ? "MSG_OPTION_ACTIVITY_EXAM" : "MSG_OPTION_ACTIVITY_STUDY")))
                                );
                            }

                            element.append(
                                skin.text('.action-help', skin.html(__(isObjectActivity ? "MSG_ACTIVITY_CONFIRMATION_OBJECT" : "MSG_ACTIVITY_CONFIRMATION_NOOBJECT")))
                            );
                        } else if (isStudyWithExpectedOperations && !isOperationConfirmStage) {
                            element.append(
                                skin.text('.action-help', skin.html(__("MSG_OBJECT_ACTIVITY_STUDY"))),
                                skin.text('.descr', operation.description)
                            );
                        }

                        if (isObjectActivity && (isStudyWithExpectedOperations && !isOperationConfirmStage)) {
                            container = skin.container('.action-container.keep-together');

                            element.append(container);
                            container.append(
                                skin.text('',
                                    __((activity.objects.length < 2) ? "UI_TXT_SELECT" : ((activity.selectionType == 1) ? "UI_TXT_SELECT_ANY" : "UI_TXT_SELECT_ALL")),
                                    ":"
                                )
                            );

                            activity.objects.forEach(function (def, objIndex) {
                                var el = skin.create('a.linkbtn', {
                                        href: '#',
                                        title: __('UI_TXT_LOCATE_PART'),
                                        onclick: function () {
                                            solo.dispatch('training.didObjectLocate', def);
                                        },
                                        onmouseover: function () {
                                            solo.dispatch('training.didObjectHover', def);
                                        },
                                        onmouseout: function () {
                                            solo.dispatch('training.didObjectOut', def);
                                        }
                                    },
                                    solo.training.interactivity.getObjectName(def)
                                );
                                if (activity.selected[objIndex]) {
                                    el.classList.add('active');
                                }
                                container.append(el);
                            });
                        }

                        var param = {};

                        if (isSelectActivity && activity.isActive()) {
                            activity.lists.forEach(function (list) {
                                var items = [].concat(list.items);
                                if (!isStudyWithExpectedOperations) {
                                    items = items.sort(randomSort).sort(randomSort).sort(randomSort);
                                }
                                element.append(
                                    skin.label('.action-container',
                                        list.text,
                                        skin.radio({
                                            onchange: function () {
                                                param[list.text] = this.value;
                                            }
                                        }, items)
                                    )
                                );
                                param[list.text] = items[0];
                            });
                        }

                        element.append(
                            skin.container('.action-container', !activity.isActive() ? skin.container('.left') :
                                skin.container('.left',
                                    skin.button({
                                        title: __("UI_BTN_SUBMIT_TITLE"),
                                        onclick: function () {
                                            solo.dispatch('training.actionSubmit', index, param);
                                        },
                                    }, __("UI_BTN_SUBMIT")), !isObjectActivity ? '' :
                                    skin.button({
                                        title: __("UI_BTN_CANCEL_TITLE"),
                                        onclick: function () {
                                            solo.dispatch('training.actionCancel', index);
                                        },
                                    }, __("UI_BTN_CANCEL"))
                                ), !(isStudyWithExpectedOperations && !(isObjectActivity && activity.isActive())) ? skin.container('.right') :
                                skin.container('.right',
                                    skin.button({
                                        title: __("UI_BTN_SKIP_TITLE"),
                                        onclick: function () {
                                            solo.dispatch('training.actionSkip', index);
                                        },
                                    }, __("UI_BTN_SKIP")),
                                    skin.button({
                                        title: __("UI_BTN_LOCATION_TITLE"),
                                        disabled: !solo.training.expected[index].animation,
                                        onclick: function () {
                                            solo.dispatch('training.actionLocation', index);
                                        },
                                    }, __("UI_BTN_LOCATION"))
                                )
                            )
                        );

                        if (isObjectActivity) {
                            solo.dispatch('training.allowObjectInteraction', !activity.isActive());
                            //disableAllInput("div_vcr", true);
                        }

                    } else if (isRequestActivity) {
                        var varName = activity.name.replace(/^_/, ''),
                            varType = solo.training.variables[activity.name].type,
                            label = skin.label('.action-container', varName + (/:$/.test(varName) ? '' : ':')),
                            input;

                        switch (varType) {
                            case 'enumeration':
                                var items = solo.training.variables[activity.name].items;
                                input = skin.select({
                                    value: activity.value
                                }, items.map(function (item, i) {
                                    return {
                                        value: i,
                                        description: item
                                    };
                                }));
                                break;
                            case 'boolean':
                                input = skin.select({
                                    value: !!+activity.value ? 1 : 0
                                }, [{
                                    value: 0,
                                    description: __("UI_TXT_FALSE")
                                }, {
                                    value: 1,
                                    description: __("UI_TXT_TRUE")

                                }]);
                                break;
                            default:
                                input = skin.input({
                                    type: 'text',
                                    value: activity.value,
                                    size: 20
                                });
                        }

                        label.append(input);

                        element.append(
                            skin.text('.action-help', skin.html(__("MSG_PARAM_ACTIVITY"))),
                            skin.text('.descr', operation.description),
                            skin.text('.prompt', activity.prompt),
                            label,
                            skin.container('.action-container', !activity.isActive() ? skin.container('.left') :
                                skin.container('.left',
                                    skin.button({
                                        title: __("UI_BTN_SUBMIT_PARA_TITLE"),
                                        onclick: function () {
                                            solo.dispatch('training.actionSubmitVar', activity.name, varType, input.value);
                                        },
                                    }, __("UI_BTN_SUBMIT"))
                                )
                            )
                        );

                    } else if (isAlertActivity && !alert_activity) {
                        if (!state.skipForward && !state.skipOperation) {
                            alert_activity = activity;
                        }
                    }

                }

                if (locateObjectExamFlag) {
                    solo.dispatch('training.showActHelp', __("MSG_OBJECT_ACTIVITY_EXAM"));
                }

                if (alert_activity) {
                    if (solo.training.isExam()|| state.options.disableAlertMessages) {
                        solo.training.processInput(alert_activity.getTemplate());
                    }
                }

                //validateSelectedParts();

            });
        });

        return this.exports(element);
    };
});