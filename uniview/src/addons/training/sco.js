define(function (require, exports, module) {

    /*
     trn_sco.js
     01.09.2008 15:27
    */

    var rtsAPI = require('./rts_api_wrapper'),
        solo = Cortona3DSolo;

    function round2(x) {
        return Math.round(x * 100) / 100;
    }

    function sco_loadPage(id) {
        (id) ? rtsAPI.initialize(id) : rtsAPI.initialize();
    }

    var startDate;
    var exitPageStatus;

    function sco_loadPage_expand() {
        sco_loadPage();
        var completion_status = rtsAPI.get("cmi.completion_status");

        if (completion_status == "not attempted" || completion_status == "unknow") {
            rtsAPI.set("cmi.completion_status", "incomplete");
        }
        //passed, failed, unknown
        var success_status = rtsAPI.get("cmi.success_status");
        if (success_status == "unknow") {
            rtsAPI.set("cmi.success_status", "unknown");
        }
        
        exitPageStatus = false;
        startTimer();
    }

    function startTimer() {
        startDate = new Date().getTime();
    }

    function sco_unloadPage_expand() {
        if (exitPageStatus != true) {
            if (!solo.training.hasQuestions) {
                rtsAPI.set("cmi.completion_status", "completed");
                rtsAPI.set("cmi.success_status", "passed");
            }
            rtsAPI.set("cmi.exit", "suspend");

            computeTime();
            exitPageStatus = true;

            rtsAPI.terminate();
        }
    }

    function computeTime() {
        if (startDate != 0) {
            var currentDate = new Date().getTime();
            var elapsedSeconds = currentDate - startDate;
            var formattedTime = ConvertMilliSecondsIntoSCORM2004Time(elapsedSeconds);
        }

        rtsAPI.set("cmi.session_time", formattedTime);
    }

    function ConvertMilliSecondsIntoSCORM2004Time(intTotalMilliseconds) {

        var ScormTime = "";

        var HundredthsOfASecond; //decrementing counter - work at the hundreths of a second level because that is all the precision that is required

        var Seconds; // 100 hundreths of a seconds
        var Minutes; // 60 seconds
        var Hours; // 60 minutes
        var Days; // 24 hours
        var Months; // assumed to be an "average" month (figures a leap year every 4 years) = ((365*4) + 1) / 48 days - 30.4375 days per month
        var Years; // assumed to be 12 "average" months

        var HUNDREDTHS_PER_SECOND = 100;
        var HUNDREDTHS_PER_MINUTE = HUNDREDTHS_PER_SECOND * 60;
        var HUNDREDTHS_PER_HOUR = HUNDREDTHS_PER_MINUTE * 60;
        var HUNDREDTHS_PER_DAY = HUNDREDTHS_PER_HOUR * 24;
        var HUNDREDTHS_PER_MONTH = HUNDREDTHS_PER_DAY * (((365 * 4) + 1) / 48);
        var HUNDREDTHS_PER_YEAR = HUNDREDTHS_PER_MONTH * 12;

        HundredthsOfASecond = Math.floor(intTotalMilliseconds / 10);

        Years = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_YEAR);
        HundredthsOfASecond -= (Years * HUNDREDTHS_PER_YEAR);

        Months = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_MONTH);
        HundredthsOfASecond -= (Months * HUNDREDTHS_PER_MONTH);

        Days = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_DAY);
        HundredthsOfASecond -= (Days * HUNDREDTHS_PER_DAY);

        Hours = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_HOUR);
        HundredthsOfASecond -= (Hours * HUNDREDTHS_PER_HOUR);

        Minutes = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_MINUTE);
        HundredthsOfASecond -= (Minutes * HUNDREDTHS_PER_MINUTE);

        Seconds = Math.floor(HundredthsOfASecond / HUNDREDTHS_PER_SECOND);
        HundredthsOfASecond -= (Seconds * HUNDREDTHS_PER_SECOND);

        if (Years > 0) {
            ScormTime += Years + "Y";
        }
        if (Months > 0) {
            ScormTime += Months + "M";
        }
        if (Days > 0) {
            ScormTime += Days + "D";
        }

        //check to see if we have any time before adding the "T"
        if ((HundredthsOfASecond + Seconds + Minutes + Hours) > 0) {

            ScormTime += "T";

            if (Hours > 0) {
                ScormTime += Hours + "H";
            }

            if (Minutes > 0) {
                ScormTime += Minutes + "M";
            }

            if ((HundredthsOfASecond + Seconds) > 0) {
                ScormTime += Seconds;

                if (HundredthsOfASecond > 0) {
                    ScormTime += "." + HundredthsOfASecond;
                }

                ScormTime += "S";
            }

        }

        if (ScormTime == "") {
            ScormTime = "0S";
        }

        ScormTime = "P" + ScormTime;

        return ScormTime;
    }

    function sco_unloadPage() {
        if (!rtsAPI.isTerminated()) {
            if (solo.training.isActive()) {
                rtsAPI.set("cmi.session_time", "PT" + solo.training.getSessionTime() + "S");
                rtsAPI.set("cmi.exit", "suspend");
            } else {
                rtsAPI.set("cmi.exit", "logout");
            }
            rtsAPI.terminate();
        }
    }

    function sco_scenarioStart() {
        solo.training.username = rtsAPI.get("cmi.learner_name");
        //completed, incomplete, not attempted, unknown
        if (solo.training.isExam()) {
            rtsAPI.set("cmi.completion_status", "incomplete");
            rtsAPI.set("cmi.success_status", "unknown");
            rtsAPI.set("cmi.score.min", "0");
            rtsAPI.set("cmi.score.max", "100");
            rtsAPI.set("cmi.score.raw", "0");
            rtsAPI.set("cmi.score.scaled", "0");
        } else if (rtsAPI.get("cmi.completion_status") !== "completed") {
            rtsAPI.set("cmi.completion_status", "incomplete");
        }
    }

    function sco_scenarioFinish() {
        var sessionTime = "PT" + solo.training.getSessionTime() + "S",
            successStatus = solo.training.getSuccessStatus(),
            score = solo.training.getScaledScore();

        rtsAPI.set("cmi.session_time", sessionTime);

        if (successStatus) {
            rtsAPI.set("cmi.completion_status", "completed");
            rtsAPI.set("cmi.success_status", successStatus);
        }

        if (solo.training.isExam()) {
            rtsAPI.set("cmi.score.raw", String(Math.round(score * 100)));
            rtsAPI.set("cmi.score.scaled", String(round2(score)));

            //passed, failed, unknown
            if (successStatus) {
                //rtsAPI.set("adl.nav.request", "continue");
                sco_unloadPage();
            }
        }
    }

    function sco_loadScenario() {}

    function sco_stepStarted() {}

    function sco_stepFinished() {}

    function sco_stepFailed() {}

    function sco_setScore(currentScore, maxScore, scaledScore) {

        rtsAPI.set("cmi.score.raw", currentScore);
        rtsAPI.set("cmi.score.min", "0");
        rtsAPI.set("cmi.score.max", maxScore);
        rtsAPI.set("cmi.score.scaled", scaledScore);
        
        var passScore = rtsAPI.get('cmi.scaled_passing_score');
        if (!passScore)
            passScore = 0.7;
        if (passScore <= scaledScore) {
            rtsAPI.set("cmi.success_status", "passed");
            rtsAPI.set("cmi.completion_status", "completed");
        } else {
            rtsAPI.set("cmi.success_status", "failed");
        }
    }

    function sco_isStub() {
        return rtsAPI.isStub();
    }

    module.exports = {
        loadPage: sco_loadPage,
        loadPageExpand: sco_loadPage_expand,
        unloadPage: sco_unloadPage,
        unloadPageExpand: sco_unloadPage_expand,
        scenarioStart: sco_scenarioStart,
        scenarioFinish: sco_scenarioFinish,
        loadScenario: sco_loadScenario,
        stepStarted: sco_stepStarted,
        stepFinished: sco_stepFinished,
        stepFailed: sco_stepFailed,

        setScore: sco_setScore,
        isStub: sco_isStub
    };

});