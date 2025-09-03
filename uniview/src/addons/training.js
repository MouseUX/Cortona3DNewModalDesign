/**
 * The add-on module that provides the support for interactive training procedure.
 * 
 * Enables the following:
 * - an access to the training scenario document
 * - ...
 * 
 * Adds {@link Cortona3DSolo.training} namespace.
 * 
 * __Exports:__ 
 * - a `Promise` whose fulfillment handler receives {@link Cortona3DSolo.training} namespace
 * 
 * @see {@link Cortona3DSolo~event:"training.didChangePlayMode"}
 * @see {@link Cortona3DSolo~event:"training.didStartScenario"}
 * @see {@link Cortona3DSolo~event:"training.didFinishScenario"}
 * @see {@link Cortona3DSolo~event:"training.didCancelScenario"}
 * @see {@link Cortona3DSolo~event:"training.didStartScenarioStep"}
 * @see {@link Cortona3DSolo~event:"training.didFinishScenarioStep"}
 * @see {@link Cortona3DSolo~event:"training.didChangeExpectedOperations"}
 * @see {@link Cortona3DSolo~event:"training.didScenarioOperations"}
 * @see {@link Cortona3DSolo~event:"training.didFailScenarioStepInput"}
 * 
 * @module addons/training
 */

define(function (require, exports, module) {

    var solo = window.Cortona3DSolo,
        procedure = solo.app.procedure,
        ixml = procedure.interactivity,
        doc = solo.app.modelInfo,
        trainingXmlFileUri = doc.companionFile.replace(/\.interactivity\.xml$/i, '.training.xml');

    if (solo.training) {
        module.exports = Promise.resolve(solo.training);
        return;
    }

    var Scenario = require('./training/scenario').Scenario,
        Variable = require('./training/scenario').Variable,
        scenario = new Scenario(),
        sco = require('./training/sco');

    function getResourceUrl(uri) {
        return solo.app.util.createResourceURL(uri) || solo.app.util.toUrl(uri, solo.app.modelInfo.baseURL);
    }

    function loadCompanionFile(uri) {
        var url = getResourceUrl(uri);
        return solo.app.util.loadResource(url, 'text/xml')
            .then(function (xhr) {
                solo.app.util.revokeResourceURL(url);
                if (xhr.responseXML) {
                    return Promise.resolve(solo.app.util.xmlToJSON(xhr.responseXML));
                } else {
                    return Promise.reject(new Error(url + " empty content"));
                }
            });
    }

    var m_mode = -1,
        m_playMode = 0,
        m_expected = [],
        m_vp;

    function setViewpointValue(value) {
        var a = value.split(' ');
        if (typeof solo.app.setCameraPosition === 'function') {
            solo.app.setCameraPosition(a.slice(3, 6), a.slice(6, 10), -1, a.slice(0, 3), true);
        } else {
            var c = a.slice(0, 3).join(' '),
                p = a.slice(3, 6).join(' '),
                o = a.slice(6, 10).join(' '),
                syntax = 'Viewpoint { jump FALSE position ' + p + ' orientation ' + o + '}';

            if (m_vp) {
                solo.app.removeObjects(m_vp);
            }

            m_vp = solo.app.createObjectsFromString(syntax)[0];
            solo.app.addObjects(m_vp);
            solo.once('core.didDrawAnimationFrame', function () {
                solo.app.activeViewpoint = m_vp;
            });
        }
    }

    /**
     * @namespace 
     * @memberof Cortona3DSolo
     * 
     * @requires module:addons/training
     */
    var training = {
        sco: sco,
        /**
         * @namespace 
         * 
         * @requires module:addons/training
         */
        interactivity: {
            /**
             * The JavaScript representation of the training scenario document file.
             * 
             * @member {XMLNodeData}
             */
            json: {},
            /**
             * @param {string} objectName
             * @returns {string}
             */
            getObjectName: function (def) {
                return solo.training.interactivity.json.$('scenario/objects/object').reduce(function (name, object) {
                    return (object.$attr('id') === def) ? object.$attr('name') : name;
                }, '');
            },
            /**
             * @param {string} objectName
             * @returns {string}
             */
            getObjectViewpoint: function (def) {
                return solo.training.interactivity.json.$('scenario/objects/object').reduce(function (vp, object) {
                    if (object.$attr('id') === def) {
                        var $vp = object.$('metainfo').filter(function (metainfo) {
                            return metainfo.$attr('name') === '$vp';
                        })[0];
                        if ($vp) {
                            return $vp.$text();
                        }
                    }
                    return vp;
                }, '');
            },
        },
        /**
         * @param {number} [mode=0]
         */
        start: function (mode) {
            if (typeof mode == 'undefined') {
                mode = training.MODE_DEMO;
            }
            m_mode = +mode;
            scenario.start();
        },
        /**
         * 
         */
        cancel: function () {
            scenario.cancel();
            m_mode = -1;
        },
        /**
         * 
         */
        fail: function () {
            scenario.fail();
            m_mode = -1;
        },
        /**
         * 
         */
        resume: function () {
            scenario.active = true;
        },
        /**
         * @returns {boolean}
         */
        isDemo: function () {
            return m_mode === training.MODE_DEMO;
        },
        /**
         * @returns {boolean}
         */
        isStudy: function () {
            return m_mode === training.MODE_STUDY;
        },
        /**
         * @returns {boolean}
         */
        isExam: function () {
            return m_mode === training.MODE_EXAM;
        },
        setViewpointValue: setViewpointValue,
        processInput: scenario.processInput.bind(scenario),
        processStep: scenario.processStep.bind(scenario),
        startStep: scenario.startStep.bind(scenario),
        getSuccessStatus: scenario.getSuccessStatus.bind(scenario),
        getScaledScore: scenario.getScaledScore.bind(scenario),
        getSessionTime: scenario.getSessionTime.bind(scenario),
        isActive: scenario.isActive.bind(scenario),
        /**
         * @param {string} name 
         * @param {sting} type 
         */
        createVariable: function (name, type) {
            var input = new Variable();
            input.name = name;
            input.type = type;
            return input;
        },
        /**
         * @param {object} data 
         */
        restoreVariables: function (data) {
            for (var key in data) {
                var variable = scenario.variables[key];
                scenario.variables[key].setValue((variable.type === 'enumeration') ? variable.items.indexOf(data[key]) : data[key]);
            }
        }
    };

    Object.defineProperty(training, 'MODE_DEMO', {
        value: 0
    });
    Object.defineProperty(training, 'MODE_STUDY', {
        value: 1
    });
    Object.defineProperty(training, 'MODE_EXAM', {
        value: 2
    });

    Object.defineProperty(training, 'MODE_PLAY', {
        value: 1
    });
    Object.defineProperty(training, 'MODE_STOP', {
        value: 0
    });
    Object.defineProperty(training, 'MODE_PAUSE', {
        value: 2
    });

    Object.defineProperty(training, 'activeStep', {
        get: function () {
            return scenario.activeStep;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(training, 'history', {
        get: function () {
            return scenario.history;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(training, 'variables', {
        get: function () {
            return scenario.variables;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(training, 'username', {
        get: function () {
            return scenario.username;
        },
        set: function (value) {
            scenario.username = value;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(training, 'scaledPassingScore', {
        get: function () {
            return scenario.scaledPassingScore;
        },
        set: function (value) {
            scenario.scaledPassingScore = value;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(training, 'mode', {
        get: function () {
            return +m_mode;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(training, 'expected', {
        get: function () {
            return m_expected;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(training, 'playMode', {
        get: function () {
            return +m_playMode;
        },
        set: function (mode) {
            if (m_playMode != mode) {
                m_playMode = mode;
                solo.dispatch('training.didChangePlayMode', mode);
            }
        },
        enumerable: true,
        configurable: true
    });

    solo.expand(scenario, {
        on_scenario_start: function () {
            m_expected = [];
            solo.dispatch('training.didStartScenario', m_mode);
        },
        on_scenario_finish: function () {
            solo.dispatch('training.didFinishScenario');
        },
        on_scenario_cancel: function () {
            m_expected = [];
            solo.dispatch('training.didCancelScenario');
        },
        on_step_start: function (step) {
            solo.dispatch('training.didStartScenarioStep', step);
        },
        on_step_finish: function (step) {
            solo.dispatch('training.didFinishScenarioStep', step);
        },
        on_expected_operations: function (operations) {
            m_expected = operations;
            solo.dispatch('training.didChangeExpectedOperations', operations);
        },
        on_operations: function (operations, input) {
            solo.dispatch('training.didScenarioOperations', operations, input);
        },
        on_step_input_failed: function (step, input) {
            solo.dispatch('training.didFailScenarioStepInput', step, input);
        }
    });

    // self register
    solo.training = training;

    module.exports = loadCompanionFile(trainingXmlFileUri)
        .then(function (json) {
            training.interactivity.json = json;
            scenario.loadFromNode(json.$('scenario')[0]);
            return training;
        });
});

/**
 * @event Cortona3DSolo~"training.didChangePlayMode"
 * @type {number}
 */

/**
 * @event Cortona3DSolo~"training.didStartScenario"
 * @type {number}
 */

/**
 * @event Cortona3DSolo~"training.didFinishScenario"
 */

/**
 * @event Cortona3DSolo~"training.didCancelScenario"
 */

/**
 * @event Cortona3DSolo~"training.didStartScenarioStep"
 * @type {object}
 */

/**
 * @event Cortona3DSolo~"training.didFinishScenarioStep"
 * @type {object}
 */

/**
 * @event Cortona3DSolo~"training.didChangeExpectedOperations"
 * @type {array}
 */

/**
 * @event Cortona3DSolo~"training.didScenarioOperations"
 * @type {arguments}
 * @prop {array} operations 
 * @prop {object} input
 */

/**
 * @event Cortona3DSolo~"training.didFailScenarioStepInput"
 * @type {arguments}
 * @prop {object} step 
 * @prop {object} input
 */
