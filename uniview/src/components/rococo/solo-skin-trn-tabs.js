/**
 * @namespace Cortona3DSolo.uniview.options
 * @prop components {object}
 * @prop components.uiTrnTabDocument {factory}
 * @prop components.uiTrnTabComments {factory}
 * @prop components.uiTrnTabParts {factory}
 * @prop components.uiTrnTabParams {factory}
 * @prop components {boolean} HideDocumentTab
 * @prop components {boolean} HideInstructionsTab
 * @prop components {boolean} HideParametersTab
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-tabs.css');

    var uiTabs = require('components/tabs');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;

        var element = skin.container('.trn-tabs');

        var tabs = skin.create(uiTabs);

        element.append(tabs.$el);

        var opt = options.components || {},
            uiTrnTabDocument = opt.uiTrnTabDocument || require('./solo-skin-trn-tab-document'),
            uiTrnTabComments = opt.uiTrnTabComments || require('./solo-skin-trn-tab-comments'),
            uiTrnTabParts = opt.uiTrnTabParts || require('./solo-skin-trn-tab-parts'),
            uiTrnTabParams = opt.uiTrnTabParams || require('./solo-skin-trn-tab-params'); 

        var elementInstructions = skin.create(uiTrnTabComments, options).$el,
            elementDocument = skin.create(uiTrnTabDocument, options).$el;

        if (!solo.uniview.options.HideDocumentTab) tabs.emit('append', __("UI_TXT_TAB_DOC"), elementDocument);
        if (!solo.uniview.options.HideInstructionsTab) tabs.emit('append', __("UI_TXT_TAB_COM"), elementInstructions);
        tabs.emit('append', __("UI_TXT_TAB_PAR"), skin.create(uiTrnTabParts, options).$el);
        if (!solo.uniview.options.HideParametersTab) tabs.emit('append', __("UI_TXT_TAB_PRM"), skin.create(uiTrnTabParams, options).$el);

        this.on('setInstructionsHtml', function (html) {
            elementInstructions.innerHTML = html || '';
        });
        this.on('activate', function (n) {
            tabs.emit('activate', n);
        });
        
        return this.exports(element);
    };
});

