// When running from Tauri bundled files, redirect to live site if reachable
if (location.hostname !== 'clock.timkay.com' && location.protocol !== 'http:') {
    fetch('https://clock.timkay.com/version.json?' + Date.now(), { mode: 'cors' })
        .then(r => { if (r.ok) location.replace('https://clock.timkay.com/') })
        .catch(() => { /* site unreachable, stay on bundled files */ })
}

let days = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ');
let months = 'January February March April May June July August September October November December'.split(' ');

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
        [this.canvas.width, this.canvas.height] = [this.w, this.h];
        this.ctx.strokeStyle = '#c008';
        this.ctx.lineWidth = 4.2 * newW / 250;
    }
    clear() {
        this.ctx.clearRect(0, 0, this.w, this.h);
    }
    v2s(x, y) {
        return [this.w / 2 + x * 2, this.h / 2 - y * 2];
    }
    hand(z, len = 1) {
        let theta = (0.25 - z) * 2 * Math.PI;
        this.ctx.beginPath();
        this.ctx.moveTo(...this.v2s(0, 0));
        this.ctx.lineTo(...this.v2s(this.w / 4 * len * Math.cos(theta), this.w / 4 * len * Math.sin(theta)));
        this.ctx.stroke();
    }
    show(h, m, s) {
        this.clear();
        this.ctx.fillStyle = '#ffff00cc';
        this.ctx.beginPath();
        this.ctx.arc(this.w / 2, this.h / 2, this.w / 2, 0, Math.PI * 2);
        this.ctx.fill();
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        this.hand((h + m / 60) / 12, 3/8);
        this.hand((m + s / 60) / 60, 3/4);
        this.hand(s / 60, 95/100);
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
    const fs = timing ? 16.8 : 21.8;
    const pt = timing ? 42 : 60;
    $('#clock').css({
        width: `${w}px`, height: `${w}px`, display: 'block',
        left: `${left}px`, top: `${top}px`,
        fontSize: `${scale * fs}px`,
        paddingTop: `${scale * pt}px`,
        borderWidth: `${scale * 3.5}px`
    });
    $('#face').css({width: `${w}px`, height: `${w}px`, left: `${left}px`, top: `${top}px`});
    $('#menu').css({display: 'block', left: `${left + 12}px`, top: `${top + 12}px`});
    $('#close').css({display: 'block', left: `${left + w - 24}px`, top: `${top + 12}px`});
    const hs = 16;
    $('[data-direction="NorthWest"]').css({left: `${left}px`, top: `${top}px`});
    $('[data-direction="NorthEast"]').css({left: `${left + w - hs}px`, top: `${top}px`});
    $('[data-direction="SouthWest"]').css({left: `${left}px`, top: `${top + w - hs}px`});
    $('[data-direction="SouthEast"]').css({left: `${left + w - hs}px`, top: `${top + w - hs}px`});
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
        time += `<div class="reset">✕</div>`;
    }
    const scale = w / 250;
    const fs = timing ? 16.8 : 21.8;
    const pt = timing ? 42 : 60;
    $('#clock').css({fontSize: `${scale * fs}px`, paddingTop: `${scale * pt}px`});
    $('#clock').html([day, date, time].join('\n'));
}

function popout() {
    if (window.__TAURI_INTERNALS__) return;
    if (location === parent.location && window.opener === null && window.innerWidth > 500) {
        open('https://clock.timkay.com/', 'clock',
            'height=300,width=300,toolbar=no,menubar=no,scrollbars=no,resizable=yes,location=no,directories=no,status=no');
    }
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/serviceworker.js")
        .then(() => console.log("Service Worker registered"))
        .catch(err => console.error("Service Worker fail", err));
}

let dragStart = null;
let dragging = false;

$(document).on('mousedown', e => {
    const handle = $(e.target).closest('.resize-handle');
    if (handle.length && window.__TAURI_INTERNALS__) {
        e.preventDefault();
        window.__TAURI_INTERNALS__.invoke('plugin:window|start_resize_dragging', {
            label: 'main',
            value: handle.data('direction')
        });
        return;
    }
    dragStart = { x: e.screenX, y: e.screenY };
    dragging = false;
});

