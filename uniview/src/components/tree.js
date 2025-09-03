/**
 * The UI component that is used to create a tree or list.
 * @module components/tree
 */
define(function (require, exports, module) {
    require('css!./tree.css');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {module:components/tree~TreeItemInfo[]} options.items 
     * @param {string} options.collapsed
     * @param {Cortona3DSolo} solo
     * @return {UISkinComponent} The instance of {@link UISkinComponent}
     * ```xml
     * <div class="skin-tree">
     *      <div class="skin-tree-item">
     *          <div>
     *              <div class="collapse-button"></div>
     *              <div class="content" data-id="{{ TreeItemInfo.id }}">{{ TreeItemInfo.content }}</div>
     *          </div>
     *          <div class="children">
     *              <!-- children -->
     *          </div>
     *      </div>
     *      <!-- sibling -->
     * </div>
     * ```
     * @fires module:components/tree~"collapsed"
     * @listens module:components/tree~"update"
     * @listens module:components/tree~"remove"
     * @listens module:components/tree~"removeAll"
     * @listens module:components/tree~"insert"
     * @listens module:components/tree~"select"
     * @listens module:components/tree~"unselect"
     * @listens module:components/tree~"collapse"
     * @listens module:components/tree~"expand"
     * @tutorial component-usage
     * @tutorial component-tree
     * @tutorial component-list
     */
    module.exports = function (skin, options, solo) {
        var component = this,
            element = options.parent || skin.create('.skin-tree'),
            itemContentQuery = '.skin-tree-item > div > .content';

        var usedId = [];

        add(options.items);

        /*
            items = [{
                id: "",
                content: ...,
                onclick: f(),
                onmouseover: f()
                onmouseout: f()
                children: [ item, ... ]            
            }, ...]
        */

        function generateId(prefix) {
            prefix = prefix || '_';
            var i = 0,
                id,
                el = true;
            for (; el || usedId.indexOf(id) >= 0; i++) {
                id = prefix + i;
                el = element.querySelector(itemContentQuery + '[data-id="' + id + '"]');
            }
            return id;
        }

        function createTreeItem(item) {
            /*
                div.skin-tree-item
                    div 
                        div.collapse-button
                        div.content(data-id=item.id)
                            item.content
                    div.children
                        item.children.map(createTreeItem)
            */
            var leaf = !item.children || item.children.length === 0,
                collapse = leaf ? '' : skin.div('.collapse-button'),
                dt = skin.div('.content', item.content),
                dd = leaf ? '' : skin.div('.children', item.children.map(createTreeItem)),
                dl = skin.div('.skin-tree-item',
                    skin.div('', collapse, dt),
                    dd
                );

            var id = (item.id === void 0) ? (item.id = generateId()) : item.id;

            usedId.push(id);

            if (leaf) {
                dl.classList.add('skin-tree-item-leaf');
            }

            dt.dataset.id = id;

            if (item.onclick) dt.onclick = item.onclick;
            if (item.onmouseover) dt.onmouseover = item.onmouseover;
            if (item.onmouseout) dt.onmouseout = item.onmouseout;
            if (item.oncontextmenu) dt.oncontextmenu = item.oncontextmenu;

            if (item.onmouseover) {
                dt.classList.add('hoverable');
            }
            if (item.onclick) {
                dt.classList.add('clickable');
            }

            if (collapse) {
                if (options.collapsed) {
                    dl.classList.add('collapsed');
                }
                collapse.onclick = function () {
                    var isCollapsed = dl.classList.contains('collapsed');
                    if (isCollapsed) {
                        dl.classList.remove('collapsed');
                    } else {
                        dl.classList.add('collapsed');
                    }
                    /**
                     * The event is fired when the tree item is collapsed.
                     * @event module:components/tree~"collapsed"
                     * @type {arguments}
                     * @prop {string} id
                     * @prop {boolean} isCollapsed
                     * @prop {HTMLElement} element div.skin-tree-item
                     */
                    component.emit('collapsed', id, isCollapsed, dl);
                };

            }
            return dl;
        }

        function add(items, parent, before) {
            (items || []).forEach(function (item) {
                usedId = [];
                (parent || element).insertBefore(
                    createTreeItem(item),
                    before
                );
            });
        }

        /**
         * The event is used to update a content of the tree item.
         * @event module:components/tree~"update"
         * @type {arguments}
         * @prop {module:components/tree~TreeItemInfo} item
         */
        component.on('update', function (item) {
            var dt = element.querySelector(itemContentQuery + '[data-id="' + item.id + '"]');
            if (dt) {
                skin.clear(dt);
                dt.append(item.content);
            }
        });

        /**
         * The event is used to insert new tree items.
         * @event module:components/tree~"insert"
         * @type {arguments}
         * @prop {module:components/tree~TreeItemInfo[]} items
         * @prop {string|null} [parentId]
         * @prop {string} [beforeId]
         */
        component.on('insert', function (items, parentId, beforeId) {
            if (!items) return;
            if (!Array.isArray(items)) items = [items];
            if (!items.length) return;
            var dt = (parentId && element.querySelector(itemContentQuery + '[data-id="' + parentId + '"]')),
                dd = element;
            if (dt) {
                dd = dt.parentNode.parentNode.querySelector('.children');
                if (!dd && !beforeId) {
                    dd = dt.parentNode.parentNode.appendChild(skin.create('.children'));
                    var collapse = dt.parentNode.querySelector('.collapse-button');
                    if (!collapse) {
                        dt.parentNode.insertBefore(skin.create('.collapse-button', {
                            onclick: function () {
                                var dl = this.parentNode.parentNode;
                                var isCollapsed = dl.classList.contains('collapsed');
                                if (isCollapsed) {
                                    dl.classList.remove('collapsed');
                                } else {
                                    dl.classList.add('collapsed');
                                }
                                component.emit('collapsed', parentId, isCollapsed, dl);
                            }
                        }), dt.parentNode.firstChild);
                    }
                    dd.parentNode.classList.remove('skin-tree-item-leaf');
                }
            }
            if (dd) {
                var before;
                if (beforeId) {
                    before = dd.querySelector(itemContentQuery + '[data-id="' + beforeId + '"]');
                    if (before) {
                        before = before.parentNode.parentNode;
                        if (before.parentNode !== dd) {
                            before = null;
                        }
                    }
                    if (!before) {
                        return;
                    }
                }
                add(items, dd, before);
            }
        });

        /**
         * The event is used to remove the tree items.
         * @event module:components/tree~"remove"
         * @type {arguments}
         * @prop {string[]} ids
         * @prop {string} [parentId]
         */
        component.on('remove', function (ids, parentId) {
            var dt = (parentId && element.querySelector(itemContentQuery + '[data-id="' + parentId + '"]')),
                dd = element;
            if (dt) {
                dd = dt.parentNode.parentNode.querySelector('.children');
            }
            if (dd) {
                if (!Array.isArray(ids)) ids = [ids];
                ids.forEach(function (id) {
                    var itemContent = dd.querySelector(itemContentQuery + '[data-id="' + id + '"]');
                    if (itemContent) {
                        try {
                            dd.removeChild(itemContent.parentNode.parentNode);
                        } catch (e) { }
                    }
                });
                if (!dd.children.length) {
                    if (dt) {
                        var collapse = dt.parentNode.querySelector('.collapse-button');
                        if (collapse) {
                            collapse.parentNode.removeChild(collapse);
                        }
                        dd.parentNode.classList.add('skin-tree-item-leaf');
                        dd.parentNode.removeChild(dd);
                    }
                }
            }
        });

        /**
         * The event is used to remove all tree items.
         * @event module:components/tree~"removeAll"
         * @type {arguments}
         * @prop {string} [parentId]
         */
        component.on('removeAll', function (parentId) {
            if (!parentId) {
                skin.clear(element);
            } else {
                var dt = element.querySelector(itemContentQuery + '[data-id="' + parentId + '"]'),
                    dd;

                if (dt) {
                    dd = dt.parentNode.parentNode.querySelector('.children');
                    if (dd) {
                        var collapse = dt.parentNode.querySelector('.collapse-button');
                        if (collapse) {
                            collapse.parentNode.removeChild(collapse);
                        }
                        dd.parentNode.classList.add('skin-tree-item-leaf');
                        dd.parentNode.removeChild(dd);
                    }
                }
            }
        });

        /**
         * The event is used to select the tree items.
         * @event module:components/tree~"select"
         * @type {arguments}
         * @prop {string[]} ids
         */
        component.on('select', function (ids) {
            if (!ids) return;
            if (!Array.isArray(ids)) ids = [ids];
            ids.forEach(function (id) {
                var itemContent = element.querySelector(itemContentQuery + '[data-id="' + id + '"]');
                if (itemContent) {
                    itemContent.classList.add('selected');
                }
            });
        });

        /**
         * The event is used to unselect the tree items.
         * @event module:components/tree~"unselect"
         * @type {arguments}
         * @prop {string[]} [ids]
         */
        component.on('unselect', function (ids) {
            if (!ids) {
                element.querySelectorAll('.content.selected').forEach(function (el) {
                    el.classList.remove('selected');
                });
            } else {
                if (!Array.isArray(ids)) ids = [ids];
                ids.forEach(function (id) {
                    var itemContent = element.querySelector(itemContentQuery + '[data-id="' + id + '"]');
                    if (itemContent) {
                        itemContent.classList.remove('selected');
                    }
                });
            }
        });

        /**
         * The event is used to collapse the tree items.
         * @event module:components/tree~"collapse"
         * @type {arguments}
         * @prop {string} [id]
         */
        component.on('collapse', function (id) {
            if (id === void 0) {
                element.querySelectorAll('.skin-tree-item').forEach(function (el) {
                    el.classList.add('collapsed');
                });
            } else {
                var itemContent = element.querySelector(itemContentQuery + '[data-id="' + id + '"]');
                if (itemContent) {
                    itemContent.parentNode.parentNode.classList.add('collapsed');
                }
            }
        });

        /**
         * The event is used to expand the tree items.
         * @event module:components/tree~"expand"
         * @type {arguments}
         * @prop {string} [id]
         */
        component.on('expand', function (id) {
            if (id === void 0) {
                element.querySelectorAll('.skin-tree-item.collapsed').forEach(function (el) {
                    el.classList.remove('collapsed');
                });
            } else {
                var itemContent = element.querySelector(itemContentQuery + '[data-id="' + id + '"]');
                if (itemContent) {
                    itemContent.parentNode.parentNode.classList.remove('collapsed');
                }
            }
        });

        return this.exports(element);
    };
});

/**
 * The object represents information about a tree or list item, for example:
 * ```javascript
 * {
 *      id: "id-001",
 *      content: "First item",
 *      onclick: function () {},
 *      onmouseover: function () {},
 *      onmouseout: function () {},
 *      children: []
 * }
 * ```
 * @prop {string} id The ID of the item
 * @prop {HTMLElement|string|Array} content The content of the item.
 * @prop {funcion} [onclick] The `click` event handler. The element is clikable, if this handler is defined.
 * @prop {funcion} [onmouseover] The `mouseover` event handler. The element is hoverable, if this handler is defined.
 * @prop {funcion} [onmouseout] The `mouseout` event handler.
 * @prop {module:components/tree~TreeItemInfo[]} [children] Child elements in the case of a tree.
 * @typedef {object} module:components/tree~TreeItemInfo
 */