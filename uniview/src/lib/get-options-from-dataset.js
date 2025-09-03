define(function (require, exports, module) {
    module.exports = function (dataset) {
        var i = 1,
            res = {};
        while (true) {
            var nameKey = 'optionName' + i,
                valueKey = 'optionValue' + i;
            if (!(nameKey in dataset) || !(valueKey in dataset)) break;
            res[dataset[nameKey]] = dataset[valueKey];
            i++;
        }
        return res;
    };
});