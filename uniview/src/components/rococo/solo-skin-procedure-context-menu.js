/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop animated {boolean}
 * @prop drawingMode {boolean}
 * @prop fitSceneFactor {number}
 * @prop helpAction {functiion}
 */
define(function (require, exports, module) {

    var uiModal = require('components/modal'),
        uiContextMenu = require('components/context-menu');

    module.exports = function (skin, options, solo) {
        var overlength = require('lib/overlength');
        var i18n = solo.uniview.i18n['solo-skin-procedure-context-menu'] || {};
        var m_animated = typeof options.animated === 'boolean' ? options.animated : true,
            m_drawingMode = options.drawingMode,
            m_aboutAction = function () {
                var opt = solo.uniview.options,
                    lang = opt.SpecLang ? " (" + opt.SpecLang + ")" : "",
                    viewer = solo.uniview,
                    customization = (overlength(viewer.customization.description) + ' ' + viewer.customization.version).trim(),
                    spec = opt.SpecID ? skin.p('.about-section',
                        skin.div({}, opt.SpecID + " " + opt.SpecVersion + lang),
                        opt.PublisherVersion ? skin.div({}, i18n.publisher + " " + opt.PublisherVersion) : ''
                    ) : '';

                var modal = skin.create(uiModal, {
                    hideDismissButton: true,
                    title: viewer.description,
                    content: [
                        skin.p('.accent', i18n.description),
                        spec,
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

        function getContextMenuOptions() {
            var menu = [];

            if (m_drawingMode) {
                menu = menu.concat(require('./context-menu-items-drawing'));
            } else {
                menu.push({
                    description: i18n.reset,
                    action: function (e) {
                        solo.app.setDefaultView(m_animated);
                        solo.app.setSelectedObjects([], m_animated);
                        solo.app.restoreObjectProperty(0, solo.app.PROPERTY_TRANSPARENCY, m_animated);
                        solo.app.restoreObjectProperty(0, solo.app.PROPERTY_VISIBILITY, m_animated);
                        solo.dispatch('uniview.didReset');
                    },
                });
                menu.push({
                    description: i18n.fitAll,
                    action: function (e) {
                        solo.app.fitSceneInView(m_animated, options.fitSceneFactor);
                    },
                });
            }

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

        solo.on('app.procedure.didDrawingDisplayMode', function (drawingMode) {
            m_drawingMode = drawingMode;
        });

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

        solo.on('app.drawing.didCallContextMenu', function (name, x, y, target) {
            var options = {
                parent: document.body,
                menu: getContextMenuOptions(),
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