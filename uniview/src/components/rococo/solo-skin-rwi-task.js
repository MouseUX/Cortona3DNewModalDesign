/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-rwi-task.css');

    module.exports = function (skin, options, solo) {
        var ixml = solo.uniview.ixml,
            i18n = solo.uniview.i18n['solo-skin-rwi-task'] || {};

        function onFigureRef(event) {
            var dataset = event.target.dataset;
            event.stopPropagation();
            solo.app.procedure.toggleDrawingDisplayMode(true);
            solo.app.procedure.pause();

            solo.dispatch('uniview.showAllPanels');

            var svgext = solo.uniview.options.UseCompressedSVG ? '.svgz' : '.svg';

            solo.app.drawing.load(dataset.href.replace(/\.cgm$/i, svgext))
                .then(function () {
                    solo.app.drawing.show(true);
                })
                .catch(function (error) {
                    solo.dispatch('uniview.error', new Error(error.message + '\n\n' + dataset.href), true);
                });

            try {
                var title = solo.skin.get('main').element.querySelector('.title');
                skin.clear(title);
                if (dataset.alt) {
                    title.append(dataset.alt);
                }
            } catch (e) {}
        }

        function onMultimediaRef(event) {
            event.stopPropagation();

            var dataset = event.target.dataset,
                src = dataset.href,

                base = solo.app.modelInfo.baseURL || solo.app.modelInfo.bundleURL,
                type = dataset.type,
                url = solo.app.util.toUrl(src, base);

            switch (type) {
                case 'audio':
                case 'video':
                    solo.dispatch('uniview.showAllPanels');
                    solo.dispatch('uniview.linkMedia', event.target);

                    solo.app.procedure.toggleDrawingDisplayMode(true);
                    solo.app.drawing.show(false);

                    solo.dispatch('uniview.multimedia.load', url, {
                        type: type,
                        autoplay: +dataset.autoplay,
                        controls: true
                    });
                    solo.dispatch('uniview.multimedia.toggle', true);

                    solo.app.procedure.pause();
                    break;
            }

            try {
                var title = solo.skin.get('main').element.querySelector('.title');
                skin.clear(title);
                if (dataset.alt) {
                    title.append(dataset.alt);
                }
            } catch (e) {}
        }

        function onPartRef(event) {
            var dataset = event.target.dataset;
            event.stopPropagation();
            solo.dispatch('uniview.showAllPanels');
            solo.app.procedure.toggleDrawingDisplayMode(false);
            solo.dispatch('procedure.selectObjects', dataset.xrefid);
        }

        function onPartRefOver(event) {
            var dataset = event.target.dataset;
            event.stopPropagation();
            solo.app.procedure.hoverItem(dataset.xrefid, true);
        }

        function onPartRefOut(event) {
            var dataset = event.target.dataset;
            event.stopPropagation();
            solo.app.procedure.hoverItem(dataset.xrefid, false);
        }

        function dataAttr(node, translationMap) {
            var res = {},
                t = translationMap || [],
                attributes = node['@attributes'] || {};

            for (var name in attributes) {
                if (name === 'id') continue;
                if (t[name] === false) continue;
                res[t[name] || name] = attributes[name];
            }

            return res;
        }

        function splitXref(children) {
            var res = [],
                isPrevXref = false;
            for (var i = 0; i < children.length; i++) {
                var node = children[i];
                if (node['@name'] === 'xref' || node['@name'] === 'a') {
                    if (isPrevXref) {
                        res.push(' ');
                    }
                    isPrevXref = true;
                } else {
                    isPrevXref = false;
                }
                res.push(node);
            }
            return res;
        }

        function processTaskContent(node) {
            var res = node;
            if (typeof node !== 'string') {
                var name = node['@name'],
                    id = node.$attr('id'),
                    children = node['@children'] || [];
                switch (name) {
                    case 'multimedia':
                        res = skin.p('',
                            skin.create('a.figure.multimedia', {
                                href: '#',
                                dataset: dataAttr(node),
                                onclick: onMultimediaRef
                            })
                        );
                        break;
                    case 'image':
                        res = skin.p('',
                            skin.create('a.figure', {
                                href: '#',
                                dataset: dataAttr(node),
                                onclick: onFigureRef
                            })
                        );
                        break;
                    case 'para':
                        res = skin.p('', splitXref(children).map(processTaskContent));
                        break;
                    case 'xref':
                        res = skin.create('a.xref', {
                            href: '#',
                            dataset: dataAttr(node),
                            onclick: onPartRef,
                            onmouseover: onPartRefOver,
                            onmouseout: onPartRefOut
                        }, node.$text());
                        break;
                    case 'a':
                        res = skin.create('a', {
                            href: node.$attr('href'),
                            target: node.$attr('target') || '_blank',
                            dataset: dataAttr(node)
                        }, node.$text());
                        break;
                    case 'input':
                        res = skin.create('input.xref', {
                            disabled: true,
                            id: id,
                            size: node.$attr('size') || '6',
                            title: node.$attr('name') || '',
                            dataset: dataAttr(node, {
                                size: false
                            }),
                            onclick: function (e) {
                                e.stopPropagation();
                            }
                        });
                        break;
                    case 'data':
                        res = skin.create('span.skin-text.rwi-doc-' + name, {
                            id: id,
                            dataset: dataAttr(node)
                        }, splitXref(children).map(processTaskContent));
                        break;
                    default:
                        res = skin.create('div.skin-text.rwi-doc-' + name, {
                            id: id,
                            dataset: dataAttr(node)
                        }, splitXref(children).map(processTaskContent));
                }
            }
            return res;
        }

        solo.uniview.css.render({
            'a.figure:before': {
                content: '"' + i18n.figureRef + '"'
            },
            'a.figure.multimedia:before': {
                content: '"' + i18n.multimediaRef + '"'
            },
            'a.figure.multimedia[data-type="audio"]:before': {
                content: '"' + i18n.audioRef + '"'
            },
            'a.figure.multimedia[data-type="video"]:before': {
                content: '"' + i18n.videoRef + '"'
            },
            '.content a.figure[data-alt]:before': {
                content: 'attr(data-alt)'
            },
        });

        return {
            processTaskContent: processTaskContent
        };
    };
});