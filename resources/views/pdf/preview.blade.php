<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>Report preview</title>
    <style>
        body { margin: 0; height: 100vh; height: 100dvh; display: flex; flex-direction: column; background: #f3f4f6; font: 15px system-ui, sans-serif; }
        header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 10px 16px; background: #111827; color: white; }
        nav { display: flex; align-items: center; gap: 12px; }
        a { color: white; }
        button { cursor: pointer; border: 0; border-radius: 8px; padding: 8px 12px; background: #facc15; color: #111827; font: inherit; font-weight: 700; }
        iframe { flex: 1; width: 100%; min-height: 0; border: 0; }
        p { margin: 0; padding: 8px 16px; }
    </style>
</head>
<body>
    @php($pdfUrl = request()->fullUrlWithoutQuery('preview'))
    <header>
        <strong>Report preview</strong>
        <nav aria-label="Report actions">
            <a href="{{ $pdfUrl }}" download>Download PDF</a>
            <button id="close-report" type="button">Close tab</button>
        </nav>
    </header>
    <p id="close-help" role="status" hidden>Use your browser’s tab controls to close this preview.</p>
    <iframe src="{{ $pdfUrl }}" title="PDF report"></iframe>
    <script>
        document.getElementById('close-report').addEventListener('click', () => {
            window.close();
            document.getElementById('close-help').hidden = false;
        });
    </script>
</body>
</html>
