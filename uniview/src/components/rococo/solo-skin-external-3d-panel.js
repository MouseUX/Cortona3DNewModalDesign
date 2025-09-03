define(function (require, exports, module) {
    require('css!./solo-skin-external-3d-panel.css');

    function cmpArrays(a1, a2) {
        return a1.length === a2.length && a1.every(h => a2.includes(h));
    }

    function cmp3f(v1, v2) {
        return v1[0] === v2[0] && v1[1] === v2[1] && v1[3] === v2[3];
    }

    module.exports = function (skin, options, solo) {
        var i18n = solo.uniview.i18n['ui'] || {};
        var svgAssets = skin.create(require('./solo-skin-svg-assets'));

        var iframe = skin.create(require('components/iframe'), options);
        
        var sceneBoundBox = require('lib/scene-bbox');

        var m_ready = false,
            m_position = 0,
            m_initNames = [], m_initForce;

        iframe
            .loadSoloResource(solo.app.modelInfo.bundleURL || solo.app.modelInfo.companionFile, solo.expand({}, solo.uniview.options, {
                factory: 'uniview-generic',
                features: solo.app.DISABLE_DOCUMENT_INTERACTIVITY,
                components: {
                    uiGenericContextMenu: function () { }
                },
                ShowAxes: false
            }))
            .then(function () {
                m_ready = true;
                solo.dispatch('uniview.external3DPanel.showObjects', m_initNames, m_initForce);
                var iframeSolo = iframe.window.Cortona3DSolo;
                iframeSolo.uniview.css.render({
                    '.skin-holder .tiramisu-banner': {
                        display: 'none',
                    },
                    '.panel-view': {
                        backgroundColor: solo.uniview.options['3DBackgroundColor'] || solo.uniview.options['Background3DColor'] || '#FFFFFF'
                    }
                });
                if (iframeSolo.app.procedure) {
                    iframeSolo.app.procedure.freezeCamera(true);
                    iframeSolo.removeAllListeners('app.procedure.didChangePlayerState');
                }
                iframeSolo.on('app.procedure.didChangePlayerState', position => m_position = position);
            });

        function isolateView(handles, parent) {
            var solo = iframe.window.Cortona3DSolo;
            solo.app.getChildObjects(parent)
                .filter(h => !/SectionPlane/.test(solo.app.getObjectTypeName(h)))
                .forEach(function (h) {
                    if (handles.indexOf(h) < 0) {
                        solo.app.setObjectVisibility(h, false);
                        solo.app.setObjectPropertyf(h, solo.app.PROPERTY_VISIBILITY, false, 0);
                        solo.app.setObjectPropertyf(h, solo.app.PROPERTY_VISIBILITY, false, -1);
                        if (solo.app.recursiveObjectLookup) {
                            isolateView(handles, h);
                        }
                    } else {
                        var children = solo.app.getChildObjects(h);
                        if (!children.length || !children.find(h => solo.app.getObjectTypeName(h) === 'ObjectVM')) {
                            for (var p = h; p; p = solo.app.getParentObject(p)) {
                                solo.app.setObjectVisibility(p, true);
                                solo.app.setObjectPropertyf(p, solo.app.PROPERTY_VISIBILITY, false, 0);
                                solo.app.setObjectPropertyf(p, solo.app.PROPERTY_TRANSPARENCY, false, -1);
                                //solo.app.restoreObjectProperty(p, solo.app.PROPERTY_VISIBILITY, false);
                                //solo.app.restoreObjectProperty(p, solo.app.PROPERTY_TRANSPARENCY, false);
                            }
                        }
                        isolateView(children, h);
                    }
                });
        }

        solo.on('core.didChangeLayout', function () {
            var iframeSolo = iframe.window.Cortona3DSolo;
            if (iframeSolo) {
                iframeSolo.dispatch('core.didChangeLayout');
            }
        });

        var currentHandles = [0],
            currentBBox;

        solo.on('uniview.external3DPanel.showObjects', function (names, force) {
            if (!m_ready) {
                m_initNames = names;
                m_initForce = force;
                return;                    
            }
            var iframeSolo = iframe.window.Cortona3DSolo;
            if (iframeSolo && iframeSolo.app) {
                var handles = names.map(iframeSolo.app.getObjectWithName);
                var bbox = sceneBoundBox(iframeSolo, handles);
                var isPositionChanged = !currentBBox || !cmp3f(currentBBox.center, bbox.center) || !cmp3f(currentBBox.size, bbox.size);
                currentBBox = bbox;
                if (!cmpArrays(currentHandles, handles) || force) {
                    iframeSolo.dispatch('uniview.clearMeasure');
                    currentHandles = handles;
                    iframeSolo.app.ui.showCanvas(false);
                    isolateView(handles);
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            iframeSolo.app.jumpToStandardView('isometric', false);
                            iframeSolo.app.ui.showCanvas(true);
                            solo.dispatch('uniview.external3DPanel.didShowObjects', iframeSolo, handles);
                            iframeSolo.dispatch('uniview.clearSection');
                            iframeSolo.dispatch('uniview.clearMeasure');
                            currentBBox = sceneBoundBox(iframeSolo, handles);
                        })
                    });
                } else if (isPositionChanged) {
                    iframeSolo.dispatch('uniview.clearMeasure');
                    iframeSolo.dispatch('uniview.clearSection');
                }
            }
        });

        if (!options.prohibitDisplaySelectedObject) {
            solo.on('app.didChangeSelectedObjects', function () {
                var iframeSolo = iframe.window.Cortona3DSolo,
                    ixml = solo.uniview.ixml,
                    names = solo.app.getSelectedObjects().map(solo.app.getObjectName);
                if (!names.length) return;
                if (ixml.getRowByObjectName) {
                    names = names.reduce(function (a, name, i) {
                        return (a.map(ixml.getRowByObjectName).indexOf(ixml.getRowByObjectName(name)) < 0) ? a.concat(name) : a;
                    }, []);
                    solo.dispatch('uniview.external3DPanel.showObjects', names);
                } else if (iframeSolo.app.procedure) {
                    var isPositionChanged = m_position !== solo.app.procedure.position;
                    iframeSolo.once('app.procedure.didChangePlayerState', function () {
                        iframe.window.requestAnimationFrame(function () {
                            solo.dispatch('uniview.external3DPanel.showObjects', names, isPositionChanged);
                        });
                    });
                    iframeSolo.app.procedure.setPlayPosition(solo.app.procedure.position, true);        
                }
            });
        }

        solo.on('uniview.settings.changedSelectedObjectsExternalView', solo.dispatch.bind(solo, 'uniview.toggleAuxSecondaryPanel'));

        var closeButton = options.disableCloseButton ? '' : skin.buttonImg({
            classList: 'button-close',
            title: i18n.close,
            onclick: function () {
                solo.uniview.settings.SelectedObjectsExternalView = false;
            }
        }, skin.html(svgAssets.cross));

        var element = skin.create('.skin-external-3d-panel',
            closeButton,
            iframe
        );

        return this.exports(element);
    };
});