/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop animated {boolean}
 * @prop helpAction {function}
 */
define(function (require, exports, module) {

    var uiModal = require('components/modal'),
        uiContextMenu = require('components/context-menu');

    module.exports = function (skin, options, solo) {
        var overlength = require('lib/overlength');
        var m_animated = typeof options.animated === 'boolean' ? options.animated : true,
            m_menu = require('./context-menu-items-drawing'),
            i18n = solo.uniview.i18n['solo-skin-drawing-context-menu'] || {},
            m_aboutAction = function () {
                var desc = (solo.app.drawing.svg.querySelector('desc') || {}).textContent || '',
                    viewer = solo.uniview,
                    customization = (overlength(viewer.customization.description) + ' ' + viewer.customization.version).trim();
                var modal = skin.create(uiModal, {
                    hideDismissButton: true,
                    title: viewer.description,
                    content: [
                        skin.p('.accent', i18n.description),
                        parseDesc(desc),
                        skin.create('hr'),
                        skin.p('.about-section',
                            skin.div({}, viewer.description + " " + viewer.version),
                            skin.div({}, "Cortona3D Solo " + solo.app.version()),
                            !customization ? '' : skin.div({}, customization)
                        )
                    ]
                });
                modal.classList.add('about');
                solo.skin.get('app').append(modal);
            };

        function parseDesc(desc) {
            var parsed = {};
            var re = /"([^"]+):([^"]+)"/g;
            while (re.exec(desc)) {
                parsed[RegExp.$1] = RegExp.$2;
            }
            var res = skin.create('div', {});
            if (parsed.ProfileId) {
                res.append(skin.div({}, i18n.profile, " ", parsed.ProfileId, " ", parsed.ProfileEd || ""));
            }
            if (parsed.Source) {
                res.append(skin.div({}, i18n.source, " ", parsed.Source));
            }
            if (parsed.Date) {
                res.append(skin.div({}, i18n.date, parsed.Date));
            }
            return res;
        }

        m_menu.push(null);

        m_menu.push({
            disabled: !options.helpAction,
            description: i18n.help,
            action: options.helpAction
        });

        m_menu.push(null);

        m_menu.push({
            description: i18n.about,
            action: m_aboutAction
        });

        solo.on('app.drawing.didCallContextMenu', function (name, x, y, target) {
            var options = {
                parent: document.body,
                menu: Array.prototype.slice.call(m_menu),
                name: name,
                x: x,
                y: y,
                target: target
            };
            solo.dispatch('uniview.didCallContextMenu', options);
            skin.create(uiContextMenu, options);
        });
    };
});

/**
 * @event Cortona3DSolo~"uniview.didCallContextMenu"
 * @type {object}
 * @prop {HTMLElement} parent
 * @prop {MenuObject[]} menu
 * @prop {string} [name] Hotsppot name
 * @prop {number} x
 * @prop {number} y
 * @prop {HTMLElement} target
 */