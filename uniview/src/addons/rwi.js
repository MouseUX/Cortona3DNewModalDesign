/**
 * The add-on module that provides the support for interactive work instructions procedure.
 * 
 * Enables the following:
 * - an access to the RWI document
 * - the PMI representations
 * - the `Job` mode for the interactive procedure
 * 
 * Adds {@link Cortona3DSolo.rwi} namespace.
 * 
 * __Exports:__ 
 * - a `Promise` whose fulfillment handler receives {@link Cortona3DSolo.rwi} namespace
 * 
 * @see {@link Cortona3DSolo~event:"rwi.didChangeJobMode"}
 * @see {@link Cortona3DSolo~event:"rwi.didTaskActive"}
 * @see {@link Cortona3DSolo~event:"rwi.didStepActive"}
 * 
 * @module addons/rwi
 */

define(function (require, exports, module) {

    var solo = window.Cortona3DSolo,
        procedure = solo.app.procedure,
        ixml = procedure.interactivity;

    if (solo.rwi) {
        module.exports = Promise.resolve(solo.rwi);
        return;
    }

    function getResourceUrl(uri) {
        return solo.app.util.createResourceURL(uri) || solo.app.util.toUrl(uri, solo.app.modelInfo.baseURL);
    }

    function loadCompanionFile(name) {
        var url = getResourceUrl(encodeURI(name));
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

    var partByDocId = {},
        bomItemByDocId = {},
        m_jobMode = false,
        m_activeTask,
        m_activeStep;


    /*
        bom = [
            {
                id: docid,
                type: '',
                parent: null,
                children: [
                    {
                        id: docid,
                        parent: docid,
                        children: []
                    }
                    ...
                ]
            }
            ...
        ]
    */

    function getPMIObjects(parent) {
        var children = solo.app.getChildObjects(parent);
        return children.reduce(function (a, handle) {
            return a.concat(getPMIObjects(handle));
        }, children.filter(function (handle) {
            return solo.app.getObjectFlags(handle) === 2;
        }));
    }

    var pmiObjects = getPMIObjects();

    /**
     * @namespace 
     * @memberof Cortona3DSolo
     * 
     * @requires module:addons/rwi
     */
    var rwi = {
        /**
         * An array of the BOM items.
         * 
         * @member {BOMItemInfo[]}
         */
        bom: [],
        /**
         * Toggles the visibility state for the PMI objects.
         * 
         * @method
         * @param {boolean} force
         * @returns {boolean}
         */
        togglePMI: function (flag) {
            pmiObjects.forEach(function (handle) {
                solo.app.setObjectPropertyf(handle, solo.app.PROPERTY_VISIBILITY, false, flag ? 0 : -1);
            });
            return flag;
        },
        /**
         * @namespace 
         * 
         * @requires module:addons/rwi
         */
        interactivity: {
            /**
             * The JavaScript representation of the RWI document file.
             * 
             * @member {XMLNodeData}
             */
            json: {},
            /**
             * Gets the part object by DocID from the RWI document.
             * 
             * @method
             * @param {DocID} docId
             * @returns {XMLNodeData}
             */
            getPartByDocId: function (docId) {
                return partByDocId[docId];
            },
            /**
             * Gets the BOM item using DocID.
             * 
             * @method
             * @param {DocID} docId
             * @returns {object}
             */
            getBomItemByDocId: function (docId) {
                return bomItemByDocId[docId];
            }
        }
    };

    /**
     * Gets or sets the state for the Job mode.
     * 
     * @memberof Cortona3DSolo.rwi
     * @member {boolean} jobMode
     * @requires addons/rwi
     */
    Object.defineProperty(rwi, 'jobMode', {
        get: function () {
            return m_jobMode;
        },
        set: function (flag) {
            if (m_jobMode != flag) {
                m_jobMode = flag;
                solo.dispatch('rwi.didChangeJobMode', m_jobMode);
            }
        },
        enumerable: true,
        configurable: true
    });

    /**
     * Gets the current active task.
     * 
     * @memberof Cortona3DSolo.rwi
     * @member {XMLNodeData} task
     * @requires addons/rwi
     */
    Object.defineProperty(rwi, 'activeTask', {
        get: function () {
            return m_activeTask;
        },
        enumerable: true,
        configurable: true
    });

    /**
     * Gets the current step.
     * 
     * @memberof Cortona3DSolo.rwi
     * @member {XMLNodeData} step
     * @requires addons/rwi
     */
    Object.defineProperty(rwi, 'activeStep', {
        get: function () {
            return m_activeStep;
        },
        enumerable: true,
        configurable: true
    });

    // self register
    solo.rwi = rwi;

    module.exports = loadCompanionFile(ixml.json.$text('SimulationInteractivity/SimulationInformation/DocumentFile'))
        .then(function (json) {
            rwi.interactivity.json = json;
            var rwiRoot = json.rwi.slice(-1)[0],
                tasks = rwiRoot.$('job/task'),
                steps = rwiRoot.$('job//step');
            rwiRoot.$('bom/part').forEach(function (part) {
                var id = part.$attr('id'),
                    type = part.$attr('type'),
                    handle = ixml.getObjectNamesByDocId(id).map(solo.app.getObjectWithName)[0],
                    parent,
                    parentHandle,
                    bomItem = bomItemByDocId[id] || {
                        id: id,
                        children: []
                    };

                if (type) bomItem.type = type;

                while (!parent && handle) {
                    handle = solo.app.getParentObject(handle);
                    parent = ixml.getDocIdByObjectName(solo.app.getObjectName(handle));
                }

                if (!parent) {
                    rwi.bom.push(bomItem);
                } else {
                    bomItem.parent = parent;
                    if (!bomItemByDocId[parent]) {
                        bomItemByDocId[parent] = {
                            id: parent,
                            children: []
                        };
                    }
                    bomItemByDocId[parent].children.push(bomItem);
                }

                bomItemByDocId[id] = bomItem;
                partByDocId[id] = part;
            });

            solo.on('app.procedure.didEnterSubstepWithName', function (id) {
                var actionInfo = ixml.getProcedureItemInfo(id),
                    stepId = solo.app.procedure.getContextItemId(id),
                    task = tasks.filter(function (task) {
                        return task.$attr('id') === stepId;
                    })[0],
                    step = steps.filter(function (step) {
                        return step.$attr('id') === actionInfo.parent;
                    })[0];
                if (task && task !== m_activeTask) {
                    solo.dispatch('rwi.didTaskActive', stepId, task);
                    m_activeTask = task;
                }
                if (step && step !== m_activeStep) {
                    solo.dispatch('rwi.didStepActive', actionInfo.parent, step);
                    m_activeStep = step;
                }
            });

            return rwi;
        });
});

/**
 * The event that occurs when the state of the job mode is changed.
 * @event Cortona3DSolo~"rwi.didChangeJobMode"
 * @type {boolean}
 */

/**
 * The event that occurs when the current RWI task is changed.
 * @event Cortona3DSolo~"rwi.didTaskActive"
 * @type {arguments}
 * @prop {string} taskId
 * @prop {XMLNodeData} task
 */

/**
 * The event that occurs when the current RWI step is changed.
 * @event Cortona3DSolo~"rwi.didStepActive"
 * @type {arguments}
 * @prop {string} stepId
 * @prop {XMLNodeData} step
 */

 /**
 * The object represents information about the BOM item, for example:
 * ```
 * {
 *      id: "id23",
 *      type: "resource",
 *      parent: "id01",
 *      children: []
 * }
 * ```
 * @prop {DocID} id
 * @prop {string} [type]
 * @prop {DocID} [parent]
 * @prop {BOMItemInfo[]} children
 * @typedef {object} BOMItemInfo
 */