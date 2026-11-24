<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>Report preview</title>
    <style>
        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body { margin: 0; display: flex; flex-direction: column; background: #e5e7eb; font: 15px system-ui, sans-serif; color: #111827; }
        header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; background: #111827; color: #fff; padding-top: max(8px, env(safe-area-inset-top)); }
        header strong { font-size: 14px; white-space: nowrap; }
        .bar { display: flex; align-items: center; gap: 6px; }
        .count { min-width: 64px; text-align: center; font-size: 12px; color: #d1d5db; }
        a.btn, button { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; height: 40px; padding: 0 12px; border: 0; border-radius: 10px; background: #facc15; color: #111827; font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
        button.ghost { background: #374151; color: #fff; }
        button:disabled { opacity: .4; }
        #pages { flex: 1; min-height: 0; overflow: auto; -webkit-overflow-scrolling: touch; padding: 10px 8px 28px; }
        #list { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; width: max-content; min-width: 100%; }
        .page { background: #fff; box-shadow: 0 2px 10px rgba(0, 0, 0, .25); margin: 0 auto; }
        .page canvas { display: block; width: 100%; height: auto; }
        #status { padding: 40px 20px; text-align: center; color: #374151; }
        #status a { color: #1d4ed8; font-weight: 700; }
        @media (max-width: 520px) { header strong { display: none; } .hide-sm { display: none !important; } }
    </style>
</head>
<body>
    @php($pdfUrl = request()->fullUrlWithoutQuery('preview'))
    <header>
        <strong>Report preview</strong>
        <div class="bar" role="toolbar" aria-label="Report controls">
            <button id="zoom-out" class="ghost" type="button" aria-label="Zoom out">−</button>
            <span id="count" class="count" role="status">Loading…</span>
            <button id="zoom-in" class="ghost" type="button" aria-label="Zoom in">+</button>
        </div>
        <div class="bar">
            <a class="btn" href="{{ $pdfUrl }}" download>Save PDF</a>
            <button id="close-report" class="ghost hide-sm" type="button">Close</button>
        </div>
    </header>

    <div id="pages">
        <p id="status">Opening report…</p>
        <div id="list"></div>
    </div>

    <script src="/vendor/pdfjs/pdf.min.js"></script>
    <script>
    (function () {
        var url = @json($pdfUrl);
        var statusEl = document.getElementById('status');
        var listEl = document.getElementById('list');
        var scroller = document.getElementById('pages');
        var countEl = document.getElementById('count');
        var zoomIn = document.getElementById('zoom-in');
        var zoomOut = document.getElementById('zoom-out');
        var STEPS = [1, 1.5, 2, 3];
        var step = 0, doc = null, pages = [], token = 0, timer = null;

        document.getElementById('close-report').addEventListener('click', function () {
            window.close();
            if (history.length > 1) history.back();
        });

        function fail(msg) {
            statusEl.hidden = false;
            statusEl.innerHTML = msg + '<br><br><a href="' + url + '">Open the PDF directly</a>';
            countEl.textContent = '';
        }

        if (!window.pdfjsLib) { fail('The report viewer could not be loaded.'); return; }
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js';

        // page width at zoom 1: fills the screen (a little margin), never wider than a desktop page
        function baseWidth() { return Math.min(scroller.clientWidth - 16, 900); }

        function layout() {
            var w = baseWidth() * STEPS[step];
            pages.forEach(function (p) {
                p.box.style.width = w + 'px';
                p.box.style.height = Math.round(w * p.ratio) + 'px';
            });
            zoomOut.disabled = step === 0;
            zoomIn.disabled = step === STEPS.length - 1;
        }

        function draw() {
            var my = ++token;
            var w = baseWidth() * STEPS[step];
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            // sharp enough to read when zoomed, but capped so phones keep enough memory
            var target = Math.min(w * dpr * 1.5, 2400);
            var chain = Promise.resolve();
            pages.forEach(function (p) {
                chain = chain.then(function () {
                    if (my !== token) return;
                    var vp1 = p.page.getViewport({ scale: 1 });
                    var vp = p.page.getViewport({ scale: target / vp1.width });
                    var canvas = document.createElement('canvas');
                    canvas.width = Math.round(vp.width);
                    canvas.height = Math.round(vp.height);
                    return p.page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise.then(function () {
                        if (my !== token) return;
                        p.box.innerHTML = '';
                        p.box.appendChild(canvas);
                    });
                });
            });
        }

        function setStep(n) {
            step = Math.max(0, Math.min(STEPS.length - 1, n));
            layout();
            clearTimeout(timer);
            timer = setTimeout(draw, 150);
        }
        zoomIn.addEventListener('click', function () { setStep(step + 1); });
        zoomOut.addEventListener('click', function () { setStep(step - 1); });

        var lastWidth = scroller.clientWidth;
        window.addEventListener('resize', function () {
            if (scroller.clientWidth === lastWidth) return;
            lastWidth = scroller.clientWidth;
            setStep(step);
        });

        // "Page x / n" follows the scroll position
        scroller.addEventListener('scroll', function () {
            if (!pages.length) return;
            var mid = scroller.scrollTop + scroller.clientHeight / 2, current = 1;
            pages.forEach(function (p, i) { if (p.box.offsetTop <= mid) current = i + 1; });
            countEl.textContent = current + ' / ' + pages.length;
        }, { passive: true });

        pdfjsLib.getDocument({ url: url, withCredentials: true }).promise.then(function (pdf) {
            doc = pdf;
            var jobs = [];
            for (var n = 1; n <= pdf.numPages; n++) jobs.push(pdf.getPage(n));
            return Promise.all(jobs);
        }).then(function (all) {
            statusEl.hidden = true;
            all.forEach(function (page) {
                var vp = page.getViewport({ scale: 1 });
                var box = document.createElement('div');
                box.className = 'page';
                listEl.appendChild(box);
                pages.push({ page: page, box: box, ratio: vp.height / vp.width });
            });
            countEl.textContent = '1 / ' + pages.length;
            layout();
            draw();
        }).catch(function () {
            fail('The report could not be opened here.');
        });
    })();
    </script>
</body>
</html>
