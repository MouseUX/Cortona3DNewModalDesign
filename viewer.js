(function (solo) {
    solo.baseUrl = 'res/';
    solo.use('skin', { baseUrl: 'uniview/src/' });

    const app = solo.skin.create('app');
    // const interactivityFile = 'Untitled.interactivity.xml';
    const interactivityFile = 'Buchna.interactivity.xml';

    app.use('solo-uniview', {
        baseUrl: 'uniview/src/',
        src: `./data/${interactivityFile}`,
        totalMemory: 64
    }).then(() => {
        console.log('✅ Model loaded');

        const selectEl = document.querySelector('#toolbar-ipc select');
        if (!selectEl) {
            console.error('❌ Could not find #toolbar-ipc select.');
            return;
        }

        // ---------------- Custom menu ----------------

        // const chevron = document.createElement('button');
        const menu = document.createElement('div');
        const menuHeader = document.createElement('div');
        const main = document.querySelector('main');
        menuHeader.className = 'custom-menu-header';
        menu.className = 'custom-menu';
        // chevron.className = 'custom-menu-button';
        // chevron.innerHTML = '<span>⬅️</span>';
        // menu.appendChild(chevron);
        menu.appendChild(menuHeader);
        main.prepend(menu);
        const ul = document.createElement('ul');
        menu.appendChild(ul);
        Array.from(selectEl.options).forEach((opt, index) => {
            const li = document.createElement('li');
            li.textContent = opt.text;
            li.dataset.value = opt.value;
            if (index === 0) li.classList.add('active');
            li.addEventListener('click', () => {
                selectEl.value = opt.value;
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            });
            ul.appendChild(li);
        });
        const allLi = document.querySelectorAll('.custom-menu li');
        allLi.forEach(i => {
            i.addEventListener('click', function (e) {
                allLi.forEach(j => j.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        // chevron.addEventListener('click', function (e) {
        //     e.preventDefault();
        //     chevron.classList.toggle('open');
        //     chevron.textContent = '➡️';
        //     console.log('test');
        // });

        // ---------------- Popup UI ----------------
        // const topRightItems = document.querySelector('#toolbar-dpl .right.skin-container');
        const openBtn = document.createElement('button');
        openBtn.innerText = '🔍';
        openBtn.className = 'open-parts-btn';
        menuHeader.appendChild(openBtn);

        const popup = document.createElement('div');
        popup.className = 'parts-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <button class="close-popup">✖</button>
                <h3>חיפוש חלקים</h3>
                <div class="row">
                    <label for="category-select">קטגוריה</label>
                    <select id="category-select"></select>
                </div>
                <div class="row">
                    <input id="parts-search" placeholder="חיפוש לפי שם חלק או מקט" />
                </div>
                <div id="parts-list" class="parts-list"></div>
            </div>
        `;
        document.body.appendChild(popup);

        const closeBtn = popup.querySelector('.close-popup');
        const catSelect = popup.querySelector('#category-select');
        const searchInput = popup.querySelector('#parts-search');
        const partsList = popup.querySelector('#parts-list');

        openBtn.addEventListener('click', () => {
            popup.classList.add('active');
            searchInput.focus();
        });
        closeBtn.addEventListener('click', () => popup.classList.remove('active'));
        popup.addEventListener('click', e => { if (e.target === popup) popup.classList.remove('active'); });

        // ---------------- Data parsing ----------------
        let categories = [];
        let partsMap = {};
        let items = [];
        let viewItemsMap = {};

        function escapeHtml(s) {
            return (s || '').replace(/[&<>"']/g, ch => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[ch]));
        }

        fetch(`./data/${interactivityFile}`)
            .then(r => r.text())
            .then(str => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(str, 'application/xml');

                xml.querySelectorAll('parts > part').forEach(p => {
                    const id = p.getAttribute('id') || '';
                    const partNo = p.querySelector('metadata value[name="PARTNUMBER"]')?.textContent?.trim() || '';
                    const desc = p.querySelector('metadata value[name="Description"]')?.textContent?.trim() || p.querySelector('metadata value[name="תיאור"]')?.textContent?.trim() || '';
                    partsMap[id] = { partNo, description: desc };
                });

                // Step 1: Build the complete viewItemsMap (same as before)
                xml.querySelectorAll('views > view').forEach(v => {
                    if (v.getAttribute('hidden') === '1') return;
                    const id = v.getAttribute('id');
                    const name = (v.querySelector('description')?.textContent || v.getAttribute('name') || '').trim();
                    categories.push({ id, name });
                    const refItems = Array.from(v.querySelectorAll('refItem')).map(r => r.getAttribute('ref')).filter(Boolean);
                    viewItemsMap[id] = new Set(refItems);
                });

                let rawItems = []; // Use a temporary array first
                xml.querySelectorAll('item').forEach(it => {
                    const id = it.getAttribute('id') || '';
                    const refPartId = it.getAttribute('refPart') || '';
                    const refViews = Array.from(it.querySelectorAll('refview')).map(rv => rv.getAttribute('ref')).filter(Boolean);
                    const itemNo = it.querySelector('metadata value[name="ITEM"]')?.textContent?.trim() || '';
                    const cmdDesc = it.querySelector('commands command value[name="Description For Part"]')?.textContent?.trim() || '';
                    const partEntry = partsMap[refPartId] || {};
                    const partNo = partEntry.partNo || refPartId || '';
                    const description = cmdDesc || partEntry.description || '';
                    rawItems.push({ id, refPartId, refViews, itemNo, partNo, description });
                    refViews.forEach(vId => {
                        if (!viewItemsMap[vId]) viewItemsMap[vId] = new Set();
                        viewItemsMap[vId].add(id);
                    });
                });

                // Step 2: Create the reverse map (item -> views) (same as before)
                const itemToViewsMap = {};
                for (const viewId of Object.keys(viewItemsMap)) {
                    for (const itemId of viewItemsMap[viewId]) {
                        if (!itemToViewsMap[itemId]) itemToViewsMap[itemId] = [];
                        itemToViewsMap[itemId].push(viewId);
                    }
                }

                // Step 3: THE KEY CHANGE - "Explode" the items into a new list.
                // Each entry in this new list represents a unique item-in-view combination.
                const itemsInViewContext = [];
                rawItems.forEach(item => {
                    const allViews = itemToViewsMap[item.id] || [];
                    if (allViews.length > 0) {
                        allViews.forEach(viewId => {
                            // Create a new, distinct object for each view context
                            itemsInViewContext.push({
                                ...item, // Copy original properties (id, partNo, etc.)
                                contextualViewId: viewId, // Add the specific view for this instance
                            });
                        });
                    } else {
                        // Fallback for items with no view (should be rare)
                        itemsInViewContext.push({ ...item, contextualViewId: null });
                    }
                });

                // Overwrite the global 'items' array with our new, more detailed list.
                items = itemsInViewContext;

                // Populate UI
                catSelect.innerHTML = categories.map(c =>
                    `<option value="${c.id}">${escapeHtml(c.name || c.id)}</option>`
                ).join('');
                if (categories.length) {
                    catSelect.value = categories[0].id;
                    renderParts(categories[0].id, '');
                }
            });
        // ---------------- Render list ----------------
        function renderParts(viewId, filter) {
            const q = (filter || '').trim().toLowerCase();
            let list = [];

            if (q) {
                // Search logic now filters our new "exploded" list.
                // This will naturally find multiple entries for the same part if it's in multiple views.
                list = items.filter(it =>
                    (it.partNo && it.partNo.toLowerCase().includes(q)) ||
                    (it.description && it.description.toLowerCase().includes(q)) ||
                    (it.itemNo && it.itemNo.toLowerCase().includes(q))
                );
            } else {
                // Browsing by category is now a simple filter on the item's specific view context.
                list = items.filter(it => it.contextualViewId === viewId);
            }

            partsList.innerHTML = '';
            if (!list.length) {
                partsList.innerHTML = `<div class="no-results">לא נמצאו פריטים.</div>`;
                return;
            }

            const ul = document.createElement('ul');
            list.forEach(p => {
                // Find the view name using the item's specific contextualViewId
                const viewName = categories.find(c => c.id === p.contextualViewId)?.name || p.contextualViewId || '';

                const li = document.createElement('li');
                li.innerHTML = `
            <span class="item-no">${escapeHtml(p.itemNo || '-')}</span>
            <span class="part-no">${escapeHtml(p.partNo || '-')}</span>
            <span class="desc">${escapeHtml(p.description || '')}</span>
            <span class="view-badge">[${escapeHtml(viewName)}]</span>
        `; // The view badge is now always shown for clarity

                li.addEventListener('click', () => {
                    // The click logic is now dead simple: the target view is the item's contextual view.
                    const targetViewId = p.contextualViewId;
                    if (!targetViewId) return; // Do nothing if item has no view context

                    const opt = Array.from(selectEl.options).find(o => o.value === targetViewId);
                    if (opt) {
                        selectEl.value = opt.value;
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    // Highlighting the IPC table row (using the original item id 'p.id')
                    const row = document.querySelector(`#dpl-table tr[data-ref="${p.id}"]`);
                    if (row) {
                        document.querySelectorAll('#toolbar-ipc .ipc-selection-highlight')
                            .forEach(el => el.classList.remove('ipc-selection-highlight'));
                        row.classList.add('ipc-selection-highlight');
                        if (typeof row.click === 'function') row.click();
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }

                    if (app.ipcTable && typeof app.ipcTable.selectItem === 'function') {
                        app.ipcTable.selectItem(p.id);
                    } else if (typeof Cortona3DSolo.selectItemById === 'function') {
                        Cortona3DSolo.selectItemById(p.id);
                    }

                    // Update custom menu active state
                    const menuItems = document.querySelectorAll('.custom-menu li');
                    menuItems.forEach(li => li.classList.remove('active'));
                    const targetLi = document.querySelector(`.custom-menu li[data-value="${targetViewId}"]`);
                    if (targetLi) targetLi.classList.add('active');

                    popup.classList.remove('active');
                });

                ul.appendChild(li);
            });

            partsList.appendChild(ul);
        }


        // Handlers
        catSelect.addEventListener('change', () => renderParts(catSelect.value, searchInput.value));
        searchInput.addEventListener('input', () => renderParts(catSelect.value, searchInput.value));

        // ==========================================================
        //  Simple PDF Export (Hebrew with Heebo font)
        // ==========================================================
        const pdfBtn = document.createElement('button');
        pdfBtn.innerText = '📄 ייצוא ל- PDF';
        pdfBtn.className = 'export-pdf-btn';
        menuHeader.appendChild(pdfBtn);

        pdfBtn.addEventListener('click', async () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            try {
                // Prefer local TTF if available; fallback to remote
                async function loadHeeboBase64() {
                    const toBase64 = (buffer) => btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                    // Try common local filenames first to avoid CORS (check both res/ and fonts/)
                    const localCandidates = [
                        './fonts/Heebo/Heebo-Regular.ttf',
                        './fonts/Heebo/Heebo-VariableFont_wght.ttf',
                        '/fonts/Heebo/Heebo-Regular.ttf',
                        '/fonts/Heebo/Heebo-VariableFont_wght.ttf'
                    ];
                    for (const url of localCandidates) {
                        const res = await fetch(url);
                        if (res.ok) return toBase64(await res.arrayBuffer());
                    }
                }

                const fontBase64 = await loadHeeboBase64();

                doc.addFileToVFS('Heebo-Regular.ttf', fontBase64);
                doc.addFont('Heebo-Regular.ttf', 'Heebo', 'normal');
                doc.setFont('Heebo');
                doc.setR2L(true);

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const rightMargin = 20;
                const topMargin = 20;
                const lineHeight = 7;
                const headerGap = 10;
                const footerGap = 10;
                const contentTop = topMargin + 12 + headerGap;
                const contentBottom = pageHeight - footerGap;

                function drawHeader(title) {
                    doc.setFontSize(16);
                    doc.text(title, pageWidth - rightMargin, topMargin, { align: 'right' });
                    doc.setFontSize(10);

                }

                function ensureSpace(currentY, needed = lineHeight) {
                    if (currentY + needed > contentBottom) {
                        doc.addPage();
                        drawHeader(currentHeader);
                        return contentTop;
                    }
                    return currentY;
                }

                // Group items by category (contextualViewId)
                const viewIdToName = Object.fromEntries(categories.map(c => [c.id, c.name || c.id]));
                const itemsByCategory = {};
                items.forEach(p => {
                    const key = p.contextualViewId || 'UNCATEGORIZED';
                    if (!itemsByCategory[key]) itemsByCategory[key] = [];
                    itemsByCategory[key].push(p);
                });

                let y = contentTop;
                let currentHeader = '';
                const orderedCategories = categories.map(c => c.id).filter(id => itemsByCategory[id] && itemsByCategory[id].length);
                if (!orderedCategories.length && items.length) {
                    orderedCategories.push('UNCATEGORIZED');
                }

                orderedCategories.forEach((catId, index) => {
                    currentHeader = catId === 'UNCATEGORIZED' ? 'ללא קטגוריה' : (viewIdToName[catId] || catId);
                    if (index > 0) {
                        doc.addPage();
                    }
                    drawHeader(currentHeader);
                    y = contentTop;

                    // Optional column titles per category
                    const titleLine = 'פריט | מספר פריט | תיאור';
                    doc.setFontSize(11);
                    doc.text(titleLine, pageWidth - rightMargin, y, { align: 'right' });
                    doc.setFontSize(10);
                    y += lineHeight + 2;

                    itemsByCategory[catId].forEach(p => {
                        y = ensureSpace(y);
                        const line = `${p.itemNo || '-'} | ${p.partNo || '-'} | ${p.description || ''}`;
                        doc.text(line, pageWidth - rightMargin, y, { align: 'right' });
                        y += lineHeight;
                    });
                });

                const pdfBlob = doc.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, '_blank');
            } catch (err) {
                console.error('❌ PDF generation failed:', err);
            }
        });

    }).catch(err => {
        console.error('❌ Error loading model:', err);
    });
})(Cortona3DSolo);
