/**
 * The UI component that is used to display a pre-rendered HTML document.
 * @module components/doc
 * @requires solo-uniview
 * @requires components/doc-resolve
 */
define(function (require, exports, module) {
    require('css!./doc.css');

    var ensureVisible = require('lib/ensure-visible');

    /** 
     * A factory function.
     * @this UISkinComponent
     * @param {UISkinController} skin The `UISkinController` object that creates an instance of the component.
     * @param {object} options The configuration object of the component instance.
     * @param {boolean} [options.showDocumentProcedureOnLoad=false]
     * @param {Cortona3DSolo} solo
     * @return {HTMLElement} 
     * ```xml
     * <div class="doc-container skin-container"></div>
     * ```
     * @fires Cortona3DSolo~"uniview.doc.didLoadComplete"
     * @fires Cortona3DSolo~"app.procedure.didSelectSubstep"
     * @fires module:components/doc~"loaded"
     * @fires Cortona3DSolo~"uniview.component.doc.loaded"
     * @listens Cortona3DSolo~"uniview.doc.activate"
     * @see module:components/doc-resolve
     * @tutorial component-usage
     * @tutorial component-doc
     */
    module.exports = function (skin, options, solo) {
        var autoplay = solo.uniview.options.StartAfterLoading || (solo.uniview.doc && solo.uniview.doc.autoStartPlayback),
            skipFirstStep = solo.uniview.with3D && !autoplay && !options.showDocumentProcedureOnLoad,
            disableTextSelection = solo.uniview.options.DisableTextSelection || options.DisableTextSelection;


        var component = this;

        var docResolve = skin.create(require('components/doc-resolve'), options);

        var css = solo.uniview.css;

        if (!disableTextSelection) {
            css.render({
                ".skin-holder .doc-container": {
                    "user-select": "text",
                    "-moz-user-select": "text",
                    "-webkit-user-select": "text",
                    "-ms-user-select": "text"
                }
            });
            window.addEventListener('mousedown', function (e) {
                var Selection = window.getSelection();
                Selection.removeAllRanges();
            });
        }

        /**
         * Mark the active document fragment for the current procedure step.
         * 
         * @event Cortona3DSolo~"uniview.doc.activate"
         * @type {arguments}
         * @prop {string} idStep ID of the playback context element. Uses `.play-context` class name.
         * @prop {string} idSubstep ID of the playback step element. Uses `.active` class name.
         * @prop {boolean} [noscroll=false] Prevents the document from scrolling to the active step.
         */
        solo.on('uniview.doc.activate',
            function (idStep, idSubstep, noscroll) {
                var elStep = document.getElementById(idStep),
                    elSubstep = document.getElementById(idSubstep);

                if (skipFirstStep) {
                    solo.on('app.procedure.didChangePlayerState', function (position) {
                        if (position) skipFirstStep = false;
                    });
                    solo.once('app.procedure.didPlay', function () {
                        skipFirstStep = false;
                    });
                    solo.once('uniview.link3d', function () {
                        skipFirstStep = false;
                    });
                    return;
                }

                if (elStep) {
                    element.querySelectorAll('.play-context').forEach(function (el) {
                        el.classList.remove('play-context');
                    });

                    element.querySelectorAll('.active').forEach(function (el) {
                        el.classList.remove('active');
                    });

                    elStep.classList.add('play-context');
                    if (!noscroll) {
                        ensureVisible(elStep);
                    }
                }
                if (elSubstep) {
                    element.querySelectorAll('.active').forEach(function (el) {
                        el.classList.remove('active');
                    });
                    elSubstep.classList.add('active');
                    if (!noscroll) {
                        ensureVisible(elSubstep);
                    }
                }
            }
        );

        var doc = solo.app.modelInfo || solo.uniview.doc || {},
            element = skin.container('.doc-container');

        function genericDocumentSyntax() {
            // doc.comments
            var root = solo.uniview.ixml.json;

            var procedure = root.$('SimulationInteractivity/Procedure')[0];

            return getProcedureSyntax('', procedure);
        }

        function validItem(item) {
            var name = item['@name'],
                comment = item.$text('Comment').trim();
            return name === 'Procedure' || name === 'Item' || (name === 'Action' && comment && !solo.uniview.options.HideActions);
        }

        function getProcedureSyntax(parentNumber, item, index) {
            var root = solo.uniview.ixml.json,
                simulation = root.$('SimulationInteractivity/Simulation')[0],
                itemNumber = parentNumber + (+index + 1) + '.',
                syntax = '',
                comment = item.$text('Comment').trim();
            switch (item['@name']) {
                case 'Procedure':
                    comment = simulation.$text('Comment').trim();
                    syntax += '<div id="' + item.$attr('id') + '">';
                    if (comment) {
                        syntax += '<div class="tiramisu-proc-title">' + comment + '</div>';
                    }
                    syntax += (item['@children'] || []).filter(validItem).map(getProcedureSyntax.bind(null, '')).join('');
                    syntax += '</div>';
                    break;
                case 'Item':
                    syntax += '<div id="' + item.$attr('id') + '" class="tiramisu-proc-item">';
                    syntax += '<div class="tiramisu-proc-item-number">' + itemNumber + '</div>';
                    syntax += '<div class="tiramisu-proc-item-content">';
                    syntax += item.$text('Comment') || '<p class="tiramisu-proc-item-empty"></p>';
                    syntax += (item['@children'] || []).filter(validItem).map(getProcedureSyntax.bind(null, itemNumber)).join('');
                    syntax += '</div>';
                    syntax += '</div>';
                    break;
                case 'Action':
                    syntax += '<div id="' + item.$attr('id') + '" class="tiramisu-proc-item">';
                    syntax += '<div class="tiramisu-proc-item-number">' + itemNumber + '</div>';
                    syntax += '<div class="tiramisu-proc-item-content">' + comment + '</div>';
                    syntax += '</div>';
                    break;
            }
            return syntax;
        }

        docResolve
            .documentTemplateHtml()
            .then(function (syntax) {
                function isAncestorExist(node, testNode) {
                    if (!node) return false;
                    if (node === testNode) return true;
                    return isAncestorExist(node.parentNode, testNode);
                }

                function isClickPrevented(e) {
                    var Selection = window.getSelection();
                    return !Selection.isCollapsed && (Selection.containsNode ? Selection.containsNode(e.target, true) : isAncestorExist(Selection.anchorNode, e.currentTarget) || isAncestorExist(Selection.focusNode, e.currentTarget));
                }

                var m_preventClickOnMouseDown;

                var div = skin.div(),
                    docSyntax = syntax || (doc.comments && '<div>' + genericDocumentSyntax() + '</div>') || '';

                div.innerHTML = docSyntax;

                var preRenderedDocument = div.querySelector('#pre-rendered-document');
                if (preRenderedDocument) {
                    div = preRenderedDocument;
                }

                docResolve.resolveImages(div, doc);
                element.innerHTML = div.innerHTML;
                docResolve.resolveLinks(element);

                if (!syntax) {
                    var procItems = document.querySelectorAll('.tiramisu-proc-item, .tiramisu-proc-title');
                    if (procItems.length) {
                        element.firstChild.classList.add('tiramisu-procedure');
                    }
                    procItems.forEach(function (item) {
                        if (item.classList.contains('tiramisu-proc-item-empty')) return;
                        if (!disableTextSelection) {
                            item.onmousedown = function (e) {
                                m_preventClickOnMouseDown = isClickPrevented(e);
                            };
                        }
                        item.onclick = function (event) {
                            /**
                             * The event is fired when user click to the step in the generic document.
                             * @event Cortona3DSolo~"app.procedure.didSelectSubstep"
                             * @type {string}
                             */
                            if (disableTextSelection || (!m_preventClickOnMouseDown && !isClickPrevented(event))) {
                                solo.dispatch('app.procedure.didSelectSubstep', this.id);
                            }
                            event.stopPropagation();
                        };
                    });
                }

                /**
                 * The event is fired when the document is loaded.
                 * @event Cortona3DSolo~"uniview.doc.didLoadComplete"
                 * @type {HTMLElement}
                 */
                solo.dispatch('uniview.doc.didLoadComplete', element);
                /**
                 * The event is fired when the document is loaded.
                 * @event module:components/doc~"loaded"
                 */
                component.emit('loaded');
                /**
                 * The event is fired when the document is loaded.
                 * @event Cortona3DSolo~"uniview.component.doc.loaded"
                 * @type {arguments}
                 * @prop {UISkinComponent} component
                 * @prop {HTMLElement} element
                 */
                solo.dispatch('uniview.component.doc.loaded', component, element);
            })
            .catch(console.error.bind(console));

        return this.exports(element);
    };
});