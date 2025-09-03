define(function (require, exports, module) {
    require('css!./solo-skin-settings-item.css');

    /**
     * @param {object} options
     * @param {string} options.name
     * @param {string} [options.label]
     * @param {string} [options.title]
     * @param {string} [options.id]
     * @param {string} [options.type='checkbox']
     * @param {any} [options.value]
     * @param {function} [options.onchange]
     * @param {object[]} [options.choice]
     * @param {boolean} [options.disabled]
     * @param {boolean} [options.hidden]
     * @param {number} [options.tabindex=-1]
     * @fires Cortona3DSolo~"uniview.settings.changed<name>"
     * @listen Cortona3DSolo~"uniview.settings.set<name>"
     * @listen Cortona3DSolo~"uniview.settings.disable<name>"
     * @listen Cortona3DSolo~"uniview.settings.hide<name>"
     */
    module.exports = function (skin, options, solo) {

        var control,
            type = (typeof options.type != 'string') ? 'checkbox' : options.type,
            tabindex = (typeof options.tabindex == 'undefined') ? -1 : options.tabindex,
            m_value = options.value;

        if (!options.name) throw new Error('Missing options.name property');

        function buttonChecked(value) {
            if (value) {
                control.classList.add('checked');
            } else {
                control.classList.remove('checked');
            }
        }

        if (solo.uniview.settings) {
            var initialValue = solo.uniview.settings[options.name];
            Object.defineProperty(solo.uniview.settings, options.name, {
                get: function () {
                    return m_value;
                },
                set: function (value) {
                    solo.dispatch('uniview.settings.set' + options.name, value);
                },
                enumerable: true,
                configurable: true
            });

            if (typeof initialValue !== 'undefined') {
                m_value = initialValue;
            }
        }

        switch (type) {
            case 'radio':
                control = skin.create('form#' + (options.id || 'options-' + options.name.toLowerCase()),
                    options.choice.map(function (item, index) {
                        return skin.label('',
                            skin.create('span.label-control.label-control-radio',
                                skin.input({
                                    type: 'radio',
                                    name: options.name,
                                    value: typeof item.value !== 'undefined' ? item.value : index,
                                    checked: item.selected,
                                    tabIndex: tabindex,
                                    onclick: function () {
                                        m_value = control.elements[options.name].value;
                                        solo.dispatch('uniview.settings.changed' + options.name, m_value);
                                    }
                                })
                            ),
                            skin.create('span.label-text.label-text-radio', item.description)
                        );
                    }));
                m_value = control.elements[options.name].value;
                break;
            case 'select':
                control = skin.select({
                    value: m_value,
                    tabIndex: tabindex,
                    onchange: function () {
                        m_value = this.value;
                        this.title = this.options[this.selectedIndex].text || '';
                        solo.dispatch('uniview.settings.changed' + options.name, m_value);
                    }
                }, options.choice);
                m_value = control.value;
                control.title = (control.options[control.selectedIndex] || {}).text || '';
                break;
            case 'button':
                m_value = !!m_value;
                control = skin.button({
                    id: options.id || 'btn-' + options.name.toLowerCase(),
                    title: options.title,
                    tabIndex: tabindex,
                    onclick: function () {
                        m_value = !m_value;
                        buttonChecked(m_value);
                        solo.dispatch('uniview.settings.changed' + options.name, m_value);
                    }
                }, options.label);
                buttonChecked(m_value);
                break;
            case 'buttonImg':
                m_value = !!m_value;
                control = skin.buttonImg({
                    id: options.id || 'btn-' + options.name.toLowerCase(),
                    title: options.label || options.title,
                    tabIndex: tabindex,
                    onclick: function () {
                        m_value = !m_value;
                        buttonChecked(m_value);
                        solo.dispatch('uniview.settings.changed' + options.name, m_value);
                    }
                });
                buttonChecked(m_value);
                break;
            default:
                m_value = !!m_value;
                control = skin.input({
                    type: 'checkbox',
                    checked: m_value,
                    tabIndex: tabindex,
                    onclick: function () {
                        m_value = this.checked;
                        solo.dispatch('uniview.settings.changed' + options.name, m_value);
                    }
                });
        }

        var element = control;

        if (!/^(button|radio)/.test(type)) {
            var typeLowerCase = type.toLowerCase(),
                elementSelector = '#' + (options.id || 'options-' + options.name.toLowerCase()),
                label = skin.create('span.label-text.label-text-' + typeLowerCase, options.label || options.title),
                labelControl = skin.create('span.label-control.label-control-' + typeLowerCase, control);
            if (type === 'checkbox') {
                element = skin.label(elementSelector,
                    labelControl,
                    label
                );
            } else {
                element = skin.label(elementSelector,
                    label,
                    labelControl
                );
            }
        }

        if (typeof options.onchange === 'function') {
            solo.on('uniview.settings.changed' + options.name, options.onchange);
        }

        solo.on('uniview.settings.set' + options.name, function (value) {
            var currentValue,
                newValue;
            switch (type) {
                case 'checkbox':
                    currentValue = control.checked;
                    control.checked = !!value;
                    newValue = control.checked;
                    break;
                case 'button':
                case 'buttonImg':
                    currentValue = m_value;
                    m_value = value;
                    buttonChecked(value);
                    newValue = m_value;
                    break;
                case 'select':
                    currentValue = control.value;
                    if (typeof value === 'undefined') {
                        control.selectedIndex = 0;
                    } else {
                        control.value = value;
                    }
                    newValue = control.value;
                    control.title = (control.options[control.selectedIndex] || {}).text || '';
                    break;
                case 'radio':
                    currentValue = control.elements[options.name].value;
                    if (typeof value === 'undefined') {
                        control.elements[options.name][0] = value;
                    } else {
                        control.elements[options.name].value = value;
                    }
                    newValue = control.elements[options.name].value;
                    break;
                default:
                    currentValue = control.value;
                    control.value = value;
                    newValue = control.value;
            }
            m_value = value;
            if (currentValue != newValue) {
                solo.dispatch('uniview.settings.changed' + options.name, value);
            }
        });

        solo.on('uniview.settings.disable' + options.name, function (value) {
            control.disabled = value;
            element.querySelectorAll('input, button, select').forEach(function (node) {
                node.disabled = value;
            });
            if (value) {
                element.classList.add('disabled');
            } else {
                element.classList.remove('disabled');
            }
        });

        solo.on('uniview.settings.hide' + options.name, function (value) {
            if (value) {
                skin.hide(element, true);
            } else {
                skin.show(element);
            }
        });

        if (options.disabled) {
            solo.dispatch('uniview.settings.disable' + options.name, true);
        }

        if (options.hidden) {
            skin.hide(element, true);
        }

        if (!options.disabled) {
            setTimeout(function () {
                solo.dispatch('uniview.settings.changed' + options.name, m_value);
            }, 0);
        }

        return element;
    };
});