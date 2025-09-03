/**
 * 
 */
define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        function openHandler(event) {
            var target = this.getAttribute('target') || '_self',
                href = this.getAttribute('href'),
                keyref = this.dataset.keyref;

            if (target === '_self') {
                event.preventDefault();
                if (!keyref) {
                    keyref = (findByHref(this.getAttribute('href')) || {}).id;
                }
                var descriptor = solo.structure.uriIndex['URN:DITA:' + keyref];
                solo.dispatch('structure.didStructureItemClick', {
                    descriptor: descriptor
                });
            }
        }
        function findByHref(href) {
            if (!href) return;
            var fn = href.replace(/\.htm.*/i, ''),
                res = solo.structure.itemNavigateIndex.find(function (res) {
                    return res.href && (res.href.replace(/(^.*[\/\\]|\.interactivity\.xml$)/g, '') === fn)
                });
            return res;
        }
        solo.on('iframe.ready', function (descriptor, iframe, searchText) {
            var iframeSolo = iframe.window.Cortona3DSolo;
            if (iframeSolo.app.ipc) {
                iframeSolo.on('app.ipc.dpl.didSetupRow', function (rowElement, index) {
                    rowElement.querySelectorAll('a').forEach(function (a) {
                        if (!a.dataset.keyref) {
                            a.target = '_blank';
                            var href = a.getAttribute('href'),
                                res = findByHref(href);
                            if (res) {
                                a.dataset.keyref = res.id;
                                a.onclick = openHandler;
                                a.target = '_self';
                            }
                        } else {
                            a.target = '_self';
                        }
                    });
                });
                iframeSolo.dispatch('app.ipc.didSelectSheet', iframeSolo.app.ipc.currentSheetInfo);
            }
        });
        return skin.use(require('./s1000d4_1_pm'), solo.expand({
            childOptions: {
                testDataLink: function (name) {
                    var descriptor = true,
                        target = this.getAttribute('target') || '_self',
                        keyref = this.dataset.keyref;
                    if (name === 'open' && (target === '_self' || keyref)) {
                        if (!keyref) {
                            keyref = (findByHref(this.getAttribute('href')) || {}).id;
                        }
                        descriptor = !!solo.structure.uriIndex['URN:DITA:' + keyref];
                        if (!descriptor) {
                            if (target === '_self') {
                                this.classList.add('disabled');
                            }
                        } else {
                            this.target = '_self';
                        }
                    }
                    return descriptor;
                },
                handlers: {
                    open: openHandler
                }
            }
        }, options));
    };
});