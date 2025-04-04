(function () {
    'use strict';

    const sheetCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQit37A2ahP-Ax3VwhrUIhwDLz3HZnhhnYccvGiV3sgqYj7o5V9nsCVXQ5pfRnnpeVKncYyxn76w-V7/pub?output=csv';

    const normalizeUrl = url => {
        try {
            const u = new URL(url);
            return u.hostname + u.pathname.replace(/\/$/, '');
        } catch (e) {
            return url;
        }
    };

    const fetchBacklinksFromCsv = async () => {
        const res = await fetch(sheetCsvUrl);
        const text = await res.text();
        const lines = text.split('\n').slice(1); // preskočíme hlavičku

        const backlinks = [];

        for (const line of lines) {
            const columns = line.split(',');
            const articleUrl = columns[1]?.trim(); // stĺpec B
            const keyword = columns[2]?.trim();     // stĺpec C

            if (articleUrl && articleUrl.startsWith('http')) {
                backlinks.push({
                    url: normalizeUrl(articleUrl),
                    keyword: keyword || ''
                });
            }
        }

        return backlinks;
    };

    const highlightResults = (backlinks) => {
        const links = document.querySelectorAll('a');

        links.forEach(link => {
            const href = link.href;
            if (!href.startsWith('http') || link.dataset.highlighted) return;

            const norm = normalizeUrl(href);
            const matches = backlinks.filter(bl => norm.includes(bl.url));
            if (matches.length > 0) {
                link.style.backgroundColor = 'rgba(210, 0, 255, 0.37)';
                link.style.border = '2px solid #910073';
                link.title = 'Tento článok obsahuje spätný odkaz';
                link.dataset.highlighted = "true";

                const keywords = matches.map(m => m.keyword).filter(k => k);
                const formattedKeywords = keywords.map(kw => `<strong>${kw}</strong>`).join(', ');
                const keywordTag = document.createElement('div');
                keywordTag.innerHTML = `🔍 kľúčové slová: ${formattedKeywords}`;
                keywordTag.style.fontSize = '15px';
                keywordTag.style.fontStyle = 'italic';
                keywordTag.style.color = 'rgb(176, 0, 255)';
                keywordTag.style.marginTop = '2px';

                if (link.parentElement) {
                    link.parentElement.appendChild(keywordTag);
                }
            }

        });
    };

    const observeResults = (backlinks) => {
        const observer = new MutationObserver(() => {
            setTimeout(() => highlightResults(backlinks), 100); // malý delay
        });


        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Spustíme aj hneď
        highlightResults(backlinks);
    };

    (async () => {
        const backlinks = await fetchBacklinksFromCsv();
        observeResults(backlinks);
    })();
})();
