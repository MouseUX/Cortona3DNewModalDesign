define(function (require, exports, module) {

var xmlDomUtils = {};

function ACTItem(inputData) {
    
    /**
     * @param {object} inputData
     * @param {XMLNode} inputData.xmlNode
     * @param {object} inputData.data
     * 
     */
    
    if (inputData.xmlNode) {
        this.createFromXMLNode(inputData.xmlNode);
    }
    if (inputData.data) {
        this.createFromData(inputData.data);
    }
}

ACTItem.prototype.createFromXMLNode = function ($node) {
    /**
     * create ACT Item Data from XML
     * @param {XMLNode} $node The XML DOMNode
     * @returns {object} The JavaScript object 
     * {
     *     id: 'model',
     *     name: 'Model',
     *     valueDataType: 'integer',
     *     valuePattern: '.*',
     *     enumeration: ['Brook trekker', 'Mountain storm']
     * }
     */

    var id = $node.getAttribute('id');
    var productIdentifier = $node.getAttribute('productIdentifier');
    var valuePattern = $node.getAttribute('valuePattern');
    var valueDataType = $node.getAttribute('valueDataType') || 'string';

    var name = (function() {
        var $name = xmlDomUtils.getSingleNodeByXPath($node, './name');
        return xmlDomUtils.getText($name);
    })()

    var displayName = (function () {
        var $displayName = xmlDomUtils.getSingleNodeByXPath($node, './displayName');
        return xmlDomUtils.getText($displayName);
    })()

    var descr = (function () {
        var $descr = xmlDomUtils.getSingleNodeByXPath($node, './descr');
        return xmlDomUtils.getText($descr);
    })()
    
    var enumeration = (function (valueDataType) {
        var values = [];
        var $enumerations = xmlDomUtils.getNodesByXPath($node, './enumeration');

        for (var i = 0; i < $enumerations.length; i++) {
            var $enumeration = $enumerations.item(i);
            var applicPropertyValues = $enumeration.getAttribute('applicPropertyValues');
            var currentValues = (applicPropertyValues.indexOf('|') != -1) ? applicPropertyValues.split('|') : [applicPropertyValues];

            for (var j = 0; j < currentValues.length; j++) {
                var item = currentValues[j];
                if (item.indexOf('~') != -1) {
                    var rangeStart = item.split('~')[0];
                    var rangeEnd = item.split('~')[1];

                    if (valueDataType == 'integer') {
                        values.push([Number(rangeStart), Number(rangeEnd)]);
                    } else {
                        values.push([rangeStart, rangeEnd]);
                    }
                } else {
                    values.push(item)
                }
            }
        }

        return values;
    })(valueDataType);

    if (id) this.id = id;
    if (productIdentifier) this.productIdentifier = productIdentifier;
    if (valuePattern) this.valuePattern = valuePattern;
    if (valueDataType) this.valueDataType = valueDataType;
    if (name) this.name = name;
    if (displayName) this.displayName = displayName;
    if (descr) this.descr = descr;
    if (enumeration) this.enumeration = enumeration;

}

ACTItem.prototype.createFromData = function (data) {
    
    if (!data) data = {};

    if (data.id) this.id = data.id;
    if (data.productIdentifier) this.productIdentifier = data.productIdentifier;
    if (data.valuePattern) this.valuePattern = data.valuePattern;
    if (data.valueDataType) this.valueDataType = data.valueDataType;
    if (data.name) this.name = data.name;
    if (data.displayName) this.displayName = data.displayName;
    if (data.descr) this.descr = data.descr;
    if (data.enumeration) this.enumeration = data.enumeration;
}

ACTItem.prototype.toData = function () {
    var data = {}
    if (this.id) data.id = this.id
    if (this.productIdentifier) data.productIdentifier = this.productIdentifier;
    if (this.valuePattern) data.valuePattern = this.valuePattern;
    if (this.valueDataType) data.valueDataType = this.valueDataType;
    if (this.name) data.name = this.name;
    if (this.displayName) data.displayName = this.displayName;
    if (this.descr) data.descr = this.descr;
    if (this.enumeration) data.enumeration = this.enumeration;

    return data;
}

module.exports = ACTItem;

});