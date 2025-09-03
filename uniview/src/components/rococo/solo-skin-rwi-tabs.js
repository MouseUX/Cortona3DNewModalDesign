/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop components {object}
 * @prop components.uiRwiTabPrerequisite {factory}
 * @prop components.uiRwiTabBom {factory}
 * @prop components.uiRwiTabInstructions {factory}
 * @prop components.uiRwiTabDocument {factory}
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-tabs.css');

    var uiTabs = require('components/tabs');

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n['solo-skin-rwi-tabs'] || {},
            element = skin.container('.rwi-tabs');

        var tabs = skin.create(uiTabs),
            tabIndexMap = [],
            counter = 0;

        element.append(tabs.$el);

        var opt = options.components || {},
            uiRwiTabPrerequisite = opt.uiRwiTabPrerequisite || require('./solo-skin-rwi-tab-prerequisite'),
            uiRwiTabBom = opt.uiRwiTabBom || require('./solo-skin-rwi-tab-bom'),
            uiRwiTabInstructions = opt.uiRwiTabInstructions || require('./solo-skin-rwi-tab-instructions'),
            uiRwiTabDocument = opt.uiRwiTabDocument || require('./solo-skin-rwi-tab-document');

        function appendTab(name, factory, local) {
            var component = skin.create(factory, solo.expand({}, options, local || {}));
            if (component.$el) {
                tabs.emit('append', name, component.$el);
                tabIndexMap.push(counter);
            }
            counter++;
        }

        appendTab(i18n.prerequisite, uiRwiTabPrerequisite);
        appendTab(i18n.BOM, uiRwiTabBom,  {
            filter: function (item) {
                return item.type !== 'resource';
            }
        });
        appendTab(i18n.resources, uiRwiTabBom,  {
            filter: function (item) {
                return item.type === 'resource';
            }
        });
        appendTab(i18n.instructions, uiRwiTabInstructions);
        appendTab(i18n.document, uiRwiTabDocument);

        solo.on('uniview.activateRwiTab', function (n) {
            var index = tabIndexMap.indexOf(n);
            if (index >= 0) {
                tabs.emit('activate', index);
            }
        });
        
        return this.exports(element, {
            appendTab: appendTab
        });
    };
});