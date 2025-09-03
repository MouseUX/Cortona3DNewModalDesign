define(function (require, exports, module) {
    require('css!./print.css');

    function isSheetChanged(id) {
        var view = Cortona3DSolo.uniview.ixml.json.$('ipc/figure/views/view').filter(function (view) {
            return view.$attr('id') === id;
        })[0];
        return view ? +view.$attr('changed') : false;
    }

    /**
     * 
     * 
     * @param {object} options 
     * @param {function} options.getPrintHeaderContainer
     * @param {function} options.getPrintFooterContainer
     * @param {module:actions/print~transformPrintHeader} options.transformPrintHeader
     * @param {module:actions/print~transformPrintFooter} options.transformPrintFooter
     * @param {any} content 
     * @returns {HTMLElement}
     */
    function appendPage(options, content) {
        var solo = Cortona3DSolo,
            skin = solo.skin.get('app');

        function isArray(a) {
            return typeof a === 'object' && a.map;
        }

        function row(value, className) {
            return value && skin.div('.row' + (className || ''), isArray(value) ? value.map(function (s) {
                return skin.span('', s);
            }) : value);
        }

        options = options || {};

        if (typeof options.transformPrintHeader !== 'function') {
            options.transformPrintHeader = function () {
                return this;
            };
        }
        if (typeof options.transformPrintFooter !== 'function') {
            options.transformPrintFooter = function () {
                return this;
            };
        }

        options.printHeader = solo.expand({
            description: solo.uniview.i18n.print.description[solo.uniview.doc.type] || void 0,
            title: solo.uniview.metadata.TITLE,
            subtitle: void 0,
            subsubtitle: void 0,
            revision: void 0,
            date: void 0,
            effectivity: void 0,
            logo: options.logoSrc,
            sheetLabel: void 0,
            sheetInfo: {}
        }, options.printHeader || {});

        options.printFooter = solo.expand({
            left: void 0,
            middle: void 0,
            right: void 0
        }, options.printFooter || {});

        if (typeof options.getPrintHeaderContainer !== 'function') {
            options.getPrintHeaderContainer = function () {
                return skin.div('',
                    skin.div('.row.left',
                        skin.div('.col.rev',
                            this.dismissSheetTitle || !isSheetChanged(this.sheetInfo.id) ? '' : row(['R'], '.sheet-rev-mark')
                        ),
                        this.logo && skin.create('img.logo', {
                            src: this.logo
                        }),
                        skin.div('.col',
                            row(this.description, '.h2'),
                            row(this.title, '.h1'),
                            row(this.subtitle),
                            row(this.subsubtitle)
                        )
                    ),
                    skin.div('.col.right',
                        row(this.effectivity),
                        row(this.revision),
                        row(this.date)
                    )
                );
            };
        }

        if (typeof options.getPrintFooterContainer !== 'function') {
            options.getPrintFooterContainer = function () {
                return skin.div('',
                    skin.div('.col.left', row(this.left)),
                    skin.div('.col.middle', row(this.middle)),
                    skin.div('.col.right', row(this.right))
                );
            };
        }

        var m_isGraphics = false,
            m_tbody = skin.create('tbody', {}),
            m_holder = options.element || (function (holder) {
                return holder || document.body.appendChild(skin.div('.uniview-print-container.print'));
            })(document.querySelector('.uniview-print-container')),
            m_header = options.getPrintHeaderContainer.call(options.transformPrintHeader.call(options.printHeader)),
            m_footer = options.getPrintFooterContainer.call(options.transformPrintFooter.call(options.printFooter));

        if (m_header.classList) {
            m_header.classList.add('print');
            m_header.classList.add('header');
        }

        if (m_footer.classList) {
            m_footer.classList.add('print');
            m_footer.classList.add('footer');
        }

        if (typeof content !== 'object' || !content.forEach) { // is not array?
            content = [content];
        }

        content.forEach(function (el) {
            var tdClass = 'td';
            if (el.classList.contains('graphics')) m_isGraphics = true;
            if (el.classList.contains('dpl-table')) tdClass += '.top';
            if (el.classList.contains('graphics-label')) tdClass += '.bottom.exact';
            m_tbody.append(
                skin.create('tr', {},
                    skin.create(tdClass, {}, el)
                )
            );
        });

        var m_printTable =
            skin.create('table.print', {},
                skin.create('thead', {},
                    skin.create('tr', {},
                        skin.create('td', {}, m_header)
                    )
                ),
                m_tbody,
                skin.create('tfoot', {},
                    skin.create('tr', {},
                        skin.create('td', {}, m_footer)
                    )
                )
            );

        if (m_isGraphics) m_printTable.classList.add('graphics-page');

        m_holder.appendChild(m_printTable);

        return m_printTable;
    }

    function waitForImages(root, query) {
        return Array.prototype.slice.call(root.querySelectorAll(query))
            .filter(function (img) {
                return !img.classList.contains('graphics');
            })
            .map(function (img) {
                return new Promise(function (resolve) {
                    img.onload = function () {
                        resolve(img);
                    };
                    img.onerror = function (e) {
                        resolve(img);
                    };
                });
            });
    }

    module.exports = {
        appendPage: appendPage,
        printPage: function (options, content) {
            var m_printPage = appendPage(options, content);

            return new Promise(function (resolve, reject) {
                window.onafterprint = function () {
                    window.onafterprint = null;
                    m_printPage.parentNode.removeChild(m_printPage);
                    resolve(content);
                };

                var images = waitForImages(m_printPage, 'img');

                Promise
                    .all(images)
                    .then(function () {
                        window.print();
                    })
                    .catch(reject);
            });
        },
        print: function () {
            return new Promise(function (resolve, reject) {
                window.onafterprint = function () {
                    window.onafterprint = null;
                    Array.prototype.slice.call(document.querySelectorAll('table.print'))
                        .forEach(function (printPage) {
                            printPage.parentNode.removeChild(printPage);
                        });
                    resolve();
                };

                var images = waitForImages(document, 'table.print img');

                Promise
                    .all(images)
                    .then(function () {
                        window.print();
                    })
                    .catch(reject);
            });
        }
    };
});

/**
 * The function converts the properties of the print header object to which `this` points and returns the modified object as a result.
 * 
 * @callback module:actions/print~transformPrintHeader
 * @this PrintHeaderOptions
 * @returns {PrintHeaderOptions}
 */

/**
 * The function converts the properties of the print footer object to which `this` points and returns the modified object as a result.
 * 
 * @callback module:actions/print~transformPrintFooter
 * @this PrintFooterOptions
 * @returns {PrintFooterOptions}
 */