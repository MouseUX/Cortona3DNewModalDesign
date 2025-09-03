define(function (require, exports, module) {

    var xmlDomUtils = {};
    var Assert = require('./Assert');
    var i18n = Cortona3DSolo.uniview.i18n['uniview-structure'];

function Evaluate(inputData) {
    this.andOr = '' //and, or, single;
    this.range = [];

    if (inputData.xml) {
        this.createFromXMLNode(inputData);
    } else if (inputData.innerHTML) {
        this.createFromHTMLNode(inputData);
    } else if (inputData.$) {
        this.createFromUniview(inputData);
    } else {
        this.createFromData(inputData);
    }
}

Evaluate.DAFAULTIDENT = '    ';

Evaluate.prototype.createFromData = function (data) {

    this.andOr = data.andOr;

    for (var i = 0; i < data.range.length; i++) {
        var dataRangeItem = data.range[i];
        var convertedItem = (dataRangeItem.andOr) ? new Evaluate(dataRangeItem) : new Assert(dataRangeItem);
        this.range.push(convertedItem);
    }
}

Evaluate.prototype.createFromXMLNode = function ($evaluate) {
    this.andOr = $evaluate.getAttribute('andOr');

    var $evaluateOrAssertsNodes = xmlDomUtils.getNodesByXPath($evaluate, './assert | ./evaluate');
    for (var i = 0; i < $evaluateOrAssertsNodes.length; i++) {
        var $evaluateOrAssertsNode = $evaluateOrAssertsNodes.item(i);
        var convertedItem = ($evaluateOrAssertsNode.nodeName == 'evaluate') ? new Evaluate($evaluateOrAssertsNode) : new Assert($evaluateOrAssertsNode);
        this.range.push(convertedItem);
    }
}

Evaluate.prototype.createFromUniview = function ($evaluate) {

    this.andOr = $evaluate.$attr('andOr');

    var $evaluateOrAssertsNodes = $evaluate.$('*');
    for (var i = 0; i < $evaluateOrAssertsNodes.length; i++) {
        var $evaluateOrAssertsNode = $evaluateOrAssertsNodes[i];
        var convertedItem = ($evaluateOrAssertsNode['@name'] == 'evaluate') ? new Evaluate($evaluateOrAssertsNode) : new Assert($evaluateOrAssertsNode);
        this.range.push(convertedItem);
    }
}

Evaluate.prototype.createFromHTMLNode = function ($evaluate) {

    this.andOr = $evaluate.getAttribute('data-andOr');

    var $evaluateOrAssertsNodes = $evaluate.children;
    for (var i = 0; i < $evaluateOrAssertsNodes.length; i++) {
        var $evaluateOrAssertsNode = $evaluateOrAssertsNodes.item(i);
        var convertedItem = ($evaluateOrAssertsNode.classList.contains('evaluate')) ? new Evaluate($evaluateOrAssertsNode) : new Assert($evaluateOrAssertsNode);
        this.range.push(convertedItem);
    }
}

Evaluate.prototype.filteredByProduct = function (product) {

    var newRange = [];

    if (this.andOr == 'or') {
        for (var i = 0; i < this.range.length; i++) {
            var state = this.range[i].filteredByProduct(product);
            if (state) {
                newRange.push(this.range[i]);
            }
        }
    } else if (this.andOr == 'and') {
        for (var i = 0; i < this.range.length; i++) {
            var state = this.range[i].filteredByProduct(product);
            if (state) {
                newRange.push(this.range[i]);
            } else {
                newRange = [];
                i = this.range.length;
            }
        }
    }

    if (newRange.length) {
        this.range = newRange;
        return true;
    } else {
        this.range = [];
        return false;
    }
}

Evaluate.prototype.toData = function () {
    var data = {};
    data.andOr = this.andOr;
    data.range = [];
    for (var i = 0; i < this.range.length; i++) {
        data.range.push(this.range[i].toData());
    }
    return data;
}

Evaluate.prototype.toString = function (ident) {
    ident = (ident) ? ident : '';
    var str = '{';
    for (var key in this) {
        if (key == 'range') {
            str += '\n' + ident + Evaluate.DAFAULTIDENT + key + ': [';
            for (var i = 0; i < this[key].length; i++) {
                str += this[key][i].toString(ident + Evaluate.DAFAULTIDENT);
                if (i != (this[key].length - 1)) {
                    str += '; ';
                }
            }
            str += ']';
        } else if ((typeof this[key] !== 'function') && (key != 'xmlNode') && (this[key])) {
            str += '\n' + ident + Evaluate.DAFAULTIDENT + key + ': ' + this[key].toString(ident + Evaluate.DAFAULTIDENT);
        }
    }
    str += '\n' + ident + '}'
    return str;
}

Evaluate.prototype.toInlineApplicString = function () {
    var res = [];
    this.range.forEach(function (el) {
        res.push(el.toInlineApplicString());
    })
    var separator = (this.andOr == 'and') ? (' ' + i18n.AND + ' ') : ', '
    return res.join(separator);
}

Evaluate.prototype.resolve = function (noBrackets) {
    var template = (noBrackets) ? '%str' : '(%str)';
    var res = [];
    this.range.forEach(function (el) {
        res.push(el.resolve());
    })
    var separator = (this.andOr == 'and') ? (' ' + i18n.AND + ' ') : ', ';
    return template.replace(/%str/, res.join(separator));
}

Evaluate.prototype.removeItem = function () {
    this.removed = true;
}

Evaluate.prototype.removeChild = function () {
    var range = [];
    this.range.forEach(function (item) {
        if (!item.removed) {
            range.push(item);
        }
    })

    this.range = range;
}

module.exports = Evaluate;
});