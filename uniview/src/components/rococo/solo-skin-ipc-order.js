/**
 * The publishing option activates the built-in shopping cart functionality in Generic IPC.
 * @memberof Cortona3DSolo.uniview.options
 * @member {boolean} UseShoppingCart
 * @tutorial 20-usage
 */

/**
 * This option allows you to disable saving the order list in the browser.
 * @memberof Cortona3DSolo.uniview.options
 * @member {boolean} disableStorage
 */

/**
 * This option allows you to redefine the key name in the browser storage to save orders. 
 * By default, a string of the form is used:
 ```
 'solo-uniview-cart-' + Cortona3DSolo.uniview.options.SpecID.toLowerCase().replace(/_/g, '-')
 ```
 * @memberof Cortona3DSolo.uniview.options
 * @member {string} storageKey
 */

/**
 * The option allows you to use the browser's `localStorage` to store the order list, this allows you to store order data after closing the browser window. 
 * By default, `sessionStorage` is used.
 * @memberof Cortona3DSolo.uniview.options
 * @member {boolean} useLocalStorage
 */

/**
 * This option disables the button to show the built-in shopping cart user interface. 
 * In this case, the interface call to display the order basket must be implemented externally.
 * @memberof Cortona3DSolo.uniview.options
 * @member {boolean} disableShowCartButton
 */

/**
 * This option disables the display of the "ordered" status for the DPL row in the catalog. 
 * By default, the DPL row of the table that is present in the order list is marked with the `ordered` CSS class.
 * @memberof Cortona3DSolo.uniview.options
 * @member {boolean} disableAddToCartState
 */

/**
 * This option disables automatic cleaning of the order list after the built-in order procedure is completed. 
 * See {@link Cortona3DSolo~event:"uniview.order"}
 * @memberof Cortona3DSolo.uniview.options
 * @member {boolean} keepOrderListAfterSubmit
 */

/**
 * The order list is displayed in a tabular type:
 * <table>
 * <thead><tr><th>N</th><th>Order Item Info Slot</th><th>Qty</th><th>Remove</th></thead>
 * <tbody><tr><td>1</td><td>[<i>Part number</i>] [<i>Description of part</i>]</td><td><input value="2" size="4"></input></td><td><button>X</button></td></tr></tbody>
 * </table>
 * where
 *  <ul>
 * <li><b>N</b> - the sequential number of the item in the order list;</li>
 * <li><b>Order Item Info Slot</b> - information about the ordered part in this order item. By default two additional cells are displayed <i>Part Number</i> and <i>Description of part</i>;</li>
 * <li><b>Qty</b> - input field for changing the number of ordered parts in this order item;</li>
 * <li><b>Remove</b> - the button to remove the item from the order list.</li>
 * </ul>
 * 
 * The option allows you to set a function for generating text inside the __Order Item Info Slot__ for a specific position. 
 * An object of type {@link OrderItem} is passed to the function as an argument. 
 * The function should return a DOM node or an array of DOM nodes to display in the order list. 
 * Each node is displayed as a separate table cell inside __Order Item Info Slot__.
 * @memberof Cortona3DSolo.uniview.options
 * @member {createOrderListItemInfoFunc} createOrderListItemInfo
 * @example
    var h = Cortona3DSolo.app.ui.createElement.bind(Cortona3DSolo.app.ui);
    Cortona3DSolo.uniview = {
        options: {
            UseShoppingCart: true,
            createOrderListItemInfo: (orderItem) => [
                h('span', orderItem.info.part.metadata.DFP.toUpperCase()), 
                h('span', orderItem.info.part.metadata.PNR),
                h('small', orderItem.info.metadata.ITEM)
            ]
        }
    };
 */

/**
 * @callback createOrderListItemInfoFunc
 * @param {OrderItem} orderItem
 * @returns HTMLElement | HTMLElement[]
 */

