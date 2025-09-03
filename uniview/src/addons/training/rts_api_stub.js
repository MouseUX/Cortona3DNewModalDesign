define(function (require, exports, module) {
    /*
      rts_api_stub.js
      29.01.2009 15:45:42
     */

    var API_1484_11_STUB = new(function () {

        var clone = function (o) {
            var r = o;
            if (typeof (o) == 'object' && o instanceof Object) {
                r = {};
                for (var k in o) {
                    r[k] = clone(o[k]);
                }
            }
            return r;
        }

        function SCORMTime( /* [oDate] */ ) {
            //YYYY[-MM[-DD[Thh[:mm[:ss[.s[TZD]]]]]]] 
            var pattern = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(.\d{1,2})(Z|[+-]\d{2}:\d{2}|[+-]\d{2})|(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(.\d{1,2})|(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})|(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})|(\d{4})-(\d{2})-(\d{2})T(\d{2})|(\d{4})-(\d{2})-(\d{2})|(\d{4})-(\d{2})|(\d{4})/;
            this.date = (arguments.length && (arguments[0] instanceof Date)) ? arguments[0] : new Date();
            this.constructor.prototype.toString = function () {
                var _ = function (n) {
                    return n < 10 ? '0' + n : n
                }
                var s = "";
                s += [this.date.getFullYear(), _(this.date.getMonth() + 1), _(this.date.getDate())].join('-');
                s += 'T';
                s += [_(this.date.getHours()), _(this.date.getMinutes()), _(this.date.getSeconds()) + '.' + _(Math.round(this.date.getMilliseconds() / 10))].join(':');
                return s;
            }
            this.constructor.prototype.check = function (s) {
                var r = pattern.exec(s);
                return (r && r[0].length == s.length);
            }
            this.constructor.prototype.parse = function (s) {
                var r = pattern.exec(s);
                if (r && r[0].length == s.length) {
                    var d = new Date(0);
                    var utc = r[8];
                    var i = 1;
                    if (!utc) {
                        for (i = 9; !r[i]; i++);
                        d.setFullYear(r[i++]);
                        if (i < r.length && r[i]) {
                            d.setMonth(r[i++] - 1);
                            if (i < r.length && r[i]) {
                                d.setDate(r[i++]);
                                if (i < r.length && r[i]) {
                                    d.setHours(r[i++]);
                                    if (i < r.length && r[i]) {
                                        d.setMinutes(r[i++]);
                                        if (i < r.length && r[i]) {
                                            d.setSeconds(r[i++]);
                                            if (i < r.length && r[i]) {
                                                d.setMilliseconds(r[i++] * 1000);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        d.setUTCFullYear(r[i++]);
                        if (i < r.length && r[i]) {
                            d.setUTCMonth(r[i++] - 1);
                            if (i < r.length && r[i]) {
                                d.setUTCDate(r[i++]);
                                if (i < r.length && r[i]) {
                                    d.setUTCHours(r[i++]);
                                    if (i < r.length && r[i]) {
                                        d.setUTCMinutes(r[i++]);
                                        if (i < r.length && r[i]) {
                                            d.setUTCSeconds(r[i++]);
                                            if (i < r.length && r[i]) {
                                                d.setUTCMilliseconds(r[i++] * 1000);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (utc != 'Z') {
                            var sign = utc.charAt(0) == '-' ? -1 : 1;
                            utc = utc.split(':');
                            if (utc.length > 1) {
                                utc = sign * (parseInt(utc[1]) + Math.abs(utc[0]) * 60);
                            } else {
                                utc = sign * Math.abs(utc[0]) * 60;
                            }
                            d.setUTCMinutes(d.getUTCMinutes() - utc);
                        }
                    }
                    this.date = d;
                }
                return this;
            }
            this.constructor.prototype.valueOf = function () {
                return this.date;
            }

            return this;
        }

        function SCORMTimeInterval( /* [seconds] */ ) {
            //P[yY][mM][dD][T[hH][mM][s[.s]S]]
            var pattern = /P(\d+Y)?(\d+M)?(\d+D)?T?(\d+H)?(\d+M)?(\d+\.?\d{0,2}S)?/;
            this.interval = arguments.length > 0 ? arguments[0] : 0;
            this.constructor.prototype.toString = function () {
                var s = "P";
                var a = this.interval;
                var _ = function (c, t) {
                    if (a > t) {
                        s += Math.floor(a / t) + c;
                        a = a % t;
                    }
                }

                _("Y", 60 * 60 * 24 * 30 * 12);
                _("M", 60 * 60 * 24 * 30);
                _("D", 60 * 60 * 24);

                if (a) {
                    s += "T";
                    _("H", 60 * 60);
                    _("M", 60);

                    a = Math.round(a * 100) / 100;
                    if (a) {
                        s += a + "S";
                    }
                }

                return s;
            }
            this.constructor.prototype.check = function (s) {
                //P[yY][mM][dD][T[hH][mM][s[.s]S]]
                var r = pattern.exec(s);
                return (r && r[0].length == s.length);
            }
            this.constructor.prototype.parse = function (s) {
                var a = 0;
                var r = pattern.exec(s);
                if (r && r[0].length == s.length) {
                    var b = [12, 30, 24, 60, 60, 1];
                    var n = 1;
                    for (var i = r.length - 1; i >= 1; i--) {
                        n *= b[i - 1]
                        a += (r[i] ? parseFloat(r[i].substring(0, r[i].length - 1)) : 0) * n;
                    }
                    this.interval = a;
                }
                return this;
            }
            this.constructor.prototype.valueOf = function () {
                return this.interval;
            }
            this.constructor.prototype.add = function (n) {
                this.interval += n;
                return this;
            }
            this.constructor.prototype.subtract = function (n) {
                this.interval -= n;
                return this;
            }
            return this;
        }

        var STATE_NOT_INITIALIZED = 0;
        var STATE_RUNNING = 1;
        var STATE_TERMINATED = 2;

        var lmsState = STATE_NOT_INITIALIZED;

        var lastCall;

        var lastErrorCode = 0;
        var errorDescriptions = {
            0: "No Error",
            101: "General Exception",
            102: "General Initialization Failure",
            103: "Already Initialized",
            104: "Content Instance Terminated",
            111: "General Termination Failure",
            112: "Termination Before Initialization",
            113: "Termination After Termination",
            122: "Retrieve Data Before Initialization",
            123: "Retrieve Data After Termination",
            132: "Store Data Before Initialization",
            133: "Store Data After Termination",
            142: "Commit Before Initialization",
            143: "Commit After Termination",
            201: "General Argument Error",
            301: "General Get Failure",
            351: "General Set Failure",
            391: "General Commit Failure",
            401: "Undefined Data Model Element",
            402: "Unimplemented Data Model Element",
            403: "Data Model Element Value Not Initialized",
            404: "Data Model Element Is Read Only",
            405: "Data Model Element Is Write Only",
            406: "Data Model Element Type Mismatch",
            407: "Data Model Element Value Out Of Range",
            408: "Data Model Dependency Not Established"
        };

        var ACCESS_READ = 1;
        var ACCESS_WRITE = 2;
        var ACCESS_INITIALIZED = 4;
        var ACCESS_UNIMPLEMENTED = 8;

        function Data() {
            this.cmi = {
                
                    _version: {
                        _value: "1.0",
                        _type: "string",
                        _access: ACCESS_READ + ACCESS_INITIALIZED
                    },
                    comments_from_learner: {
                        _count: {
                            _value: 0,
                            _type: "integer",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _children: {
                            _value: "comment,location,timestamp",
                            _type: "string",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _items: [],
                        _prototype: {
                            comment: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            location: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            timestamp: {
                                _value: "",
                                _type: "time",
                                _access: ACCESS_READ + ACCESS_WRITE
                            }
                        }
                    },
                    comments_from_lms: {
                        _count: {
                            _value: 0,
                            _type: "integer",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _children: {
                            _value: "comment,location,timestamp",
                            _type: "string",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _items: [],
                        _prototype: {
                            comment: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ
                            },
                            location: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ
                            },
                            timestamp: {
                                _value: "",
                                _type: "time",
                                _access: ACCESS_READ
                            }
                        }
                    },
                    completion_status: {
                        _value: "unknown",
                        _type: "state(completed;incomplete;not attempted;unknown)",
                        _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                    },
                    completion_threshold: {
                        _value: "",
                        _type: "real",
                        _access: ACCESS_READ
                    },
                    /* readonly, from manifest */
                    credit: {
                        _value: "credit",
                        _type: "state(credit;no-credit)",
                        _access: ACCESS_READ
                    },
                    entry: {
                        _value: "ab-initio",
                        _type: "state(ab-initio;resume;)",
                        _access: ACCESS_READ
                    },
                    exit: {
                        _value: "",
                        _type: "state(time-out;suspend;logout;normal;)",
                        _access: ACCESS_WRITE
                    },
                    interactions: {
                        _count: {
                            _value: 0,
                            _type: "integer",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _children: {
                            _value: "id,type,objectives,timestamp,correct_responses,weighting,learner_response,result,latency,description",
                            _type: "string",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _items: [],
                        _prototype: {
                            id: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            type: {
                                _value: "",
                                _type: "state(true-false;choice;fill-in;long-fill-in;likert;matching;performance;sequencing;numeric;other)",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            objectives: {
                                _count: {
                                    _value: 0,
                                    _type: "integer",
                                    _access: ACCESS_READ + ACCESS_INITIALIZED
                                },
                                _items: [],
                                _prototype: {
                                    id: {
                                        _value: "",
                                        _type: "string",
                                        _access: ACCESS_READ + ACCESS_WRITE
                                    }
                                }
                            },
                            timestamp: {
                                _value: "",
                                _type: "time",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            correct_responses: {
                                _count: {
                                    _value: 0,
                                    _type: "integer",
                                    _access: ACCESS_READ + ACCESS_INITIALIZED
                                },
                                _items: [],
                                _prototype: {
                                    pattern: {
                                        _value: "",
                                        _type: "string",
                                        _access: ACCESS_READ + ACCESS_WRITE
                                    }
                                }
                            },
                            weighting: {
                                _value: 0,
                                _type: "real",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            learner_response: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            result: {
                                _value: "",
                                _type: "state(correct;incorrect;unanticipated;neutral)|real",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            latency: {
                                _value: 0,
                                _type: "timeinterval",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            description: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ + ACCESS_WRITE
                            }
                        }
                    },
                    launch_data: {
                        _value: "",
                        _type: "string",
                        _access: ACCESS_READ
                    },
                    /* readonly, from manifest */
                    learner_id: {
                        _value: "urn:VTE:user-generic-id",
                        _type: "string",
                        _access: ACCESS_READ + ACCESS_INITIALIZED
                    },
                    learner_name: {
                        _value: "user_generic_name",
                        _type: "string",
                        _access: ACCESS_READ + ACCESS_INITIALIZED
                    },
                    learner_preference: {
                        _count: {
                            _value: 0,
                            _type: "integer",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _children: {
                            _value: "audio_level,language,delivery_speed,audio_captioning",
                            _type: "string",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _items: [],
                        _prototype: {
                            audio_level: {
                                _value: 1,
                                _type: "real",
                                _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                            },
                            language: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                            },
                            delivery_speed: {
                                _value: 1,
                                _type: "real",
                                _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                            },
                            audio_captioning: {
                                _value: "0",
                                _type: "state(-1;0;1)",
                                _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                            }
                        }
                    },
                    location: {
                        _value: "",
                        _type: "string",
                        _access: ACCESS_READ + ACCESS_WRITE
                    },
                    max_time_allowed: {
                        _value: "",
                        _type: "timeinterval",
                        _access: ACCESS_READ
                    },
                    mode: {
                        _value: "normal",
                        _type: "state(browse;normal;review)",
                        _access: ACCESS_READ + ACCESS_INITIALIZED
                    },
                    objectives: {
                        _count: {
                            _value: 0,
                            _type: "integer",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _children: {
                            _value: "id,score,success_status,completion_status,description",
                            _type: "string",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        _items: [],
                        _prototype: {
                            id: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ + ACCESS_WRITE
                            },
                            score: {
                                _children: {
                                    _value: "scaled,raw,min,max",
                                    _type: "string",
                                    _access: ACCESS_READ + ACCESS_INITIALIZED
                                },
                                scaled: {
                                    _value: "",
                                    _type: "real",
                                    _access: ACCESS_READ + ACCESS_WRITE
                                },
                                raw: {
                                    _value: "",
                                    _type: "real",
                                    _access: ACCESS_READ + ACCESS_WRITE
                                },
                                min: {
                                    _value: "",
                                    _type: "real",
                                    _access: ACCESS_READ + ACCESS_WRITE
                                },
                                max: {
                                    _value: "",
                                    _type: "real",
                                    _access: ACCESS_READ + ACCESS_WRITE
                                }
                            },
                            success_status: {
                                _value: "unknown",
                                _type: "state(passed;failed;unknown)",
                                _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                            },
                            completion_status: {
                                _value: "unknown",
                                _type: "state(completed;incomplete;not attempted;unknown)",
                                _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                            },
                            description: {
                                _value: "",
                                _type: "string",
                                _access: ACCESS_READ + ACCESS_WRITE
                            }
                        }
                    },
                    progress_measure: {
                        _value: "",
                        _type: "real",
                        _access: ACCESS_READ + ACCESS_WRITE,
                        _relationship: function (value) {
                            data.cmi.progress_measure._value = value;
                            data.cmi.progress_measure._access |= ACCESS_INITIALIZED;
                            if (value == 0) {
                                data.cmi.completion_status._value = "not attempted";
                                data.cmi.completion_status._access |= ACCESS_INITIALIZED;
                            } else
                            if (value == 1) {
                                data.cmi.completion_status._value = "completed";
                                data.cmi.completion_status._access |= ACCESS_INITIALIZED;
                            }
                            if (data.cmi.completion_threshold._access & ACCESS_INITIALIZED) {
                                if (value >= data.cmi.completion_threshold._value) {
                                    data.cmi.completion_status._value = "completed";
                                } else {
                                    data.cmi.completion_status._value = "incomplete";
                                }
                                data.cmi.completion_status._access |= ACCESS_INITIALIZED;
                            }
                            return "true";
                        }
                    },
                    scaled_passing_score: {
                        _value: "",
                        _type: "real",
                        _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                    },
                    score: {
                        _children: {
                            _value: "scaled,raw,min,max",
                            _type: "string",
                            _access: ACCESS_READ + ACCESS_INITIALIZED
                        },
                        scaled: {
                            _value: "",
                            _type: "real",
                            _access: ACCESS_READ + ACCESS_WRITE,
                            _relationship: function (value) {
                                data.cmi.score.scaled._value = value;
                                data.cmi.score.scaled._access |= ACCESS_INITIALIZED;
                                if (data.cmi.scaled_passing_score._access & ACCESS_INITIALIZED) {
                                    if (value >= data.cmi.scaled_passing_score._value) {
                                        data.cmi.success_status._value = "passed";
                                    } else {
                                        data.cmi.success_status._value = "failed";
                                    }
                                    data.cmi.success_status._access |= ACCESS_INITIALIZED;
                                }
                                return "true";
                            }
                        },
                        raw: {
                            _value: "",
                            _type: "real",
                            _access: ACCESS_READ + ACCESS_WRITE
                        },
                        min: {
                            _value: "",
                            _type: "real",
                            _access: ACCESS_READ + ACCESS_WRITE
                        },
                        max: {
                            _value: "",
                            _type: "real",
                            _access: ACCESS_READ + ACCESS_WRITE
                        }
                    },
                    session_time: {
                        _value: "",
                        _type: "timeinterval",
                        _access: ACCESS_WRITE
                    },
                    success_status: {
                        _value: "unknown",
                        _type: "state(passed;failed;unknown)",
                        _access: ACCESS_READ + ACCESS_WRITE + ACCESS_INITIALIZED
                    },
                    suspend_data: {
                        _value: "",
                        _type: "string",
                        _access: ACCESS_READ + ACCESS_WRITE
                    },
                    time_limit_action: {
                        _value: "continue,no message",
                        _type: "state(exit,message;continue,message;exit,no message;continue,no message)",
                        _access: ACCESS_READ + ACCESS_INITIALIZED
                    },
                    total_time: {
                        _value: "PT0H0M0S",
                        _type: "timeinterval",
                        _access: ACCESS_READ + ACCESS_INITIALIZED
                    }
                
            };
            this.c3d = {
                hasQuestions: {
                    _value: "unknown",
                    _type: "boolean",
                    _access: ACCESS_READ + ACCESS_WRITE
                }
            }
        }

        function Storage() {
            
            this.currentID = '';
            
            this.setData = function (id, data) {
                this[id] = data;
            }
            
            this.getData = function (id) {
                var data;
                if (!id) id = '_default';
                
                if (this[id]) {
                    data = this[id];
                } else {
                    data = new Data();
                    this.setData(id, data);
                }
                this.currentID = id;
                return data
            }
        }

        var _storage = new Storage();
        var data = new Data();
        
        this.constructor.prototype.Initialize = function () {
            
            lastCall = "Initialize()";
            lastErrorCode = 101;
            switch (lmsState) {
                case STATE_NOT_INITIALIZED:
                    lastErrorCode = 0;
                    lmsState = STATE_RUNNING;
                    break;
                case STATE_RUNNING:
                    //lastErrorCode = 103;
                    //return "false";
                    break;
                case STATE_TERMINATED:
                    lastErrorCode = 104;
                    return "false";
            }
            return "true";
        };
        this.constructor.prototype.Terminate = function () {
            lastCall = "Terminate()";
            lastErrorCode = 101;
            switch (lmsState) {
                case STATE_NOT_INITIALIZED:
                    lastErrorCode = 112;
                    return "false";
                case STATE_RUNNING:
                    lastErrorCode = 0;
                    lmsState = STATE_TERMINATED;
                    break;
                case STATE_TERMINATED:
                    lastErrorCode = 113;
                    return "false";
            }
            return "true";
        };
        this.constructor.prototype.Commit = function () {
            lastCall = 'Commit()';
            lastErrorCode = 101;
            switch (lmsState) {
                case STATE_NOT_INITIALIZED:
                    lastErrorCode = 142;
                    return "false";
                    break;
                case STATE_RUNNING:
                    lastErrorCode = 0;
                case STATE_TERMINATED:
                    lastErrorCode = 143;
                    return "false";
            }
            return "true";
        };
        this.constructor.prototype.GetLastError = function () {
            return lastErrorCode;
        };
        this.constructor.prototype.GetErrorString = function (code) {
            return errorDescriptions[code];
        };
        this.constructor.prototype.GetDiagnostic = function (param) {
            return lastCall;
        };
        this.constructor.prototype.SetValue = function (name, value /* [,  forced ] */ ) {
            lastCall = "SetValue('" + name + "', '" + value + "')";

            var bForced = arguments.length > 2 && arguments[2];

            if (!bForced) {
                switch (lmsState) {
                    case STATE_NOT_INITIALIZED:
                        lastErrorCode = 132;
                        return "false";
                        break;
                    case STATE_TERMINATED:
                        lastErrorCode = 133;
                        return "false";
                }
            }

            lastErrorCode = 0;
            var a = name.split('.');
            var current = data;
            while (a.length) {
                var name = a.shift();
                var index = parseInt(name);
                if (isNaN(index)) {
                    if (name in current) {
                        current = current[name];
                    } else {
                        lastErrorCode = 401;
                        return "false";
                    }
                } else {
                    if ('_items' in current) {
                        if (current._items.length > index) {
                            current = current._items[index];
                        } else
                        if (current._items.length == index) {
                            // new collection element
                            current._items[index] = clone(current._prototype);
                            current._count._value = current._items.length;
                            current = current._items[index];
                        } else {
                            lastErrorCode = 351;
                            return "false";
                        }
                    } else {
                        lastErrorCode = 351;
                        return "false";
                    }
                }
            }

            if (current instanceof Object && '_value' in current) {
                if ((current._access & ACCESS_UNIMPLEMENTED) != 0) {
                    lastErrorCode = 402;
                    return "false";
                }

                if (!bForced && (current._access & ACCESS_WRITE) == 0) {
                    lastErrorCode = 404;
                    return "false";
                }

                // to-do: 407, 408

                var atype = current._type.split('|');
                var valid = false;

                for (var j = 0; j < atype.length && !valid; j++) {
                    var type = /(\w+)\(?([\w\s-,;]*)\)?/.exec(atype[j]);
                    if (type) {
                        switch (type[1]) {
                            case 'state':
                                var restricted = type[2].split(';');
                                for (var i = 0; i < restricted.length && !valid; i++) {
                                    valid = (restricted[i] == value);
                                }
                                break;
                            case 'integer':
                                valid = (value != '' && !isNaN(parseInt(value)));
                                break;
                            case 'real':
                                valid = (value != '' && !isNaN(parseFloat(value)));
                                break;
                            case 'timeinterval':
                                valid = (value != '' && new SCORMTimeInterval().check(value));
                                break;
                            case 'time':
                                valid = (value != '' && new SCORMTime().check(value));
                                break;
                            default:
                                valid = true;
                                break;
                        }
                    }
                }

                if (!valid) {
                    lastErrorCode = 406;
                    return "false";
                }

                if ('_relationship' in current) {
                    return current._relationship(value);
                }

                current._value = value;
                current._access |= ACCESS_INITIALIZED;
                return "true";
            }

            lastErrorCode = 351;
            return "false";
        };
        this.constructor.prototype.GetValue = function (name) {
            lastCall = "GetValue('" + name + "')";

            switch (lmsState) {
                case STATE_NOT_INITIALIZED:
                    lastErrorCode = 122;
                    return "false";
                    break;
                case STATE_TERMINATED:
                    lastErrorCode = 123;
                    return "false";
            }

            lastErrorCode = 0;
            var a = name.split('.');
            var current = data;
            while (a.length) {
                var name = a.shift();
                var index = parseInt(name);
                if (isNaN(index)) {
                    if (name in current) {
                        current = current[name];
                    } else {
                        lastErrorCode = 401;
                        return "";
                    }
                } else {
                    if ('_items' in current) {
                        if (current._items.length > index) {
                            current = current._items[index];
                        } else {
                            lastErrorCode = 301;
                            return "";
                        }
                    } else {
                        lastErrorCode = 301;
                        return "";
                    }
                }
            }

            if (current instanceof Object && '_value' in current) {
                if ((current._access & ACCESS_UNIMPLEMENTED) != 0) {
                    lastErrorCode = 402;
                    return "";
                }

                if ((current._access & ACCESS_READ) == 0) {
                    lastErrorCode = 405;
                    return "";
                }

                if ((current._access & ACCESS_INITIALIZED) == 0) {
                    lastErrorCode = 403;
                    return "";
                }

                return current._value;
            }

            lastErrorCode = 301;
            return "";
        };
        this.constructor.prototype.SetValueForItemById = function(name, value, id) {
            lastCall = "SetValue('" + name + "', '" + value + "')";

            switch (lmsState) {
                case STATE_NOT_INITIALIZED:
                    lastErrorCode = 132;
                    return "false";
                    break;
                case STATE_TERMINATED:
                    lastErrorCode = 133;
                    return "false";
            }
            

            lastErrorCode = 0;
            var a = name.split('.');
            var current = _storage.getData(id);
            while (a.length) {
                var name = a.shift();
                var index = parseInt(name);
                if (isNaN(index)) {
                    if (name in current) {
                        current = current[name];
                    } else {
                        lastErrorCode = 401;
                        return "false";
                    }
                } else {
                    if ('_items' in current) {
                        if (current._items.length > index) {
                            current = current._items[index];
                        } else
                        if (current._items.length == index) {
                            // new collection element
                            current._items[index] = clone(current._prototype);
                            current._count._value = current._items.length;
                            current = current._items[index];
                        } else {
                            lastErrorCode = 351;
                            return "false";
                        }
                    } else {
                        lastErrorCode = 351;
                        return "false";
                    }
                }
            }

            if (current instanceof Object && '_value' in current) {
                if ((current._access & ACCESS_UNIMPLEMENTED) != 0) {
                    lastErrorCode = 402;
                    return "false";
                }

                if ((current._access & ACCESS_WRITE) == 0) {
                    lastErrorCode = 404;
                    return "false";
                }

                // to-do: 407, 408

                var atype = current._type.split('|');
                var valid = false;

                for (var j = 0; j < atype.length && !valid; j++) {
                    var type = /(\w+)\(?([\w\s-,;]*)\)?/.exec(atype[j]);
                    if (type) {
                        switch (type[1]) {
                            case 'state':
                                var restricted = type[2].split(';');
                                for (var i = 0; i < restricted.length && !valid; i++) {
                                    valid = (restricted[i] == value);
                                }
                                break;
                            case 'integer':
                                valid = (value != '' && !isNaN(parseInt(value)));
                                break;
                            case 'real':
                                valid = (value != '' && !isNaN(parseFloat(value)));
                                break;
                            case 'timeinterval':
                                valid = (value != '' && new SCORMTimeInterval().check(value));
                                break;
                            case 'time':
                                valid = (value != '' && new SCORMTime().check(value));
                                break;
                            default:
                                valid = true;
                                break;
                        }
                    }
                }

                if (!valid) {
                    lastErrorCode = 406;
                    return "false";
                }

                if ('_relationship' in current) {
                    return current._relationship(value);
                }

                current._value = value;
                current._access |= ACCESS_INITIALIZED;
                return "true";
            }

            lastErrorCode = 351;
            return "false";
        };
        this.constructor.prototype.GetValueForItemById = function (name, id) {
            lastCall = "GetValue('" + name + "')";

            switch (lmsState) {
                case STATE_NOT_INITIALIZED:
                    lastErrorCode = 122;
                    return "false";
                    break;
                case STATE_TERMINATED:
                    lastErrorCode = 123;
                    return "false";
            }

            lastErrorCode = 0;
            var a = name.split('.');
            var current = _storage.getData(id);
            while (a.length) {
                var name = a.shift();
                var index = parseInt(name);
                if (isNaN(index)) {
                    if (name in current) {
                        current = current[name];
                    } else {
                        lastErrorCode = 401;
                        return "";
                    }
                } else {
                    if ('_items' in current) {
                        if (current._items.length > index) {
                            current = current._items[index];
                        } else {
                            lastErrorCode = 301;
                            return "";
                        }
                    } else {
                        lastErrorCode = 301;
                        return "";
                    }
                }
            }

            if (current instanceof Object && '_value' in current) {
                if ((current._access & ACCESS_UNIMPLEMENTED) != 0) {
                    lastErrorCode = 402;
                    return "";
                }

                if ((current._access & ACCESS_READ) == 0) {
                    lastErrorCode = 405;
                    return "";
                }

                if ((current._access & ACCESS_INITIALIZED) == 0) {
                    lastErrorCode = 403;
                    return "";
                }

                return current._value;
            }

            lastErrorCode = 301;
            return "";
        };
        this.constructor.prototype.GetNewTimeIntervalObject = function (n) {
            return new SCORMTimeInterval(n);
        };
        this.constructor.prototype.GetNewTimeObject = function () {
            return new SCORMTime();
        };
        this.constructor.prototype.startLO = function (id) {
            data = _storage.getData(id);
            return true;
        }
    })();

    module.exports = API_1484_11_STUB;

});