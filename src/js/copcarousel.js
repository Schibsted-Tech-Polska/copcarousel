/* @preserve
 * CopCarousel 0.1.0
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Schibsted Tech Polska  Sp. z o.o.
 * Author: Tomasz Łukasik
 *
 * Inspired by Brad Birdsall's Swipe 2.0
 */

// required polyfill
if (typeof Object.prototype.extend !== 'function') {
    Object.prototype.extend = function () {
        var obj;
        for (var a = 0; a < arguments.length; a++) {
            obj = arguments[a];
            if (!obj || typeof obj !== 'object') {
                continue;
            }
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    this[p] = obj[p];
                }
            }
        }
        return this;
    }
}

function CopCarousel(container, options) {

    "use strict";

    if (!container) return;

    var noop = function () {
    };
    var offloadFn = function (fn) {
        setTimeout(fn || noop, 0)
    };

    var defaultOptions = {
        autoStart: false,
        delay: 5000,
        speed: 500,
        itemsCustom: [
            [0, 1],
            [480, 2],
            [768, 3]
        ],
        vertical: false,
        slidesData: [],
        slideRender: null,
        stopPropagation: true,
        setupCallback: null,
        callback: null,
        disableScroll: false
    };
    // check browser capabilities
    var browser = {
        addEventListener: !!window.addEventListener,
        touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch
    };
    (function (temp, browser) {
        var props = {
                transition: ['transitionProperty', 'webkitTransition', 'MozTransition', 'OTransition', 'msTransition'],
                transitionDuration: ['transitionDuration', 'webkitTransitionDuration', 'MozTransitionDuration', 'OTransitionDuration', 'msTransitionDuration'],
                transform: ['transform', 'webkitTransform', 'MozTransform', 'OTransform', 'msTransform']
            },
            transitionEndEvent = {
                'transitionProperty': 'transitionend',
                'webkitTransition': 'webkitTransitionEnd',
                'MozTransition': 'transitionend',
                'OTransition': 'otransitiontnd',
                'msTransition': 'msTransitionEnd'
            };

        for (var prop in props) {
            for (var i in props[prop]) {
                if (temp.style[props[prop][i]] !== undefined) {
                    browser[prop] = props[prop][i];
                    break;
                }
                browser[prop] = false;
            }
        }
        browser.transitionEnd = transitionEndEvent[browser.transition] || false;
        browser.transitions = !!browser.transition;
    })(document.createElement('swipe'), browser);

    var template, size, pageSize, lowestRendered, highestRendered, wrapperBaseOffset, wrapperRelativeOffset = 0;
    var wrapper = container.children[0];
    options = {}.extend(defaultOptions, options || {});
    var slidesPerPage = 1, doSlide = false, doFill = false;
    var speed = (options.speed || 300);
    var slidesData = options.slidesData || [];
    var length = slidesData.length;
    var index = circle(parseInt(options.startSlide, 10) || 0), newIndex = index;
    options.slideRender = options.slideRender || noop;
    var slideRender = function (slide, idx) {
        if (slide.getAttribute('data-idx') != idx) {
            slide.setAttribute('data-idx', idx);
            options.slideRender(slide, (idx === 'plug') ? options.plugData : slidesData[idx]);
        }
    };
    options.itemsCustom = options.itemsCustom && options.itemsCustom.sort(function (a, b) {
        return a[0] - b[0];
    });
    var fading = false;
    if (options.template && typeof options.template === 'string') {
        template = document.createElement('div');
        template.innerHTML = options.template;
        options.template = template.children[0];
    }
    template = (options.template instanceof HTMLElement && options.template) || (wrapper.children.length && wrapper.removeChild(wrapper.children[0])) || '';
    wrapper.innerHTML = '';
    var axisProperties = (options.vertical) ? {measure: 'height', axis: 'y', oppAxis: 'x', position: 'top'} : {measure: 'width', axis: 'x', oppAxis: 'y', position: 'left'};
    if (options.vertical) container.className += ' vertical';
    var oldSlidesPerPage, oldDoSlide;

    function setup() {
        var cnt;
        oldSlidesPerPage = slidesPerPage;
        oldDoSlide = doSlide;
        size = container.getBoundingClientRect()[axisProperties.measure] || container['offset' + axisProperties.measure.ucfirst()];
        calculateSlidesPerPage();
        doSlide = (length > slidesPerPage);
        doFill = !doSlide && !!options.plugData;
        size = size / slidesPerPage;//Math.floor(size / slidesPerPage);
        if (!wrapper.children.length) {
            cnt = doSlide ? slidesPerPage * 3 : slidesPerPage;
            calculateLowestHighest();
            appendSlides(cnt);
        } else {
            adjustSlides();
        }
        renderSlides();

        pageSize = size * slidesPerPage;
        wrapperBaseOffset = doSlide ? -pageSize : 0;
        wrapperRelativeOffset = 0;
        wrapper.style[axisProperties.measure] = size * wrapper.children.length + 'px';
        moveToOffset(0, 0);
        offloadFn(options.setupCallback);
        begin();
    }

    function calculateLowestHighest() {
        if (doSlide) {
            lowestRendered = circle(index - slidesPerPage);
            highestRendered = circle(index + 2 * slidesPerPage - 1);
        } else {
            lowestRendered = index;
            highestRendered = circle(index + length - 1);
        }
    }

    function calculateSlidesPerPage() {
        var i;
        if (options.itemsCustom) {
            for (i = 0; i < options.itemsCustom.length; i += 1) {
                if (options.itemsCustom[i][0] > size) {
                    break;
                }
                slidesPerPage = options.itemsCustom[i][1];
            }
        }
    }

    function adjustSlides() {
        if (slidesPerPage === oldSlidesPerPage) {
            return;
        }
        // Need to add/remove slides
        var needed = (doSlide) ? slidesPerPage * 3 : slidesPerPage;
        var current = wrapper.children.length;
        var toPrepend = 0, toAppend;
        if (oldDoSlide) {
            if (doSlide) {
                toPrepend = slidesPerPage - oldSlidesPerPage;
                toAppend = needed - toPrepend - current;
            } else {
                toPrepend = -oldSlidesPerPage;
                toAppend = needed - toPrepend - current;
            }
        } else {
            if (doSlide) {
                toPrepend = slidesPerPage;
                toAppend = needed - toPrepend - current;
            } else {
                toAppend = needed - toPrepend - current;
            }
        }
        calculateLowestHighest();

        if (toPrepend >= 0) {
            prependSlides(toPrepend);
        } else {
            shiftSlides(-toPrepend);
        }
        if (toAppend >= 0) {
            appendSlides(toAppend);
        } else {
            popSlides(-toAppend);
        }
    }

    function shiftSlides(count) {
        while (count--) {
            wrapper.removeChild(wrapper.firstChild);
        }
    }

    function prependSlides(count) {
        while (count--) {
            wrapper.insertBefore(template.cloneNode(true), wrapper.firstChild);
        }
    }

    function popSlides(count) {
        while (count--) {
            wrapper.removeChild(wrapper.lastChild);
        }
    }

    function appendSlides(count) {
        while (count--) {
            wrapper.appendChild(template.cloneNode(true));
        }
    }

    function renderSlides() {
        var slide, i, cnt, len = wrapper.children.length, dataIdx;
        for (cnt = 0, i = lowestRendered; cnt < len; i = circle(++i), cnt++) {
            slide = wrapper.children[cnt];
            dataIdx = (doFill && cnt >= length) ? 'plug' : i;
            slideRender(slide, dataIdx);
            slide.style[axisProperties.measure] = size + 'px';
        }
    }

    function shuffle(diff) {
        if (!diff) {
            return;
        }
        if (diff < 0) {
            lowestRendered = circle(lowestRendered - diff);
            while (diff++) {
                highestRendered = circle(highestRendered + 1);
                slideRender(wrapper.firstChild, highestRendered);
                wrapper.appendChild(wrapper.firstChild);
            }
        } else {
            highestRendered = circle(highestRendered - diff);
            while (diff--) {
                lowestRendered = circle(lowestRendered - 1);
                slideRender(wrapper.lastChild, lowestRendered);
                wrapper.insertBefore(wrapper.lastChild, wrapper.firstChild);
            }
        }
    }

    function circle(index) {
        return (length + (index % length)) % length;
    }

    function slide(to, slideSpeed) {
        to = circle(to);
        if (index == to) return;
        move(to - index, slideSpeed);
    }

    function move(steps, slideSpeed) {
        stop();
        if (fading || !doSlide) {
            return;
        }
        steps = steps % length;
        steps = steps + length * (0 + (steps <= -length / 2)) - length * (0 + (steps > length / 2));
        // if slide far, we need to fade out
        if (Math.abs(steps) > slidesPerPage) {
            fading = true;
            browser.addEventListener && wrapper.removeEventListener('touchstart', events, false);
            newIndex = circle(index + steps);
            fade(true);
            return;
        }
        var offset = -steps * size;
        moveToOffset(offset, slideSpeed);
    }

    function moveToOffset(offset, slideSpeed) {
        slideSpeed = (typeof slideSpeed !== 'undefined') ? slideSpeed : speed;
        var destOffset = offset + wrapperBaseOffset;
        if (!animateHelper.intervalId) {
            wrapperRelativeOffset = offset;
        }
        translate(destOffset, slideSpeed);
    }

    function translate(dest, speed) {
        var style = wrapper.style;
        if (browser.transitions) {
            style[browser.transitionDuration] = speed + 'ms';
            style[browser.transform] = 'translate' + axisProperties.axis.toUpperCase() + '(' + dest + 'px)';
        } else if (!speed) {
            style[axisProperties.position] = dest + 'px';
        } else if (!animateHelper.intervalId) {
            animateHelper.start(wrapperBaseOffset, dest, axisProperties.position, 'px', speed, events.transformTransitionEnd);
        }
    }

    function fade(out) {
        var style = wrapper.style, duration = 400, finalVal = Math.abs(1 - out);
        if (browser.transitions) {
            style[browser.transitionDuration] = duration + 'ms';
            style[browser.transition] = 'opacity';
            offloadFn(function () {
                style.opacity = finalVal;
            });
        } else if ('opacity' in style) {
            var property = 'opacity', initVal = +out;
            if (animateHelper.property === axisProperties.position) {
                animateHelper.finish(true);
            }
            animateHelper.start(initVal, finalVal, property, '', duration, events.opacityTransitionEnd);
        } else {
            style.opacity = finalVal;
            events.opacityTransitionEnd();
        }
    }

    var delay = options.delay || 0;
    var interval;

    function begin() {
        if (!interval && delay && options.autoStart && doSlide) {
            interval = setTimeout(function () {
                move(1)
            }, delay);
        }
    }

    function stop() {
        if (interval) {
            clearTimeout(interval);
        }
        interval = false;
    }

// setup initial vars
    var start = {};
    var delta = {};
    var isScrolling;

// setup event capturing
    var events = {
        handleEvent: function (event) {
            switch (event.type) {
                case 'touchstart':
                    this.start(event);
                    break;
                case 'touchmove':
                    this.move(event);
                    break;
                case 'touchend':
                    offloadFn(function () {
                        events.end(event)
                    });
                    break;
                case browser.transitionEnd:
                    offloadFn(function () {
                        events.transitionEnd(event)
                    });
                    break;
                case 'resize':
                    offloadFn(this.resize);
                    break;
            }
            if (options.stopPropagation) event.stopPropagation();
        },
        start: function (event) {
            var touches = event.touches[0];
            start = {
                x: touches.pageX,
                y: touches.pageY,
                time: +new Date
            };

            // used for testing first move event
            isScrolling = undefined;

            // reset delta and end measurements
            delta = {};
            this.transformTransitionEnd(event);
            wrapper.addEventListener('touchmove', this, false);
            wrapper.addEventListener('touchend', this, false);
        },
        move: function (event) {
            if (event.touches.length > 1 || event.scale && event.scale !== 1) return;

            if (options.disableScroll) event.preventDefault();

            var touch = event.touches[0];

            delta = {
                x: touch.pageX - start.x,
                y: touch.pageY - start.y
            };

            // determine if scrolling test has run - one time test
            if (typeof isScrolling == 'undefined') {
                isScrolling = !!( isScrolling || Math.abs(delta[axisProperties.axis]) < Math.abs(delta[axisProperties.oppAxis]) );
            }
            // if user is trying to scroll
            if (isScrolling) {
                wrapper.removeEventListener('touchmove', events, false);
                wrapper.removeEventListener('touchend', events, false);
            } else {
                event.preventDefault();

                stop();
                delta.direction = Math.abs(delta[axisProperties.axis]) / delta[axisProperties.axis];
                delta[axisProperties.axis] = Math.min(Math.abs(delta[axisProperties.axis]), pageSize);
                if (delta[axisProperties.axis] <= pageSize) {
                    delta[axisProperties.axis] = delta.direction * delta[axisProperties.axis];
                    moveToOffset(delta[axisProperties.axis], 0);
                }
            }
        },
        end: function (event) {
            var dist;

            // if not scrolling
            if (!isScrolling && delta.direction) {
                dist = delta.direction * Math.ceil(Math.abs(delta[axisProperties.axis]) / size);
                var isMove = ((dist * size) != wrapperRelativeOffset);
                moveToOffset(dist * size);
                if (!isMove) {
                    this.transitionEnd(event);
                }
                event.preventDefault();
            }

            wrapper.removeEventListener('touchmove', events, false);
            wrapper.removeEventListener('touchend', events, false);
            return false;
        },
        resize: function () {
            setup();
            wrapper.removeEventListener('touchstart', events, false);
            if (doSlide) {
                wrapper.addEventListener('touchstart', events, false);
            }
        },
        transitionEnd: function (event) {
            if (event.propertyName === 'opacity') {
                this.opacityTransitionEnd(event);
            } else if (/transform/i.test(event.propertyName)) {
                this.transformTransitionEnd(event);
            }
        },
        transformTransitionEnd: function (event) {
            newIndex = (newIndex !== index) ? newIndex : circle(index - Math.round(wrapperRelativeOffset / size));
            var diff = (index - newIndex);
            diff = diff + length * (0 + (diff < -length / 2)) - length * (0 + (diff >= length / 2));
            index = newIndex;
            translate(wrapperBaseOffset, 0);
            wrapperRelativeOffset = 0;
            if (diff) {
                shuffle(diff);
                offloadFn(options.callback);
            }
            options.autoStart = true;
            begin();
        },
        opacityTransitionEnd: function (event) {
            if (parseFloat(wrapper.style.opacity)) {
                if (browser.transitions) {
                    wrapper.style[browser.transition] = '';
                    wrapper.style[browser.transitionDuration] = '';
                }
                wrapper.style.opacity = '';
                fading = false;
                if (browser.touch) wrapper.addEventListener('touchstart', events, false);
                begin();
            } else {
                index = newIndex;
                wrapperRelativeOffset = 0;
                translate(wrapperBaseOffset, 0);
                calculateLowestHighest();
                renderSlides();
                offloadFn(options.callback);
                options.autoStart = true;
                setTimeout(function () {
                    fade(false)
                }, 5);
            }
        }
    };

// Transition fallback
    var animateHelper = {
        duration: 400,
        intervalId: 0,
        initValue: 0,
        finalValue: 1,
        diffValue: 1,
        startDate: 0,
        property: '',
        unit: '',
        onAnimationEnd: null,
        start: function (initValue, finalValue, property, unit, duration, onAnimationEnd) {
            this.initValue = initValue;
            this.finalValue = finalValue;
            this.property = property;
            this.unit = unit;
            this.duration = duration;
            this.onAnimationEnd = onAnimationEnd;
            this.diffValue = finalValue - initValue;
            this.startDate = +new Date;
            this.intervalId = setInterval(this.tick, 5);
        },
        tick: function () {
            var currentDate = +new Date;
            var diff = currentDate - animateHelper.startDate;
            var step = diff / animateHelper.duration;
            var offset = step * animateHelper.diffValue;
            var currentValue = animateHelper.initValue + offset;

            wrapper.style[animateHelper.property] = currentValue + animateHelper.unit;
            if (currentDate >= animateHelper.startDate + animateHelper.duration) {
                animateHelper.finish();
            }

        },
        finish: function (noCallback) {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = 0;
                wrapper.style[this.property] = this.finalValue + this.unit;
                if (!noCallback && this.onAnimationEnd && typeof this.onAnimationEnd === 'function') {
                    this.onAnimationEnd({elapsedTime: this.duration, currentValue: this.finalValue});
                }
            }
        }
    };

    setup();
    wrapper.style.display = 'inherit';