/**
 * The option allows you to set a function to configure the default action when creating an order. 
 * The `this` object inside the function has a number of auxiliary methods for generating a CSV file in the browser.
```
function (orderList) {
    // this.concatCSVLine(str, ...) // -> quoted CSV line
    // this.getTimestampString() // -> string
    // this.joinCSVLine(arr) // -> CSV line
    // this.quoteCSVString(str) // -> quoted string
    // this.saveOrOpenCSV(fileName, csvSyntax)
    // this.setCSVOptions({ delimiter: ',', linefeed: '\n' })
    // this.exportToCSV(options) // action by default
}
```
 * @memberof Cortona3DSolo.uniview.options
 * @member {defaultOrderActionFunc} defaultOrderAction
 
 * @example
     Cortona3DSolo.uniview = {
        options: {
            UseShoppingCart: true,
            defaultOrderAction: function (orderList) {
                const exportCSV = this;

                exportCSV.setCSVOptions({
                    linefeed: "\r\n"
                });

                let fileName = 'order_' + exportCSV.getTimestampString() + '.csv',
                    csvSyntax = exportCSV.concatCSVLine('DESCRIPTION', 'PARTNUMBER', 'ITEM', 'QUANTITY');

                csvSyntax = orderList.reduce((csv, orderItem) => csv + exportCSV.concatCSVLine(
                    orderItem.info.part.metadata.DFP.toUpperCase(), 
                    orderItem.info.part.metadata.PNR, 
                    orderItem.info.metadata.ITEM,
                    orderItem.qty
                ), csvSyntax);

                exportCSV.saveOrOpenCSV(fileName, csvSyntax);
            }
        }
    };
 */

/**
 * @callback defaultOrderActionFunc
 * @param {Array.<OrderItem>} orderList
 */


