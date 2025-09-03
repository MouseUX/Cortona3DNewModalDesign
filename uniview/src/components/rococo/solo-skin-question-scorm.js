/**
 * 
 * @uniview.doc.changeQuestionSlide({answer: false, next: false, previous: false})
 * @uniview.doc.slidePassed
 * @uniview.doc.allSlidesPassed
 *
 * ? @uniview.doc.setValueLMS
 * 
 * =@uniview.doc.showPreviousOrNextSlide
 * =@uniview.doc.submitAnswer
 * =@uniview.doc.submitAllAnswers
 * 
 */
define(function (require, exports, module) {

    require('css!./solo-skin-question-scorm.css');
    module.exports = function (skin, options, solo) {

        //Learning questions SCORM View
        var hasAssessment;
        var answers;

        var i18n = solo.uniview.i18n["solo-skin-question"];

        scormQuestionFunctions();

        //events from toolbars bottons
        solo.on('uniview.doc.showPreviousOrNextSlide', function (state) {
            showNextPreviousSlide(state);
        })

        function checkAnswer(slide, silent) {
            
            var answerItem = answers[slide.id];
            var type = answerItem.type;
            var correct = answerItem.correct;
            
            function getOneMoreAttemp(wrongType) {
                
                if (silent) {
                    return false;
                }
                
                /*
                  wrongTypes: notFullAnswer | nothingChoose
                */
                
                if (!answerItem.attempts) {
                    solo.dispatch('uniview.doc.wrongAnswer', undefined, wrongType);
                    return true;
                }

                answerItem.attempts = answerItem.attempts - 1;
                if (answerItem.attempts == 0) {
                    solo.dispatch('uniview.doc.wrongAnswer', undefined, wrongType);
                    return false;
                } else {
                    solo.dispatch('uniview.doc.wrongAnswer', answerItem.attempts, wrongType);
                    return true;
                }
            }
            
            function disableAnswerControls(passed) {
                var answerControls = slide.querySelectorAll('.answerControl');
                for (var i = 0; i < answerControls.length; i++) {
                    answerControls[i].disabled = true;
                    if (answerControls[i].type == 'text') {
                        answerControls[i].value = correct.join(' | ');
                    }
                }
                var orderItems = slide.querySelectorAll('.orderItem');
                for (var i = 0; i < orderItems.length; i++) {
                    //orderItems[i].removeEventListener('click', chooseElement);
                    var clone = orderItems[i].cloneNode(true);
                    orderItems[i].parentElement.replaceChild(clone, orderItems[i]);
                    orderItems[i] = null;
                }
                //disable Answer button
                solo.dispatch('uniview.doc.slidePassed');
                slide.setAttribute('passed', passed);
            }

            var highlightAnswers = slide.querySelectorAll('.highlightAnswer');
            highlightAnswers.forEach(function (item) {
                highlightAnswer(item, 'remove');
            })

            if (type == 'complete') {
                var answerControl = slide.querySelector('.answerControl');
                var answerValue = answerControl.value;
                if (correct.indexOf(answerValue) != -1) {
                    //Correct answer
                    highlightAnswer(answerControl, 'correct');
                    disableAnswerControls('passed');
                } else {
                    //Wrong answer
                    highlightAnswer(answerControl, 'wrong');
                    (getOneMoreAttemp()) ? true : disableAnswerControls('failed');
                }
            }
            
            if (type == 'select') {
                var correctCloneArray = correct.slice();
                var answerControls = slide.querySelectorAll('.answerControl');
                var correctAnswerCount = 0;
                var wrongAnswerCount = 0;

                answerControls.forEach(function (answerControl) {
                    
                    var indexInCorrect = correctCloneArray.indexOf(answerControl.id);
                    
                    if (answerControl.checked) {
                        if (indexInCorrect != -1) {
                            correctCloneArray.splice(indexInCorrect, 1);
                            highlightAnswer(answerControl, 'correct');
                            correctAnswerCount++;
                        } else {
                            correctCloneArray.push(answerControl.id);
                            highlightAnswer(answerControl, 'wrong');
                            wrongAnswerCount++;
                        }
                    } else if (silent) {
                        if (indexInCorrect != -1) {
                            highlightAnswer(answerControl, 'correct');
                        }
                    }
                })

                var wrongType;
                if (!correctAnswerCount && !wrongAnswerCount) {
                    wrongType = 'nothingChoose';
                } else if (correctCloneArray.length && !wrongAnswerCount) {
                    wrongType = 'notFullAnswer';
                }

                if (correctCloneArray.length) {
                    //wrong answer
                    if (!getOneMoreAttemp(wrongType)) {
                        disableAnswerControls('failed');
                    }
                } else {
                    //correct answer
                    disableAnswerControls('passed');
                }
            }

            if (type == 'match') {
                var correctCloneArray = correct.slice();
                var answerControls = slide.querySelectorAll('.answerControl');
                for (var i = 0; i < answerControls.length; i = i + 2) {
                    var id1 = answerControls[i].id;
                    var id2 = answerControls[i + 1].id;
                    if ((correctCloneArray.indexOf(id1) != -1) &&
                        (correctCloneArray.indexOf(id2) != -1) &&
                        (correctCloneArray.indexOf(id2) == correctCloneArray.indexOf(id1) + 1)) {

                        correctCloneArray.splice(correctCloneArray.indexOf(id1), 2);
                        highlightAnswer(answerControls[i], 'correct');
                    } else {
                        highlightAnswer(answerControls[i], 'wrong');
                    }
                }
                selectDefaultState();
                if (correctCloneArray.length) {
                    //wrong answer
                    (getOneMoreAttemp()) ? true : disableAnswerControls('failed');
                } else {
                    //correct answer
                    disableAnswerControls('passed');
                }
            }

            if (type == 'sequence') {
                var correctCloneArray = correct.slice();
                var answerControls = slide.querySelectorAll('.answerControl');
                answerControls.forEach(function (answerControl, index) {
                    var id = answerControl.id;
                    if (correctCloneArray.indexOf(id) != index) {
                        correctCloneArray[index] = undefined;
                        highlightAnswer(answerControl, 'wrong');
                    } else {
                        highlightAnswer(answerControl, 'correct');
                    }
                })
                selectDefaultState();

                if (correctCloneArray.some(function (item) { return item === undefined })) {
                    //wrong answer
                    (getOneMoreAttemp()) ? true : disableAnswerControls('failed');
                } else {
                    //correct answer
                    disableAnswerControls('passed');
                }
            }
        }

        solo.on('uniview.doc.submitAnswer', function () {
            
            var scoTabs = document.querySelector('.sco-tabs');
            var slide = (scoTabs) ? scoTabs.querySelector('.active .slide.show') : slide = document.querySelector('.slide.show');
            
            var silent = false;
            checkAnswer(slide, silent);
            
        });
        
        solo.on('uniview.doc.submitAllAnswers', function () {
            var questionSlides = document.querySelectorAll('.assessmentQuestion');
            for (var i = 0; i < questionSlides.length; i++) {
                var slide = questionSlides[i];
                if (!slide.getAttribute('passed')) {
                    
                    (new Promise(function (resolve, reject) {
                        solo.dispatch('uniview.doc.confirmAnswer', i18n.notAllAnswersAnswered);
                        solo.on('uniview.doc.confirmAnswer.OK', function () {
                            resolve(true);
                        });
                        solo.on('uniview.doc.confirmAnswer.Cancel', function () {
                            resolve(false);
                        });
                    })).then(function (result) {
                        
                        var allPassed = true;
                        
                        if (!result) {
                            var writeTab = showCorrectTab(slide);
                            var displaySlide = (writeTab) ? writeTab.querySelector('.slide.show') : document.querySelector('.slide.show');
                            showHideSlide(displaySlide, 'hide');
                            showHideSlide(slide, 'show');
                            allPassed = false;
                        }
                        return allPassed;
                    }).then(function (allPassed) {
                        
                        if (allPassed) {
                            markAllSlideArePassed();
                        }
                    });

                    break;                
                }
            }

            if (i == questionSlides.length) {
                markAllSlideArePassed();
            }
        });

        solo.on('uniview.component.tab.activated', function(component, n) {
            var activeTab = document.querySelectorAll('.skin-page-body.active')[0];
            var activeQuestionSlide = activeTab.querySelector('.slide.show');
            
            if (!activeQuestionSlide) {
                var buttonsState = getStateButtons(null, 'hide')
                solo.dispatch('uniview.doc.changeQuestionSlide', buttonsState);
            } else {
                var buttonsState = getStateButtons(activeQuestionSlide);
                solo.dispatch('uniview.doc.changeQuestionSlide', buttonsState);
            }
        })

        solo.on('uniview.doc.getAndChangeQuestionSlide', function (slide) {
            solo.dispatch('uniview.doc.changeQuestionSlide', getStateButtons(slide));
        })
        
        function scormQuestionFunctions() {
            hasAssessment = false;
            deleteInteraction();
            createQuestionSlides();
            hideSlides();
            answers = new Answers();
        }

        function shuffleNodesFromArr(arr) {
            var TIMES = 3;
            for (var time = 0; time < TIMES; time++) {
                for (var i = arr.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    if (i == j)
                        continue;
                    replaceElements(arr[i], arr[j]);
                }
            }
        }

        function replaceElements(node1, node2) {
            if (node1 === node2) {
                //alert('match');
                return;
            }

            var tempNode = document.createElement('div');
            node1.parentElement.replaceChild(tempNode, node1);
            node2.parentElement.replaceChild(node1, node2);
            tempNode.parentElement.replaceChild(node2, tempNode);
            tempNode = null;
        }

        function deleteInteraction() {

            function _shuffleChildrens(node) {

                var childrens = Array.prototype.slice.call(node.children);
                shuffleNodesFromArr(childrens);
            }

            function _copyAttributesToChildren(node, attrArr) {
                for (var i = 0; i < node.children.length; i++) {
                    for (var j = 0; j < attrArr.length; j++) {
                        if (node.getAttribute(attrArr[j])) {
                            node.children[i].setAttribute(attrArr[j], node.getAttribute(attrArr[j]));
                        }
                    }
                }
            }

            function _excludeWithoutChildrens(node) {
                while (node.firstElementChild) {
                    node.parentElement.insertBefore(node.firstElementChild, node);
                }
                node.parentElement.removeChild(node);
            }

            var interactions = document.querySelectorAll('.lcInteraction');
            for (var i = 0; i < interactions.length; i++) {
                var interaction = interactions[i];
                if (interaction.getAttribute('data-shuffle') == 1) {
                    _shuffleChildrens(interaction);
                }
                _copyAttributesToChildren(interaction, ['data-attempts', 'data-weightingFactor']);
                _excludeWithoutChildrens(interaction);
            }

        }

        function createQuestionSlides() {
            
            var afterQuestionSelectors = ['.learningAssessment>.lcSummary',
                                          '*[data-class~="learningAssessment/learningAssessmentbody"]>*[data-class~="learningBase/lcSummary"]']
            var afterQuestionItems = document.querySelectorAll(afterQuestionSelectors.join(', '));
            addToSlide(afterQuestionItems);
            
            var beforeQuestionSelectors = ['.learningAssessment>.lcIntro', 
                                           '.learningAssessment>.lcDuration', 
                                           '*[data-class~="learningAssessment/learningAssessmentbody"]>*[data-class~="topic/shortdesc"]',
                                           '*[data-class~="learningAssessment/learningAssessmentbody"]>.section'];
            var beforeQuestionItems = document.querySelectorAll(beforeQuestionSelectors.join(', '));
            addToSlide(beforeQuestionItems);
            
            var questions = document.querySelectorAll('.assessmentQuestion');
            for (var i = 0; i < questions.length; i++) {
                addToSlide(questions[i], 'convert');
            }
        }

        function addToSlide(nodes, convert) {
            if (nodes.length == 0)
                return;

            //Element to array
            if (!nodes.length)
                nodes = [nodes];

            var slide;

            if (convert) {
                //first Element to slide
                slide = nodes[0];
                for (var i = 1; i < nodes.length; i++) {
                    slide.appendChild(nodes[i]);
                }
            } else {
                //insert all elements to slide
                slide = document.createElement('div');
                nodes[0].parentElement.replaceChild(slide, nodes[0]);
                for (var i = 0; i < nodes.length; i++) {
                    slide.appendChild(nodes[i]);
                }
            }

            slide.classList.add('slide');
        }

        function getStateButtons(slide, state) {
                
            var res = {
                'answer' : false,
                'previous' : false,
                'next' : false
            }
            
            if (state == 'hide') {
                return res;
            }

            if (!slide.nextElementSibling || !slide.nextElementSibling.classList.contains('slide')) {
                res.next = false;
            }
            if (slide.nextElementSibling && slide.nextElementSibling.classList.contains('slide')) {
                res.next = true;
            }

            if (!slide.previousElementSibling || !slide.previousElementSibling.classList.contains('slide')) {
                res.previous = false;
            }
            if (slide.previousElementSibling && slide.previousElementSibling.classList.contains('slide')) {
                res.previous = true;
            }

            if (slide.classList.contains('assessmentQuestion') && slide.getAttribute('passed')) {
                res.answer = false;
            } else if (slide.classList.contains('assessmentQuestion')) {
                res.answer = true;
            } else {
                res.answer = false;
            }

            return res;
        }

        function showHideSlide(slide, state) {
            
            if (!slide)
                return;
            //state: 'show|hide';
            slide.classList.remove('hide');
            slide.classList.remove('show');
            slide.classList.add(state);
            solo.dispatch('uniview.doc.changeQuestionSlide', getStateButtons(slide, state));
        }

        function showCorrectTab(slide) {
            if (!slide)
                return;
            
            var tabElement = slide;
            while (tabElement && !tabElement.classList.contains('skin-page-body')) {
                tabElement = tabElement.parentElement;
            }
            
            if (!tabElement)
                return;
            
            var count = 0;
            var currentTabElement = tabElement;
            while (tabElement && tabElement.previousElementSibling) {
                tabElement = tabElement.previousElementSibling;
                count++;
            }
            solo.dispatch('uniview.component.tabs.activateByNumber', count);
            return currentTabElement;
                
            //alert(tabElement.classList);
        }

        function showNextPreviousSlide(state) {
            
            var scoTabs = document.querySelector('.sco-tabs');
            var slide = (scoTabs) ? scoTabs.querySelector('.active .slide.show') : slide = document.querySelector('.slide.show');
            
            showHideSlide(slide, 'hide');

            if (state == 'next') {
                showHideSlide(slide.nextElementSibling, 'show');
                
            } else if (state == 'previous') {
                showHideSlide(slide.previousElementSibling, 'show');
                
            }
        }

        function hideSlides() {

            var slides = document.querySelectorAll('.slide');
            for (var i = 0; i < slides.length; i++) {
                showHideSlide(slides[i], 'hide');
            }
            
            var trainingSteps = document.querySelectorAll('.sco-tabs .trainingStep');
            if (trainingSteps.length) {
                trainingSteps.forEach(function (trainingStep) {
                    var slides = trainingStep.querySelectorAll('.slide');
                    showHideSlide(slides[0], 'show');    
                })
            } else {
                showHideSlide(slides[0], 'show');
            }
        }

        function guid() {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            //return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            return s4() + s4();
        }

        function highlightAnswer(node, state) {
            while (node && !node.classList.contains('highlightAnswer')) {
                node = node.parentElement;
            }
            if (!node)
                return;
            if (state == 'remove') {
                node.classList.remove('correct');
                node.classList.remove('wrong');
            } else if (state == 'correct') {
                node.classList.add('correct');
            } else if (state == 'wrong') {
                node.classList.add('wrong');
            }
        }

        function selectDefaultState() {
            var selectingElement = document.querySelector('.select');
            if (selectingElement) {
                selectingElement.classList.remove('select');
                selectingElement = null;
            }

            disableAllOrderControls();
        }

        function disableAllOrderControls() {
            var sequenceButtons = document.querySelectorAll('.control .up, .control .down');
            for (var i = 0; i < sequenceButtons.length; i++) {
                sequenceButtons[i].disabled = true;
            }
        }
        /*
        {
        guid1: {
            type: 'select|sequence',
            correct: [guid_input, guid_input,...],
            answer: [],
            //attempts: number,
            //weightFactor: number
        },
        guid2: {
            type: 'match',
            correct: [[guid, guid], [guid, guid],...],
            ...
        },
        guid3: {
            type: 'complete',
            correct: ['text', 'text',...],
            ...
        }
        }
        */

        function Answers() {

            function AnswerItem(slide) {

                function getCorrectValues(slide, type) {
                    var res = [];
                    try {
                        var answerControlItems = slide.querySelectorAll('.answerControl');

                        if (type == 'match') {
                            var firstOrderItem = slide.querySelectorAll('.orderItem')[0];
                            var columnsNumber = firstOrderItem.parentElement.children.length;
                            for (var i = 0; i < answerControlItems.length; i = i + columnsNumber) {
                                for (var j = i; j < i + columnsNumber; j++) {
                                    answerControlItems[j].id = guid();
                                    res.push(answerControlItems[j].id);
                                }
                            }
                        } else {
                            for (var i = 0; i < answerControlItems.length; i++) {
                                var item = answerControlItems[i];
                                item.id = guid();
                                if (type == 'complete' && item.getAttribute('data-correct')) {
                                    var strVariants = item.getAttribute('data-correct');
                                    if (!strVariants)
                                        return;
                                    res = strVariants.split('|');
                                    //remove correct label
                                    item.removeAttribute('data-correct')
                                    item.value = '';
                                }
                                if (type == 'select' && item.getAttribute('data-correct')) {
                                    res.push(item.id);
                                    //remove correct label
                                    item.removeAttribute('data-correct')
                                    item.checked = false;
                                }
                                if (type == 'sequence') {
                                    res.push(item.id);
                                }
                            }
                        }
                    } catch (e) {
                        console.log('Error fill correct answers: ' + e.desciption);
                    }

                    return res;
                }

                function shuffleAnswers(slide, type) {

                    var answers = slide.querySelectorAll('.canShuffle');
                    if (!answers.length)
                        return;
                    answers = Array.prototype.slice.call(answers);

                    if (type == 'match') {
                        var answers1 = [], answers2 = [];
                        for (var i = 0; i < answers.length; i++) {
                            if (i % 2 == 1) {
                                answers1.push(answers[i]);
                            } else {
                                answers2.push(answers[i]);
                            }
                        }
                        shuffleNodesFromArr(answers1);
                        shuffleNodesFromArr(answers2);
                    } else {
                        shuffleNodesFromArr(answers);
                    }
                }


                this.id = slide.id;
                this.type = slide.getAttribute('data-type');
                this.correct = getCorrectValues(slide, this.type);
                this.attempts = slide.getAttribute('data-attempts');
                this.weightFactor = slide.getAttribute('data-weightFactor');

                shuffleAnswers(slide, this.type);
            }

            var slides = document.querySelectorAll('.slide.assessmentQuestion');
            for (var i = 0; i < slides.length; i++) {
                var answerItem = new AnswerItem(slides[i]);
                this[answerItem.id] = answerItem;
            }

        }

        function markAllSlideArePassed() {
            var questionSlides = document.querySelectorAll('.assessmentQuestion');
            questionSlides.forEach(function (slide) {
                if (!slide.getAttribute('passed')) {
                    var silent = true;
                    checkAnswer(slide, silent);
                }
            });
            calculateScore();
            //disable Answer All button
            solo.dispatch('uniview.doc.allSlidesPassed');
        }

        function calculateScore() {
            var slides = document.querySelectorAll('.assessmentQuestion');
            var maxScore = 0;
            var currentScore = 0;
            for (var i = 0; i < slides.length; i++) {
                var slide = slides[i];
                var answerScore = 1;
                var weightFactor = slide.getAttribute('data-weightingFactor');
                if (+weightFactor) {
                    answerScore = answerScore * weightFactor;
                }
                maxScore = maxScore + answerScore;
                if (slide.getAttribute('passed') == 'passed') {
                    currentScore = currentScore + answerScore;
                }
                //alert(currentScore + '\/' + maxScore);
            }
            var scaledScore = currentScore / maxScore;

            if (solo.training && solo.training.sco) {
                solo.training.sco.setScore(currentScore, maxScore, scaledScore);
            }
            
            var scoreElement = document.createElement('h3');
            scoreElement.innerHTML = i18n.score + ': ' + (scaledScore * 100);

            var scoTabs = document.querySelector('.sco-tabs');
            if (scoTabs) {
                scoTabs.parentElement.insertBefore(scoreElement, scoTabs.nextElementSibling);
            } else {
                slides[0].parentElement.appendChild(scoreElement);
            }
        }


    };
});