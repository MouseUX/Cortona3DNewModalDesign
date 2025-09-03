define(function (require, exports, module) {
    require('css!components/rococo/rococo.css');
    require('css!./generic_toc.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml;

        var tocModel = require('./toc/toc-model');

        var opt = options.components || {},
            uiToc = opt.uiToc || require('./toc/toc'),
            uiFigureHeader = opt.uiFigureHeader || require('./toc/figure-header'),
            uiIpcContextMenu = opt.uiIpcContextMenu || require('components/rococo/solo-skin-ipc-context-menu');

        // load catalog add-on
        var fig = solo.skin.create('figure', options.panel.main || options.panel.figure),
            aux = solo.skin.create('aux', options.panel.aux),
            view = solo.skin.create('view', options.panel.view);

        fig.append(options.panel.view);

        view.render({
            component: uiFigureHeader,
            options: {
                title: solo.uniview.metadata.TITLE
            }
        }, options);

        // load components
        fig.render(uiIpcContextMenu, options);

        var toc = aux.render(uiToc, options);
        toc.on('enter', function (index) {
            tocModel.select(index);
            solo.app.ipc.hoverItem(index);
        });
        toc.on('out', function (index) {
            tocModel.clear();
            solo.app.ipc.hoverItem(-1);
        });

        solo.on('app.ipc.didHoverItem', function (index) {
            if (index < 0) {
                skin.element.title = '';
                tocModel.clear();
                skin.element.style.cursor = '';
            } else {
                var row = ixml.getRowByIndex(index),
                    itemInfo = ixml.getItemInfo(row),
                    href = itemInfo.metadata._B479653540A9423B8170B31E38783811;
                skin.element.title = ixml.getScreenTip(index);
                skin.element.style.cursor = href ? 'pointer': '';
                tocModel.select(index);
            }
        });

        solo.on('app.ipc.didSelectItem', function (index) {
            var el = aux.element.querySelector('.toc [data-index="' + index + '"] a[href]');
            if (el) {
                el.click();
            }
            solo.app.ipc.selectItem(-1);
        });

        solo.on('app.drawing.didEnterHotspot', function (name) {
            var index = ixml.getIndexByItem(name),
                row = ixml.getRowByIndex(index),
                itemInfo = ixml.getItemInfo(row),
                href = itemInfo.metadata._B479653540A9423B8170B31E38783811;
            skin.element.title = ixml.getScreenTip(index);
            tocModel.select(index);
        });

        solo.on('app.drawing.didLeaveHotspot', function (name) {
            skin.element.title = '';
            tocModel.clear();
        });

        solo.on('app.drawing.didSelectHotspot', function (name) {
            var index = ixml.getIndexByItem(name),
                el = aux.element.querySelector('.toc [data-index="' + index + '"] a[href]');
            if (el) {
                el.click();
            }
            solo.app.ipc.selectItem(-1);
        });

        if (solo.uniview.with3D) {
            if (solo.uniview.options.DisableNavigation) {
                solo.app.addObjects(solo.app.createObjectsFromString('NavigationInfo { type "NONE" }'));
            }
        } else {
            solo.app.configureInstance(solo.app.DRAWING_HOTSPOT_HIGHLIGHT_SOLID);
            solo.app.drawing.maxScale = 3;
            solo.app.ipc.toggleDrawingDisplayMode(true);
        }
        
        solo.app.ipc.interactivity.willGetCSNString = function (info, row) {
            return info.part.metadata.DFP;
        };

        solo.dispatch('uniview.showAllPanels');
    };
});