$(document).on('mousemove', e => {
    if (!dragStart) return;
    const dx = Math.abs(e.screenX - dragStart.x);
    const dy = Math.abs(e.screenY - dragStart.y);
    if (!dragging && (dx > 3 || dy > 3)) {
        dragging = true;
        if (window.__TAURI_INTERNALS__) {
            window.__TAURI_INTERNALS__.invoke('plugin:window|start_dragging', { label: 'main' })
        }
    }
});

$(document).on('mouseup', e => {
    if (!dragStart) return;
    if (!dragging) {
        if ($(e.target).closest('#close, #menu, #menu-dropdown, #version, #overlay, #toast').length) {
            dragStart = null;
            dragging = false;
            return;
        }
        if ($(e.target).closest('.reset').length) {
            timing = false;
            timer0 = timer1 = null;
            splitTime = null;
        } else if (!timing) {
            timing = true;
            timer0 = Date.now();
            timer1 = Date.now();
        } else {
            timer1 = Date.now();
            splitTime = elapsed();
        }
        update();
    }
    dragStart = null;
    dragging = false;
});

let localVersion = null;

let notifyCount = 0;

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
    if (window.__TAURI_INTERNALS__) {
        const label = `notify-${++notifyCount}`;
        window.__TAURI_INTERNALS__.invoke('plugin:webview|create_webview_window', {
            options: {
                label,
                url: `data:text/html,${encodeURIComponent(`<!DOCTYPE html>
<html><head><style>${popupStyle} body { -webkit-app-region: drag; } .dismiss { -webkit-app-region: no-drag; }</style></head><body>
<div class="message">${escapeHtml(message)}</div>
<button class="dismiss" onclick="try{window.__TAURI_INTERNALS__.invoke('plugin:window|close',{label:'${label}'})}catch(e){window.close()}">Dismiss</button>
<div class="hint">or press any key</div>
<script>
function dismissWindow(){try{window.__TAURI_INTERNALS__.invoke('plugin:window|close',{label:'${label}'})}catch(e){window.close()}}
document.onkeydown=dismissWindow;
setTimeout(dismissWindow,30000);
</script>
</body></html>`)}`,
                width: pw,
                height: ph,
                center: true,
                alwaysOnTop: true,
                decorations: false,
            }
        }).catch(() => showToast(message));
    } else {
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
            if (!localVersion) {
                localVersion = data.version;
                $('#version').text(localVersion);
            } else if (data.version !== localVersion) {
                location.replace('https://clock.timkay.com/')
            }
        })
        .catch(() => {})
}

let resizeRAF;
$(window).resize(() => {
    cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(resize);
});
$(() => {
    resize();
    face = new ClockFace();
    update();
    setInterval(update, 87);
    checkForUpdate();
    setInterval(checkForUpdate, 5000);

    // Get Tauri app version
    if (window.__TAURI_INTERNALS__) {
        window.__TAURI_INTERNALS__.invoke('plugin:app|version')
            .then(v => { $('#app-version').text('v' + v); })
            .catch(() => {});
    }

    function closeApp() {
        if (window.__TAURI_INTERNALS__) {
            window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'main' });
        } else {
            window.close();
        }
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
        } else {
            const pos = $('#menu').position();
            dd.css({left: `${parseInt($('#menu').css('left'))}px`, top: `${parseInt($('#menu').css('top')) + 20}px`});
            dd.show();
        }
    });

    // close menu on outside click
    $(document).on('mousedown', e => {
        if (!$(e.target).closest('#menu, #menu-dropdown').length) {
            $('#menu-dropdown').hide();
        }
    });

    // menu actions
    $(document).on('click', '.menu-item', function() {
        const action = $(this).data('action');
        $('#menu-dropdown').hide();
        if (action === 'notify') notify('Test notification');
        else if (action === 'devtools') {
            if (window.__TAURI_INTERNALS__) {
                window.__TAURI_INTERNALS__.invoke('plugin:webview|internal_toggle_devtools')
                    .catch(() => showToast('Dev Tools not available'));
            } else {
                showToast('Dev Tools requires Tauri');
            }
        }
        else if (action === 'about') showAbout();
        else if (action === 'close') closeApp();
    });

    $('#close').on('click', closeApp);
    $('#version').on('click', showAbout);

    $(document).on('keydown', e => {
        if (e.key === 'n' || e.key === 'N') notify('Test notification');
    });
    popout();
});
