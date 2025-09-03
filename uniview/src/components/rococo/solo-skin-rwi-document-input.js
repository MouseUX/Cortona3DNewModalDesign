/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop disableRwiLog {boolean}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-document-input.css');

    module.exports = function (skin, options, solo) {
        var currentStepId,
            lastOperationTimestamp,
            taskInfo = {
                step: {}
            };

        var csv = require('actions/catalog-export-to-csv'),
            root = solo.rwi.interactivity.json,
            rwi = root.$('rwi').slice(-1)[0];

        var instructions = document.querySelector('.instructions');

        var observer = new MutationObserver(function (mutationsList, observer) {
            var inputs = document.querySelectorAll('.instructions input');
            inputs.forEach(function (input) {
                input.onchange = function (e) {
                    processInputField(e.target);
                };
                input.oninput = function () {
                    var btnSignOff = document.getElementById('btn-sign-off');
                    if (btnSignOff) {
                        btnSignOff.disabled = false;
                    }
                    solo.dispatch('rwi.didSignOffDisabled', false);
                };
            });
            if (currentStepId) {
                invalidateInput(currentStepId);
            }
        });

        observer.observe(instructions, {
            childList: true
        });

        function processInputField(node) {
            var input = document.querySelectorAll('.instructions input');
            for (var i = 0; i < input.length; i++) {
                if (input[i] === node) {
                    var id = document.querySelector('.instructions .job .content').dataset.id;
                    taskInfo.step[id].input[i] = node.value;
                    var nodes = document.querySelectorAll('.job.document *[data-id="' + id + '"] input');
                    nodes[i].value = node.value;
                    break;
                }
            }
        }

        function invalidateInput(stepId) {
            var inputs = Array.prototype.slice.call(document.querySelectorAll('.instructions input'));
            taskInfo.step[stepId].input.length = inputs.length;

            var btnSignOff = document.getElementById('btn-sign-off');
            if (solo.rwi.jobMode) {
                var flag = !!Array.prototype.slice.call(document.querySelectorAll('.instructions input[data-required="1"]')).length;
                if (btnSignOff) {
                    btnSignOff.disabled = flag;
                }
                solo.dispatch('rwi.didSignOffDisabled', flag);
            }

            inputs.forEach(function (input, i) {
                input.disabled = !solo.rwi.jobMode;
                input.value = taskInfo.step[stepId].input[i] || '';
            });
        }

        solo.on('rwi.didChangeJobMode', function (jobMode) {
            if (jobMode) {
                if (!taskInfo.startTime || taskInfo.endTime) {
                    lastOperationTimestamp = new Date();
                    taskInfo.startTime = new Date();
                }
                if (taskInfo.endTime) {
                    delete taskInfo.endTime;
                    for (var id in taskInfo.step) {
                        taskInfo.step[id] = {
                            input: []
                        };
                    }
                    document.querySelectorAll('.job.document input').forEach(function (input) {
                        input.value = "";
                    });
                }
            }
            if (currentStepId) {
                invalidateInput(currentStepId);
            }
        });

        solo.on('rwi.didTaskActive', function (stepId, task) {
            if (currentStepId === stepId) return;
            if (!taskInfo.step[stepId]) {
                taskInfo.step[stepId] = {
                    input: []
                };
            }
            currentStepId = stepId;
            invalidateInput(stepId);
        });

        solo.on('rwi.didSignOff', function () {
            var dt = document.querySelector('.job.document .active');
            if (dt) {
                var id = dt.dataset.id,
                    now = new Date();

                taskInfo.step[id].signed = now;
                taskInfo.step[id].operationTime = Math.floor((now - lastOperationTimestamp) / 1000);
                lastOperationTimestamp = now;
            }
        });

        solo.on('rwi.didJobComplete', function () {
            taskInfo.endTime = new Date();
            currentStepId = null;
        });

        // 0:00
        function formatTime(sec) {
            var d = new Date(0, 0);
            d.setSeconds(sec);
            return d.getHours() + ':' + _00(d.getMinutes()) + ':' + _00(d.getSeconds());
        }

        // 1 -> 01
        function _00(n) {
            n = n || 0;
            return n < 10 ? '0' + n : n;
        }

        function getInputLabel(name, index) {
            return 'INPUT' + ' ' + (name ? '(' + name.toUpperCase() + ')' : (index + 1));
        }

        if (!options.disableRwiLog) {
            solo.on('rwi.didLogRequest', function () {
                var fn = 'log_' + rwi.$text('jobCode') + '_' + csv.getTimestampString() + '.csv',
                    syntax = '';

                var inputNames = [];

                rwi.$('job/task').forEach(function (task) {
                    task.$('//input').forEach(function (input, index) {
                        var name = getInputLabel(input.$attr('name'), index);
                        if (inputNames.indexOf(name) < 0) {
                            inputNames.push(name);
                        }
                    });
                });

                inputNames.sort();

                syntax += csv.joinCSVLine(
                    ["JOB CODE:", rwi.$text('jobCode')].map(csv.quoteCSVString)
                );
                syntax += csv.joinCSVLine(
                    ["START TIME:", (taskInfo.startTime && taskInfo.startTime.toLocaleString()) || ''].map(csv.quoteCSVString)
                );
                syntax += csv.joinCSVLine(
                    ["END TIME:", (taskInfo.endTime && taskInfo.endTime.toLocaleString()) || ''].map(csv.quoteCSVString)
                );

                syntax += csv.concatCSVLine("");

                syntax += csv.joinCSVLine(
                    ["TASK NUMBER", "TITLE", "OPERATION TIME (MIN.)", "SIGNED"]
                    .concat(inputNames).map(csv.quoteCSVString)
                );

                rwi.$('job/task').forEach(function (task, i) {
                    var id = task.$attr('id'),
                        item = taskInfo.step[id] || {},
                        inputs = document.querySelectorAll('.job.document *[data-id="' + id + '"] input'),
                        inputValues = new Array(inputNames.length);

                    inputs.forEach(function (input, index) {
                        var name = getInputLabel(input.dataset.name, index);
                        inputValues[inputNames.indexOf(name)] = input.value;
                    });

                    syntax += csv.joinCSVLine([
                        String(i + 1),
                        task.$text('title'),
                        item.operationTime ? formatTime(item.operationTime) : '',
                        item.signed ? item.signed.toLocaleString() : ''
                    ].concat(inputValues).map(csv.quoteCSVString));
                });

                csv.saveOrOpenCSV(fn, syntax);
            });
        }
    };
});