define(function (require, exports, module) {
    function $$(selector, node) {
        return Array.prototype.slice.call((node || document).querySelectorAll(selector));
    }

    function $$ch(selector, node) {
        return $$(selector, node).filter(n => n.parentNode === node);
    }

    module.exports = function (skin, options, solo) {
        const uiContextMenu = require('components/context-menu');
        const urlMap = {},
            hotspotMap = {};

        solo.on('uniview.clearAllSelectedObjects', () => {
            solo.app.drawing.setSelectedObjects([]);
            solo.dispatch('uniview.secondaryFigure.setSelectedObjects', []);
        })

        solo.on('uniview.didLoadIllustration', (url, icn) => {
            if (!icn) return;
            urlMap[url] = icn;
            if (!hotspotMap[icn]) {
                hotspotMap[icn] = Array.prototype.slice.call(document.querySelectorAll('.graphic-link[data-infoEntityIdent="' + icn + '"] .hotspot'));
            }
        });

        solo.on('app.drawing.didSelectHotspot', (name, key, url, x, y) => {
            if (!url) {
                const rect = solo.app.drawing.svg.getBoundingClientRect();
                x = solo.app.drawing.lastPointerX + rect.left;
                y = solo.app.drawing.lastPointerY + rect.top;
                url = solo.app.drawing.src;
                solo.app.drawing.setSelectedObjects(name);
            } else {
                solo.dispatch('uniview.secondaryFigure.setSelectedObjects', name);
            }

            let hotspots = hotspotMap[urlMap[url]].filter(hotspot => hotspot.dataset.applicationstructurename === name),
                links = [];

            function isEqualDataset(dataset1, dataset2) {
                for (var key in dataset1) {
                    if (dataset1[key] !== dataset2[key]) return false;
                }
                for (var key in dataset2) {
                    if (dataset1[key] !== dataset2[key]) return false;
                }
                return true;
            }

            function isSameLink(link1, link2) {
                return (link1.href === link2.href && link1.className === link2.className && isEqualDataset(link1.dataset, link2.dataset));
            }

            hotspots
                .flatMap(hotspot => $$ch('.dmRef, .internalRef, .catalogSeqNumberRef', hotspot))
                .forEach(link => {
                    if (!links.find(lnk => isSameLink(lnk, link))) {
                        links.push(link);
                    }
                });

            //if (links.length === 1) links[0].click(); else
            if (links.length) {
                let options = {
                    parent: document.body,
                    //closeEvents: ['wheel'],
                    menu: links
                        .map(link => {
                            return {
                                label: link.cloneNode(true), 
                                action: () => link.click()
                            };
                        }),
                    x: x + 10,
                    y: y + 10,
                    target: document.body
                };
                let popup = skin.create(uiContextMenu, options);
                let closeMenu = () => popup.emit('close');
                solo.once('uniview.secondaryFigure.contextMenuShouldBeClosed', closeMenu);
                popup.on('closed', () => solo.removeListener('uniview.secondaryFigure.contextMenuShouldBeClosed', closeMenu));
            }
        });

        solo.on('app.drawing.didEnterHotspot', (name, url, x, y) => {
            let hotspots = hotspotMap[urlMap[url || solo.app.drawing.src]].filter(hotspot => hotspot.dataset.applicationstructurename === name),
                links = hotspots.flatMap(hotspot => $$ch('.dmRef, .internalRef, .catalogSeqNumberRef', hotspot)),
                screentip = (hotspots.length && hotspots[0].dataset.hotspottitle) || name;
            if (links.length) {
                screentip += ' 🔗';
            }
            if (url) {
                solo.dispatch('uniview.secondaryFigure.setScreenTip', screentip);
            } else {
                solo.app.drawing.svg.parentNode.title = screentip;
            }
        });

        solo.on('app.drawing.didLeaveHotspot', (name, url, x, y) => {
            if (url) {
                solo.dispatch('uniview.secondaryFigure.setScreenTip');
            } else {
                solo.app.drawing.svg.parentNode.title = '';
            }
        });
    };
})
