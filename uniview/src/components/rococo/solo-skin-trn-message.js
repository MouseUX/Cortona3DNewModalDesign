/**
 */
define(function (require, exports, module) {
    require('css!./solo-skin-trn-message.css');

    module.exports = function (skin, options, solo) {
        var element = skin.container('.message'),
            t;

        function translateVariables(text) {
            var result = '';
            var a = text.split('%');
            while (a.length > 0) {
                result += a.shift();
                while (a.length > 0 && typeof solo.training.variables[a[0]] === 'undefined') {
                    result += '%' + a.shift();
                }
                if (a.length > 0) {
                    result += solo.training.variables[a.shift()].value;
                }
            }
            return result;
        }

        solo.on('training.messages', function (messages, timeout, isAlert) {
            timeout = timeout || 0;
            messages = messages || [];

            if (typeof messages === 'string') {
                messages = [ messages ];
            }

            if (isAlert) {
                element.classList.add('alert');
            } else {
                element.classList.remove('alert');
            }

            if (!isAlert) {
                //doc_writeline("log", '<dl style="color:#FF8000"><dt>' + getTime() + ' | Message:</dt><dd>' + text + '</dd></dl>');
            }

            skin.clear(element);

            messages.forEach(function (message) {
                element.append(skin.div('', translateVariables(message)));
            });

            clearTimeout(t);

            if (timeout) {
                t = setTimeout(function () {
                    skin.clear(element);
                }, timeout * 1000);
            }
        });

        return this.exports(element);
    };
});