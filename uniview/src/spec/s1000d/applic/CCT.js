define(function (require, exports, module) {

var xmlDomUtils = {};
var CCTItem = require('./CCTItem');

function CCT(inputData) {

    this.items = {};
    this.itemsArray = [];

    if (inputData.path) {
        this.createFromXMLFile(inputData.path)
    } else if (inputData.data) {
        this.createFromData(inputData.data)
    } else {
        //throw new Error('Error CCT initialize, illegal input')
    }
}

CCT.prototype.createFromXMLFile = function (cctPath) {

    var cctDOM = xmlDomUtils.getXmlDOM_load(cctPath);

    if (!cctDOM) {
        return;
    }

    var $cctCondTypeList = xmlDomUtils.getSingleNodeByXPath(cctDOM, '/dmodule/content/condCrossRefTable/condTypeList');
    var $cctConds = xmlDomUtils.getNodesByXPath(cctDOM, '/dmodule/content/condCrossRefTable/condList/cond');

    for (var i = 0; i < $cctConds.length; i++) {
        var $cctCond = $cctConds.item(i);
        var cctItem = new CCTItem({ xmlNodes: {
            nodeCond: $cctCond,
            nodeCondTypeList: $cctCondTypeList
        }});

        this.items[cctItem.id] = cctItem;
        this.itemsArray.push(cctItem);
    }
}

CCT.prototype.createFromData = function (data) {
    if (!data) data = {};
    if (!data.items) data.items = {};

    for (var key in data.items) {
        var cctItem = new CCTItem( { data: data.items[key] } );
        this.items[cctItem.id] = cctItem;
        this.itemsArray.push(cctItem);
    }
}

CCT.prototype.isEmpty = function () {
    return !this.itemsArray.length
}

CCT.prototype.toData = function () {
    var data = {};
    
    for (var key in this.items) {
        var cctItemData = this.items[key].toData();
        data[key] = cctItemData;
    }

    return {
        items: data
    };
}

module.exports = CCT;

});