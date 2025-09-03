define(function (require, exports, module) {

    //console.log('Assert init!');

    var xmlDomUtils = {};
/*
var inputDataSample = {
    applicPropertyIdent: 'serialno',
    applicPropertyType: 'prodattr',
    applicPropertyValues: '0005|0006|0007|0010~9999'
}*/

/*rules (can be define in Applic class): {
    'versrank': {
        enumerated: true,
        optimize: true,
        toComparedValues: function (value) {
            return parseInt(value.replace(/\D/, ''));
        },
        toS1000DValues: function (value) {
            return '' + value;
        }
    },
    'serial': {
        enumerated: true,
        optimize: true,
        toComparedValues: function (value) {
            return +(value.replace(/\D/, ''))
        },
        toS1000DValues: function (value) {
            return ('000' + value).slice(-4);
        }
    }
}*/

function Assert(inputData) {

    //console.log('Assert create', Assert.ACT, inputData);
    
    this.applicPropertyIdent = '';
    this.applicPropertyType = '';
    this.applicPropertyValues = '';

    this.convertedRulesByIdent = (function () {
        return Assert.RULES || {};
    })();

    this.act = (function () {
        return Assert.ACT || { items: { empty: true } };
    })();

    this.cct = (function () {
        return Assert.CCT || { items: { empty: true } };
    })();

    if (!inputData) {
        this.createDefault();
    } else if (inputData.xml) {
        this.createFromXMLNode(inputData);
    } else if (inputData.innerHTML) {
        this.createFromHTMLNode(inputData);
    } else if (inputData.$) {
        this.createFromUniview(inputData);
    } else {
        this.createFromData(inputData);
    }

    this.updateValues();
}

Assert.DEFAULT_IDENT = '';
Assert.DEFAULT_TYPE = 'prodattr';
Assert.DEFAULT_VALUE = '';
Assert.DAFAULTIDENT = '    ';

Assert.RULES = '';

Assert.prototype.createDefault = function () {
    this.applicPropertyIdent = Assert.DEFAULT_IDENT;
    this.applicPropertyType = Assert.DEFAULT_TYPE;
    this.applicPropertyValues = Assert.DEFAULT_VALUE;
}

Assert.prototype.createFromXMLNode = function (assertNode) {

    function getProperty(propertyName) {
        var res = '';
        if (!assertNode || !assertNode.getAttribute(propertyName)) {
            return undefined;
        } else {
            return assertNode.getAttribute(propertyName);
        }
    }

    this.applicPropertyIdent = getProperty('applicPropertyIdent') || Assert.DEFAULT_IDENT;
    this.applicPropertyType = getProperty('applicPropertyType') || Assert.DEFAULT_TYPE;
    this.applicPropertyValues = getProperty('applicPropertyValues') || getProperty('applicPropertyValue') || Assert.DEFAULT_VALUE;
}

Assert.prototype.createFromUniview = function ($assert) {

    this.applicPropertyIdent = $assert.$attr('applicPropertyIdent') || Assert.DEFAULT_IDENT;
    this.applicPropertyType = $assert.$attr('applicPropertyType') || Assert.DEFAULT_TYPE;
    this.applicPropertyValues = $assert.$attr('applicPropertyValues') || $assert.$attr('applicPropertyValue') || Assert.DEFAULT_VALUE;
}

Assert.prototype.createFromHTMLNode = function (assertNode) {

    function getProperty(propertyName) {
        if (!assertNode || !assertNode.getAttribute(propertyName)) {
            return undefined;
        } else {
            return assertNode.getAttribute(propertyName);
        }
    }

    this.applicPropertyIdent = getProperty('data-applicPropertyIdent') || Assert.DEFAULT_IDENT;
    this.applicPropertyType = getProperty('data-applicPropertyType') || Assert.DEFAULT_TYPE;
    this.applicPropertyValues = getProperty('data-applicPropertyValues') || getProperty('data-applicPropertyValue') || Assert.DEFAULT_VALUE;
}

Assert.prototype.createFromData = function (data) {

    this.applicPropertyIdent = data.applicPropertyIdent || Assert.DEFAULT_IDENT;
    this.applicPropertyType = data.applicPropertyType || Assert.DEFAULT_TYPE;
    this.applicPropertyValues = data.applicPropertyValues || data.applicPropertyValue || Assert.DEFAULT_VALUE;

}

Assert.prototype.updateValues = function () {
    this.values = this.getValuesArraysFromString(this.applicPropertyValues, this.applicPropertyIdent);
    this.applicPropertyValues = this.getS1000DApplicStringFromValues(this.values, this.applicPropertyIdent);
}

Assert.prototype.getValuesArraysFromString = function (str, applicPropertyIdent) {

    function formatValue(value, applicPropertyIdent) {

        if (actItem) {
            if (actItem.valueDataType == 'integer' || actItem.valueDataType == 'real') {
                return Number(value);
            } else {
                return value;
            }
        }
        
        return value;
    }

    var arr = [];
    var parts = str.split('|');
    var actItem = this.act.items[applicPropertyIdent];

    if (!str) {
        return arr;
    }

    if (this.convertedRulesByIdent[applicPropertyIdent] && this.convertedRulesByIdent[applicPropertyIdent].enumerated) {
        //get array for enumerated values

        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.indexOf('~') != -1) {
                var range = part.split('~');
                range[0] = this.convertedRulesByIdent[applicPropertyIdent].toComparedValues(range[0]);
                range[1] = this.convertedRulesByIdent[applicPropertyIdent].toComparedValues(range[1]);
                for (var j = range[0]; j <= range[1]; j++) {
                    arr.push(j);
                }
            } else {
                arr.push(this.convertedRulesByIdent[applicPropertyIdent].toComparedValues(part));
            }
        }
    } else {

        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.indexOf('~') != -1) {
                var start = formatValue(part.split('~')[0], applicPropertyIdent),
                    end = formatValue(part.split('~')[1], applicPropertyIdent);

                arr.push([start, end])
            } else {
                part = formatValue(part, applicPropertyIdent);
                arr.push(part);
            }
        }
    }

    if (this.convertedRulesByIdent[applicPropertyIdent] && this.convertedRulesByIdent[applicPropertyIdent].optimize) {
        arr = this.optimizeArray(arr);
    } else {
        arr = this.defaultOptimize(arr)
    }

    return arr;
}

