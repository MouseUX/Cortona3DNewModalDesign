define(function (require, exports, module) {

var xmlDomUtils = {};

function CCTItem(inputData) {

    /**
     * @param {object} inputData
     * @param {object} inputData.xmlNodes
     * @param {XMLNode} inputData.xmlNodes.nodeCond
     * @param {XMLNode} inputData.xmlNodes.nodeCondTypeList
     * @param {object} inputData.data
     * 
     */

    if (inputData.xmlNodes) {
        this.createFromXMLNode(inputData.xmlNodes.nodeCond, inputData.xmlNodes.nodeCondTypeList);
    }
    if (inputData.data) {
        this.createFromData(inputData.data);
    }
}

CCTItem.prototype.createFromXMLNode = function ($nodeCond, $nodeCondTypeList) {
    /**
     * create CCT Item from XMLNode
     * @param {XMLNode} $nodeCond The XML DOMNode <cond>
     * @param {XMLNode} $nodeCondTypeList The XML DOMNode <condType>
     * @returns {object} The JavaScript object 
     * {
     *     id: 'SB-S001',               // <cond>
     *     name: '',                    // <cond> | <condType>
     *     displayName: '',             // <cond>
     *     descr: '',                   // <cond> | <condType>
     *     valueDataType: 'integer',    // <condType>
     *     valuePattern: '.*',          // <condType>
     *     enumeration: ['Brook trekker', 'Mountain storm'] // <condType>
     * }
     */

    var condTypeRefId = $nodeCond.getAttribute('condTypeRefId');
    var $nodeCondType = (function() {
        var $condTypes = xmlDomUtils.getNodesByXPath($nodeCondTypeList, './condType');
        for (var i = 0; i < $condTypes.length; i++) {
            if ($condTypes.item(i).getAttribute('id') == condTypeRefId) {
                return $condTypes.item(i)
            }
        }
    })()
    
    var id = $nodeCond.getAttribute('id');
    var valuePattern = $nodeCondType.getAttribute('valuePattern');
    var valueDataType = $nodeCondType.getAttribute('valueDataType') || 'string';
    
    var name = (function () {
        var $name = xmlDomUtils.getSingleNodeByXPath($nodeCond, './name');
        var text = xmlDomUtils.getText($name);
        if (text) {
            return text;
        }
            
        $name = xmlDomUtils.getSingleNodeByXPath($nodeCondType, './name');
        var text = xmlDomUtils.getText($name);
        return text;
        
    })()
    
    var displayName = (function () {
        var $displayName = xmlDomUtils.getSingleNodeByXPath($nodeCond, './displayName');
        return xmlDomUtils.getText($displayName);
    })()

    var descr = (function () {
        var $descr = xmlDomUtils.getSingleNodeByXPath($nodeCond, './descr');
        var text = xmlDomUtils.getText($descr);
        if (text) {
            return text;
        }

        $descr = xmlDomUtils.getSingleNodeByXPath($nodeCondType, './descr');
        text = xmlDomUtils.getText($descr);
        return text;
    })()

    var enumeration = (function (valueDataType) {
        var values = [];
        var $enumerations = xmlDomUtils.getNodesByXPath($nodeCondType, './enumeration');

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
    if (valuePattern) this.valuePattern = valuePattern;
    if (valueDataType) this.valueDataType = valueDataType;
    if (name) this.name = name;
    if (displayName) this.displayName = displayName;
    if (descr) this.descr = descr;
    if (enumeration) this.enumeration = enumeration;

}

CCTItem.prototype.createFromData = function (data) {
    
    if (!data) data = {};

    if (data.id) this.id = data.id;
    if (data.valuePattern) this.valuePattern = data.valuePattern;
    if (data.valueDataType) this.valueDataType = data.valueDataType;
    if (data.name) this.name = data.name;
    if (data.displayName) this.displayName = data.displayName;
    if (data.descr) this.descr = data.descr;
    if (data.enumeration) this.enumeration = data.enumeration;
}

CCTItem.prototype.toData = function () {
    var data = {}
    if (this.id) data.id = this.id
    if (this.valuePattern) data.valuePattern = this.valuePattern;
    if (this.valueDataType) data.valueDataType = this.valueDataType;
    if (this.name) data.name = this.name;
    if (this.displayName) data.displayName = this.displayName;
    if (this.descr) data.descr = this.descr;
    if (this.enumeration) data.enumeration = this.enumeration;

    return data;
}

module.exports = CCTItem;

});