define(function (require, exports, module) {
    require('css!./solo-skin-ipc-order.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['solo-skin-ipc-order'] || {},
            uiCart = require('./solo-skin-ipc-cart');

        var storage,
            storageKey = options.storageKey || 'solo-uniview-cart-' + solo.uniview.options.SpecID.toLowerCase().replace(/_/g, '-'),
            source = solo.app.modelInfo.companionFile;

        try {
            storage = options.disableStorage ? null : (options.useLocalStorage ? localStorage : sessionStorage);
        } catch (e) {
            storage = null;
        }

        var m_orderList = [];

        /*
        Array.prototype
        clear();
        add({});
        remove({});
        */

        /**
         * Built-in object of type `Array`, which contains the current order list.
         * 
         * @memberof Cortona3DSolo.uniview
         * @namespace orderList
         * @implements Array.<OrderItem>
         */

        Object.defineProperty(solo.uniview, 'orderList', {
            get: function () {
                return Object.defineProperties(m_orderList.slice(), {
                    /**
                     * Clears the order list.
                     * @memberof Cortona3DSolo.uniview.orderList
                     * @method clear
                     */
                    'clear': {
                        value: function () {
                            m_orderList.length = 0;
                            showOrderCounter();
                            saveStorage();
                        }
                    },
                    /**
                     * Adds a new item in the order list.
                     * @memberof Cortona3DSolo.uniview.orderList
                     * @method add
                     * @param {OrderItem} orderItem
                     * @example
// Adds a new item to the order list for the DPL row number
let orderItemInfo = Cortona3DSolo.app.ipc.interactivity.getItemInfo(row);

Cortona3DSolo.uniview.orderList.add({
    source: Cortona3DSolo.app.modelInfo.companionFile,
    info: orderItemInfo,
    qty: orderItemInfo.metadata.QNA
});
                     */
                    'add': {
                        value: function (item) {
                            if (m_orderList.indexOf(item) < 0) {
                                m_orderList.push(item);
                                showOrderCounter();
                                saveStorage();
                            }
                        }
                    },
                    /**
                     * Removes the item from the order list.
                     * @memberof Cortona3DSolo.uniview.orderList
                     * @method remove
                     * @param {OrderItem} orderItem
                     */
                    'remove': {
                        value: function (item) {
                            var index = m_orderList.indexOf(item);
                            if (index >= 0) {
                                m_orderList.splice(index, 1);
                                showOrderCounter();
                                saveStorage();
                            }
                        }
                    }
                });
            },
            set: function (array) {
                if (Array.isArray(array)) {
                    m_orderList = array.slice();
                    showOrderCounter();
                    saveStorage();
                }
            }
        });

        m_orderList = JSON.parse((storage && storage.getItem(storageKey)) || '[]');

        solo.on('uniview.toggleAddToCartState', function (row, flag) {
            var el = skin.element.querySelector('tr#row' + ixml.getIndexByRow(row));
            if (el) {
                el.classList.toggle('ordered', flag);
            }
        });

        function saveStorage() {
            if (storage) {
                storage.setItem(storageKey, JSON.stringify(m_orderList));
            }
        }

        function showOrderCounter() {
            if (orderCounter) {
                orderCounter.innerText = m_orderList.length || '';

                if (m_orderList.length) {
                    skin.show(orderCounter);
                    buttonShowCart.classList.remove('disabled');
                } else {
                    skin.hide(orderCounter);
                    buttonShowCart.classList.add('disabled');
                }
            }
        }

        var orderButton = skin.div('.shopping-cart'),
            orderCounter, buttonShowCart;

        if (!options.disableShowCartButton) {
            orderCounter = skin.div('.counter');
            buttonShowCart = skin.buttonImg({
                id: 'btn-order',
                title: i18n.order,
                onclick: function () {
                    solo.dispatch('uniview.willShowCart', solo.uniview.orderList);
                }
            });
            orderButton.append(
                buttonShowCart,
                orderCounter
            );
        }

        solo.on('uniview.willShowCart', solo.dispatch.bind(solo, 'uniview.showCart'));

        solo.on('uniview.showCart', function (orderList) {
            var cart = skin.render({
                component: uiCart,
                options: {
                    orderList: orderList
                }
            }, options);
            cart.on('closed', function () { 
                solo.removeAllListeners('uniview.closeCart'); 
            });
            cart.on('remove', solo.dispatch.bind(solo, 'uniview.willRemoveFromCart'));
            cart.on('clear', solo.dispatch.bind(solo, 'uniview.willClearCart'));
            cart.on('change', solo.dispatch.bind(solo, 'uniview.cartChanged'));
            cart.on('order', function () {
                solo.dispatch('uniview.willOrder', solo.uniview.orderList);
                if (!options.keepOrderListAfterSubmit) solo.dispatch('uniview.willClearCart');
            });
            solo.dispatch('uniview.didShowCart');
            solo.once('uniview.closeCart', cart.emit.bind(cart, 'close'));
        });

        solo.on('uniview.willRemoveFromCart', solo.dispatch.bind(solo, 'uniview.removeFromCart'));
        solo.on('uniview.willClearCart', function () {
            solo.dispatch('uniview.clearCart');
            solo.dispatch('uniview.closeCart');
        });
        solo.on('uniview.willOrder', function (orderList) {
            solo.dispatch('uniview.order', orderList);
            solo.dispatch('uniview.closeCart');
        });
        solo.on('uniview.willToggleAddToCartState', function (item, flag) {
            if (item.source === source && item.info && !options.disableAddToCartState) {
                solo.dispatch('uniview.toggleAddToCartState', item.info.row, flag);
            }
        });

        solo.on('uniview.removeFromCart', function (item) {
            // { source, info: { row } }
            if (typeof item === 'object' && item !== null) {
                solo.dispatch('uniview.willToggleAddToCartState', item, false);
                solo.uniview.orderList.remove(item);
            }
        });

        solo.on('uniview.clearCart', function () {
            solo.uniview.orderList
                .forEach(function (item) {
                    solo.dispatch('uniview.willToggleAddToCartState', item, false);
                });
            solo.uniview.orderList.clear();
        });

        // add extra "basket" column in DPL row
        solo.on('app.ipc.dpl.didSetupTable', function (dplTable) {
            dplTable.querySelector('colgroup').append(
                skin.create('col')
            );

            dplTable.querySelector('thead tr').append(
                skin.create('td')
            );

            dplTable.querySelector('tbody tr').append(
                skin.create('td.strut', {}, skin.div('', skin.create('pre', {}, 'WWW')))
            );
        });

        solo.on('app.ipc.dpl.didSetupRow', function (tr, index) {
            tr.append(
                skin.create('td', {},
                    skin.create('div.basket', {
                        title: i18n.addToCart,
                        onclick: function (event) {
                            solo.dispatch('uniview.willAddToCart', ixml.getRowByIndex(index));
                            event.stopPropagation();
                        }
                    })
                )
            );
        });

        solo.on('uniview.willAddToCart', solo.dispatch.bind(solo, 'uniview.addToCart'));

        solo.on('uniview.addToCart', function (row) {
            if (!solo.uniview.orderList.some(function (item) {
                return item.source === source && item.info && item.info.row === row;
            })) {
                var itemInfo = ixml.getItemInfo(row);
                var comments = '';
                try { comments = ixml.json.$('ipc/figure/ipc-table/table/tbody/row')[row].entry.slice(-1)[0].$text('para'); } catch (e) { }
                var item = {
                    source: source,
                    info: itemInfo,
                    comments: comments,
                    qty: itemInfo.metadata.QNA
                };
                solo.uniview.orderList.add(item);
                solo.dispatch('uniview.willToggleAddToCartState', item, true);
            }
        });

        solo.on('app.ipc.didSelectSheet', function () {
            solo.uniview.orderList
                .forEach(function (item) {
                    solo.dispatch('uniview.willToggleAddToCartState', item, true);
                });
        });

        showOrderCounter();

        return this.exports(orderButton);
    };
});

