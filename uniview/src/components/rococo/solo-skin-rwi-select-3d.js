define(function (require, exports, module) {
    'use strict';

    require('css!./solo-skin-rwi-select-3d.css');

    module.exports = function (skin, options, solo) {
        var m_selectedDocId = null;

        function unselect() {
            if (m_selectedDocId) {
                var a = m_selectedDocId;
                if (typeof m_selectedDocId === 'string') {
                    a = [m_selectedDocId];
                }
                a.forEach(function (docid) {
                    solo.app.procedure.selectItem(docid, false, true);
                }); 
                m_selectedDocId = null;
                solo.dispatch('uniview.didObjectSelection');
            }
        }

        function select(docid) {
            var a = docid;
            if (typeof docid === 'string') {
                a = [docid];
            }
            a.forEach(function (docid) {
                solo.app.procedure.selectItem(docid, true, true);
            }); 
            m_selectedDocId = docid;
            solo.dispatch('uniview.didObjectSelection', docid);
        }

        solo.on('procedure.didObjectClick', function (docid) {
            unselect();
            select(docid);
        });

        solo.on('touch.didObjectClick', function (handle) {
            if (!handle) {
                unselect();
            }
        });

        solo.on('app.procedure.didPlay', unselect);
        solo.on('app.procedure.didChangePlayerState', unselect);

        solo.on('uniview.didObjectSelection', function (docid) {
            document.querySelectorAll('[data-id].selected').forEach(function (node) {
                node.classList.remove('selected');
            });
            if (docid) {
                var a = docid;
                if (typeof docid === 'string') {
                    a = [docid];
                }
                a.forEach(function (docid) {
                    document.querySelectorAll('[data-id="' + docid + '"]').forEach(function (node) {
                        node.classList.add('selected');
                    });
                });
            }
        });

    };
});