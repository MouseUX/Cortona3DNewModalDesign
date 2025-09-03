define(function (require, exports, module) {
    'use strict';

    require('css!./date-picker.css');

    module.exports = function (skin, options, solo) {

        var element = skin.$el.querySelector('#toolbar-dpl .skin-container.right'),
            calendar = skin.div('#dteSet'),
            dateInput = skin.input({
                id: options.inputId || 'inptDate1',
                type: 'text',
                size: 8,
                maxLength: 8,
                onselectstart: function (event) {
                    event.stopPropagation();
                },
                onchange: _onChangeDate,
                onkeyup: _onChangeDate,
                onpaste: _onChangeDate,
                onfocus: showDatePicker,
                onblur: preHideSet
            });

        element.append(
            skin.label('', 'DATE:', dateInput)
        );
        skin.append(calendar);

        var datePicker = (function () {

            var currentYear = 0;
            var currentMonth = 0;
            var currentDay = 0;

            var selectedYear = 0;
            var selectedMonth = 0;
            var selectedDay = 0;

            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            var dateField = null;

            function getDaysInMonth(year, month) {
                return [31, ((!(year % 4) && ((year % 100) || !(year % 400))) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
            }

            function getDayOfWeek(year, month, day) {
                return new Date(year, month - 1, day).getDay();
            }

            function clearDate() {
                dateInput.value = '';
                hide();
            }

            function setDate(year, month, day) {
                if (dateField) {
                    if (month < 10) {
                        month = "0" + month;
                    }
                    if (day < 10) {
                        day = "0" + day;
                    }
                    var y = "" + year;
                    y = y.substr(2, 2);
                    dateField.value = month + "-" + day + "-" + y;
                    hide();
                }
                return;
            }

            function changeMonth(change) {
                currentMonth += change;
                currentDay = 0;
                if (currentMonth > 12) {
                    currentMonth = 1;
                    currentYear++;
                } else if (currentMonth < 1) {
                    currentMonth = 12;
                    currentYear--;
                }
                if (currentYear < 2000) {
                    currentYear = 2000;
                    currentMonth = 1;
                }

                drawCalendar();
            }

            function changeYear(change) {
                currentYear += change;
                if (currentYear < 2000) {
                    currentYear = 2000;
                }
                currentDay = 0;
                drawCalendar();
            }

            function getCurrentYear() {
                return new Date().getFullYear();
            }

            function getCurrentMonth() {
                return new Date().getMonth() + 1;
            }

            function getCurrentDay() {
                return new Date().getDate();
            }

            function drawCalendar() {
                var dayOfMonth = 1;
                var validDay = false;
                var startDayOfWeek = getDayOfWeek(currentYear, currentMonth, dayOfMonth);
                var daysInMonth = getDaysInMonth(currentYear, currentMonth);
                var cssClass = null;

                calendar.innerHTML = '';

                var dtMainTbl = skin.create('table#dtMainTbl.hideOnPrint', {
                    onfocus: function () {
                        dateInput.focus();
                    }
                });

                var td = skin.create('td', {},
                    skin.create('table', {
                            onfocus: function () {
                                dateInput.focus();
                            }
                        },
                        skin.create('tr.header', {},
                            skin.create('td.previous', {},
                                skin.create('a', {
                                    href: '#',
                                    title: 'Previous Month',
                                    onclick: function () {
                                        datePicker.changeMonth(-1);
                                        dateInput.focus();
                                    }
                                }, '<'),
                                skin.create('a', {
                                    href: '#',
                                    title: 'Previous Year',
                                    onclick: function () {
                                        datePicker.changeYear(-1);
                                        dateInput.focus();
                                    }
                                }, '«')
                            ),
                            skin.create('td.title', {}, months[currentMonth - 1] + ' ' + currentYear),
                            skin.create('td.next', {},
                                skin.create('a', {
                                    href: '#',
                                    title: 'Next Year',
                                    onclick: function () {
                                        datePicker.changeYear(1);
                                        dateInput.focus();
                                    }
                                }, '»'),
                                skin.create('a', {
                                    href: '#',
                                    title: 'Next Month',
                                    onclick: function () {
                                        datePicker.changeMonth(1);
                                        dateInput.focus();
                                    }
                                }, '>')
                            )
                        )
                    )
                );

                td.setAttribute('colspan', 7);

                var tr = skin.create('tr');
                tr.innerHTML = '<th>S</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th>';

                dtMainTbl.append(
                    skin.create('tr.header', {}, td),
                    tr
                );

                for (var week = 0; week < 6; week++) {
                    tr = skin.create('tr');
                    for (var dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                        if (week === 0 && startDayOfWeek == dayOfWeek) {
                            validDay = true;
                        } else if (validDay && dayOfMonth > daysInMonth) {
                            validDay = false;
                        }

                        if (validDay) {
                            if (dayOfMonth == selectedDay && currentYear == selectedYear && currentMonth == selectedMonth) {
                                cssClass = 'current';
                            } else if (dayOfWeek === 0 || dayOfWeek == 6) {
                                cssClass = 'weekend';
                            } else {
                                cssClass = 'weekday';
                            }
                            td = skin.create('td', {},
                                skin.create('a', {
                                    className: cssClass,
                                    href: '#',
                                    onclick: (function (dayOfMonth) {
                                        datePicker.setDate(currentYear, currentMonth, dayOfMonth);
                                        _onChangeDate();
                                    }).bind(null, dayOfMonth)
                                }, '' + dayOfMonth)
                            );
                            tr.append(td);
                            dayOfMonth++;
                        } else {
                            tr.append(
                                skin.create('td.empty', {}, ' ')
                            );
                        }
                    }
                    dtMainTbl.append(tr);
                }

                tr = skin.create('tr.dtfooter', {});

                td = skin.create('td', {},
                    skin.create('a.dtBtnFtr', {
                        href: '#',
                        onclick: function () {
                            datePicker.clearDate();
                            _onChangeDate();
                        }
                    }, 'Clear')
                );
                td.setAttribute('colspan', 3);
                tr.append(td);

                tr.append(skin.create('td', {}, ' '));

                td = skin.create('td', {},
                    skin.create('a.dtBtnFtr', {
                        href: '#',
                        onclick: function () {
                            hideDtSet();
                        }
                    }, 'Close')
                );
                td.setAttribute('colspan', 3);
                tr.append(td);

                dtMainTbl.append(tr);

                calendar.append(dtMainTbl);
            }

            function show(field) {
                if (dateField == field) {
                    return;
                }

                dateField = field;

                if (dateField) {
                    try {
                        var dateString = String(dateField.value);
                        var dateParts = dateString.split("-");

                        selectedMonth = parseInt(dateParts[0], 10);
                        selectedDay = parseInt(dateParts[1], 10);
                        selectedYear = 2000 + parseInt(dateParts[2], 10);
                    } catch (e) {}
                }
                if (isNaN(selectedYear) || isNaN(selectedMonth) || isNaN(selectedDay) || selectedMonth > 12 || selectedDay > 31) {
                    selectedMonth = getCurrentMonth();
                    selectedDay = getCurrentDay();
                    selectedYear = getCurrentYear();
                }

                currentDay = (selectedDay <= 0) ? 1 : selectedDay;
                currentMonth = (selectedMonth <= 0) ? 1 : selectedMonth;
                currentYear = (selectedYear < 2000) ? 2000 : selectedYear;

                if (document.getElementById) {
                    drawCalendar();
                    resize();
                    calendar.style.display = 'block';
                }
            }

            function hide() {
                if (dateField) {
                    calendar.style.display = 'none';
                    dateField = null;
                }
            }

            function visible() {
                return dateField;
            }

            function resize() {
                if (dateField && document.getElementById) {
                    var rectSkin = skin.$el.getBoundingClientRect(),
                        rect = dateField.getBoundingClientRect(),
                        x = rect.left - rectSkin.left,
                        y = rect.bottom - rectSkin.top;

                    calendar.style.left = x + 'px';
                    calendar.style.top = y + 'px';
                }
            }

            return {
                clearDate: clearDate,
                setDate: setDate,
                changeMonth: changeMonth,
                changeYear: changeYear,
                show: show,
                hide: hide,
                visible: visible,
                resize: resize
            };

        })();

        function showDatePicker() {
            clearTimeout(_preHideWaitingTimer);
            datePicker.show(dateInput);
        }

        function _onChangeDate() {
            hideDtSet();
            var date = _parseDate(dateInput.value);
            solo.dispatch('uniview.datePicker.changed', date);
        }

        solo.on('uniview.datePicker.onChangeDate', _onChangeDate);

        function _parseDate(txt) {
            var dt = 0;
            try {
                dt = (2000 + parseInt(txt.substr(6, 2), 10)) * 10000 + parseInt(txt.substr(0, 2), 10) * 100 + parseInt(txt.substr(3, 2), 10);
            } catch (err) {
                console.log("Error parsing date _parseDate:" + txt);
            }
            if (isNaN(dt)) dt = 0;
            return dt;
        }

        var _preHideWaitingTimer = null;

        function preHideSet() {
            clearTimeout(_preHideWaitingTimer);
            _preHideWaitingTimer = setTimeout(hideDtSet, 500);
        }

        function hideDtSet() {
            clearTimeout(_preHideWaitingTimer);
            if (datePicker.visible()) {
                datePicker.hide();
            }
        }

        solo.on('core.didChangeLayout', datePicker.resize);
        solo.on('uniview.datePicker.clear', datePicker.clearDate);

        return this.exports(element);
    };
});

/**
 * @event Cortona3DSolo~"uniview.datePicker.changed"
 * @type {number} YYYYMMDD
 */