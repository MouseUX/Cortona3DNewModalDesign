define(function (require, exports, module) {

var Applic = require('spec/s1000d/applic/Applic');
var ACT = require('./ACT');
var CCT = require('./CCT');
var PCT = require('./PCT');

var act,
    cct,
    pct;

var INIT_STATE = false;

function initialize(metadata, force) {

    if (force) INIT_STATE = false;

    //console.log('Applic resources init ', INIT_STATE)

    if (INIT_STATE) return true;

    act = cct = pct = undefined;

    if (!metadata) return;

    var actData = metadata['$ACTDATA'] && JSON.parse(metadata['$ACTDATA']) || {};
    var cctData = metadata['$CCTDATA'] && JSON.parse(metadata['$CCTDATA']) || {};
    var pctData = metadata['$PCTDATA'] && JSON.parse(metadata['$PCTDATA']) || { products: [] };
    
    act = new ACT({ data: actData });
    cct = new CCT({ data: cctData });
    
    if (act) {
        Applic.defineACTRules(act);
    }

    if (cct) {
        Applic.defineCCTRules(cct);
    }

    pct = new PCT({ data: pctData });

}

function getResource(type) {
    if (type == 'act') return act;
    if (type == 'cct') return cct;
    if (type == 'pct') return pct;
}

module.exports = {
    initialize: initialize,
    getResource: getResource
}

});
