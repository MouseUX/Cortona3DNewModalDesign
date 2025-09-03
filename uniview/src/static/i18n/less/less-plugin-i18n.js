/* JSON */

var toJSONString = (function() {
    var m = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        },
        m_indent_ch = '\t',
        m_indent = false,
        cr = function(n) {
            if (!m_indent) return '';
            return '\n' + (new Array(n + 1).join(m_indent_ch));
        },
        sp = function() {
            return m_indent ? ' ' : '';
        },
        s = {
            array: function(x, level) {
                var a = ['[' + sp()],
                    b,
                    f,
                    i,
                    l = x.length,
                    v;
                for (i = 0; i < l; i += 1) {
                    v = x[i];
                    f = s[typeof v];
                    if (f) {
                        v = f(v, level + 1);
                        if (typeof v == 'string') {
                            if (b) {
                                a[a.length] = ',' + sp();
                            }
                            a[a.length] = v;
                            b = true;
                        }
                    }
                }
                a[a.length] = sp() + ']';
                return a.join('');
            },
            'boolean': function(x) {
                return String(x);
            },
            'null': function(x) {
                return "null";
            },
            number: function(x) {
                return isFinite(x) ? String(x) : 'null';
            },
            object: function(x, level) {
                if (x) {
                    if (x instanceof Array) {
                        return s.array(x, level);
                    }
                    var a = ['{' + cr(level + 1)],
                        b,
                        f,
                        i,
                        v;
                    for (i in x) {
                        v = x[i];
                        f = s[typeof v];
                        if (f) {
                            v = f(v, level + 1);
                            if (typeof v == 'string') {
                                if (b) {
                                    a[a.length] = ',' + cr(level + 1);
                                }
                                a.push(s.string(i), ':' + sp(), v);
                                b = true;
                            }
                        }
                    }
                    a[a.length] = cr(level) + '}';
                    return a.join('');
                }
                return 'null';
            },
            string: function(x) {
                if (/["\\\x00-\x1f]/.test(x)) {
                    x = x.replace(/([\x00-\x1f\\"])/g, function(a, b) {
                        var c = m[b];
                        if (c) {
                            return c;
                        }
                        c = b.charCodeAt();
                        return '\\u00' +
                            Math.floor(c / 16).toString(16) +
                            (c % 16).toString(16);
                    });
                }
                return '"' + x + '"';
            }
        };

    return function(v, indent) {
        if (typeof indent === 'string') {
            if (indent) {
                m_indent_ch = indent;
            }
        } else if (typeof indent === 'number') {
            if (indent) {
                m_indent_ch = new Array(indent + 1).join(' ');
            }
        }
        m_indent = !!indent;
        return s[typeof v](v, 0);
    };
})();

var parseJSON = function(s) {
    try {
        return !(/[^,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]/.test(
                s.replace(/"(\\.|[^"\\])*?"/g, ''))) &&
            eval('(' + s + ')');
    } catch (e) {
        return false;
    }
};

var sprintf = (function() {
    /*
    sprintf-js
    Copyright (c) 2007-present, Alexandru Mărășteanu <hello@alexei.ro>
    sprintf-js is licensed under the terms of the 3-clause BSD license.
    */

    'use strict';

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diefg]/,
        numeric_arg: /[bcdiefguxX]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijostTuvxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    };

    function sprintf(key) {
        // `arguments` is not an array, but should be fine for this call
        return sprintf_format(sprintf_parse(key), arguments);
    }

    function vsprintf(fmt, argv) {
        return sprintf.apply(null, [fmt].concat(argv || []));
    }

    function sprintf_format(parse_tree, argv) {
        var cursor = 1,
            tree_length = parse_tree.length,
            arg, output = '',
            i, k, ph, pad, pad_character, pad_length, is_positive, sign;
        for (i = 0; i < tree_length; i++) {
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i];
            } else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i]; // convenience purposes only
                if (ph.keys) { // keyword argument
                    arg = argv[cursor];
                    for (k = 0; k < ph.keys.length; k++) {
                        if (arg == undefined) {
                            throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k - 1]));
                        }
                        arg = arg[ph.keys[k]];
                    }
                } else if (ph.param_no) { // positional argument (explicit)
                    arg = argv[ph.param_no];
                } else { // positional argument (implicit)
                    arg = argv[cursor++];
                }

                if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
                    arg = arg();
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new Error(sprintf('[sprintf] expecting number but found %T', arg));
                }

                if (re.number.test(ph.type)) {
                    is_positive = arg >= 0;
                }

                switch (ph.type) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2);
                        break;
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10));
                        break;
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10);
                        break;
                    case 'j':
                        //arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0);
                        arg = toJSONString(arg, ph.width ? parseInt(ph.width) : 0);
                        break;
                    case 'e':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential();
                        break;
                    case 'f':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg);
                        break;
                    case 'g':
                        arg = ph.precision ? String(Number(arg.toPrecision(ph.precision))) : parseFloat(arg);
                        break;
                    case 'o':
                        arg = (parseInt(arg, 10) >>> 0).toString(8);
                        break;
                    case 's':
                        arg = String(arg);
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 't':
                        arg = String(!!arg);
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 'T':
                        arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0;
                        break;
                    case 'v':
                        arg = arg.valueOf();
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg);
                        break;
                    case 'x':
                        arg = (parseInt(arg, 10) >>> 0).toString(16);
                        break;
                    case 'X':
                        arg = (parseInt(arg, 10) >>> 0).toString(16).toUpperCase();
                        break;
                }
                if (re.json.test(ph.type)) {
                    output += arg;
                } else {
                    if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
                        sign = is_positive ? '+' : '-';
                        arg = arg.toString().replace(re.sign, '');
                    } else {
                        sign = '';
                    }
                    pad_character = ph.pad_char ? ph.pad_char === '0' ? '0' : ph.pad_char.charAt(1) : ' ';
                    pad_length = ph.width - (sign + arg).length;
                    pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : '';
                    output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg);
                }
            }
        }
        return output;
    }

    var sprintf_cache = {};

    function sprintf_parse(fmt) {
        if (sprintf_cache[fmt]) {
            return sprintf_cache[fmt];
        }

        var _fmt = fmt,
            match, parse_tree = [],
            arg_names = 0;
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0]);
            } else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%');
            } else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1;
                    var field_list = [],
                        replacement_field = match[2],
                        field_match = [];
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1]);
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            } else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1]);
                            } else {
                                throw new Error('[sprintf] failed to parse named argument key');
                            }
                        }
                    } else {
                        throw new Error('[sprintf] failed to parse named argument key');
                    }
                    match[2] = field_list;
                } else {
                    arg_names |= 2;
                }
                if (arg_names === 3) {
                    throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported');
                }

                parse_tree.push({
                    placeholder: match[0],
                    param_no: match[1],
                    keys: match[2],
                    sign: match[3],
                    pad_char: match[4],
                    align: match[5],
                    width: match[6],
                    precision: match[7],
                    type: match[8]
                })
            } else {
                throw new Error('[sprintf] unexpected placeholder');
            }
            _fmt = _fmt.substring(match[0].length);
        }
        return sprintf_cache[fmt] = parse_tree;
    }

    return sprintf;
})();

