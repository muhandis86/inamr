import 'babel-polyfill';
import $ from "expose-loader?exposes=$,jQuery!jquery";
import 'before-after-image-viewer/dist/beforeafter.jquery-1.0.0.min.js';
import moment from 'moment';
import Cropper from 'cropperjs';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import ruLocale from '@fullcalendar/core/locales/ru';
import Modal from 'modal';

let cropper = (function () {
    const wrapper = document.querySelector('.image-wrapper');
    const inputFile = document.getElementById('input-file');
    const inputBtn = document.querySelector('.input-btn');
    const subText = document.querySelectorAll('.subtext');

    $("body").on("change", "#input-file", function (e) {
        var files = e.target.files;
        var done = function (url) {
            $('#image-container').html('');
            $("#image-container").html('<img name="image-data" id="image-data" src="' + url + '" alt="Uploaded Picture">');

        };
        if (files && files.length > 0) {
            var file = files[0];

            if (URL) {
                done(URL.createObjectURL(file));
            } else if (FileReader) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    done(reader.result);
                };
                reader.readAsDataURL(file);
            }

            wrapper.classList.remove('hide');
            inputBtn.classList.add('hide');
            subText.forEach(item => {
                item.classList.toggle('hide');
            });
        }

        var image = document.getElementById('image-data');
        var buttonCrop = document.getElementById('crop_button');
        var buttonCancel = document.getElementById('cancel_button');
        var croppable = false;
        var cropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 3,
            zoomOnWheel: false,
            ready: function () {
                croppable = true;
            },
        });

        buttonCrop.onclick = function () {

            var croppedCanvas;
            var roundedCanvas;
            var roundedImage;

            if (!croppable) {
                return;
            }

            // Crop
            croppedCanvas = cropper.getCroppedCanvas();

            // Round
            roundedCanvas = getRoundedCanvas(croppedCanvas);

            // Show
            roundedImage = document.createElement('img');
            roundedImage.src = roundedCanvas.toDataURL()

            let base64data = roundedImage.src;
            console.log(base64data);
        };

        buttonCancel.onclick = function () {
            wrapper.classList.add('hide');
            inputBtn.classList.remove('hide');
            subText.forEach(item => {
                item.classList.toggle('hide');
            });
            inputFile.value = '';
            console.clear();

            if (cropper) {
                cropper.destroy();
            }
        }

        $('.jsModalLoadImage').on('hidden.bs.modal', function () {
            wrapper.classList.add('hide');
            inputBtn.classList.remove('hide');
            subText.forEach(item => {
                item.classList.toggle('hide');
            });
            inputFile.value = '';
            console.clear();
            if (cropper) {
                cropper.destroy();
            }
        });
    });

    function getRoundedCanvas(sourceCanvas) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var width = sourceCanvas.width;
        var height = sourceCanvas.height;

        canvas.width = width;
        canvas.height = height;
        context.imageSmoothingEnabled = true;
        context.drawImage(sourceCanvas, 0, 0, width, height);
        context.globalCompositeOperation = 'destination-in';
        context.beginPath();
        context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);
        context.fill();
        return canvas;
    }
})(),
    calendar = (function () {
        document.addEventListener('DOMContentLoaded', function () {
            var calendarEl = document.getElementById('calendar');

            if (calendarEl) {
                var calendar = new Calendar(calendarEl, {
                    plugins: [dayGridPlugin, timeGridPlugin],
                    initialView: 'dayGridMonth',
                    locale: ruLocale,
                    dayMaxEvents: true,
                    // fixedWeekCount: false,
                    allDaySlot: false,
                    slotMinTime: '04:00:00',
                    scrollTime: '04:00:00',
                    slotLabelFormat: {
                        hour: 'numeric',
                        minute: '2-digit'
                    },
                    eventDisplay: 'block',
                    displayEventTime: false,
                    headerToolbar: {
                        left: 'dayGridMonth,timeGridWeek,timeGridDay',
                        center: 'prev,title,next',
                        right: ''
                    },
                    views: {
                        dayGridMonth: {
                            titleFormat: { month: 'long' },
                            dayPopoverFormat: { weekday: 'short', day: 'numeric', omitCommas: true }
                        },
                        timeGridWeek: {
                            titleFormat: { month: 'long', day: 'numeric' },
                            dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true }
                        },
                        timeGridDay: {
                            titleFormat: { month: 'long', day: 'numeric' },
                            dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true }
                        }
                    },
                    moreLinkContent: function (args) {
                        return 'еще ' + args.num;
                    },
                    viewDidMount: function (info) {
                        if (info.view.type == 'dayGridMonth') {
                            if (screen.width > 1199) {
                                if (screen.width > 1919) {
                                    calendar.setOption('height', 1416);
                                } else {
                                    calendar.setOption('height', 1133);
                                }
                            } else {
                                calendar.setOption('height', 512);
                            }
                        } else {
                            if (screen.width > 1199) {
                                if (screen.width > 1919) {
                                    calendar.setOption('height', 830);
                                } else {
                                    calendar.setOption('height', 610);
                                }
                            } else {
                                calendar.setOption('height', 566);
                            }
                            if (screen.width <= 1199) {
                                calendar.setOption('slotLabelFormat', {
                                    hour: 'numeric'
                                });
                            }
                        }
                    },
                    viewHint: '',
                    moreLinkHint: '',
                    closeHint: '',
                    buttonHints: {
                        next: '',
                        prev: ''
                    },
                    eventSources: [
                        {
                            events: jsonData,
                            color: '#2196F3',
                            textColor: '#fff'
                        }
                    ],
                    eventClick: function (info) {

                        //---------------show data of event object on modal--------------
                        var event = info.event;

                        var eventDate = event.start;
                        var formattedDate = eventDate.getDate() + ' ' + getMonthName(eventDate.getMonth());
                        var startTime = moment(event.start).format('HH:mm');
                        var endTime = moment(event.end).format('HH:mm');
                        var eventTime = startTime + ' - ' + endTime;

                        const button = document.querySelector('.fc-button-active');

                        if (button.textContent == 'Месяц') {
                            $('.modal-title').text(formattedDate);
                        } else {
                            $('.modal-title').text(formattedDate + ', ' + eventTime);
                        }
                        $('.modal-subtitle').text(event.title);
                        $('.modal-description').text('' + event.extendedProps.description);
                        $('.modal-teacher').text('Преподаватель: ' + event.extendedProps.teacher);
                        $('#calendarModal').modal();

                        //-------------show modal inside of screen-------------------------
                        if (screen.width > 1199) {
                            const calendarDialog = document.querySelector('#calendarDialog');
                            const btnDay = document.querySelector('.fc-timeGridDay-button');

                            var rectEvent = info.el.getBoundingClientRect();
                            var topPosition = rectEvent.top;
                            var leftPosition = rectEvent.left;

                            var rectModal = calendarDialog.getBoundingClientRect();
                            var modalWidth = rectModal.width;
                            var modalHeight = rectModal.height;

                            var screenWidth = screen.width;
                            var screenHeight = screen.height;

                            //--------------checking if modal out of screen-----------
                            if (screen.width > 1919) {
                                if (leftPosition + 313 + modalWidth > screenWidth) {
                                    leftPosition = screenWidth - modalWidth - 313;
                                }
                                if (topPosition + modalHeight > screenHeight) {
                                    topPosition = screenHeight - modalHeight;
                                }
                                if (btnDay.classList.contains('fc-button-active')) {
                                    leftPosition = (screenWidth / 2) - modalWidth;
                                }
                            } else {
                                if (leftPosition + 250 + modalWidth > screenWidth) {
                                    leftPosition = screenWidth - modalWidth - 250;
                                }
                                if (topPosition + modalHeight > screenHeight) {
                                    topPosition = screenHeight - modalHeight;
                                }
                                if (btnDay.classList.contains('fc-button-active')) {
                                    leftPosition = (screenWidth / 2) - modalWidth;
                                }
                            }


                            //---------------show modal with new position------------
                            if (screen.width > 1919) {
                                calendarDialog.style.top = (topPosition - 113) + 'px';
                                calendarDialog.style.left = (leftPosition + 25) + 'px';
                            } else {
                                calendarDialog.style.top = (topPosition - 90) + 'px';
                                calendarDialog.style.left = (leftPosition + 20) + 'px';
                            }
                        }

                        //--------------change background for clicked event--------------
                        info.el.style.backgroundColor = '#BBDEFB';
                        info.el.style.borderColor = '#BBDEFB';
                        info.el.style.opacity = '0.75';

                        //------------return event background on close modal--------
                        $('#calendarModal').on('hidden.bs.modal', function () {
                            info.el.style.backgroundColor = '#2196F3';
                            info.el.style.borderColor = '#2196F3';
                            info.el.style.opacity = '1';
                        });
                    }
                });

                calendar.render();
                addMonthName();

                const button = document.querySelectorAll('.fc-button');

                button.forEach(btn => {
                    btn.addEventListener('click', () => {
                        addMonthName();
                        lineBorderOnScroll();
                    });
                });
            }

        });

        //-----------------underline th-cell border on scrolling-----------------------
        function lineBorderOnScroll() {
            const activeButton = document.querySelector('.fc-button-active');
            const scrollContainer = document.querySelector('.fc-scroller-liquid-absolute');
            const thCells = document.querySelectorAll('th');

            if (activeButton.textContent != 'Месяц') {

                scrollContainer.addEventListener('scroll', function () {
                    thCells.forEach((item, i) => {
                        if (i != 0) {
                            item.style.borderBottomColor = '#999';
                            item.style.borderLeftColor = '#999';
                        }
                    });

                    if (scrollContainer.scrollTop == 0) {
                        thCells.forEach((item, i) => {
                            if (i != 0) {
                                item.style.borderBottomColor = '#ddd';
                                item.style.borderLeftColor = '#ddd';
                            }
                        });
                    }
                });
            }
        }

        //------------adding month name for the first day in calendar-------------------
        function addMonthName() {
            const activeButton = document.querySelector('.fc-button-active');
            const daysMonth = document.querySelectorAll('.fc-daygrid-day-number');
            const daysWeek = document.querySelectorAll('.fc-col-header-cell-cushion');
            const title = document.querySelector('.fc-toolbar-title');

            if (activeButton.textContent == 'Месяц') {

                daysWeek.forEach(item => {
                    item.style.color = '#000';
                });

                for (let i = 0; i <= 6; i++) {
                    let arrDate = daysMonth[i].getAttribute('aria-label').split(' ');
                    if (arrDate[1].slice(0, 3) != title.textContent.slice(0, 3)) {
                        daysWeek[i].style.color = '#bebaba';
                    }
                }

                if (screen.width > 1199) {
                    daysMonth.forEach(item => {
                        if (item.textContent == '1' || item.textContent.slice(0, 2) == '1 ') {
                            item.textContent = item.getAttribute('aria-label').slice(0, 5);
                        }
                    });
                }
            }
            // else if (activeButton.textContent == 'Неделя') {
            //     const daysWeek = document.querySelectorAll('.fc-col-header-cell-cushion');

            //     daysWeek.forEach(item => {
            //         item.textContent = item.textContent.slice(0, 3).toLocaleUpperCase() + item.textContent.slice(3, 5);

            //         if (item.textContent.slice(3) == '1') {
            //             item.style.transition = 'none';
            //             item.style.width = '50px';
            //             item.textContent = item.textContent.slice(0, 3) + item.getAttribute('aria-label').slice(0, 1) + String.fromCharCode(160) + item.getAttribute('aria-label').slice(2, 5);
            //         }
            //     });
            // }
        }

        function getMonthName(monthNumber) {
            var monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
            return monthNames[monthNumber];
        }

    })();
