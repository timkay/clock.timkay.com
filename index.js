let days = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ');
let months = 'January February March April May June July August September October November December'.split(' ');

// Keep the launcher tab visually empty. Named popup windows can reveal the
// clock immediately; small standalone windows wait for layout to settle.
const revealClock = () => document.documentElement.classList.add('clock-visible');
if (window.name === 'clock') {
    revealClock();
} else {
    setTimeout(() => { if (window.innerWidth <= 500) revealClock(); }, 1250);
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

class ClockFace {
    constructor() {
        this.canvas = $('#face')[0];
        this.ctx = this.canvas.getContext('2d');
        this.setSize(w);
    }
    setSize(newW) {
        [this.w, this.h] = [newW, newW];
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        [this.canvas.width, this.canvas.height] = [Math.round(this.w * this.dpr), Math.round(this.h * this.dpr)];
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    clear() {
        this.ctx.clearRect(0, 0, this.w, this.h);
    }
    v2s(x, y) {
        return [this.w / 2 + x * 2, this.h / 2 - y * 2];
    }
    hand(z, len = 1, width = 4, color = '#553318') {
        let theta = (0.25 - z) * 2 * Math.PI;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width * this.w / 250;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(...this.v2s(0, 0));
        this.ctx.lineTo(...this.v2s(this.w / 4 * len * Math.cos(theta), this.w / 4 * len * Math.sin(theta)));
        this.ctx.stroke();
    }
    show(h, m, s) {
        this.clear();
        const inset = Math.max(2, this.w * 0.012);
        const gradient = this.ctx.createRadialGradient(this.w * .38, this.h * .3, 0, this.w / 2, this.h / 2, this.w * .65);
        gradient.addColorStop(0, '#fff4a3');
        gradient.addColorStop(1, '#f3cf3f');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.w / 2, this.h / 2, this.w / 2 - inset, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#b9432d';
        this.ctx.lineWidth = Math.max(2, this.w * .012);
        this.ctx.stroke();

        for (let i = 0; i < 60; i++) {
            const major = i % 5 === 0;
            const angle = i * Math.PI / 30 - Math.PI / 2;
            const outer = this.w * .452;
            const inner = outer - this.w * (major ? .035 : .014);
            this.ctx.strokeStyle = major ? 'rgba(91,62,26,.58)' : 'rgba(91,62,26,.24)';
            this.ctx.lineWidth = this.w * (major ? .008 : .0035);
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(this.w / 2 + Math.cos(angle) * inner, this.h / 2 + Math.sin(angle) * inner);
            this.ctx.lineTo(this.w / 2 + Math.cos(angle) * outer, this.h / 2 + Math.sin(angle) * outer);
            this.ctx.stroke();
        }
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        this.hand((h + m / 60) / 12, 3/8, 4.2, '#c008');
        this.hand((m + s / 60) / 60, 3/4, 4.2, '#c008');
        this.hand(s / 60, 95/100, 4.2, '#c008');
    }
}

let w;
let face;
let timing = false, timer0, timer1, splitTime = null;

const elapsed = () => ((timer1 - timer0) / 1000).toFixed(3);

function formatTime(h, m, s) {
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${period}`;
}

let resizeTimer;
function resize() {
    const ww = $(window).innerWidth();
    const wh = $(window).innerHeight();
    w = Math.min(ww, wh);
    const left = Math.max(0, (ww - w) / 2);
    const top = Math.max(0, (wh - w) / 2);
    const scale = w / 250;
    const fs = 21.8;
    const pt = 60;
    $('#clock').css({
        width: `${w}px`, height: `${w}px`, display: 'block',
        left: `${left}px`, top: `${top}px`,
        fontSize: `${scale * fs}px`,
        paddingTop: `${scale * pt}px`,
        borderWidth: '0'
    });
    $('#face').css({width: `${w}px`, height: `${w}px`, left: `${left}px`, top: `${top}px`});
    $('#menu').css({display: 'block', left: `${left + 12}px`, top: `${top + 12}px`});
    $('#close').css({display: 'block', left: `${left + w - 42}px`, top: `${top + 12}px`});
    // defer canvas resolution update until resize settles
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (!face) {
            face = new ClockFace();
        } else {
            face.setSize(w);
        }
        update();
    }, 150);
}

function update() {
    if (!face) return;
    let d = new Date();
    if (timing) timer1 = d.getTime();
    let h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    face.show(h, m, s);
    let day = days[d.getDay()];
    let date = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    let time = `<div class="time">${formatTime(h, m, s)}</div>`;
    if (timing) {
        time += `<div>${elapsed()}s</div>`;
        time += `<div class="split">${splitTime !== null ? splitTime + 's' : '&nbsp;'}</div>`;
        time += `<button class="reset" type="button" aria-label="Close stopwatch"></button>`;
    }
    const scale = w / 250;
    const fs = 21.8;
    const pt = 60;
    $('#clock').css({fontSize: `${scale * fs}px`, paddingTop: `${scale * pt}px`});
    $('#clock').html(`<div class="day">${day}</div><div class="date">${date}</div>${time}`);
    $('#app').attr('aria-label', `${day}, ${date}, ${formatTime(h, m, s)}. ${timing ? `Stopwatch ${elapsed()} seconds.` : 'Press Space to start the stopwatch.'}`);
}

let popoutAttempted = false;
function popout() {
    if (!popoutAttempted && window.name !== 'clock' && location === parent.location && window.innerWidth > 500) {
        const popup = open('https://clock.timkay.com/', 'clock',
            'height=300,width=300,toolbar=no,menubar=no,scrollbars=no,resizable=yes,location=no,directories=no,status=no');
        if (popup) {
            popoutAttempted = true;
            popup.focus();
            // App-hosted tabs may still be committing their navigation here;
            // defer Back so Chrome does not discard it during initial load.
            setTimeout(() => history.back(), 250);
        }
    }
}

// Remove the retired PWA worker and its offline caches from returning browsers.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
        .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
        .catch(() => {});
}
if ('caches' in window) {
    caches.keys()
        .then(keys => Promise.all(keys.filter(key => key.startsWith('clock-')).map(key => caches.delete(key))))
        .catch(() => {});
}

$(document).on('click', '.reset', e => {
    e.preventDefault();
    e.stopImmediatePropagation();
    timing = false;
    timer0 = timer1 = null;
    splitTime = null;
    update();
});

$(document).on('click', e => {
    if ($(e.target).closest('#close, #menu, #menu-dropdown, #version, #overlay, #toast, .reset').length) return;
    if (!timing) {
        timing = true;
        timer0 = Date.now();
        timer1 = Date.now();
    } else {
        timer1 = Date.now();
        splitTime = elapsed();
    }
    update();
});

let localVersion = $('#version').text();

function notify(message) {
    const pw = 500, ph = 250;
    const popupStyle = `
body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
       height: 100vh; font-family: sans-serif; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; }
.message { font-size: 32px; font-weight: bold; text-align: center; padding: 30px; }
.dismiss { margin-top: 20px; padding: 12px 40px; font-size: 18px; cursor: pointer;
           background: linear-gradient(135deg, #c00, #900); color: white; border: none; border-radius: 8px;
           box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.dismiss:hover { background: linear-gradient(135deg, #e00, #b00); }
.hint { font-size: 12px; color: #666; margin-top: 16px; }`;
    const px = (screen.width - pw) / 2;
    const py = (screen.height - ph) / 2;
    const popup = open('', '_blank',
        `width=${pw},height=${ph},left=${px},top=${py},toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,status=no`);
    if (!popup) {
        showToast(message);
        return;
    }
    popup.document.write(`<!DOCTYPE html>
<html><head><style>${popupStyle}</style></head><body>
<div class="message">${escapeHtml(message)}</div>
<button class="dismiss" onclick="window.close()">Dismiss</button>
<div class="hint">or press any key</div>
<script>document.onkeydown = () => window.close();</script>
</body></html>`);
    popup.document.close();
}

window.notify = notify;

function showOverlay(content) {
    let overlay = document.getElementById('overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        document.body.appendChild(overlay);
    }
    const ww = $(window).innerWidth();
    const wh = $(window).innerHeight();
    const left = Math.max(0, (ww - w) / 2);
    const top = Math.max(0, (wh - w) / 2);
    $(overlay).css({
        display: 'flex',
        left: `${left}px`,
        top: `${top}px`,
        width: `${w}px`,
        height: `${w}px`
    });
    overlay.innerHTML = content;
    overlay.onclick = () => { overlay.style.display = 'none'; };
}

function showToast(message, duration = 4000) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `${escapeHtml(message)}<div class="toast-hint">click to dismiss</div>`;
    toast.style.display = 'block';
    toast.onclick = () => { toast.style.display = 'none'; };
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

function checkForUpdate() {
    fetch('https://clock.timkay.com/version.json?' + Date.now())
        .then(r => r.json())
        .then(data => {
            if (!data.version) return;
            if (data.version !== localVersion) {
                const url = new URL(location.href);
                url.searchParams.set('version', data.version);
                location.replace(url);
            }
        })
        .catch(() => {})
}

let resizeRAF;
$(window).resize(() => {
    cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(resize);
    popout();
});
$(window).on('load', popout);
$(() => {
    resize();
    face = new ClockFace();
    update();
    setInterval(() => { if (!document.hidden) update(); }, 100);
    checkForUpdate();
    setInterval(checkForUpdate, 1000);

    function closeApp() {
        window.close();
    }

    function showAbout() {
        showOverlay(`
            <div class="about-title">Clock</div>
            <div class="about-version">${localVersion || ''}</div>
            <div class="about-desc">Analog/digital clock</div>
            <div class="about-url">clock.timkay.com</div>
            <div class="about-hint">click to dismiss</div>
        `);
    }

    // menu toggle
    $('#menu').on('click', () => {
        const dd = $('#menu-dropdown');
        if (dd.is(':visible')) {
            dd.hide();
            $('#menu').attr('aria-expanded', 'false');
        } else {
            const pos = $('#menu').position();
            dd.css({left: `${parseInt($('#menu').css('left'))}px`, top: `${parseInt($('#menu').css('top')) + 20}px`});
            dd.show();
            $('#menu').attr('aria-expanded', 'true');
            dd.find('.menu-item').first().trigger('focus');
        }
    });

    // close menu on outside click
    $(document).on('mousedown', e => {
        if (!$(e.target).closest('#menu, #menu-dropdown').length) {
            $('#menu-dropdown').hide();
            $('#menu').attr('aria-expanded', 'false');
        }
    });

    // menu actions
    $(document).on('click', '.menu-item', function() {
        const action = $(this).data('action');
        $('#menu-dropdown').hide();
        if (action === 'notify') notify('Test notification');
        else if (action === 'reload') location.reload();
        else if (action === 'about') showAbout();
        else if (action === 'close') closeApp();
    });

    $('#close').on('click', closeApp);
    $('#version').on('click', showAbout);
    $('#version').on('keydown', e => { if (e.key === 'Enter' || e.key === ' ') showAbout(); });

    $(document).on('keydown', e => {
        if (e.key === 'n' || e.key === 'N') notify('Test notification');
        if (e.key === 'Escape') {
            $('#menu-dropdown, #overlay, #toast').hide();
            $('#menu').attr('aria-expanded', 'false').trigger('focus');
        }
        if ((e.key === ' ' || e.key === 'Enter') && !$(e.target).is('button, [role="button"]')) {
            e.preventDefault();
            if (!timing) {
                timing = true;
                timer0 = timer1 = Date.now();
            } else {
                timer1 = Date.now();
                splitTime = elapsed();
            }
            update();
        }
        if ((e.key === 'r' || e.key === 'R') && timing) {
            timing = false;
            timer0 = timer1 = null;
            splitTime = null;
            update();
        }
    });
    popout();
    setTimeout(popout, 250);
    setTimeout(popout, 1000);
});
