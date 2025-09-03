define(function (require, exports, module) {

    /*
      rts_api_wrapper.js
      26.02.2009 10:10:13
     */

    var rtsAPI = new(function () {

        var _api = null;
        var _terminated = false;
        var _is_stub = false;
        var _displayErrorInfo = function (code) {
            console.error("ERROR: " + code + " - " + _api.GetErrorString(code), ": " + _api.GetDiagnostic(code));
        };

        this.constructor.prototype.isStub = function () {
            if (this.getAPI().isSoloStub)
                return true;
            return _is_stub;
        };

        this.constructor.prototype.isTerminated = function () {
            return _terminated;
        };

        this.constructor.prototype.getAPI = function () {
            var _findAPI = function (win) {
                var findAPITries = 0;

                while ((win.API_1484_11 == null) &&
                    (win.parent != null) &&
                    (win.parent != win)) {
                    findAPITries++;
                    if (findAPITries > 500) {
                        console.error("Error finding API -- too deeply nested.");
                        return null;
                    }
                    win = win.parent;
                }

                return win.API_1484_11;
            };

            if (!_api) {
                _api = _findAPI(window);

                if (!_api &&
                    (window.opener != null) &&
                    (typeof (window.opener) != "undefined")) {
                    _api = _findAPI(window.opener);
                }

                if (!_api) {
                    console.error("Unable to locate the LMS's API Implementation. Communication with the LMS will not occur.");
                    console.log("Switch to LMS's API stub.");
                    _is_stub = true;
                    _api = require('./rts_api_stub');
                }
            }
            return _api;
        };


        this.constructor.prototype.initialize = function () {
            var result = false;
            var api = this.getAPI();
            if (api) {
                result = (api.Initialize("") == "true");
                if (!result) {
                    _displayErrorInfo(api.GetLastError());
                }
            }
            return result;
        };

        this.constructor.prototype.terminate = function () {
            var result = false;
            var api = this.getAPI();
            if (api) {
                if (!_terminated) {
                    _terminated = true;

                    result = (api.Terminate("") == "true");

                    if (!result) {
                        _displayErrorInfo(api.GetLastError());
                    }
                }
            }
            return result;
        };

        this.constructor.prototype.get = function (name) {
            if (!_terminated) {
                var api = this.getAPI();
                if (api) {
                    var value = api.GetValue(name);

                    var errCode = api.GetLastError();

                    if (errCode != "0") {
                        _displayErrorInfo(errCode);
                    } else {
                        return value;
                    }
                }
            }
            return;
        };

        this.constructor.prototype.set = function (name, value) {
            var result = false;
            if (!_terminated) {
                var api = this.getAPI();
                if (api) {
                    result = (api.SetValue(name, value) == "true");
                    if (!result) {
                        _displayErrorInfo(api.GetLastError());
                    }
                }
            }
            return result;
        };

        this.constructor.prototype.commit = function () {
            var result = false;
            if (!_terminated) {
                var api = this.getAPI();
                if (api) {
                    result = (api.Commit() == "true");
                    if (!result) {
                        _displayErrorInfo(api.GetLastError());
                    }
                }
            }
            return result;
        };

        this.constructor.prototype.startLO = function (id) {
            var api = this.getAPI();
            return api.startLO(id);
        }

        this.constructor.prototype.setValueForItemById = function(name, value, id) {
            var api = this.getAPI();
            var res = api.SetValueForItemById(name, value, id);
            return (res == 'true') ? true : false;
        };
        this.constructor.prototype.getValueForItemById = function (name, id) {
            var api = this.getAPI();
            var res = api.GetValueForItemById(name, id);
            return res;
        };

    })();

    module.exports = rtsAPI;

});