Assert.prototype.optimizeArray = function (arr) {
    // [1,4,1] -> [1,4]
    var res = [];

    arr.forEach(function (item) {
        var flag = false;

        for (var i = 0; i < res.length; i++) {
            if (res[i] == item) {
                flag = true;
                break;
            }
        }
        if (!flag) {
            res.push(item);
        }
    });

    //sort [5,3,1,6,10] -> [1,3,5,6,10]
    res = res.sort(function (a, b) {
        return a - b;
    });

    return res;
}

Assert.prototype.defaultOptimize = function (arr) {
    // [A,[B, C],D,[B, C],D] -> [A,[B, C], D]
    var uniqArr = [];
    var res = [];
    
    arr.forEach(function (item) {
        var flag = false;
        var key = (item instanceof Array) ? item.join('~') : item;
        for (var i = 0; i < uniqArr.length; i++) {
            if (uniqArr[i] == key) {
                flag = true;          
                break;
            }
        }
        if (!flag) {
            uniqArr.push(key);
            res.push(item);
        }
    })

    return res;
}

Assert.prototype.getS1000DApplicStringFromValues = function (arr, applicPropertyIdent) {

    var res = [];

    if (this.convertedRulesByIdent[applicPropertyIdent] && this.convertedRulesByIdent[applicPropertyIdent].enumerated) {
        //get array for enumerated values
        var start = arr[0];
        var end = arr[0];

        for (var i = 0; i < arr.length; i++) {
            if (start) {
                if (arr[i] != arr[i + 1]) {
                    if (arr[i] != (arr[i + 1] - 1)) {
                        end = arr[i];
                        if (start == end) {
                            res.push(this.convertedRulesByIdent[applicPropertyIdent].toS1000DValues(start));
                        } else if (start == (end - 1)) {
                            res.push(this.convertedRulesByIdent[applicPropertyIdent].toS1000DValues(start));
                            res.push(this.convertedRulesByIdent[applicPropertyIdent].toS1000DValues(end));
                        } else {
                            res.push(this.convertedRulesByIdent[applicPropertyIdent].toS1000DValues(start) + '~' + this.convertedRulesByIdent[applicPropertyIdent].toS1000DValues(end));
                        }
                        start = '';
                    }
                }
            } else {
                start = arr[i];
                end = arr[i];
                if (i == arr.length - 1)
                    res.push(this.convertedRulesByIdent[applicPropertyIdent].toS1000DValues(start));
                else
                    i--;
            }
        }

        return res.join('|');

    } else {
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            if (item instanceof Array) {
                res.push(item[0] + '~' + item[1]);
            } else {
                res.push(item);
            }
        }
        return res.join('|');
    }
}

