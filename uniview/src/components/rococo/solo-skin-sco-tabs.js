/**
 * 
 */
define(function (require, exports, module) {
    require('css!./solo-skin-sco-tabs.css');

    var uiTabs = require('components/tabs');

    module.exports = function (skin, options, solo) {
        var element = skin.container('.sco-tabs');

        var unloadTabsId = [];
            tabs = skin.create(uiTabs);

        element.append(tabs.element);
        
        var i, id, label, item,
            opt = options.components || {},
            uiScoTabTrainingStep = opt.uiScoTabTrainingStep || require('./solo-skin-sco-tab-trainingStep');
        
        //skin == doc
        var trainingSteps = skin.element.querySelectorAll('.trainingStep');
        for (i = 0; i < trainingSteps.length; i++) {
            id = trainingSteps[i].id;
            label = trainingSteps[i].querySelector('.simplePara').innerText;
            tabs.emit('append', label, skin.create(uiScoTabTrainingStep, solo.expand({
                traingStepId: id
            }, options)).$el);
            unloadTabsId.push(id);
        }

        var deleteRenederContent = skin.element.querySelectorAll('.doc-container>.dmodule>.content, .doc-container>.dmodule>.pageSequence>.content');
        for (i = 0; i < deleteRenederContent.length; i++) {
            item = deleteRenederContent.item(i);
            item.parentElement.removeChild(item);
        }
        /*deleteRenederContent.forEach(function(item) {
            item.parentElement.removeChild(item);
        });*/

        
        solo.on('uniview.sco.tabLoaded', function (tabId) {
            unloadTabsId.splice(unloadTabsId.indexOf(tabId), 1);
            if (!unloadTabsId.length) {
                solo.dispatch('uniview.sco.allTabsLoaded');
            }
        });

        solo.on('uniview.component.tabs.activateByNumber', function (n) {
            tabs.emit('activate', n);
        });

        return this.exports(element);
    };
});