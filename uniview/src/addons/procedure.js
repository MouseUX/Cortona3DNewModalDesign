/**
 * The add-on module that extends the support for interactive procedures.
 * 
 * Enables the support for:
 * - context of the playback
 * - step-by-step mode
 * - drawing attention to 3D objects
 * - highlighting 3D objects
 * 
 * @mixes Cortona3DSolo.app.procedure
 * @mixes Cortona3DSolo.app.procedure.interactivity
 * 
 * @see {@link Cortona3DSolo~event:"app.procedure.didChangePlayableRange"}
 * @see {@link Cortona3DSolo~event:"app.procedure.didDrawingDisplayMode"}
 * @see {@link Cortona3DSolo~event:"app.procedure.didEnableForward"}
 * @see {@link Cortona3DSolo~event:"app.procedure.didEnableBackward"}
 * @see {@link Cortona3DSolo~event:"app.procedure.didPlay"}
 * @see {@link Cortona3DSolo~event:"app.procedure.didStop"}
 * @see {@link Cortona3DSolo~event:"app.procedure.didPlaySound"}
 * @see {@link Cortona3DSolo~event:"app.procedure.onStartPosition"}
 * @see {@link Cortona3DSolo~event:"app.procedure.onEndPosition"}
 * @see {@link Cortona3DSolo~event:"app.procedure.didStart"}
 * @see {@link Cortona3DSolo~event:"app.procedure.didFinish"}
 * @see {@link Cortona3DSolo~event:"procedure.didObjectEnter"}
 * @see {@link Cortona3DSolo~event:"procedure.didObjectOut"}
 * @see {@link Cortona3DSolo~event:"procedure.didObjectClick"}
 * @see {@link Cortona3DSolo~event:"procedure.selectObjects"}
 * 
 * @module addons/procedure
 */

