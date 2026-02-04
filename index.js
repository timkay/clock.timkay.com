console.clear();


let days = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ');
let months = 'January February March April May June July August September October November December'.split(' ');

class ClockFace {
    constructor() {
        this.canvas = $('#face')[0];
        [this.w, this.h] = [w, w];
        [this.canvas.width, this.canvas.height] = [this.w, this.h];
        this.ctx = this.canvas.getContext('2d');
        this.ctx.strokeStyle = '#c00';
        this.ctx.lineWidth = 6;
    }
    clear() {
        this.ctx.clearRect(0, 0, this.w, this.h);
    }
    begin() {
        this.ctx.beginPath();
    }
    v2s(x, y) {
        return [this.w / 2 + x * 2, this.h / 2 - y * 2];
    }
    move(x, y) {
        this.ctx.moveTo(...this.v2s(x, y));
    }
    draw(x, y) {
        this.ctx.lineTo(...this.v2s(x, y));
    }
    stroke() {
        this.ctx.stroke();
    }
    hand(z, len = 1) {
        let theta = (0.25 - z) * 2 * Math.PI;
        this.move(0, 0);
        this.draw(this.w / 4 * len * Math.cos(theta), this.w / 4 * len * Math.sin(theta));
        this.stroke();
    }
    show(h, m, s) {
        this.clear();
        this.ctx.fillStyle = '#ffff00cc';
        this.ctx.beginPath();
        this.ctx.arc(this.w / 2, this.h / 2, this.w / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.begin();
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        this.hand((h + m / 60) / 12, 3/8);
        this.hand((m + s / 60) / 60, 3/4);
        this.hand(s / 60, 95/100);
    }
}


const [initial_w, initial_h] = [300, 300];
let w;
let face;
let timing = false, timer0, timer1;

const elapsed = () => ((timer1 - timer0) / 1000).toFixed(3);

function resize() {
    w = Math.min($(window).outerWidth(), $(window).outerHeight());
    $('#clock').css({width: `${w}px`, height: `${w}px`, display: 'block'});
    face = new ClockFace();
}

function update() {
    if (timing) timer1 = new Date().getTime();
    let d = new Date();
    let day;
    let date;
    let time;
    const utc = false;
    if (utc) {
        face.show(d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
        day = `${days[d.getUTCDay()]}`;
        date = `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
        time = d.toISOString().substring(11, 19);
    } else {
        face.show(d.getHours(), d.getMinutes(), d.getSeconds());
        day = `${days[d.getDay()]}`;
        date = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        time = d.toString().substr(16, 8);
        if (time > '12') {
            time += ' PM';
            if (time > '13') {
                time = (parseInt(time) - 12).toString().padStart(2, '0') + time.substr(2);
            }
        } else {
            if (time.startsWith('00')) {
                time = '12' + time.substr(2);
            }
            time += ' AM';
        }
    }
    time = `<div>${time}</div>`;
    if (timer0) time += `<div>${elapsed()} sec</div>`;
    $('#clock').html([day, date, time].join('\n'));
}

function popout() {
    if (window.__TAURI_INTERNALS__) return;
    if (location === parent.location && window.opener === null && window.innerWidth > 500) {
        let options =  `height=${initial_w}, width=${initial_h}, toolbar=no, menubar=no, scrollbars=no, resizable=no, location=no, directories=no, status=no`;
        open('https://clock.timkay.com/', 'clock', options);
        // window.close();
    }
}

function time() {
    timer1 = new Date().getTime();
    update();
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/serviceworker.js")
        .then(() => console.log("Service Worker registered"))
        .catch(err => console.error("Service Worker fail", err));
}

$('#face').click(event => {
    timing = !timing;
    if (timing) timer0 = new Date().getTime();
    time();
});

// let save;

// $('body')
// .mousedown(event => {
//     save = [event.clientX, event.clientY]
//     console.log(save, event);
// })
// .mouseup(event => {
//     console.log(event);
// })
// .mousemove(event => {
//     // console.log(event);
// });

const localVersion = $('#version').text()

function checkForUpdate() {
    fetch('https://clock.timkay.com/version.json?' + Date.now())
        .then(r => r.json())
        .then(data => {
            if (data.version && data.version !== localVersion) {
                location.replace('https://clock.timkay.com/')
            }
        })
        .catch(() => {})
}

$(window).resize(resize);
$(() => {
    resize();
    update();
    setInterval(update, 87);
    checkForUpdate();
    setInterval(checkForUpdate, 1000);
    popout();
});