/**
 * The event is fired when you click the button to open the built-in user interface of the shopping cart with an order list. 
 * The default handler calls the {@link Cortona3DSolo~event:"uniview.showCart"} event.
 * @event Cortona3DSolo~"uniview.willShowCart"
 * @type {arguments}
 * @prop {Array.<OrderItem>} orderList
 * @example Cortona3DSolo.on('uniview.willShowCart', orderList => {})
 * @fires {@link Cortona3DSolo~event:"uniview.showCart"}
 */

/**
 * The event is fired when the remove button in the order list of the built-in shopping cart user interface is clicked. 
 * The default handler calls the {@link Cortona3DSolo~event:"uniview.removeFromCart"} event.
 * @event Cortona3DSolo~"uniview.willRemoveFromCart"
 * @type {arguments}
 * @prop {OrderItem} orderItem
 * @example Cortona3DSolo.on('uniview.willRemoveFromCart', orderItem => {})
 * @fires {@link Cortona3DSolo~event:"uniview.removeFromCart"}
 */

/**
 * The event is fired when the clear order list button is clicked in the built-in shopping cart user interface. 
 * The default handler calls the {@link Cortona3DSolo~event:"uniview.clearCart"} event.
 * @event Cortona3DSolo~"uniview.willClearCart"
 * @example Cortona3DSolo.on('uniview.willClearCart')
 * @fires {@link Cortona3DSolo~event:"uniview.clearCart"}
 */

/**
 * The event is fired when the order button is clicked in the built-in shopping cart user interface. 
 * The default handler calls the {@link Cortona3DSolo~event:"uniview.order"} event.
 * @event Cortona3DSolo~"uniview.willOrder"
 * @type {arguments}
 * @prop {Array.<OrderItem>} orderList
 * @example Cortona3DSolo.on('uniview.willOrder', orderList => {})
 * @fires {@link Cortona3DSolo~event:"uniview.order"}
 */

/**
 * The event is fired when the add to cart button is clicked in the DPL row of the catalog. 
 * The default handler calls the {@link Cortona3DSolo~event:"uniview.addToCart"} event.
 * @event Cortona3DSolo~"uniview.willAddToCart"
 * @type {arguments}
 * @prop {number} row
 * @example Cortona3DSolo.on('uniview.willAddToCart', row => {})
 * @fires {@link Cortona3DSolo~event:"uniview.addToCart"}
 */

/**
 * The event is fired when it is necessary to change the "ordered" state for the DPL line. 
 * The default handler calls the {@link Cortona3DSolo~event:"uniview.toggleAddToCartState"} event for the corresponding DPL row of the loaded catalog.
 * @event Cortona3DSolo~"uniview.willToggleAddToCartState"
 * @type {arguments}
 * @prop {OrderItem} orderItem
 * @prop {boolean} flag
 * @example Cortona3DSolo.on('uniview.willToggleAddToCartState', (orderItem, flag) => {})
 * @fires {@link Cortona3DSolo~event:"uniview.toggleAddToCartState"}
 */

/**
 * The event is called to display the user interface of the shopping cart with an order list. 
 * Fires the {@link Cortona3DSolo~event:"uniview.didShowCart"} event after the shopping cart is displayed.
 * @event Cortona3DSolo~"uniview.showCart"
 * @type {arguments}
 * @prop {Array.<OrderItem>} orderList
 * @example Cortona3DSolo.on('uniview.showCart', orderList => {})
 * @see {@link Cortona3DSolo~event:"uniview.willShowCart"}
 * @fires {@link Cortona3DSolo~event:"uniview.didShowCart"}
 */

/**
 * The event is fired when the built-in shopping cart user interface is displayed.
 * @event Cortona3DSolo~"uniview.didShowCart"
 * @example Cortona3DSolo.on('uniview.didShowCart')
 * @see {@link Cortona3DSolo~event:"uniview.showCart"}
 */

