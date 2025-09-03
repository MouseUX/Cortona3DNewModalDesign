define(function (require, exports, module) {
    require('css!./solo-skin-ipc-cart.css');

    module.exports = function (skin, options, solo) {
        var component = this,
            i18n = solo.uniview.i18n['solo-skin-ipc-cart'] || {};
        uiModal = require('components/modal');

        var modal = skin.render(uiModal, {
            i18n: {
                close: i18n.close
            },
            footerContent: [
                skin.button({
                    id: 'btn-clear',
                    onclick: function () {
                        component.emit('clear');
                    }
                }, i18n.clear),
                skin.button({
                    id: 'btn-submit',
                    onclick: function () {
                        component.emit('order');
                    }
                }, i18n.order)
            ],
            hideDismissButton: false,
            title: i18n.orderList,
            content: skin.ol('.cart-list', options.orderList.map(function (item, index) {
                var input = skin.input({
                    type: 'number',
                    length: 4,
                    min: 1,
                    max: 9999,
                    value: item.qty,
                    oninput: function () {
                        if (isNaN(+this.value)) {
                            this.value = item.qty;
                        }
                        if (!this.value) {
                            this.value = 1;
                        }
                        item.qty = this.value;
                        component.emit('change', item);
                    },
                    onkeydown: function (e) {
                        switch (e.keyCode) {
                            case 38: // up
                                if (!isNaN(+this.value) && +this.value < this.max) {
                                    this.value = +this.value + 1;
                                    this.oninput.call(this);
                                } else {
                                    this.value = this.max;
                                }
                                break;
                            case 40: // down
                                if (!isNaN(+this.value) && +this.value > this.min) {
                                    this.value = +this.value - 1;
                                    this.oninput.call(this);
                                } else {
                                    this.value = this.min;
                                }
                                break;
                        }
                    }
                }),
                interval,
                timeout;
                return [
                    skin.create('.num'),
                    (typeof options.createOrderListItemInfo === 'function') ? options.createOrderListItemInfo(item) : [
                        skin.div('.pnr', item.info.part.metadata.PNR),
                        skin.div('.dfp', item.info.part.metadata.DFP),
                    ],
                    skin.create('.cart-list-input.nowrap',
                        skin.label('.nowrap',
                            input,
                            skin.create('.skin-input-number-steppers',
                                skin.button({
                                    className: "skin-input-number-button",
                                    onclick: function () {
                                        input.onkeydown.call(input, {
                                            keyCode: 38
                                        });
                                    },
                                    onmousedown: function (e) {
                                        timeout = setTimeout(function () {
                                            interval = setInterval(function () {
                                                input.onkeydown.call(input, {
                                                    keyCode: 38
                                                });
                                            }, 50);
                                        }, 500);
                                    },
                                    onmouseout: function (e) {
                                        clearInterval(interval);
                                        clearTimeout(timeout);
                                    },
                                    onmouseup: function (e) {
                                        clearInterval(interval);
                                        clearTimeout(timeout);
                                    }
                                }, '\u23F6'),
                                skin.button({
                                    className: "skin-input-number-button",
                                    onclick: function () {
                                        input.onkeydown.call(input, {
                                            keyCode: 40
                                        });
                                    },
                                    onmousedown: function (e) {
                                        timeout = setTimeout(function () {
                                            interval = setInterval(function () {
                                                input.onkeydown.call(input, {
                                                    keyCode: 40
                                                });
                                            }, 50);
                                        }, 500);
                                    },
                                    onmouseout: function (e) {
                                        clearInterval(interval);
                                        clearTimeout(timeout);
                                    },
                                    onmouseup: function (e) {
                                        clearInterval(interval);
                                        clearTimeout(timeout);
                                    }
                                }, '\u23F7')
                            )
                        ),
                        skin.button({
                            onclick: function () {
                                component.emit('remove', item);
                                skin.remove(this.parentNode.parentNode);
                                if (!skin.element.querySelectorAll('.cart-list li').length) {
                                    component.emit('clear');
                                }
                            }
                        }, '\u274C')
                    )
                ];
            }))
        });

        modal.$el.focus();

        modal.classList.add('cart');
        modal.on('closed', component.emit.bind(component, 'closed'));
        component.on('close', modal.emit.bind(modal, 'close'));
    };
});