Assert.prototype.filteredByProduct = function (product) {

    if (product.filter[this.applicPropertyIdent]) {
        this.values = this.crossRangeArrays(this.values, product.filter[this.applicPropertyIdent].values);
        if (this.values.length) {
            this.applicPropertyValues = this.getS1000DApplicStringFromValues(this.values, this.applicPropertyIdent);
            return true;
        } else {
            this.applicPropertyValues = '';
            return false;
        }
    }
    return true;
}

Assert.prototype.crossRangeArrays = function (arr1_orig, arr2_orig) {

    function cross_ArrayArray(array1, array2) {
        var a0 = array1[0],
            a1 = array1[1],
            b0 = array2[0],
            b1 = array2[1];

        var res;

        if (a0 == b0) {
            if (a1 == b1) {
                return { push: array1, shift1: true, shift2: true }
            } else if (b1 < a1) {
                return { push: array2, shift1: false, shift2: true }
            } else {
                return { push: array1, shift1: true, shift2: false }
            }
        } else if (a0 < b0) {
            if (a1 == b1) {
                return { push: array2, shift1: true, shift2: true }
            } else if (a1 > b1) {
                return { push: array2, shift1: false, shift2: true }
            } else if (a1 < b1) {
                if (a1 == b0) {
                    return { push: a1, shift1: true, shift2: false }
                } else if (a1 < b0) {
                    return { push: false, shift1: true, shift2: false }
                } else if (a1 > b0) {
                    return { push: [b0, a1], shift1: true, shift2: false }
                }
            }
        } else if (a0 > b0) {
            if (a1 == b1) {
                return { push: array1, shift1: true, shift2: true }
            } else if (a1 < b1) {
                return { push: array1, shift1: true, shift2: false }
            } else if (a1 > b1) {
                if (a0 == b1) {
                    return { push: a0, shift1: false, shift2: true }
                } else if (a0 > b1) {
                    return { push: false, shift1: false, shift2: true }
                } else if (a0 < b1) {
                    return { push: [a0, b1], shift1: false, shift2: true }
                }
            }
        }
        throw new Error(array1, array2);
    }

    function cross_StringArray(str, arr) {

        var a0 = arr[0],
            a1 = arr[1];

        if (a0 == str) {
            return { push: str, shift_str: true, shift_arr: false }
        } else if (a1 == str) {
            return { push: str, shift_str: false, shift_arr: true }
        } else if (a0 > str) {
            return { push: false, shift_str: true, shift_arr: false }
        } else if (a1 < str) {
            return { push: false, shift_str: false, shift_arr: true }
        } else {
            return { push: str, shift_str: true, shift_arr: false }
        }
    }

    function cross_StringString(str1, str2) {

        if (str1 == str2) {
            return { push: str1, shift1: true, shift2: true }
        } else if (str1 < str2) {
            return { push: false, shift1: true, shift2: false }
        } else if (str1 > str2) {
            return { push: false, shift1: false, shift2: true }
        }
    }

    /*

    arr1 = [[1, 5], 8, [10, 33]];
    arr2 = [3, [5, 10], 22];

    */

    var arr1 = arr1_orig.slice(),
        arr2 = arr2_orig.slice(),
        arr = [];

    while (arr1.length && arr2.length) {
        if ((arr1[0] instanceof Array) && (arr2[0] instanceof Array)) {
            var res = cross_ArrayArray(arr1[0], arr2[0]);
            (res.push) && arr.push(res.push);
            (res.shift1) && arr1.shift();
            (res.shift2) && arr2.shift();
        } else if (arr1[0] instanceof Array) {
            res = cross_StringArray(arr2[0], arr1[0]);
            (res.push) && arr.push(res.push);
            (res.shift_str) && arr2.shift();
            (res.shift_arr) && arr1.shift();
        } else if (arr2[0] instanceof Array) {
            res = cross_StringArray(arr1[0], arr2[0]);
            (res.push) && arr.push(res.push);
            (res.shift_str) && arr1.shift();
            (res.shift_arr) && arr2.shift();
        } else {
            res = cross_StringString(arr1[0], arr2[0]);
            (res.push) && arr.push(res.push);
            (res.shift1) && arr1.shift();
            (res.shift2) && arr2.shift();
        }
    }

    return arr;
}