// add event listeners
    if (browser.addEventListener) {
        if (browser.touch && doSlide) wrapper.addEventListener('touchstart', events, false);

        if (browser.transitions) {
            wrapper.addEventListener(browser.transitionEnd, events, false);
        }
        window.addEventListener('resize', events, false);
    } else {
        window.onresize = function () {
            setup()
        };
    }

// expose the CopCarousel API
    return {
        setup: function () {
            setup();
        },
        slide: function (to, speed) {
            stop();
            slide(to, speed);
        },
        move: function (steps) {
            stop();
            move(steps);
        },
        prev: function () {
            stop();
            move(-1);
        },
        next: function () {
            stop();
            move(1);
        },
        stop: function () {
            stop();
        },
        getPos: function () {
            return index;
        },
        getNumSlides: function () {
            return length;
        },
        getSlidesPerPage: function () {
            return slidesPerPage;
        },
        getIndex: function () {
            return index;
        },
        getBoxSize: function () {
            return size;
        },
        kill: function () {
            stop();
            wrapper.style[axisProperties.measure] = '';
            wrapper.style[axisProperties.position] = '';
            translate(0, 0);
            if (browser.addEventListener) {
                wrapper.removeEventListener(browser.transitionEnd, events, false);
                wrapper.removeEventListener('touchstart', events, false);
                wrapper.removeEventListener('touchmove', events, false);
                wrapper.removeEventListener('touchend', events, false);
                window.removeEventListener('resize', events, false);
            } else {
                window.onresize = null;
            }
        }
    }
}