module.exports = {
    setOptions: function(options) {
        options && console.log(options);
    },
    install: function(less, pluginManager, functions) {
        /*
            i18n 
            Internationalization module
        */

        var i18n = (function() {
            function config(options) {
                this.configure(options || {});
            }

            config.prototype.configure = function(options) {
                this.locales = options.locales || [];
                this.fallbacks = options.fallbacks || {};
                this.defaultLocale = options.defaultLocale || 'en';
                this.directory = options.catalog ? void 0 : options.directory || './locales';
                this.prefix = options.prefix || '';
                this.extension = options.extension || '.json';
                this.autoReload = !!options.autoReload;
                this.updateFiles = !!options.updateFiles;
                this.catalog = options.catalog || {};
                this.locale = 'en';
                if (typeof options.register === 'object') {
                    this.register = (options.register instanceof Array) ? options.register : [options.register];
                } else {
                    this.register = [];
                }
            };

            config.prototype.getLocalesDirectory = function() {
                if (!this.directory) return;

                try {
                    less.fs.mkdirSync(this.directory);
                } catch (e) {}

                return this.directory;
            };

            config.prototype.writeCatalog = function() {
                if (!this.getLocalesDirectory()) return;

                for (var locale in this.catalog) {
                    this.writeLocale(locale);
                }
            };

            config.prototype.writeLocale = function(locale) {
                if (!this.getLocalesDirectory()) return;

                var localeFileName = this.prefix + locale + this.extension,
                    localePath = this.directory + '\\' + localeFileName;
                try {
                    less.fs.writeFileSync(localePath, toJSONString(this.catalog[locale], '\t'));
                } catch (e) {}
            };

            config.prototype.readLocale = function(locale) {
                if (!this.getLocalesDirectory()) return;

                var localeFileName = this.prefix + locale + this.extension,
                    localePath = this.directory + '\\' + localeFileName,
                    json;

                try {
                    json = parseJSON(less.fs.readFileSync(localePath, {
                        encoding: 'utf8'
                    }));
                } catch (e) {
                    json = {};
                }

                if (!json) throw new Error("Failed to parse JSON " + localePath);

                this.catalog[locale] = json;
            };

            config.prototype.fetchLocalesFromDirectory = function() {
                var localesDir = this.getLocalesDirectory();

                if (!localesDir) return;

                try {
                    var a,
                        re = new RegExp('^' + this.prefix + '(.+)' + this.extension + '$', 'i');

                    less.fs.readdirSync(localesDir)
                        .forEach(function(name) {
                            a = re.exec(name);
                            if (a) {
                                this.locales.push(a[1]);
                            }
                        }, this);
                } catch (e) {}
            };

            var m_options = new config();

            // public methods

            function configure(options) {
                /*
                    {
                        // other locales default to 'en' silently
                        locales: ['en', 'ru'],
                        fallbacks: {'nl' : 'de'},
                        defaultLocale: 'de',
                        // './locales' by default
                        directory: './locales',
                        autoReload: true,
                        updateFiles: true,
                        // '.json' by default
                        extension: '.js',
                        // '' by default
                        prefix: 'helper-',
                        register: global
                    }
                */
                if (typeof options !== 'object') return;

                var m_opt;

                if (!options.register) {
                    m_options.configure(options);
                    m_opt = m_options;
                } else {
                    m_opt = new config(options);
                }

                if (!m_opt.locales.length) {
                    m_opt.fetchLocalesFromDirectory();
                }

                m_opt.locales.forEach(function(locale) {
                    m_opt.readLocale(locale);
                });

                m_opt.register.forEach(function(obj) {
                    exports(obj, m_opt);
                });
            }

            // public bindable 

            function setLocale(locale) {
                this.locale = (typeof locale === 'string') ? locale : this.defaultLocale;
            }

            function getLocale() {
                return this.locale;
            }

            function getCatalog(locale) {
                if (locale) {
                    return this.catalog[locale] || {};
                }
                return this.catalog || {};
            }

            function __(s) {
                var phrase = s || '',
                    localPhrase = phrase,
                    locale = this.locale || this.defaultLocale;

                if (typeof s == 'object') {
                    phrase = s.phrase || '';
                    locale = s.locale || locale;
                    localPhrase = phrase;
                }

                if (!phrase) return '';

                if (!(locale in this.catalog)) {
                    this.catalog[locale] = {};
                }

                var thisCatalog = this.catalog[locale],
                    globalCatalog = i18n.getCatalog(locale);

                if (phrase in thisCatalog) {
                    localPhrase = thisCatalog[phrase];
                } else if (phrase in globalCatalog) {
                    localPhrase = globalCatalog[phrase];
                } else {
                    thisCatalog[phrase] = phrase;
                    if (this.updateFiles) {
                        this.writeLocale(locale);
                    }
                }

                return sprintf.apply(null, [localPhrase].concat(Array.prototype.slice.call(arguments, 1)));
            }

            // private methods

            function exports(obj, opt) {
                obj.__ = function() {
                    return __.apply(opt, arguments);
                };
                obj.setLocale = function() {
                    return setLocale.apply(opt, arguments);
                };
                obj.getLocale = function() {
                    return getLocale.apply(opt, arguments);
                };
                obj.getCatalog = function() {
                    return getCatalog.apply(opt, arguments);
                };
                return obj;
            }

            // exports

            return exports({
                configure: configure
            }, m_options);
        })();

        ///console.log(arguments);

        functions.add('__', function(s) {
            var q = less.quoted(s.quote, i18n.__(s.value), s.escaped);
            return q;
        });

        functions.add('__UC', function(s) {
            var q = less.quoted(s.quote, i18n.__(s.value).toUpperCase(), s.escaped);
            return q;
        });

        functions.add('__lc', function(s) {
            var q = less.quoted(s.quote, i18n.__(s.value).toLowerCase(), s.escaped);
            return q;
        });

        functions.add('setLocale', function(s) {
            i18n.setLocale(s.value);
            return false;
        });

        functions.add('configure', function(s) {
            i18n.configure({
                updateFiles: true,
                directory: less.options.paths[0],
                prefix: (s && s.value) || 'common-css-locale-'
            });
            return false;
        });
    }
};