# Lightweight carousel with touch support and no dependencies

This carousel was created because our team needed lightweight solution that would handle 50+ slides smoothly. Preferably with minimum dependencies. 

## Concept

There are at most 3 * *number\_of\_visible\_slides* elements at once and they are juggled back and forth from the beginning to the end and other way round. So after sliding left, the first element is moved to the end and modified with a new data. With this concept there is no possibility to perform fast, long-distance swiping, so instead if the distance between current and target index is greater than *number\_of\_visible\_slides* the fadeout/fadein is performed.

## Overview

#### Set up your HTML

Include css stylesheet and JS script in your html:

```html
    <link type="text/css" rel="stylesheet" href="src/css/copcarousel.css">
    
    <script type="text/javascript" src="src/js/copcarousel.js"></script>
```

Include the following code in your html:

```html
<div id="carousel" class="cop-carousel-container">
    <div class="cop-carousel">
        <div class="brick">
            <img>
            <span>This div is optional and can be used as a slide template</span>
        </div>
    </div>
</div>
```

#### JavaScript

**Before** the carousel can be started, you need to prepare the data and function for rendering a single slide.
CopCarousel accepts array of data. The data source and structure is up to you as the rendering function is also written by you.

```javascript
var slidesData = [{
        url: "http://www.example.com/1.jpg",
        text: "First picture"
    },
    {
        url: "http://www.example.com/2.jpg",
        text: "Second picture"
    },
    {
        url: "http://www.example.com/3.jpg",
        text: "Third picture"
    }];

function slideRender(slide, data) {
    slide.querySelector('img').src = data.url;
    slide.querySelector('.text').innerHTML = data.text;
}
```

Having this you can start the carousel

```javascript
var carousel = CopCarousel(document.querySelector('#carousel'), {
    slidesData: slidesData,
    slideRender: slideRender
});
```

That is just a really basic setup. There are no controls included, but they can be easily added using public API methods. More lower and in examples.

## Options

**autoStart** (*bool*; default: `false`) - autoplay right after data load

**delay** (*int*; defult: `5000`) - delay in miliseconds between carousel moves

**speed** (*int*; default: `500`) - speed of animation in miliseconds

**itemsCustom** (*array of two-int arrays*; default: `[ [0, 1], [480, 2], [768, 3] ]`) - breakpoints for carousel container width in pixels, eg. if container is at least 480 px wide, then 2 slides are visible, if 720 px - 3 slides.
        
**vertical** (*bool*; default: `false`) - create vertical carousel

**slidesData** (*array*; default: `[]`) - data used to prepare slides; **must be provided before initializing carousel!**

**slideRender** (*function(element, data)*; default: `null`) - whenever slide is rendered, this function is called. The **element** is a slide HTMLelement object that is to be changed using the **data** (one element of *slidesData* array); **must be provided before initializing carousel!**

**plugData** (*mixed*; default: `undefined`) - extra data to be used to fill up carousel when there is not enough slides data (length(slidesData) < number\_of\_visible\_slides); omit this param if you don't want to fill up

**stopPropagation** (*bool*; default: `true`) - prevent event propagation

**setupCallback** (*function()*; default: `null`) - called just before the end of the carousel setup; useful for creating pagination

**callback** (*function()*; default: `null`) - called right after carousel movement; useful for updating pagination

**disableScroll** (*bool*; default: `false`) - disable page scrolling with touch if the touchstart event was called on carousel

## Demos
Some examples: [click](http://schibsted-tech-polska.github.io/copcarousel/ "examples").