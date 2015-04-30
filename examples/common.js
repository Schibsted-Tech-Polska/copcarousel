function loadJSON(url, success) {
    var http_request = new XMLHttpRequest();
    try {
        // Opera 8.0+, Firefox, Chrome, Safari
        http_request = new XMLHttpRequest();
    } catch (e) {
        // Internet Explorer Browsers
        try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                http_request = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                console.log("Cannot use AJAX!");
                return false;
            }
        }
    }
    http_request.onreadystatechange = function () {
        if (http_request.readyState == 4) {
            var jsonObj = JSON.parse(http_request.responseText);
            if (typeof success === "function") {
                success.call(null, jsonObj);
            }
        }
    }
    http_request.open("GET", url, true);
    http_request.send();
}

if (typeof String.prototype.ucfirst !== 'function') {
    String.prototype.ucfirst = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
}

var count = count || 15,
    dataUrl = "http://api.randomuser.me?results=" + count,
    carouselConf = {
        autoStart: false,
        itemsCustom: [
            [0, 1],
            [480, 2],
            [768, 3],
            [1024, 4]
        ],
        plugData: {
            "user": {
                "gender": "unknown",
                "name": {"title": "", "first": "N", "last": "N"},
                "location": {
                    "street": "unknown",
                    "city": "unknown",
                    "state": "unknown",
                    "zip": "00000"
                },
                "email": "unknown@example.com",
                "username": "unknown",
                "password": "unknown",
                "registered": "0000000000",
                "dob": "000000000",
                "phone": "(000)-00-0000",
                "cell": "(000)-00-0000",
                "SSN": "000-00-0000",
                "picture": {
                    "large": "examples/img/plug.png",
                    "medium": "examples/img/plug-mid.png",
                    "thumbnail": "examples/img/plug-thumb.png"
                }
            }
        },
        slidesData: [],
        slideRender: slideRender,
        setupCallback: renderPagination,
        callback: updatePagination
    };

window.specialSettings && carouselConf.extend(specialSettings);

function jsonSuccess(data) {
    carouselConf.slidesData = data.results;
    window.carousel = CopCarousel(document.querySelector('#carousel'), carouselConf);
}

function slideRender(slide, data) {
    var link, image, user = data.user, url = user.picture.large;
    image = slide.querySelector('img');
    image.style.visibility = 'hidden';
    image.style.maxHeight = (image.getBoundingClientRect().height || image.offsetHeight) + 'px';
    image.onload = function () {
        image.style.visibility = '';
        image.style.maxHeight = '';
    }
    //IE9 hack to fire onload
    setTimeout(function () {
        image.src = url;
        if (image.complete || image.readyState == "complete" || image.readyState == 4) {
            image.onload();
        }
    }, 1);

    slide.querySelector('.name').innerText = [user.name.title.ucfirst(), user.name.first.ucfirst(), user.name.last.ucfirst()].join(' ');
    link = slide.querySelector('.email');
    link.title = link.innerText = user.email;
    link.href = "mailto:" + user.email;
}

var oldSlidesPerPage = 0;
function renderPagination() {
    var slidesPerPage = carousel.getSlidesPerPage(),
        dataLength = carouselConf.slidesData.length;
    if (slidesPerPage === oldSlidesPerPage) {
        return;
    }
    oldSlidesPerPage = slidesPerPage;
    var i, html = '', paginationContainer = document.querySelector('.pagination'), pages = Math.ceil(dataLength / slidesPerPage);

    var buttons = document.querySelector('.arrows');
    if (buttons) {
        buttons.style.display = (slidesPerPage >= dataLength) ? 'none' : '';
    }
    if (slidesPerPage >= dataLength) {
        paginationContainer.innerHTML = '';
        return;
    }
    for (i = 0; i < pages; i++) {
        html += '<li><a onclick="carousel.slide(' + i * slidesPerPage + ')"></a></li>';
    }
    paginationContainer.innerHTML = html;
    paginationContainer.children[Math.floor(carousel.getIndex() / slidesPerPage)].className += ' active';
}

function updatePagination() {
    var i, activePage = document.querySelectorAll('.pagination .active'), len = activePage.length, slidesPerPage = carousel.getSlidesPerPage();
    for (i = 0; i < len; i++) {
        activePage[i].className = activePage[i].className.replace(/\s?active/g, '').trim();
    }
    i = Math.floor(carousel.getIndex() / slidesPerPage);
    document.querySelectorAll('.pagination li')[i].className += ' active';
}


loadJSON(dataUrl, jsonSuccess);