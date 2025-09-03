define(function (require, exports, module) {

var xmlDomUtils = {};
var ACTItem = require('./ACTItem');

function ACT(inputData) {
    
    this.items = {};
    this.itemsArray = [];

    if (inputData.path) {
        this.createFromXMLFile(inputData.path)
    } else if (inputData.data) {
        this.createFromData(inputData.data)
    } else {
        //throw new Error('Error ACT initialize, illegal input')
    }
}

ACT.prototype.createFromXMLFile = function (actPath) {

    var actDOM = xmlDomUtils.getXmlDOM_load(actPath);

    if (!actDOM) {
        return;
    }

    var $productAttributes = xmlDomUtils.getNodesByXPath(actDOM, '/dmodule/content/applicCrossRefTable/productAttributeList/productAttribute');

    for (var i = 0; i < $productAttributes.length; i++) {
        var $productAttribute = $productAttributes.item(i);
        var actItem = new ACTItem({ xmlNode: $productAttribute });

        this.items[actItem.id] = actItem;
        this.itemsArray.push(actItem);
    }
}

ACT.prototype.createFromData = function (data) {
    if (!data) data = {};
    if (!data.items) data.items = {};

    for (var key in data.items) {
        var actItem = new ACTItem({ data: data.items[key] });
        this.items[actItem.id] = actItem;
        this.itemsArray.push(actItem);
    }
}

ACT.prototype.isEmpty = function () {
    return !this.itemsArray.length
}

ACT.prototype.toData = function () {
    var data = {};

    for (var key in this.items) {
        var actItemData = this.items[key].toData();
        data[key] = actItemData;
    }

    return {
        items: data
    };
}

module.exports = ACT;

});