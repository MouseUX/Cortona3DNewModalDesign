define(function (require, exports, module) {
    require('css!./solo-skin-secondary-figure-panel.css');

    module.exports = function (skin, options, solo) {
        var iframe = skin.create(require('components/iframe'), options);

        var element = skin.create('.skin-secondary-figure', iframe);

        var m_currentSrc,
            m_selectedHotspot,
            m_figureNumber;

        var m_closeEvents = options.closeEvents || ['mousedown', 'wheel', 'pointerdown', 'touchstart'];
        
        var contextMenuShouldBeClosedHandler = () => {
            solo.dispatch('uniview.secondaryFigure.contextMenuShouldBeClosed');
        }

        iframe.on('beforeCleanUp', () => m_closeEvents.forEach(name => iframe.window.removeEventListener(name, contextMenuShouldBeClosedHandler)));

        solo.on('uniview.secondaryFigure', function (linkNode) {
            var svgext = solo.uniview.options.UseCompressedSVG ? '.svgz' : '.svg',
                interactivitySrc = linkNode.dataset.ixml,
                infoEntityIdent = linkNode.dataset.infoentityident,
                src = interactivitySrc || linkNode.dataset.src.replace(/\.cgm$/i, svgext),
                type = /\.(wrl|vrml|cortona3d|solo|vmb|interactivity\.xml)$/i.test(src) ? 'solo' : (linkNode.dataset.link === 'link2d' ? 'image' : linkNode.dataset.multimediatype),
                autoplay = +linkNode.dataset.autoplay,
                fullscreen = +linkNode.dataset.fullscreen,
                controls = linkNode.dataset.showplugincontrols !== 'hide',
                multimediaOptions = {
                    controls: controls,
                    autoplay: autoplay
                },
                url = solo.app.util.toUrl(src, solo.app.modelInfo.baseURL || solo.app.modelInfo.bundleURL);

            var getOptionsFromDataset = require('lib/get-options-from-dataset');

            if (type === 'image' && solo.app.modelInfo.bundleURL) {
                // get data url from bundle
                url = solo.app.util.createResourceURL(src);
            }

            var innerUniviewStyle = {
                '.main.panel, .main-content.panel': {
                    border: 'none'
                },
                '.skin-holder .solo-uniview-content': {
                    padding: 0
                }
            };

            switch (type) {
                case 'solo':
                case '3D':
                    iframe
                        .loadSoloResource(url, solo.expand({}, solo.uniview.options, {
                            lang: solo.uniview.config.lang,
                            factory: interactivitySrc && 'uniview-procedure',
                            EnableWarnings: false,
                            disableMessages: true,
                            components: {
                                uiProcedureToolbar: !controls ? nop : null,
                                uiToolbarSceneNavigation: !controls ? nop : null,
                                uiProcedureToolbarPartSelection: !controls ? nop : null
                            }
                        }, getOptionsFromDataset(linkNode.dataset)))
                        .then(function () {
                            var iframeSolo = iframe.safeProperty('Cortona3DSolo');
                            if (iframeSolo) {
                                iframeSolo.uniview.settings.Locked = false;
                                if (autoplay) {
                                    iframeSolo.app.procedure.play();
                                }
                                iframeSolo.uniview.css.render(innerUniviewStyle);
                                iframeSolo.dispatch("core.didChangeLayout");
                                if (iframeSolo.app.modelInfo.type === 'generic') {
                                    iframeSolo.app.jumpToStandardView('isometric');
                                }
                            }
                            m_closeEvents.forEach(name => iframe.window.addEventListener(name, contextMenuShouldBeClosedHandler));
                        });
                    break;
                case 'audio':
                    iframe.loadAudio(url, multimediaOptions);
                    break;
                case 'video':
                    iframe.loadVideo(url, multimediaOptions);
                    break;
                case 'image':
                    solo.dispatch('uniview.clearAllSelectedObjects');

                    var linkByName = (linkNode.dataset.linkbyname || 'true') === 'true',
                        targetName = linkNode.dataset.targetname,
                        figureNumber = linkNode.dataset.figure,
                        hotspot = linkNode.dataset.referredfragment || ((figureNumber === m_figureNumber) ? m_selectedHotspot : ''),
                        iframeSolo = iframe.safeProperty('Cortona3DSolo');
                    if (src === m_currentSrc || (linkByName && targetName === 'figure' && figureNumber === m_figureNumber && iframeSolo.app.drawing.hotspotExists(hotspot))) {
                        iframeSolo.app.drawing.setSelectedObjects(hotspot);
                        m_selectedHotspot = hotspot;
                    } else if (m_currentSrc !== src) {
                        iframe
                            .loadSoloResource('data:image/svg+xml,<svg/>', solo.expand({}, solo.uniview.options, {
                                treatSrcAsImageFile: true
                            }))
                            .then(function () {
                                var iframeSolo = iframe.safeProperty('Cortona3DSolo');
                                if (iframeSolo) {
                                    iframeSolo.removeAllListeners('app.drawing.didHoverHotspot');
                                    iframeSolo.uniview.css.render(innerUniviewStyle);
                                    iframeSolo.app.drawing
                                        .load(url, !/\.svgz?$/.test(src))
                                        .then(function () {
                                            solo.dispatch('uniview.didLoadIllustration', iframeSolo.app.drawing.src, infoEntityIdent);
                                            iframeSolo.app.drawing.setSelectedObjects(hotspot);
                                            m_selectedHotspot = hotspot;
                                        });
                                    [
                                        'app.drawing.didSelectHotspot',
                                        'app.drawing.didLeaveHotspot',
                                        'app.drawing.didEnterHotspot',
                                        'uniview.clearAllSelectedObjects'
                                    ].forEach(function (eventName) {
                                        iframeSolo.on(eventName, function () {
                                            const drawing = iframeSolo.app.drawing,
                                                rect = element.getBoundingClientRect();
                                            solo.dispatch.apply(solo, [eventName].concat(Array.prototype.slice.call(arguments)).concat(drawing.src, drawing.lastPointerX + rect.left, drawing.lastPointerY + rect.top));
                                        })
                                    });

                                    m_closeEvents.forEach(name => iframe.window.addEventListener(name, contextMenuShouldBeClosedHandler));

                                    m_figureNumber = figureNumber;
                                    m_selectedHotspot = null;
                                }
                            });
                    }
                    break;
                default:
                    iframe.load(url, multimediaOptions);
            }

            m_currentSrc = src;

            solo.dispatch('uniview.toggleMainSecondaryPanel', true);
        });

        solo.on('uniview.secondaryFigure.solo', function (cb) {
            if (typeof cb === 'function') {
                cb(iframe.safeProperty('Cortona3DSolo'));
            }
        });

        solo.on('uniview.secondaryFigure.setScreenTip', function (name) {
            var iframeSolo = iframe.safeProperty('Cortona3DSolo');
            if (iframeSolo) {
                iframe.window.document.body.title = name || '';
            }
        });

        solo.on('uniview.secondaryFigure.setSelectedObjects', function (name) {
            var iframeSolo = iframe.safeProperty('Cortona3DSolo');
            if (iframeSolo) {
                if (iframeSolo.uniview.doc.type === 'drawing') {
                    iframeSolo.app.drawing.setSelectedObjects(name);
                }
            }
        });

        solo.on('uniview.secondaryFigure.setHoveredObjects', function (name) {
            var iframeSolo = iframe.safeProperty('Cortona3DSolo');
            if (iframeSolo) {
                if (iframeSolo.uniview.doc.type === 'drawing') {
                    iframeSolo.app.drawing.setHoveredObjects(name);
                }
            }
        });

        solo.on('uniview.secondaryFigure.removeHoveredObjects', function (name) {
            var iframeSolo = iframe.safeProperty('Cortona3DSolo');
            if (iframeSolo) {
                if (iframeSolo.uniview.doc.type === 'drawing') {
                    iframeSolo.app.drawing.removeHoveredObjects(name);
                }
            }
        });

        function vcr(method) {
            var iframeSolo = iframe.safeProperty('Cortona3DSolo');
            if (iframeSolo) {
                if (iframeSolo.app && iframeSolo.app.procedure) {
                    iframeSolo.app.procedure[method]();
                }
            } else {
                var method = iframe.safeProperty(method);
                if (method) {
                    method.call(iframe.window);
                }
            }
        }

        solo.on('uniview.secondaryFigure.play', vcr.bind(iframe, 'play'));
        solo.on('uniview.secondaryFigure.pause', vcr.bind(iframe, 'pause'));
        solo.on('uniview.secondaryFigure.stop', vcr.bind(iframe, 'stop'));

        solo.on('uniview.toggleMainSecondaryPanel', function (visible) {
            if (!visible) {
                var iframeSolo = iframe.safeProperty('Cortona3DSolo');
                if (iframeSolo) {
                    if (iframeSolo.app && iframeSolo.app.procedure) {
                        iframeSolo.app.procedure.pause();
                    }
                } else {
                    var method = iframe.safeProperty('pause');
                    if (method) {
                        method.call(iframe.window);
                    }
                }
            }
        });

        solo.on('core.didChangeLayout', function () {
            var iframeSolo = iframe.safeProperty('Cortona3DSolo');
            if (iframeSolo) {
                iframeSolo.dispatch('core.didChangeLayout');
            }
        });

        return this.exports(element);
    };
});