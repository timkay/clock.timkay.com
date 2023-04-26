// console.clear();

let w = 250;

$('#clock').css({width: `${w}px`, height: `${w}px`, display: 'block'});

let options =  `height=${w}, width=${w}, toolbar=no, menubar=no, scrollbars=no, resizable=no, location=no, directories=no, status=no`;

let days = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ');
let months = 'January February March April May June July August September October November December'.split(' ');

class ClockFace {
    constructor() {
        this.canvas = $('#face')[0];
        [this.w, this.h] = [w, w];
        [this.canvas.width, this.canvas.height] = [this.w, this.h];
        this.ctx = this.canvas.getContext('2d');
        this.ctx.strokeStyle = '#f002';
        this.ctx.lineWidth = 4;
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
        this.begin();
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        this.hand((h + m / 60) / 12, 3/8);
        this.hand((m + s / 60) / 60, 3/4);
        this.hand(s / 60, 95/100);
    }
}

let face = new ClockFace;
let timing = false, timer0, timer1;

const elapsed = () => ((timer1 - timer0) / 1000).toFixed(3);

function update() {
    if (timing) timer1 = new Date().getTime();
    let d = new Date();
    face.show(d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
    let day = `${days[d.getDay()]}`;
    let date = `${months[d.getMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    let time = `<div>${d.toTimeString().substring(0, 8)}</div>`;
    if (timer0) time += `<div>${elapsed()} sec</div>`;
    $('#clock').html([day, date, time].join('\n'));
}

function popout() {
    if (location === parent.location && $(window).width() !== w) {
        // open('https://clock.timkay.com/', 'clock', options);
        // window.close();
    }
}

function time() {
    timer1 = new Date().getTime();
    update();
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

update();
setInterval(update, 87);
$(popout);
























