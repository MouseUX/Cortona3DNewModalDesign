define(function (require, exports, module) {
    var m_figureSrc,
        m_figureNumber,
        m_sheetNumber,
        m_selectedHotspot;

    function isHidden(node) {
        return !node.offsetWidth && !node.offsetHeight;
    }

    /**
     * 
     */
    function link2d(solo) {
        solo = solo || Cortona3DSolo;

        if (m_selectedHotspot) {
            if (!solo.app.drawing.isVisible() || isHidden(solo.app.drawing.svg.parentNode)) {
                solo.app.drawing.selectHotspot(m_selectedHotspot, '');
                m_selectedHotspot = null;
            }
        }

        solo.dispatch('uniview.clearAllSelectedObjects');

        // show all panels in the link2d() call context
        Cortona3DSolo.dispatch('uniview.showAllPanels');

        var svgext = solo.uniview.options.UseCompressedSVG ? '.svgz' : '.svg';
        var src = this.dataset.src.replace(/\.cgm$/i, svgext);
        var title = this.dataset.title || this.title || '';
        var figureNumber = this.dataset.figure;
        var sheetNumber = this.dataset.sheet;
        var infoEntityIdent = this.dataset.infoentityident;
        var linkByName = (this.dataset.linkbyname || 'true') === 'true';
        var targetName = this.dataset.targetname;
        var hotspot = this.dataset.referredfragment || ((figureNumber === m_figureNumber) ? m_selectedHotspot : '');
        //procedureApp.setTitle(title, this.className, figureNumber, this.getAttribute('data-sheet'), this.getAttribute('data-sheets'));

        if (solo.uniview.with3D) {
            solo.app.procedure.toggleDrawingDisplayMode(true);
            solo.app.procedure.pause();
        } else {
            src = solo.uniview.doc.baseURL + src;
        }

        function selectHotspot(name) {
            m_selectedHotspot = name || null;
            solo.app.drawing.setSelectedObjects(name || []);
        }

        var keepTitle;

        if (linkByName && targetName === 'figure' && figureNumber === m_figureNumber && solo.app.drawing.hotspotExists(hotspot)) {
            selectHotspot(hotspot);
            keepTitle = true;
        } else {
            solo.app.drawing
                .load(src)
                .then(function () {
                    solo.dispatch('uniview.didLoadIllustration', solo.app.drawing.src, infoEntityIdent);
                    solo.app.drawing.show(true);
                    m_figureSrc = src;
                    m_figureNumber = figureNumber;
                    m_sheetNumber = sheetNumber;
                    m_selectedHotspot = null;
                    selectHotspot(hotspot);
                });
        }

        solo.dispatch('uniview.link2d', this, keepTitle);
    }

    /**
     * 
     */
    function link3d(solo) {
        solo = solo || Cortona3DSolo;

        if (this.classList.contains('disabled')) return;

        // show all panels in the link3d() call context
        Cortona3DSolo.dispatch('uniview.showAllPanels');

        solo.dispatch('uniview.link3d', this);

        var dataset = this.dataset,
            ixml = solo.uniview.ixml;

        switch (solo.uniview.doc.type) {
            case 'procedure':
                var autoplay = (dataset.autoplay === void 0 && !dataset.figure && !dataset.multimediatype) ? solo.uniview.options.StartAfterNavigate : +dataset.autoplay;

                solo.app.procedure.toggleDrawingDisplayMode(false);

                if (!ixml) ixml = {};
                if (!ixml.getObjects) {
                    ixml.getObjects = function (a) {
                        if (!Array.isArray(a)) {
                            a = [a];
                        }
                        return a.map(solo.app.getObjectWithName);
                    };
                }

                switch (dataset.context) {
                    case 'part':
                    case 'item':
                        solo.dispatch('procedure.selectObjects', dataset.key.split(' '));
                        break;
                    default:
                        solo.app.procedure.seekToSubstep(dataset.key);
                        if (autoplay) {
                            solo.app.procedure.play();
                        }
                }
                break;
            case 'ipc':
                switch (dataset.context) {
                    case 'item':
                        var row = ixml.getRowByItem(dataset.key);
                        if (row >= 0) {
                            var sheetId = ixml.getItemInfo(row).sheetId || ixml.getSheetsForRow(row)[0].id;
                            solo.app.ipc.selectSheet(sheetId).then(function () {
                                var index = ixml.getIndexByItem(dataset.key);
                                solo.dispatch('app.ipc.didSelectItem', -1, []);
                                solo.dispatch('app.ipc.didSelectItem', index, index < 0 ? [] : [index]);
                                setTimeout(function () {
                                    solo.app.ipc.fitItem(index, true);
                                }, 0);
                                solo.once('app.drawing.didFinishLoadDrawing', function () {
                                    solo.app.drawing.selectItem(index, true);
                                });
                            });
                        }
                        break;
                    default:
                        solo.app.ipc.selectSheet(dataset.key);
                        break;
                }
                break;
        }
    }

    function footnote(solo) {

        function close(e) {
            popup.remove();
            m_closerEvents.forEach(function (name) {
                appElem.removeEventListener(name, close);
            });
            popup.emit('close');
        }

        solo = solo || Cortona3DSolo;

        var popup;
        var m_closerEvents = ['mousedown', 'wheel', 'blur', 'pointerdown', 'touchstart'];

        var skin = solo.skin.get('app');
        var appElem = skin.element;
        if (!skin)
            return;

        popup = skin.render(require('components/popup'));
        popup.element.classList.add('footnote-popup');

        var footnoteBody = this.querySelector('.footnoteBody');
        var content = (footnoteBody) ? footnoteBody.cloneNode(true) : '';

        popup.emit('open', {
            content: content,
            x: this.getBoundingClientRect().left + 4,
            y: this.getBoundingClientRect().top + 4,
            target: appElem
        });

        m_closerEvents.forEach(function (name) {
            appElem.addEventListener(name, close);
        });
    }

    module.exports = {
        link2d: link2d,
        link3d: link3d,
        footnote: footnote,
    };
});