define(function (require, exports, module) {

    var solo = Cortona3DSolo,
        procedure = solo.app.procedure,
        ixml = procedure.interactivity,
        withDocument = ixml && !!ixml.json.$text('SimulationInteractivity/SimulationInformation/DocumentFile'),
        m_locked = false,
        m_context = null, // no context by default
        m_playableItemList = null,
        m_contextStepId = procedure.RANGE_VALUE_CURRENT_STEP,
        m_state,
        m_pos = 0,
        m_currentSubstepId;

    var Vec3f = solo.app.util.Vec3f;

    if (!procedure) return;
    if (typeof procedure.drawAttention === 'function') return;

    var procedureBackward = procedure.backward,
        procedureForward = procedure.forward,
        procedureSeekToSubstep = procedure.seekToSubstep;

    procedure.defaultSeekMode = procedure.SEEK_TO_CUE_POINT;

    function isPlayed() {
        return !!((m_state || 0) & 1);
    }

    function setPlayRangeToCurrentContext() {
        procedure.setPlayRange(
            typeof m_locked === 'object' ? m_locked.start : m_contextStepId,
            typeof m_locked === 'object' ? m_locked.end : null,
            procedure.RANGE_FLAGS_REQUEST_NOTIFICATION | procedure.RANGE_FLAGS_DO_NOT_RECALCULATE_POSITION
        );
        var startTime = procedure.getPlayableRangeStartTime(),
            stopTime = procedure.getPlayableRangeStopTime();
        solo.dispatch('app.procedure.didChangePlayableRange', startTime, stopTime);
    }

    function backward(seekMode) {
        if (m_locked) {
            procedure.stop();
            procedure.setPlayRange();
        }
        var context = m_context;
        if (context) {
            var index = context.indexOf(m_contextStepId) - 1;
            while (index >= 0 && !isValidContextItem(context[index])) {
                index--;
            }
            if (index >= 0) {
                procedureSeekToSubstep(context[index], seekMode);
            }
        } else {
            procedureBackward(seekMode);
        }
        if (m_locked) {
            setPlayRangeToCurrentContext();
        }

    }

    function forward(seekMode) {
        if (m_locked) {
            procedure.stop();
            procedure.setPlayRange();
        }
        var context = m_context;
        if (context) {
            var index = context.indexOf(m_contextStepId) + 1;
            while (index < context.length && !isValidContextItem(context[index])) {
                index++;
            }
            if (index < context.length) {
                procedureSeekToSubstep(context[index], seekMode);
            }
        } else {
            procedureForward(seekMode);
        }
        if (m_locked) {
            setPlayRangeToCurrentContext();
        }
    }

    function isEmptyStep(info) {
        if (!info) return false;
        if (info.type !== 'step') return false;
        if (info.actions.length) return false;
        return info.children.map(ixml.getProcedureItemInfo).every(isEmptyStep);
    }

    function changeContext(id) {
        if (ixml) {
            var procId = ixml.getProcedureId(),
                info = ixml.getProcedureItemInfo(id) || ixml.getProcedureItemInfo(procId),
                parent;
            if (info) {
                m_context = [];
                switch (info.type) {
                    case 'procedure':
                        m_context = info.raw.$('Item');
                        break;
                    case 'step':
                    case 'action':
                        parent = ixml.getProcedureItemInfo(info.parent);
                        m_context = withDocument ? parent.raw.$('Item') : parent.raw['@children'];
                        break;
                }
                m_context = getContextFromChildren(m_context || []);
                if (m_playableItemList) {
                    m_context = m_context.filter(function (id) {
                        for (var p = id; p; p = ixml.getProcedureItemInfo(p).parent) {
                            if (m_playableItemList.indexOf(id) >= 0) {
                                return true;
                            }
                        }
                        return false;
                    });
                }
                if (!m_context.length) {
                    m_context = null;
                }
            }
        }
    }

    function seek(id, seekMode) {
        var info = ixml && ixml.getProcedureItemInfo(id);
        if (isEmptyStep(info)) {
            return;
        }
        if (m_locked) {
            procedure.stop();
            procedure.setPlayRange();
        }
        changeContext(id);
        if (procedureSeekToSubstep) {
            procedureSeekToSubstep(id, seekMode);
            setTimeout(function () {
                solo.app.procedure.requestPlayerState();
                if (m_locked) {
                    setPlayRangeToCurrentContext();
                }
            }, 0);
        }
    }

    function getContextLevel(id) {
        var level = 0,
            p = id;
        while (p) {
            p = getParent(p);
            level++;
        }
        return level;
    }

    function getContextItemId(itemId) {
        var srcId = itemId || m_currentSubstepId,
            id = procedure.RANGE_VALUE_CURRENT_STEP,
            itemInfo,
            hash,
            level;

        if (ixml) {
            itemInfo = ixml.getProcedureItemInfo(srcId) || {};
            srcId = (withDocument && itemInfo.type === 'action') ? itemInfo.parent || itemInfo.parentStep : srcId;
            id = srcId;
            if (!m_context) {
                id = itemInfo.parentStep || ixml.getProcedureId();
            } else {
                level = getContextLevel(m_context[0]);
                while (id && m_context.indexOf(id) < 0) {
                    id = getParent(id);
                }
                if (!id) {
                    hash = m_context.join('');
                    id = srcId;
                    while (getContextLevel(id) > level) {
                        id = getParent(id);
                    }
                    changeContext(id);
                    if (m_context && hash !== m_context.join('')) {
                        if (!getCurrentContext().length) {
                            changeContext(getParent(id));
                        }
                        id = getContextItemId(srcId);
                    } else {
                        id = itemInfo.parentStep || ixml.getProcedureId();
                    }
                }
                id = alignContextItemId(id);
            }
        }
        return id;
    }

    function getCurrentContext() {
        return m_context && m_context.filter(isValidContextItem);
    }

    function isValidContextItem(id) {
        var info = ixml.getProcedureItemInfo(id);
        return info && (info.type !== 'action' || (info.comment && !solo.uniview.options.HideActions && !withDocument));
    }

    function getParent(id) {
        return (ixml.getProcedureItemInfo(id) || {}).parent;
    }

    function alignContextItemId(itemId) {
        var id = itemId,
            contextIndex,
            delta = 0;
        context = getCurrentContext();
        if (id && m_context && context.length) {
            contextIndex = m_context.indexOf(id);
            if (contextIndex >= 0) {
                while (context.indexOf(id) < 0) {
                    if (delta === 0) {
                        delta = -1;
                    } else if (delta < 0) {
                        delta = -delta;
                    } else {
                        delta = -delta - 1;
                    }
                    id = m_context[contextIndex + delta];
                }
            }
        }
        return id;
    }

    function getContextFromChildren(children) {
        return children.reduce(function (a, node) {
            var id = node.$attr('id'),
                info = id && ixml.getProcedureItemInfo(id);
            return info && !isEmptyStep(info) ? a.concat(id) : a;
        }, []);

    }

    function getActiveItemId(itemId) {
        var id = itemId,
            info = ixml.getProcedureItemInfo(id),
            parent = ixml.getProcedureItemInfo(getParent(id));
        if (info && info.type === 'action' && !isValidContextItem(id)) {
            if ((!parent.children || !parent.children.length) && !parent.actions.some(isValidContextItem)) {
                id = parent.id;
            } else {
                var context = getContextFromChildren(parent.raw['@children'] || []),
                    delta = 0,
                    index = context.indexOf(id);

                if (context.some(isValidContextItem)) {
                    do {
                        if (delta === 0) {
                            delta = -1;
                        } else if (delta < 0) {
                            delta = -delta;
                        } else {
                            delta = -delta - 1;
                        }
                        id = context[index + delta];
                    } while (!isValidContextItem(id));

                    info = ixml.getProcedureItemInfo(id);

                    if (info.type === 'step') {
                        var a = getAllValidActions(id);
                        if (a.length) {
                            id = delta > 0 ? a[0] : a[a.length - 1];
                        }
                    }
                } else {
                    id = parent.id;
                }
            }
        }
        return id;
    }

    function getAllValidActions(id) {
        var res = [],
            info = ixml.getProcedureItemInfo(id);

        switch (info.type) {
            case 'action':
                if (info.comment) {
                    res = [id];
                }
                break;
            case 'step':
                if ((!info.children || !info.children.length) && !info.actions.some(isValidContextItem)) {
                    res = [id];
                } else {
                    res = getContextFromChildren(info.raw['@children'] || [])
                        .filter(isValidContextItem)
                        .reduce(function (a, id) {
                            return a.concat(getAllValidActions(id));
                        }, []);
                }

                break;
        }

        return res;
    }

    if (ixml) {
        solo.on('app.procedure.didEnterSubstepWithName', function (id) {
            m_currentSubstepId = id;
            m_contextStepId = getContextItemId(id);

            var procedureContext = m_contextStepId === ixml.getProcedureId(),
                enableForward = false,
                enableBackward = false;

            var context = m_context;

            if (context && !procedureContext) {
                var index = context.indexOf(m_contextStepId);
                enableForward = index < (context.length - 1);
                enableBackward = index > 0;
            }

            solo.dispatch('app.procedure.didEnableForward', enableForward);
            solo.dispatch('app.procedure.didEnableBackward', enableBackward);
        });
    }

    solo.on('app.procedure.didChangePlayerState', function (pos, state) {
        var changes = typeof m_state === 'undefined' ? 0xFFFFFF : state ^ m_state;

        m_state = state;
        m_pos = pos;

        if (changes & 1) {
            if (isPlayed()) {
                solo.dispatch('app.procedure.didPlay');
                solo.app.procedure.requestPlayerState();
            } else {
                solo.dispatch('app.procedure.didStop');
            }
        }

        if (changes & 0x400) {
            solo.dispatch('app.procedure.didPlaySound', !!(state & 0x400));
        }

        if (changes & 0x100) {
            solo.dispatch('app.procedure.didEnableForward', !!(state & 0x100));
        }

        if (changes & 0x200) {
            solo.dispatch('app.procedure.didEnableBackward', !!(state & 0x200));
        }

        if (pos === 0) {
            solo.dispatch('app.procedure.onStartPosition');
            if (changes & 1) {
                if (isPlayed()) {
                    solo.dispatch('app.procedure.didStart');
                }
            }
        } else if (pos >= solo.app.procedure.duration) {
            solo.dispatch('app.procedure.onEndPosition');
            if (changes & 1) {
                if (!isPlayed()) {
                    solo.dispatch('app.procedure.didFinish');
                }
            }
        }
    });

    /**
     * Extended methods and properties of the namespace `Cortona3DSolo.app.procedure`.
     * 
     * @namespace app.procedure
     * @memberof Cortona3DSolo
     * @mixin
     */

    /**
     * Gets or sets the state for the "step-by-step" mode.
     * 
     * @memberof Cortona3DSolo.app.procedure
     * @member {boolean} locked
     * @requires addons/procedure
     */
    Object.defineProperty(solo.app.procedure, 'locked', {
        get: function () {
            return m_locked;
        },
        set: function (flag) {
            m_locked = flag;

            if (m_locked) {
                setPlayRangeToCurrentContext();
            } else {
                if (procedure.setPlayRange)
                    procedure.setPlayRange(null, null, procedure.RANGE_FLAGS_DO_NOT_RECALCULATE_POSITION);
            }
        },
        enumerable: true,
        configurable: true
    });

    /**
     * Gets the flag that the procedure is played.
     * 
     * @memberof Cortona3DSolo.app.procedure
     * @member {boolean} played
     * @requires addons/procedure
     */
    Object.defineProperty(solo.app.procedure, 'played', {
        get: isPlayed,
        enumerable: true,
        configurable: true
    });

    /**
     * Gets the current playback position on the timeline.
     * 
     * @memberof Cortona3DSolo.app.procedure
     * @member {number} position
     * @requires addons/procedure
     * @see {@link Cortona3DSolo.app.procedure.didChangePlayerState}
     */
    Object.defineProperty(solo.app.procedure, 'position', {
        get: function () {
            return m_pos;
        },
        enumerable: true,
        configurable: true
    });

    /**
     * Gets the current playback context.
     * 
     * @memberof Cortona3DSolo.app.procedure
     * @member {number} context
     * @requires addons/procedure
     */
    Object.defineProperty(solo.app.procedure, 'context', {
        get: function () {
            return [].concat(m_context || []);
        },
        enumerable: true,
        configurable: true
    });

    /**
     * Gets the current playback state of the procedure.
     * 
     * @memberof Cortona3DSolo.app.procedure
     * @member {number} state
     * @requires addons/procedure
     * @see {@link Cortona3DSolo.app.procedure.didChangePlayerState}
     */
    Object.defineProperty(solo.app.procedure, 'state', {
        get: function () {
            return m_state;
        },
        enumerable: true,
        configurable: true
    });

    var intervals = {};

    solo.expand(solo.app.procedure, {
        /**
         * Toggles display between 2D and 3D views.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {boolean} force
         * @requires addons/procedure
         */
        toggleDrawingDisplayMode: function (force) {
            solo.dispatch('app.procedure.didDrawingDisplayMode', force);
            solo.app.drawing.show(force);
            solo.app.ui.showCanvas(!force);
        },
        /**
         * Gets the procedure item ID from the current context.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {string} [itemId]
         * @returns {string}
         * @requires addons/procedure
         */
        getContextItemId: getContextItemId,
        /**
         * Gets the active procedure item ID for the current context.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {string} [itemId]
         * @returns {string}
         * @requires addons/procedure
         */
        getActiveItemId: getActiveItemId,
        /**
         * Checks the item ID is valid for the procedural context.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {string} [itemId]
         * @returns {boolean}
         * @requires addons/procedure
         */
        isValidContextItem: isValidContextItem,
        /**
         * Highlights the 3D object.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {Handle} handle
         * @param {boolean} enable
         * - `true` - highlight
         * - `false` - unhighlight
         * @param {boolean} [animated]
         * @requires addons/procedure
         */
        hoverObject: function (handle, enable, animated) {
            var handles = [handle],
                hovered = solo.app.getHoveredObjects();

            handles.forEach(function (h) {
                var index = hovered.indexOf(h);
                if (enable) {
                    if (index < 0) {
                        hovered.push(h);
                    }
                } else {
                    if (index >= 0) {
                        hovered.splice(index, 1);
                    }
                }
            });
            solo.app.setHoveredObjects(hovered, animated);
        },
        /**
         * Highlights the 3D item.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {DocID} docId
         * @param {boolean} enable
         * - `true` - highlight
         * - `false` - unhighlight
         * @requires addons/procedure
         */
        hoverItem: function (docId, enable) {
            if (!docId) return;
            var handles = ixml.getObjectNamesByDocId(docId).map(solo.app.getObjectWithName);
            handles.forEach(function (handle) {
                solo.app.procedure.hoverObject(handle, enable, true);
            });
        },
        /**
         * Selects the 3D item.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {DocID} docId
         * @param {boolean} enable
         * - `true` - select
         * - `false` - unselect
         * @param {boolean} [animated]
         * @requires addons/procedure
         */
        selectItem: function (docId, enable, animated) {
            if (!docId) return;
            var handles = ixml.getObjectNamesByDocId(docId).map(solo.app.getObjectWithName),
                selected = solo.app.getSelectedObjects();

            handles.forEach(function (h) {
                var index = selected.indexOf(h);
                if (enable) {
                    if (index < 0) {
                        selected.push(h);
                    }
                } else {
                    if (index >= 0) {
                        selected.splice(index, 1);
                    }
                }
            });
            solo.app.setSelectedObjects(selected, animated);
        },
        /**
         * Checks if the 3D item is visible.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {DocID} docId
         * @returns {boolean}
         * @requires addons/procedure
         */
        isItemVisible: function (docId) {
            var handles = ixml.getObjectNamesByDocId(docId).map(solo.app.getObjectWithName);
            return handles.some(function (handle) {
                return solo.app.getObjectVisibility(handle) === 0;
            });
        },
        /**
         * Activates the blink feature for 3D objects to attract the user's attention.
         * 
         * @async
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {Handle[]|Handle} handles Array of 3D object handles or a single handle
         * @param {number} [duration=3] Duration in seconds
         * @returns {Promise}
         * @requires addons/procedure
         */
        drawAttention: function (handles, duration) {
            if (solo.app.selectionMode > 0) return;
            var handlesArray = Array.isArray(handles) ? handles : [handles];
            return new Promise(function (success, reject) {
                var interval,
                    state = false;

                duration = duration || 3;
                solo.app.fitObjectsInView(handlesArray, true, 0.5);

                function toggleHighlight(enable) {
                    state = !arguments.length ? !state : enable;
                    handlesArray.forEach(function (handle) {
                        if (handle) {
                            solo.app.procedure.hoverObject(handle, state, true);
                        }
                    });
                }

                interval = setInterval(toggleHighlight, 250);

                function finish() {
                    clearInterval(interval);
                    delete intervals[interval];
                    toggleHighlight(false);
                    success();
                }

                intervals[interval] = {
                    finish: finish,
                    timeout: setTimeout(finish, duration * 1000)
                };
            });
        },
        /**
         * Activates the blink feature for 3D objects to attract the user's attention.
         * 
         * @async
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @param {Handle[]|Handle} handles Array of 3D object handles or a single handle
         * @param {number} [duration=3] Duration in seconds
         * @param {string} [syntax="Shape { geometry Sphere {} }"]
         * @returns {Promise}
         * @requires addons/procedure
         */
        drawAttentionEx: function (handles, duration, syntax) {
            syntax = syntax || 'Shape { \
                geometry Sphere {} \
                appearance Appearance { \
                    material Material { \
                        diffuseColor .8 .31 0 \
                        specularColor .5 .5 .5 \
                        emissiveColor .1 .1 .1 \
                        ambientIntensity 0 \
                        transparency .5 \
                    } \
                } \
            }';

            var handlesArray = Array.isArray(handles) ? handles : [handles],
                flashers = new Array(handlesArray.length);

            return new Promise(function (success, reject) {
                var interval,
                    state = false,
                    start = new Date;

                duration = duration || 3;
                solo.app.fitObjectsInView(handlesArray, true, 0.5);

                handlesArray.forEach(function (handle, index) {
                    if (handle) {
                        var bb = solo.app.getObjectBoundingBox(handle);
                        if (bb) {
                            var r = new Vec3f(bb.size).length() / 1.8,
                                o = solo.app.createObjectsFromString('Transform { children Transform { scale ' + r + ' ' + r + ' ' + r + ' children ' + syntax + ' } }');
                            if (o) {
                                solo.app.addObjects(o, handle);
                                flashers[index] = o[0];
                            }
                        }
                    }
                });

                function toggleHighlight(enable) {
                    state = !arguments.length ? !state : enable;
                    handlesArray.forEach(function (handle) {
                        if (handle) {
                            solo.app.procedure.hoverObject(handle, state, true);
                        }
                    });
                }

                interval = setInterval(toggleHighlight, 250);

                var scaleInterval = setInterval(function () {
                    var pos = (new Date() - start) % 1000;
                    var scale = (Math.cos((pos - 500) / 500 * Math.PI) + 1) * 0.35 + 0.3;
                    flashers.forEach(function (handle) {
                        solo.app.setObjectPropertyf(handle, solo.app.PROPERTY_SCALE, false, scale, scale, scale);
                    });
                }, 10);

                function finish() {
                    clearInterval(interval);
                    clearInterval(scaleInterval);
                    delete intervals[interval];
                    toggleHighlight(false);
                    handlesArray.map(function (handle, index) {
                        if (handle) {
                            solo.app.removeObjects(flashers[index], handle);
                        }
                    });
                    success();
                }

                intervals[interval] = {
                    finish: finish,
                    timeout: setTimeout(finish, duration * 1000)
                };
            });
        },
        /**
         * Cancels the blinking of all 3D objects to draw attention.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @requires addons/procedure
         */
        clearAllAttentions: function () {
            for (var interval in intervals) {
                clearInterval(interval);
                clearTimeout(intervals[interval].timeout);
                intervals[interval].finish();
            }
        }
    });

    // overwriting app.procedure
    solo.expand(solo.app.procedure, {
        /**
         * Moves the playback marker position to the next substep in the current context.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @requires addons/procedure
         */
        forward: forward,

        /**
         * Moves the playback marker position to the previous substep in the current context.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @requires addons/procedure
         */
        backward: backward,

        /**
         * Moves the playback marker of the procedure to the start of the specified procedure/step/substep and changes current context to it.
         * 
         * @memberof Cortona3DSolo.app.procedure
         * @method
         * @requires addons/procedure
         */
        seekToSubstep: seek
    });

    /*
        {
            id: DocID,
            objectNames: [...],
            screentip: "",
            metadata: {},
        }
     */

    if (ixml) {

        /**
         * Extended methods and properties of the namespace `Cortona3DSolo.app.procedure.interactivity`.
         * 
         * @namespace app.procedure.interactivity
         * @memberof Cortona3DSolo
         * @mixin
         */
        // expando
        solo.expand(ixml, {
            /**
             * Gets 3D object handles for DocID or 3D object names.
             * 
             * @memberof Cortona3DSolo.app.procedure.interactivity
             * @method
             * @param {string|string[]} name
             * @returns {Handle[]} 
             * @requires addons/procedure
             */
            getObjects: function (name) {
                var res = [],
                    names = Array.isArray(name) ? name : [name];
                names = names.reduce(function (a, name) {
                    return a.concat(ixml.getDocItemInfo(name) ? ixml.getObjectNamesByDocId(name) : name);
                }, []);
                names.forEach(function (name) {
                    if (res.indexOf(name) < 0) {
                        res.push(name);
                    }
                });
                return res.map(solo.app.getObjectWithName).filter(function (h) { return !!h; });
            },
            /**
             * Gets DocID by 3D object handle.
             * 
             * @memberof Cortona3DSolo.app.procedure.interactivity
             * @method
             * @param {Handle} handle
             * @returns {DocID} docId
             * @requires addons/procedure
             */
            getDocIdForObject: function (handle) {
                var docId = ixml.getDocIdByObjectName(solo.app.getObjectName(handle));
                while (!docId && handle) {
                    handle = solo.app.getParentObject(handle);
                    docId = ixml.getDocIdByObjectName(solo.app.getObjectName(handle));
                }
                return docId;
            },
            /**
             * Gets screen tip for the name of 3D object.
             * 
             * @memberof Cortona3DSolo.app.procedure.interactivity
             * @method
             * @param {string} name
             * @returns {string}
             * @requires addons/procedure
             */
            getScreenTip: function (name) {
                var docItemInfo = ixml.getDocItemInfo(ixml.getDocIdByObjectName(name)) || {};
                return docItemInfo.screentip || '';
            }
        });

        solo.on('touch.didObjectEnter', function (handle, name) {
            var docId = ixml.getDocIdForObject(handle);
            if (docId) {
                solo.dispatch('procedure.didObjectEnter', docId);
            }
        });

        solo.on('touch.didObjectOut', function (handle, name) {
            var docId = ixml.getDocIdForObject(handle);
            if (docId) {
                solo.dispatch('procedure.didObjectOut', docId);
            }
        });

        solo.on('touch.didObjectClick', function (handle, name, x, y, button, key, event) {
            var docId = ixml.getDocIdForObject(handle);
            if (docId) {
                solo.dispatch('procedure.didObjectClick', docId, x, y, button, key, event);
            }
        });

        solo.on('procedure.selectObjects', function (names) {
            var handles = ixml.getObjects(names);
            if (solo.uniview.options.UseLegacy3DPartDrawAttention) {
                solo.app.procedure.clearAllAttentions();
                solo.app.procedure.drawAttention(handles);
            } else {
                solo.app.setSelectedObjects(handles, true);
                solo.app.fitObjectsInView(handles, true, 0.5);
            }
        });

        seek(ixml.getProcedureId());
    }

    solo.on('app.procedure.didChangePlayableItemList', function (duration, items) {
        m_playableItemList = items;
    });
});

