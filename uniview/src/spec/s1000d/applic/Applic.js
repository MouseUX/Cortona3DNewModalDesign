define(function (require, exports, module) {
    
    var xmlDomUtils = {};
    var Evaluate = require('./Evaluate');
    var Assert = require('./Assert');

    function Applic(inputData) {

    this.id = '';
    this.attributes = [];
    this.displayText = [];
    this.expression = {};

    if (!inputData) {
        this.createDefault();
    } else if (inputData.innerHTML) {
        this.createFromHTMLNode(inputData);
    } else if (inputData.xml) {
        this.createFromXMLNode(inputData);
    } else if (inputData.$) {
        this.createFromUniview(inputData);
    } else {
        this.createFromData(inputData);
    }

    this.data = this.toData();
}

Applic.DAFAULTIDENT = '    ';

Applic.prototype.createDefault = function () {
    this.id = '';
    this.expression = new Assert();
}
Applic.prototype.createFromData = function (data) {
    this.id = data.id;
    this.attributes = data.attributes || {};
    this.displayText = (function () {
        return (data.displayText) ? data.displayText : [];
    })();
    this.expression = (function () {
        if (!data.expression) {
            //return new Assert();
            return undefined;
        }

        if (data.expression.andOr) {
            return new Evaluate(data.expression)
        } else {
            return new Assert(data.expression)
        }
    })();
}
Applic.prototype.createFromXMLNode = function ($applic) {

    this.id = $applic.getAttribute('id') || '';
    this.attributes = (function () {
        var res = {};
        for (var i = 0; i < $applic.attributes.length; i++) {
            var name = $applic.attributes.item(i).name;
            if (name == 'id') {
                continue;
            }
            res[name] = $applic.attributes.item(i).value;
        }
        return res;
    })();
    this.displayText = (function () {
        var res = [];
        var $simpleParas = xmlDomUtils.getNodesByXPath($applic, './displayText/simplePara');
        for (var i = 0; i < $simpleParas.length; i++) {
            res.push(xmlDomUtils.getText($simpleParas.item(i)));
        }
        return res;
    })();
    this.expression = (function () {
        var $evaluatesAndAsserts = xmlDomUtils.getNodesByXPath($applic, './assert | ./evaluate');
        if (!$evaluatesAndAsserts.length) {
            //return new Assert();
            return undefined;
        }
        
        var $evaluatesOrAssert = $evaluatesAndAsserts.item(0);

        return ($evaluatesOrAssert.nodeName == 'assert') ? new Assert($evaluatesOrAssert) : new Evaluate($evaluatesOrAssert);
    })();
}

Applic.prototype.createFromUniview = function ($applic) {

    this.id = $applic.$attr('id') || '';
    this.attributes = (function () {
        var res = {};
        for (var key in $applic['@attributes']) {
            if (key == 'id') {
                continue;
            }
            res[key] = $applic['@attributes'][key];
        }
        return res;
    })();
    
    this.displayText = (function () {
        var res = [];
        if (typeof $applic.displayText === 'string') {
            // <?displayText?>, not processing, because author did not insert displayText.
            //res.push($applic.displayText);
        } else {
            // <displayText><simplePara>
            res = $applic.$('displayText/simplePara').map(function (simplePara) {
                return simplePara.$text();
            })
        }
        return res;
    })();
    this.expression = (function () {

        if ($applic.$('assert')[0]) {
            return new Assert($applic.$('assert')[0]);
        } else if ($applic.$('evaluate')[0]) {
            return new Evaluate($applic.$('evaluate')[0]);
        } else {
            //return new Assert();
            return undefined;
        }
    })();
}

Applic.prototype.createFromHTMLNode = function ($applic) {

    this.id = $applic.id || '';
    this.displayText = (function () {
        var res = [];

        var $simpleParas = $applic.querySelectorAll('.simplePara');
        for (var i = 0; i < $simpleParas.length; i++) {
            res.push($simpleParas.item(i).innerText.replace(/\n/, ''));
        }
        return res;
    })();
    this.expression = (function () {
        var $evaluatesAndAssert = $applic.lastElementChild;

        if (!$evaluatesAndAssert) {
            //return new Assert();
            return undefined;
        }

        if ($evaluatesAndAssert.classList.contains('assert')) {
            res = new Assert($evaluatesAndAssert);
        } else if ($evaluatesAndAssert.classList.contains('evaluate'))
            res = new Evaluate($evaluatesAndAssert);
        else {
            //res = new Assert();
            res = undefined;
        }

        return res;
    })();
}

Applic.prototype.getStateAfterFilteringByProducts = function (products) {
    var state = false;

    for (var i = 0; i < products.length; i++) {
        var filterApplic = this.filteredByProduct(products[i]);
        if (filterApplic.state == true) {
            state = true;
            break;
        }
    }

    return state;
}

Applic.prototype.filteredByProduct = function (product) {
    if (!product || (product && !product.filter))
        return;

    var filterApplic = new Applic(this.data);
    filterApplic.filteredBy = product;
    if (!filterApplic.expression) {
        filterApplic.state = true;
        return filterApplic.toData();
    }
    filterApplic.expression.filteredByProduct(product);

    if (filterApplic.expression.range && !filterApplic.expression.range.length) {
        filterApplic.state = false;
    } else if (filterApplic.expression.values && !filterApplic.expression.values.length) {
        filterApplic.state = false;
    } else {
        filterApplic.state = true;
    }

    return filterApplic.toData();
}

Applic.prototype.toData = function () {
    var data = {};

    data.id = this.id;
    data.attributes = this.attributes;
    data.displayText = this.displayText;
    /* data.expression = (this.expression.hasOwnProperty('andOr') || this.expression.hasOwnProperty('applicPropertyIdent')) 
        ? this.expression.toData() 
        : {}; */
    if (this.expression) {
        data.expression = this.expression.toData();
    }
    if (this.hasOwnProperty('state')) {
        data.state = this.state;
    }

    return data;
}

Applic.prototype.removeItem = function () {
    this.removed = true;
}

Applic.prototype.removeChild = function () {
    this.expression = undefined;
}

Applic.prototype.toString = function (ident) {
    ident = (ident) ? ident : '';
    var str = '{';

    for (var key in this) {
        if ((typeof this[key] !== 'function') && (key != 'xmlNode') && (this[key])) {
            str += '\n' + ident + Applic.DAFAULTIDENT + key + ': ' + this[key].toString(ident + Applic.DAFAULTIDENT);
        } else if (typeof this[key] == 'boolean') {
            str += '\n' + ident + Applic.DAFAULTIDENT + key + ': ' + this[key]
        }
    }
    str += '\n}'
    return str;
}

Applic.prototype.toInlineApplicString = function () {
    if (this.displayText.length) {
        return this.displayText.join(' ')
    }

    var str = '';
    if (this.expression) {
        str = this.expression.toInlineApplicString();
    }
    
    return str;
}

Applic.prototype.resolve = function () {
    if (this.displayText.length) {
        return this.displayText.join(' ')
    }
    
    var str = '';
    if (this.expression) {
        str = this.expression.resolve(true);
    }
    
    return str;
}

Applic.defineConvertedRules = function (rules) {
    Assert.RULES = rules;
}

Applic.defineACTRules = function (act) {
    Assert.ACT = act;
}

Applic.defineCCTRules = function (cct) {
    Assert.CCT = cct;
}

module.exports = Applic;
});