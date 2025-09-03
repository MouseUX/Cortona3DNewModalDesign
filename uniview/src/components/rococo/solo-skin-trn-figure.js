/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-figure.css');

    module.exports = function (skin, options, solo) {
        var __ = solo.uniview.i18n.__;
        var ixml = solo.app.procedure.interactivity;

        function getTrainingObjectsChain() {
            return solo.touch.lastPickInfo.chain
                .map(solo.app.getObjectName)
                .filter(function (def) {
                    return solo.training.interactivity.getObjectName(def);
                });
        }

        var m_hovered,
            m_entered;

        solo.on('touch.didObjectEnter', function (handle, objectName) {
            var chain = getTrainingObjectsChain();

            if (chain.length) {
                m_entered = objectName;
                m_hovered = chain[0];
                var docItemInfo = ixml.getDocItemInfo(ixml.getDocIdByObjectName(m_hovered)) || {};
                document.body.title = docItemInfo.screentip || solo.training.interactivity.getObjectName(m_hovered);
                solo.dispatch('training.didObjectHover', m_hovered);
            }
        });

        solo.on('touch.didObjectOut', function (handle, objectName) {
            if (objectName === m_entered) {
                document.body.title = '';
                solo.dispatch('training.didObjectOut', m_hovered);
                m_entered = null;
                m_hovered = null;
            }
        });


        solo.on('touch.didObjectClick', function (handle, objectName) {
            if (handle) {
                var chain = getTrainingObjectsChain();
                if (chain.length) {
                    solo.dispatch('training.didObjectClick', chain.length == 1 ? chain[0] : chain);
                }
            }
        });

        solo.on('training.didObjectHover', function (def) {
            solo.app.procedure.hoverObject(solo.app.getObjectWithName(def), true, true);
        });

        solo.on('training.didObjectOut', function (def) {
            solo.app.procedure.hoverObject(solo.app.getObjectWithName(def), false, true);
        });

        solo.on('training.didObjectLocate', function (def) {
            solo.app.procedure.drawAttention([solo.app.getObjectWithName(def)]);
        });
    };
});