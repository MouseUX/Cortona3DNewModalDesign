define(function (require, exports, module) {
    module.exports = function (skin, options, solo) {
        solo.on('uniview.hashChange', function (data) {
            var ixml = solo.uniview.ixml,
                a,
                seq = [];

            if (/,/.test(data)) {
                // set range
                // #<start-id>,<end-id>
                a = data.split(',');
                var root = ixml.getProcedureItemInfo(ixml.getProcedureId()),
                    first = a[0],
                    last = a[1],
                    firstIdx = root.children.indexOf(first),
                    lastIdx = root.children.indexOf(last);
                if (firstIdx >= 0 && lastIdx >= 0 && lastIdx >= firstIdx) {
                    seq = root.children.slice(firstIdx, lastIdx + 1);
                } else {
                    console.error('"' + data + '" is not a valid range of procedure step IDs');
                }
            } else if (/;/.test(data)) {
                // set random procedure
                // #<id-1>;...;<id-N>
                seq = data.split(';');
            } else if (data && data !== ixml.getProcedureId()) {
                // goto step
                // #<step-id>
                if (ixml.getProcedureItemInfo(data)) {
                    solo.app.procedure.seekToSubstep(data);
                }
                return;
            } else {
                return;
            }

            seq = seq.filter(function (id) {
                var isValid = !!ixml.getProcedureItemInfo(id);

                if (id && !isValid) {
                    console.error('"' + id + '" is not a valid ID for a step in the procedure');
                }

                return isValid;
            });

            // restore full procedure by default
            // #<procedure-id>
            // #;
            solo.app.procedure.setPlayableItemList();

            if (seq && seq.length) {
                solo.app.procedure.seekToSubstep(seq[0]);
                solo.app.procedure.setPlayableItemList(seq);
            }
            solo.app.procedure.setPlayPosition(solo.app.procedure.duration, false);
            solo.app.procedure.setPlayPosition(0, true);
        });
    };
});