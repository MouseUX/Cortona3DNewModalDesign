define(function (require, exports, module) {
    /*
        filter.create(key, f) <- f(itemInfo, value): boolean
        filter.set(key, value)
        filter.reset(key)
        filter.remove(key)
    */

    var filter = {}; // filter data by name: name, test function, list of available values
    var current = {}; // current value of filters by name
    var filtered = []; // filtered dpl rows
    var options = {
        allowDescendantFiltering: false
    };

    /*
        The row is visible if:
        - the filter is set to 'undefined' or * (All);
        - the filter is successfully test() for row.
        
        The row will be hidden if one of the filters does not meet the above conditions.
     */

    function isRowVisibleForFilters(row, explicitly) {
        var ixml = Cortona3DSolo.app.ipc.interactivity,
            satisfies = true;
        for (var name in filter) {
            var info = ixml.getItemInfo(row);
            // no current value => any (*)
            satisfies = (current[name] === void 0 || current[name] === '*') || filter[name].test(info, current[name], explicitly);
            if (!satisfies) break;
        }
        return satisfies;
    }

    function applyFilters() {
        var ixml = Cortona3DSolo.app.ipc.interactivity,
            res = [];

        // initially all rows are visible
        res = ixml.json.$('ipc/figure/dplist/item').map(function (v, row) { return row; });

        res.forEach(function (visibleRow, row) {
            var isHidden = visibleRow < 0;
            var visible = isRowVisibleForFilters(row, isHidden);
            if (visible) {
                res[row] = row;
                if (options.allowDescendantFiltering) {
                    if (isHidden) {
                        ixml.getChildren(row, true).forEach(function (childRow) {
                            res[childRow] = childRow;
                        });
                    }
                }
            } else {
                res[row] = -1;
                if (options.allowDescendantFiltering) {
                    ixml.getChildren(row, true).forEach(function (childRow) {
                        res[childRow] = -1;
                    });
                }
            }
        })

        res = res
            .map(function (visibleRow, row) { return visibleRow < 0 ? row : -1; })
            .filter(function (row) { return row >= 0; });

        if (filtered.toString() !== res.toString()) {
            Cortona3DSolo.dispatch('catalog.didChangeFilteredItems', res, filtered);
            filtered = res;
        }

        return res;
    }

    /**
     * The function defines the filter criteria. 
     * Must return `true` if the IPC item specified by the `info` parameter satisfies the filtering value specified by the `value` parameter.
     * 
     * @callback Cortona3DSolo.catalog.filter~testFunction
     * @param {CatalogItemInfo} info The IPC item information object
     * @param {string|undefined} value The filter value to check
     * @returns {boolean}
     */

    module.exports = {
        /**
         * @memberof Cortona3DSolo.catalog.filter
         * @member
         * @prop {object} options Options for filtering the catalog.
         * @prop {boolean} [options.allowDescendantFiltering = false] Allows you to filter all descendant rows for the filtered row.
         */
        options: options,
        /**
         * Creates a new IPC filter with name specified by the `name` parameter, the filter criteria function, and an array of valid filter criteria values.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {string} name The name of the IPC filter
         * @param {Cortona3DSolo.catalog.filter~testFunction} test Filtering criteria function
         * ```javascript
         * function (itemInfo, filterCurrentValue, explicitly) {}
         * ```
         * @param {array} values An array of valid filter criteria values
         * @param {boolean} [permanent=false]
         */
        create: function (options, test, values, permanent) {
            var filterObject = {};
            if (arguments.length === 1 && typeof options === 'object') {
                filterObject.name = options.name;
                filterObject.test = options.test || function () { };
                filterObject.values = options.values;
                filterObject.permanent = !!options.permanent;
            } else {
                filterObject.name = options;
                filterObject.test = test || function () { };
                filterObject.values = values;
                filterObject.permanent = !!permanent;
            }
            if (!filter[filterObject.name]) {
                filter[filterObject.name] = filterObject;
            }
        },
        /**
         * Specifies the filter value for the IPC filter with name specified by the `name` parameter. 
         * Resets the filter if the filter value is undefined or equals `"*"`.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {string} name The name of the IPC filter
         * @param {string} [value] The filter value
         * @fires Cortona3DSolo~"catalog.didChangeFilterValue"
         * @fires Cortona3DSolo~"catalog.didChangeFilteredItems"
         */
        set: function (name, value) {
            current[name] = value;
            Cortona3DSolo.dispatch('catalog.didChangeFilterValue', name, value);
            applyFilters();
        },
        /**
         * Resets all IPC filters to the default value.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {boolean} [force=false] Allows you to forcibly reset the permanent filter.
         * @fires Cortona3DSolo~"catalog.didChangeFilterValue"
         * @fires Cortona3DSolo~"catalog.didChangeFilteredItems"
         */
        resetAll: function (force) {
            var changed = false;
            for (var name in filter) {
                if (!filter[name].permanent || force) {
                    delete current[name];
                    Cortona3DSolo.dispatch('catalog.didChangeFilterValue', name);
                    changed = true;
                }
            }
            if (changed) {
                applyFilters();
            }
        },
        /**
         * Removes the IPC filter with name specified by the `name` parameter.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {string} name The name of the IPC filter
         * @fires Cortona3DSolo~"catalog.didChangeFilteredItems"
         */
        remove: function (name) {
            delete filter[name];
            delete current[name];
            applyFilters();
        },
        /**
         * Helper function. The validation function of an IPC item metadata.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {string} declId ID of the metadata declaration
         * @param {CatalogItemInfo} info The IPC item information object
         * @param {string} value The filter value to check
         * @param {boolean} [explicitly]
         * @returns {boolean}
         * @example
         * Cortona3DSolo.catalog.filter.create(
         *      'QNA', 
         *      Cortona3DSolo.catalog.filter.testMeta.bind(null, 'QNA'),
         *      Cortona3DSolo.catalog.filter.valuesMeta('QNA')
         * );
         */
        testMeta: function (declId, info, value, explicitly) {
            var v = info.metadata[declId] || info.part.metadata[declId],
                res = false;
            if (Array.isArray(v)) {
                if (!explicitly) {
                    res = !v.length;
                }
                res = res || v.some(function (v) {
                    return v === value;
                });
            } else {
                if (!explicitly) {
                    res = (v === void 0);    
                }
                res = res || (v === value);
            }
            return res;
        },
        /**
         * Helper function. The validation function of the command operand in the IPC item.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {string} commandId Command template ID
         * @param {number} argNumber The number of the operand
         * @param {CatalogItemInfo} info The IPC item information object
         * @param {string} value The filter value to check
         * @returns {boolean}
         */
        testCommand: function (type, argNumber, info, value) {
            return info.commands.some(function (command) {
                return command.type === type && command.args[argNumber] === value;
            });
        },
        /**
         * Returns an array of values of metadata with ID of the metadata declaration specified by the `declId` parameter.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {string} declId ID of the metadata declaration
         * @returns {string[]}
         */
        valuesMeta: function (declId) {
            var ixml = Cortona3DSolo.app.ipc.interactivity,
                res = [];

            function testAndPush(value) {
                if (value === void 0) return;
                var v = ('' + value).trim();
                if (v && res.indexOf(v) < 0) {
                    res.push(v);
                }
            }

            ixml.json.$('ipc/figure/dplist/item').forEach(function (item, row) {
                var info = ixml.getItemInfo(row),
                    value = info.metadata[declId] || info.part.metadata[declId];
                if (Array.isArray(value)) {
                    value.forEach(testAndPush)
                } else {
                    testAndPush(value);
                }
            });
            return res.sort();
        },
        /**
         * Returns an array of values of the nth operand of the command specified by `commandId` and `argNumber` parameter.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {string} commandId Command template ID
         * @param {number} argNumber The number of the operand
         * @returns {string[]}
         */
        valuesCommand: function (type, argNumber) {
            argNumber = argNumber || 0;
            var ixml = Cortona3DSolo.app.ipc.interactivity,
                res = [];
            ixml.json.$('ipc/figure/dplist/item').forEach(function (item, row) {
                var info = ixml.getItemInfo(row);
                info.commands.filter(function (command) {
                    return command.type === type;
                }).map(function (command) {
                    return !command.args.length || command.args[argNumber].trim();
                }).forEach(function (value) {
                    if (value && res.indexOf(value) < 0) {
                        res.push(value);
                    }
                });
            });
            return res;
        },
        /**
         * Returns an array of values and descriptions of the nth operand of the command specified by `commandId`, `argNumber` and `refTableName` parameter.
         * 
         * @memberof Cortona3DSolo.catalog.filter
         * @method 
         * @param {string} commandId Command template ID
         * @param {number} argNumber The number of the operand
         * @param {string} refTableName The name of the reftable
         * @returns {string[] | object[]}
         */
        valuesCommandDescription: function (type, argNumber, refTableName) {
            var commandValues = this.valuesCommand(type, argNumber);

            try {
                if (!refTableName) {
                    return commandValues;
                }

                var ixml = Cortona3DSolo.app.ipc.interactivity,
                    res = [],
                    refTable;

                var reftables = ixml.json.$('ipc/reftables/reftable');
                refTable = reftables.filter(function (refTableItem) {
                    return refTableItem.$attr('name') === refTableName;
                })[0];

                if (!refTable) {
                    return commandValues;
                }

                commandValues.forEach(function (applicRefId) {
                    var refTableValues = refTable.$('value');
                    refTableValues.forEach(function (value) {
                        if (value.$text() == applicRefId) {
                            res.push({
                                description: value.$attr('descr'),
                                value: applicRefId
                            })
                        }
                    })
                })

                return res;
            } catch (e) {
                console.log('Error applicability filter: ', e);
            }

            return commandValues;
        }
    };

});

/**
 * The event that occurs when the filtered DPL rows are changed.
 * @event Cortona3DSolo~"catalog.didChangeFilteredItems"
 * @type {arguments}
 * @prop {number[]} newFiltered A new array of filtered DPL rows.
 * @prop {number[]} prevFiltered Old array of filtered DPL rows.
 */

/**
* The event that occurs when the filtered DPL rows are changed.
* @event Cortona3DSolo~"catalog.didChangeFilterValue"
* @type {arguments}
* @prop {string} name The IPC filter name
* @prop {string|undefined} value The new filter value or `undefined` if IPC filter has been reset.
*/