/**
 * The event is called to delete an order item from the shopping cart.
 * @event Cortona3DSolo~"uniview.removeFromCart"
 * @type {arguments}
 * @prop {OrderItem} orderItem
 * @example Cortona3DSolo.on('uniview.removeFromCart', orderItem => {})
 * @see {@link Cortona3DSolo~event:"uniview.willRemoveFromCart"}
 */

/**
 * The event is called to clear the order list.
 * @event Cortona3DSolo~"uniview.clearCart"
 * @example Cortona3DSolo.on('uniview.clearCart')
 * @see {@link Cortona3DSolo~event:"uniview.willClearCart"}
 */

/**
 * The event is called to generate an order in the external system.
 * By default, the function specified in the {@link Cortona3DSolo.uniview.options.defaultOrderAction defaultOrderAction} option will be executed.
 * If this option is not specified, a CSV file with a list of orders will be generated.
 * @event Cortona3DSolo~"uniview.order"
 * @type {arguments}
 * @prop {Array.<OrderItem>} orderList
 * @example Cortona3DSolo.on('uniview.order', orderList => {})
 * @see {@link Cortona3DSolo~event:"uniview.willOrder"}
 * @see {@link Cortona3DSolo.uniview.options.defaultOrderAction defaultOrderAction}
 */

/**
 * The event is called to add an item to the order list for the DPL row with the number `row`. 
 * By default, the quantity in the order position is selected equal to the value of the QNA metadata in this DPL row.
 * @event Cortona3DSolo~"uniview.addToCart"
 * @type {arguments}
 * @prop {number} row
 * @example Cortona3DSolo.on('uniview.addToCart', row => {})
 * @see {@link Cortona3DSolo~event:"uniview.willAddToCart"}
 */

/**
 * The event is called to change the ordered state of the DPL row with the number `row`. 
 * By default, the CSS class `.ordered` is switched in the DPL row of the catalog.
 * @event Cortona3DSolo~"uniview.toggleAddToCartState"
 * @type {arguments}
 * @prop {number} row
 * @prop {boolean} flag
 * @example Cortona3DSolo.on('uniview.toggleAddToCartState', (row, flag) => {})
 * @see {@link Cortona3DSolo~event:"uniview.willToggleAddToCartState"}
 */

/**
 * The event is triggered when the quantity of order items changes.
 * @event Cortona3DSolo~"uniview.cartChanged"
 * @type {arguments}
 * @prop {OrderItem} orderItem
 * @example Cortona3DSolo.on('uniview.cartChanged', orderItem => {})
 */

/**
 * The event is called to close the user interface of the shopping cart.
 * @event Cortona3DSolo~"uniview.closeCart"
 * @example Cortona3DSolo.on('uniview.closeCart')
 */

/**
 * The object of the order list.
 * @typedef {Object} OrderItem
 * @property {string} source - __Required field__. Contains the interactivity.xml file name of the catalog for the ordered DPL row. It is used to link an item from the order list to its corresponding catalog when displaying the status "ordered" of the DPL row in the catalog.
 * @property {CatalogItemInfo} info - __Required field__. Contains the `CatalogItemInfo` object of the ordered DPL row.
 * 
 * Access to metadata:
```javascript
// Metadata of the DPL row
orderItem.info.metadata
// Part Metadata
orderItem.info.part.metadata
// The sequence number of the DPL row in the catalog
orderItem.info.row
```
 * Metadata is accessed by their ID.
 *
 * Basic metadata of the Generic IPC specification:
 * - `orderItem.info.part.metadata.PNR` - Part number
 * - `orderItem.info.part.metadata.DFP` - Description of part
 * - `orderItem.info.metadata.QNA` - Quantity per next higher assembly
 * - `orderItem.info.metadata.ITEM` - Item number
 *
 * @property {number} qty - The quantity of this item in the order.
 * @see {@link Cortona3DSolo.uniview.orderList}
 * @example
// Create an order item for the DPL row
var orderItem = {};
orderItem.source = Cortona3DSolo.app.modelInfo.companionFile; // required
orderItem.info = Cortona3DSolo.app.ipc.interactivity.getItemInfo(row); // required
orderItem.qty = orderItem.info.metadata.QNA;

Cortona3DSolo.uniview.orderList.add(orderItem);

 */