/**
 * The event that occurs when the playable range of the procedure is changed.
 * @event Cortona3DSolo~"app.procedure.didChangePlayableRange"
 * @type {arguments}
 * @prop {number} startTime
 * @prop {number} stopTime
 */
/**
 * The event that occurs when the display mode is changed.
 * @event Cortona3DSolo~"app.procedure.didDrawingDisplayMode"
 * @type {boolean}
 */
/**
 * The event that occurs when a step forward is possible.
 * @event Cortona3DSolo~"app.procedure.didEnableForward"
 * @type {boolean}
 */
/**
 * The event that occurs when a step backward is possible.
 * @event Cortona3DSolo~"app.procedure.didEnableBackward"
 * @type {boolean}
 */
/**
 * The event that occurs when the procedure enters the playback state.
 * @event Cortona3DSolo~"app.procedure.didPlay"
 */
/**
 * The event that occurs when the procedure enters the stop state.
 * @event Cortona3DSolo~"app.procedure.didStop"
 */
/**
 * The event that occurs when the audio playback in the procedure changes.
 * @event Cortona3DSolo~"app.procedure.didPlaySound"
 * @type {boolean}
 */
/**
 * The event that occurs when the current playback position in the timeline is moved to the beginning.
 * @event Cortona3DSolo~"app.procedure.onStartPosition"
 */
