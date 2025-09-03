define(function (require, exports, module) {
    
    function DMC(dmc) {
        dmc = dmc || 'S1000D-A-00-00-00-00A-000A-A';
        if (typeof dmc === 'string') {
            this.fromString(dmc);
        
        } else if (typeof dmc === 'object' && dmc.dataset && dmc.dataset.dmc) {
            this.fromString(dmc.dataset.dmc);
        
        } else if (typeof dmc === 'object' && dmc.dataset) {
            this.modelIdentCode = dmc.dataset.modelidentcode;
            this.systemDiffCode = dmc.dataset.systemdiffcode;
            this.systemCode = dmc.dataset.systemcode;
            this.subSystemCode = dmc.dataset.subsystemcode;
            this.subSubSystemCode = dmc.dataset.subsubsystemcode;
            this.assyCode = dmc.dataset.assycode;
            this.disassyCode = dmc.dataset.disassycode;
            this.disassyCodeVariant = dmc.dataset.disassycodevariant;
            this.infoCode = dmc.dataset.infocode;
            this.infoCodeVariant = dmc.dataset.infocodevariant;
            this.itemLocationCode = dmc.dataset.itemlocationcode;
            this.learnCode = dmc.dataset.learncode;
            this.learnEventCode = dmc.dataset.learneventcode;
        
        } else if (typeof dmc === 'object') {
            this.modelIdentCode = dmc.modelIdentCode;
            this.systemDiffCode = dmc.systemDiffCode;
            this.systemCode = dmc.systemCode;
            this.subSystemCode = dmc.subSystemCode;
            this.subSubSystemCode = dmc.subSubSystemCode;
            this.assyCode = dmc.assyCode;
            this.disassyCode = dmc.disassyCode;
            this.disassyCodeVariant = dmc.disassyCodeVariant;
            this.infoCode = dmc.infoCode;
            this.infoCodeVariant = dmc.infoCodeVariant;
            this.itemLocationCode = dmc.itemLocationCode;
            this.learnCode = dmc.learnCode;
            this.learnEventCode = dmc.learnEventCode;
        }
    }

    DMC.prototype.toString = function () {
        var a = [
            this.modelIdentCode,
            this.systemDiffCode,
            this.systemCode,
            this.subSystemCode + this.subSubSystemCode,
            this.assyCode,
            this.disassyCode + this.disassyCodeVariant,
            this.infoCode + this.infoCodeVariant,
            this.itemLocationCode
        ];
        if (this.learnCode && this.learnEventCode) {
            a.push(this.learnCode + this.learnEventCode);
        }
        return a.join('-');
    };

    DMC.prototype.fromString = function (dmc) {
        var a = dmc.split('-');
        if (a.length >= 8) {
            this.modelIdentCode = a[0];
            this.systemDiffCode = a[1];
            this.systemCode = a[2];
            this.subSystemCode = a[3].substring(0, a[3].length - 1);
            this.subSubSystemCode = a[3].substring(a[3].length - 1);
            this.assyCode = a[4];
            this.disassyCode = a[5].substring(0, 2);
            this.disassyCodeVariant = a[5].substring(2);
            this.infoCode = a[6].substring(0, 3);
            this.infoCodeVariant = a[6].substring(3);
            this.itemLocationCode = a[7];
            if (a.length > 8) {
                this.learnCode = a[9].substring(0, a[3].length - 1);
                this.learnEventCode = a[9].substring(a[3].length - 1);
            } else {
                delete this.learnCode;
                delete this.learnEventCode;
            }
        }
    };

    DMC.prototype.getURI = function () {
        var prefix = 'DMC'; //DME function add later 
        return 'URN:S1000D:' + prefix + '-' + this.toString();
    }

    function CSN(csn, ipdDMC) {
        this.ipdDMC = ipdDMC || new DMC('S1000D-A-00-00-00-000-941A-D');
        csn = csn || '00-000';
        if (typeof csn === 'string') {
            this.fromString(csn);
        } else if (typeof csn === 'object' && csn instanceof CSN) {
            this.fromString(csn.toString());
        }
    }

    CSN.prototype.toString = function () {
        var csn = [
            this.modelIdentCode,
            this.systemDiffCode,
            this.systemCode,
            this.subSystemCode + this.subSubSystemCode,
            this.assyCode,
            this.figureNumber + this.figureNumberVariant,
            this.itemNumber + this.itemNumberVariant
        ].filter(function (value) {
            return typeof value === 'string' && value;
        }).join('-');

        if (this.itemSequenceNumber) {
            csn += '/' + this.itemSequenceNumber;
        }

        return csn;
    };

    CSN.prototype.fromString = function (csn) {
        // CSN/ISN 11-22-33-01-001A/00A
        // CSN 11-22-33-01A-002A
        // CSN 10-001
        var token,
            a = csn.split('/');

        delete this.itemSequenceNumber;
        delete this.itemNumber;
        delete this.itemNumberVariant;
        delete this.figureNumber;
        delete this.figureNumberVariant;
        delete this.assyCode;
        delete this.subSystemCode;
        delete this.subSubSystemCode;
        delete this.systemCode;
        delete this.systemDiffCode;
        delete this.modelIdentCode;

        if (a.length > 1) {
            this.itemSequenceNumber = a.pop();
        }

        a = a[0].split('-');

        // 1(M) item + variant
        token = a.pop();
        this.itemNumber = token.substring(0, 3);
        this.itemNumberVariant = token.substring(3) || '';

        // 2(M) figure + variant
        token = a.pop();
        this.figureNumber = token.substring(0, 2);
        this.figureNumberVariant = token.substring(2) || '';

        // 3(O) assy
        if (a.length) this.assyCode = a.pop();

        // 4(O) subsytem + subsubsytem
        if (a.length) {
            token = a.pop();
            this.subSystemCode = token.substring(0, 1);
            this.subSubSystemCode = token.substring(1);
        }

        // 5(O) system
        if (a.length) this.systemCode = a.pop();

        // 6(O) sdc
        if (a.length) this.systemDiffCode = a.pop();

        // 7(O) mi
        if (a.length) this.modelIdentCode = a.pop();

    };

    CSN.prototype.toDMC = function (ipdDMC) {
        ipdDMC = ipdDMC || this.ipdDMC;
        var a = [
            this.modelIdentCode || ipdDMC.modelIdentCode,
            this.systemDiffCode || ipdDMC.systemDiffCode,
            this.systemCode || ipdDMC.systemCode,
            (this.subSystemCode || ipdDMC.subSystemCode) + (this.subSubSystemCode || ipdDMC.subSubSystemCode),
            this.assyCode || ipdDMC.assyCode,
            this.figureNumber + (this.figureNumberVariant || '0'),
            (this.infoCode || ipdDMC.infoCode) + (this.infoCodeVariant || ipdDMC.infoCodeVariant),
            this.itemLocationCode || 'D'
        ];
        return a.join('-');
    };

    module.exports = {
        CSN: CSN,
        DMC: DMC
    };
});