//depricated
Assert.prototype.crossArraysEnum = function (arr1_orig, arr2_orig) {

    var arr1 = arr1_orig.slice();
    var arr2 = arr2_orig.slice();

    var arr = [];

    while (arr1.length && arr2.length) {
        var a = arr1[0];
        var b = arr2[0];

        if (a == b) {
            arr.push(a);
            arr1.shift();
            arr2.shift();
        } else if (a > b) {
            arr2.shift();
        } else if (a < b) {
            arr1.shift();
        }
    }

    return arr;
}

Assert.prototype.toData = function () {
    var data = {};
    data.applicPropertyIdent = this.applicPropertyIdent;
    data.applicPropertyType = this.applicPropertyType;
    data.applicPropertyValues = this.applicPropertyValues;

    return data;
}

Assert.prototype.toString = function (ident) {
    var strValues = '';
    if (this.values.length > 10) {
        for (var i = 0; i < 4; i++) {
            strValues += this.values[i];
            if (i < 4) {
                strValues += ',';
            }
        }
        strValues += '...' + this.values[this.values.length - 1];
    } else {
        strValues += this.values.join(',');
    }
    var filtered = '';
    if (this.filtered) {
        filtered = ' [' + this.filtered.state;
        if (this.filtered.applicPropertyValues) {
            filtered += ': ' + this.filtered.applicPropertyValues;
        }
        filtered += ']'
    }
    return '\n' + ident + Assert.DAFAULTIDENT + this.applicPropertyIdent + ': ' + strValues + ' [' + this.applicPropertyValues + ']' + filtered;
}

Assert.prototype.toPCTString = function () {
    
    //act && act.items
    
    function printValue (value) {
        return (value instanceof Array) ? value.join('-') : value;
    }
    
    if (!this.values.length) {
        return '';
    }
    
    var strValues = '' + printValue(this.values[0]);
    var i = 1;
    while ((strValues.length < 50) && this.values[i]) {
        strValues += ',' + printValue(this.values[i]);
        i++;
    }
    if (i == (this.values.length - 1)) {
        strValues += ',' + printValue(this.values[i]);
    }
    if (i < (this.values.length - 1)) {
        strValues += '...' + printValue(this.values[this.values.length - 1]);
    }

    var sourceACTCCT = (this.applicPropertyType == 'condition') ? this.cct : this.act;

    var prefix = sourceACTCCT && 
                 sourceACTCCT.items && 
                 sourceACTCCT.items[this.applicPropertyIdent] && 
                 sourceACTCCT.items[this.applicPropertyIdent].displayName && 
                 sourceACTCCT.items[this.applicPropertyIdent].displayName + ' ' || '';
    
    return prefix  + strValues;
}

Assert.prototype.toInlineApplicString = function () {
    return this.toPCTString();
}

Assert.prototype.resolve = function () {
    return (!this.applicPropertyIdent) ? '' : this.toPCTString();
}

Assert.prototype.toXML = function () {
    var dom = xmlDomUtils.getXmlDOM();
    var $assert = dom.createElement('assert');
    $assert.setAttribute('applicPropertyIdent', this.applicPropertyIdent);
    $assert.setAttribute('applicPropertyType', this.applicPropertyType);
    $assert.setAttribute('applicPropertyIdent', this.applicPropertyValues);

    return $assert.xml;
}

Assert.prototype.removeItem = function () {
    this.removed = true;
}


module.exports = Assert;

});
