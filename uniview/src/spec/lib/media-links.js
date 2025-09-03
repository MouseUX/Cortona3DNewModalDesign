define(function (require, exports, module) {
    require('css!./media-links.css');

    module.exports = function (skin, options, solo) {

        var iframe = solo.skin.get('view').render(require('components/iframe')),
            docLinks = require('actions/doc-links');

        var getOptionsFromDataset = require('lib/get-options-from-dataset');

        solo.expand(solo.app, {
            ui: {
                showCanvas: function (visible) {
                    if (!visible) {
                        if (iframe.window && iframe.window.Cortona3DSolo && iframe.window.Cortona3DSolo.app.procedure && iframe.window.Cortona3DSolo.app.procedure.played) {
                            iframe.window.Cortona3DSolo.app.procedure.pause();
                        }
                    }
                    skin.toggle(iframe.$el, visible);
                    if (visible && iframe.window) {
                        iframe.window.focus();
                    }
                }
            }
        });

        var m_waitSoloResource = false;

        var MODE_1D = 0,
            MODE_2D = 1,
            MODE_3D = 2,
            m_currentViewMode;

        function switchView(mode) {
            solo.dispatch('uniview.showAllPanels');
            solo.app.procedure.toggleDrawingDisplayMode(true);
            switch (mode) {
                case MODE_1D:
                    solo.dispatch('uniview.multimedia.toggle', true);
                    solo.app.drawing.show(false);
                    solo.app.ui.showCanvas(false);
                    break;
                case MODE_2D:
                    solo.dispatch('uniview.multimedia.toggle', false);
                    break;
                case MODE_3D:
                    solo.dispatch('uniview.multimedia.toggle', false);
                    solo.app.drawing.show(false);
                    solo.app.ui.showCanvas(true);
                    break;
            }
            m_currentViewMode = mode;
        }

        solo.on('uniview.settings.changedExpandMain', function (expanded) {
            switch (m_currentViewMode) {
                case MODE_1D:
                case MODE_3D:
                    if (iframe.window) {
                        iframe.window.focus();
                    }
                    break;
            }
        });

        solo.on('uniview.settings.changedExpandAux', function (expanded) {
            switch (m_currentViewMode) {
                case MODE_1D:
                    solo.dispatch('uniview.multimedia.toggle', !expanded);
                    break;
                case MODE_3D:
                    solo.app.ui.showCanvas(!expanded);
                    break;
            }
        });

        function link2d() {
            switchView(MODE_2D);
            docLinks.link2d.call(this, solo);
        }

        function link3d() {
            var src = this.dataset.src,
                interactivitySrc = this.dataset.ixml,
                url = solo.app.util.toUrl(interactivitySrc || src, solo.app.modelInfo.baseURL || solo.app.modelInfo.bundleURL),
                isPartContext = /(part|item)/.test(this.dataset.context),
                self = this;

            switchView(MODE_3D);

            if (!m_waitSoloResource) {
                solo.dispatch('uniview.linkMedia', this);
                m_waitSoloResource = true;
                iframe
                    .loadSoloResource(url, solo.expand({}, solo.uniview.options, {
                        factory: interactivitySrc && 'uniview-procedure',
                        totalMemory: +solo.uniview.options.TotalMemory || 256,
                        AutoStop: true,
                        EnableWarnings: false,
                        disableMessages: true
                    }, getOptionsFromDataset(this.dataset)))
                    .then(function () {
                        switchView(MODE_3D);
                        setTimeout(function () {
                            if (!isPartContext) {
                                iframe.window.Cortona3DSolo.uniview.settings.Locked = true;
                            }
                            docLinks.link3d.call(self, iframe.window.Cortona3DSolo);
                        }, isPartContext ? 500 : 0);
                        iframe.window.Cortona3DSolo.uniview.css.render({
                            '.main.panel': {
                                border: 'none'
                            },
                            '.skin-holder .solo-uniview-content': {
                                padding: 0
                            }
                        });
                        iframe.window.Cortona3DSolo.dispatch("core.didChangeLayout");

                        m_waitSoloResource = false;
                    })
                    .catch(function () {
                        m_waitSoloResource = false;
                    });
            }
        }

        function linkMedia() {
            var src = this.dataset.src,
                base = solo.app.modelInfo.baseURL || solo.app.modelInfo.bundleURL,
                interactivitySrc = this.dataset.ixml,
                type = /\.(wrl|vrml|cortona3d|solo|vmb|interactivity\.xml)$/i.test(src) ? 'solo' : this.dataset.multimediatype,
                autoplay = +this.dataset.autoplay,
                fullscreen = +this.dataset.fullscreen,
                controls = this.dataset.showplugincontrols !== 'hide',
                url = solo.app.util.toUrl(interactivitySrc || src, base);

            var nop = function () {};

            switch (type) {
                case '3D':
                case 'solo':
                    if (!m_waitSoloResource) {
                        solo.dispatch('uniview.linkMedia', this);
                        switchView(MODE_3D);
                        m_waitSoloResource = true;

                        iframe
                            .loadSoloResource(url, solo.expand({}, solo.uniview.options, {
                                lang: solo.uniview.config.lang,
                                factory: interactivitySrc && 'uniview-procedure',
                                totalMemory: +solo.uniview.options.TotalMemory || 256,
                                EnableWarnings: false,
                                disableMessages: true,
                                components: {
                                    uiProcedureToolbar: !controls ? nop : null,
                                    uiToolbarSceneNavigation: !controls ? nop : null,
                                    uiProcedureToolbarPartSelection: !controls ? nop : null
                                }
                            }, getOptionsFromDataset(this.dataset)))
                            .then(function () {
                                var button = document.getElementById('btn-3d-display-mode');
                                if (button) {
                                    button.style.display = '';
                                }
                                switchView(MODE_3D);
                                if (fullscreen) {
                                    solo.uniview.settings.ExpandMain = true;
                                }
                                iframe.window.Cortona3DSolo.uniview.settings.Locked = false;
                                if (autoplay) {
                                    iframe.window.Cortona3DSolo.app.procedure.play();
                                }
                                iframe.window.Cortona3DSolo.uniview.css.render({
                                    '.main.panel, .main-content.panel': {
                                        border: 'none'
                                    },
                                    '.skin-holder .solo-uniview-content': {
                                        padding: 0
                                    }
                                });
                                iframe.window.Cortona3DSolo.dispatch("core.didChangeLayout");
                                if (iframe.window.Cortona3DSolo.app.modelInfo.type === 'generic') {
                                    iframe.window.Cortona3DSolo.app.jumpToStandardView('isometric');
                                }
                                m_waitSoloResource = false;
                            })
                            .catch(function () {
                                m_waitSoloResource = false;
                            });
                    }
                    break;
                default:
                    solo.dispatch('uniview.linkMedia', this);
                    solo.dispatch('uniview.multimedia.load', url, {
                        type: type,
                        autoplay: autoplay,
                        fullscreen: fullscreen,
                        controls: controls
                    });
                    switchView(MODE_1D);
                    if (fullscreen) {
                        solo.uniview.settings.ExpandMain = true;
                    }
            }
        }

        function footnote() {
            docLinks.footnote.call(this, solo);
        }

        solo.once('uniview.ready', function () {
            var button = document.getElementById('btn-3d-display-mode');
            if (button) {
                button.style.display = 'none';
            }
        });

        return {
            link2d: link2d,
            link3d: link3d,
            linkMedia: linkMedia,
            footnote: footnote
        };

    };
});