/**
 * The event that occurs when the current playback position in the timeline is moved to the end.
 * @event Cortona3DSolo~"app.procedure.onEndPosition"
 */
/**
 * The event that occurs when the procedure starts playing from the beginning.
 * @event Cortona3DSolo~"app.procedure.didStart"
 */
/**
 * The event that occurs when the procedure playing is stopped in the end.
 * @event Cortona3DSolo~"app.procedure.didFinish"
 */
/**
 * The event that occurs when the pointer is moved over the object in the 3D window.
 * @event Cortona3DSolo~"procedure.didObjectEnter"
 * @type {arguments}
 * @prop {DocID} docId
 */
/**
 * The event that occurs when the pointer is moved off the object in the 3D window.
 * @event Cortona3DSolo~"procedure.didObjectOut"
 * @type {arguments}
 * @prop {DocID} docId
 */
/**
 * The event that occurs when the mouse button is pressed and then released (the pointer was in a “pressed” and then “released” state) and the pointer is over the object in the 3D window.
 * @event Cortona3DSolo~"procedure.didObjectClick"
 * @type {arguments}
 * @prop {DocID} docId
 * @prop {number} x - The X coordinate of the pointer in local (canvas) coordinates
 * @prop {number} y - The Y coordinate of the pointer in local (canvas) coordinates
 * @prop {number} buttons - Bitwise flags of the buttons depressed when the event was fired: 
 * - Left=1 
 * - Right=2 
 * - Middle (wheel)=4 
 * @prop {number} keys - Bitwise control key flags that were pressed when the event was fired: 
 * - Shift=1
 * - Ctrl=2
 * - Alt=4
 * @prop {object} event - Source PointerEvent or MouseEvent object
 */
/**
 * The event is called to select 3D objects.
 * @event Cortona3DSolo~"procedure.selectObjects"
 * @type {arguments}
 * @prop {string|string[]} names - DocID or 3D object names
 */
