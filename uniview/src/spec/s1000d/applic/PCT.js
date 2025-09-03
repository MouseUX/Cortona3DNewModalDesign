define(function (require, exports, module) {

    var xmlDomUtils = {};
    var Assert = require('./Assert');

function PCT(inputData) {

    this.products = [];

    if (inputData.xmlStr) {
        this.initializeFromXML({
            xmlStr: inputData.xmlStr
        });
    } else if (inputData.path) {
        this.initializeFromXML({
            path: inputData.path
        });
        this.path = inputData.path;
    } else if (inputData.data) {
        this.initializeFromData(inputData.data);
    } else {
        //throw new Error('PCT initialize arguments error')
    }

}

PCT.prototype.initializeFromXML = function (data) {

    /*
        data.xmlStr
        data.path
    */

    var xmlStr = data.xmlStr;
    var docPath = data.path;
    
    var dom;
    
    try {

        if (docPath) {
            dom = xmlDomUtils.getXmlDOM_load(docPath);
        } else if (xmlStr) {
            dom = xmlDomUtils.getXmlDOM();
            dom.loadXML(xmlStr);
        }
    } catch (e) {}

    if (!dom) {
        return;
    }
    
    if (!dom.documentElement) {
        return;
    } 
    
    var $pct_products = xmlDomUtils.getNodesByXPath(dom.documentElement, '//productCrossRefTable/product');
    var $products = [];

    for (var i = 0; i < $pct_products.length; i++) {
        $products.push($pct_products[i]);

        var product = {
            id: $pct_products[i].getAttribute('id') || 'product' + i,
            filter: {}
        }

        var $assigns = xmlDomUtils.getNodesByXPath($pct_products[i], './assign');
        var assigns = {};

        for (var j = 0; j < $assigns.length; j++) {
            var $assign = $assigns[j];
            var assign = {
                applicPropertyIdent: $assign.getAttribute('applicPropertyIdent'),
                applicPropertyType: $assign.getAttribute('applicPropertyType'),
                applicPropertyValues: $assign.getAttribute('applicPropertyValue')
            }

            if (assigns[assign.applicPropertyIdent]) {
                assign.applicPropertyValues = assigns[assign.applicPropertyIdent].applicPropertyValues + '|' + assign.applicPropertyValues;
            }
            assigns[assign.applicPropertyIdent] = assign;
        }

        for (var key in assigns) {
            var assert = new Assert(assigns[key]);
            product.filter[assert.applicPropertyIdent] = assert;
        }

        this.products.push(new Product(product));
    }

    return true;
}

PCT.prototype.initializeFromData = function (data) {

    /*{
        products: [
            { 
                id: 'id', 
                filter: { applicPropertyIdent1: AssertData, applicPropertyIdent2: AssertData } 
            }, 
            product, 
            product
        ]
    }*/

    if (!data.products) {
        throw new Error('PCT initialize by Data arguments error');
    }

    for (var i = 0; i < data.products.length; i++) {
        this.products.push(new Product(data.products[i]));
    }

    return true;
}

PCT.prototype.toData = function () {
    var data = {
        products: []
    };

    for (var i = 0; i < this.products.length; i++) {
        var product = this.products[i];
        var dataProduct = {
            id: product.id,
            filter: {}
        }
        for (var key in product.filter) {
            dataProduct.filter[key] = product.filter[key].toData();
        }
        data.products.push(dataProduct);
    }

    return data;

}

PCT.prototype.toString = function () {
    return toJSONString(this.toData());
}

PCT.prototype.getProductByArgs = function (args) {

    /*args = {
        id: String,
        count: Number
    }*/

    var args = args || {};
    var id = args.id;
    var count = args.count;

    if (!id && !count)
        return;

    if (id) {
        for (var i = 0; i < this.products.length; i++) {
            var product = this.products[i];
            if (product.id == id)
                return product;
        }

        return;
    }

    if (count) {
        return this.products[count - 1];
    }
    return;
}

function Product(inputData) {
    this.id = inputData.id || 'product' + i;
    this.filter = (function () {
        var res = {};
        for (var key in inputData.filter) {
            res[key] = new Assert(inputData.filter[key])
        }
        return res;
    })();

    this.resolve = function (template) {
        if (!template) {
            template = '[%id] %resolveStr';
        }
        
        return template.replace(/%id/, this.id).replace(/%resolveStr/, this.toArrString().join(', '))
    }

    this.toArrString = function () {
        var arr = [];
        for (var key in this.filter) {
            arr.push(this.filter[key].toPCTString());
        }
        return arr;
    }
}

module.exports = PCT;

});