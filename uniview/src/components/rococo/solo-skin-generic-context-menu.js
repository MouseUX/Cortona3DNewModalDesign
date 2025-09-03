/**
 * =@uniview.didCallContextMenu options
 */
/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop animated {boolean}
 * @prop fitSceneFactor {number}
 * @prop helpAction {function}
 */
define(function (require, exports, module) {

    var uiModal = require('components/modal'),
        uiContextMenu = require('components/context-menu');

    module.exports = function (skin, options, solo) {
        var overlength = require('lib/overlength');
        var m_animated = typeof options.animated === 'boolean' ? options.animated : true,
            i18n = solo.uniview.i18n['solo-skin-generic-context-menu'] || {},
            m_aboutAction = function () {
                var viewer = solo.uniview,
                    customization = (overlength(viewer.customization.description) + ' ' + viewer.customization.version).trim();
                var modal = skin.create(uiModal, {
                    hideDismissButton: true,
                    title: viewer.description,
                    content: [
                        skin.p('.accent', i18n.description),
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

        function getContextMenuOptions() {
            var menu = [];

            // sheet functions
            var vp = solo.app.getViewpoints(),
                vpActive = solo.app.activeViewpoint;

            if (vp.length) {

                vp.forEach(function (vpInfo) {
                    var isCurrent = vpInfo.handle === vpActive;
                    var description = vpInfo.description || vpInfo.name;
                    if (description) {
                        menu.push({
                            description: description,
                            checked: isCurrent,
                            disabled: isCurrent,
                            action: function (e) {
                                solo.app.activeViewpoint = vpInfo.handle;
                            }
                        });
                    }
                });
                menu.push(null);
            }
            /*
                        menu.push({
                            description: "Reset",
                            action: function (e) {
                                solo.app.setDefaultView(m_animated);
                            },
                        });
            */
            menu.push({
                description: i18n.fitAll,
                action: function (e) {
                    solo.app.fitSceneInView(m_animated, options.fitSceneFactor);
                },
            });

            menu.push(null);

            menu.push({
                disabled: !options.helpAction,
                description: i18n.help,
                action: options.helpAction
            });

            menu.push(null);

            menu.push({
                description: i18n.about,
                action: m_aboutAction
            });

            return menu;
        }

        // use popup menu
        solo.on('app.didCallContextMenu', function (x, y, target) {
            var options = {
                parent: document.body,
                menu: getContextMenuOptions(),
                x: x,
                y: y,
                target: target
            };
            solo.dispatch('uniview.didCallContextMenu', options);
            skin.create(uiContextMenu, options);
        });
    };
});