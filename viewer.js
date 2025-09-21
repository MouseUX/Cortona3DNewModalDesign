(function (solo) {
    solo.baseUrl = 'res/';
    solo.use('skin', { baseUrl: 'uniview/src/' });

    const app = solo.skin.create('app');
    const interactivityFile = 'pump-catalog.interactivity.xml';

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

        // ---------------- keep your custom menu ----------------
        const menu = document.createElement('div');
        menu.className = 'custom-menu';
        document.body.appendChild(menu);
        const ul = document.createElement('ul');
        menu.appendChild(ul);
        Array.from(selectEl.options).forEach(opt => {
            const li = document.createElement('li');
            li.textContent = opt.text;
            li.addEventListener('click', () => {
                selectEl.value = opt.value;
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            });
            ul.appendChild(li);
        });

        // ---------- popup UI ----------
        const openBtn = document.createElement('button');
        openBtn.textContent = 'Open Parts List';
        openBtn.className = 'open-parts-btn';
        document.body.appendChild(openBtn);

        const popup = document.createElement('div');
        popup.className = 'parts-popup';
        popup.innerHTML = `
            <div class="popup-content" role="dialog" aria-modal="true">
                <button class="close-popup" title="Close">✖</button>
                <h3>Parts Browser</h3>
                <div class="row">
                    <label for="category-select">Category</label>
                    <select id="category-select"></select>
                </div>
                <div class="row">
                    <input id="parts-search" placeholder="Filter by part number or name" />
                </div>
                <div id="parts-list" class="parts-list" role="list"></div>
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

        // ---------- small CSS so popup & highlight are visible ----------

        // ---------- parse XML: categories (views), parts map, items, and view->refItems ----------
        let categories = [];    // {id, name}
        let partsMap = {};      // partId -> { partNo, description }
        let items = [];         // { id, viewRef(s), itemNo, refPartId, partNo, description }
        let viewItemsMap = {};  // viewId -> Set(itemId)

        fetch(`./data/${interactivityFile}`)
            .then(r => r.text())
            .then(str => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(str, 'application/xml');

                // PARTS: build map from <parts><part id="...">
                Array.from(xml.querySelectorAll('parts > part')).forEach(p => {
                    const id = p.getAttribute('id') || '';
                    const partNo = p.querySelector('metadata value[name="PARTNUMBER"]')?.textContent?.trim() || '';
                    const desc = p.querySelector('metadata value[name="Description"]')?.textContent?.trim() || '';
                    partsMap[id] = { partNo, description: desc };
                });

                // VIEWS: collect only visible views (hidden != "1")
                Array.from(xml.querySelectorAll('views > view')).forEach(v => {
                    const hidden = v.getAttribute('hidden');
                    if (hidden === '1') return; // skip hidden/intermediate views
                    const id = v.getAttribute('id');
                    const name = (v.querySelector('description')?.textContent || v.getAttribute('name') || '').trim();
                    categories.push({ id, name });
                    // build viewItemsMap from refItem entries inside each view
                    const refItems = Array.from(v.querySelectorAll('refItem')).map(r => r.getAttribute('ref')).filter(Boolean);
                    viewItemsMap[id] = new Set(refItems);
                });

                // ITEMS: build list; some items may also have <refview ref="..."> referencing views
                Array.from(xml.querySelectorAll('item')).forEach(it => {
                    const id = it.getAttribute('id') || '';
                    const refPartId = it.getAttribute('refPart') || '';
                    // items can have one or multiple refview entries — collect all refs
                    const refViews = Array.from(it.querySelectorAll('refview')).map(rv => rv.getAttribute('ref')).filter(Boolean);
                    const itemNo = it.querySelector('metadata value[name="ITEM"]')?.textContent?.trim() || '';
                    const cmdDesc = it.querySelector('commands command value[name="Description For Part"]')?.textContent?.trim() || '';
                    const partEntry = partsMap[refPartId] || {};
                    const partNo = partEntry.partNo || refPartId || '';
                    const description = cmdDesc || partEntry.description || '';
                    items.push({ id, refPartId, refViews, itemNo, partNo, description });

                    // If item lists refview(s), also make sure it's included in viewItemsMap
                    refViews.forEach(vId => {
                        if (!viewItemsMap[vId]) viewItemsMap[vId] = new Set();
                        viewItemsMap[vId].add(id);
                    });
                });

                // Populate category select (only visible categories)
                catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name || c.id)}</option>`).join('');
                if (categories.length) {
                    catSelect.value = categories[0].id;
                    renderParts(categories[0].id, '');
                }
            })
            .catch(err => console.error('Error parsing XML:', err));

        // ---------- helper util ----------
        function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[ch])); }
        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        // Wait for toolbar ipc table to render the rows (or a specific refItem to appear)
        function waitForNativeTable(refItem, timeout = 2500) {
            return new Promise(resolve => {
                const start = Date.now();
                const check = () => {
                    if (refItem && document.querySelector(`#toolbar-ipc [refitem="${refItem}"], #toolbar-ipc [data-refitem="${refItem}"]`)) {
                        resolve(true); return;
                    }
                    // any table rows exist under toolbar-ipc? That means table refreshed.
                    if (document.querySelector('#toolbar-ipc table tbody tr, #toolbar-ipc tbody tr')) {
                        resolve(true); return;
                    }
                    if (Date.now() - start > timeout) { resolve(false); return; }
                    requestAnimationFrame(check);
                };
                check();
            });
        }

        // Try likely Cortona API methods to select/highlight an item by refItem
        function tryCortonaApiSelect(refItem) {
            const candidates = [
                'ipcTable.selectItem',
                'ipcTable.selectRow',
                'ipcTable.select',
                'selectItem',
                'selectRow',
                'selectByRefItem',
                'selectIpcItem',
                'selectIPCItem',
                'ipc.selectItem'
            ];

            for (const path of candidates) {
                const parts = path.split('.');
                let holder = app;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!holder) break;
                    holder = holder[parts[i]];
                }
                const fnName = parts[parts.length - 1];
                const fn = holder?.[fnName];
                if (typeof fn === 'function') {
                    try {
                        fn.call(holder, refItem);
                        console.log('Called Cortona API:', path, refItem);
                        return true;
                    } catch (err) {
                        console.warn('API call failed for', path, err);
                    }
                }
            }
            return false;
        }

        // DOM fallback to locate row in native IPC table and click/highlight it
        function domSelectAndHighlight(refItem, matchTextCandidates = []) {
            // clear previous highlights
            Array.from(document.querySelectorAll('#toolbar-ipc .ipc-selection-highlight')).forEach(el => el.classList.remove('ipc-selection-highlight'));

            // try attributes
            const selectors = [
                `#toolbar-ipc [refitem="${refItem}"]`,
                `#toolbar-ipc [data-refitem="${refItem}"]`,
                `#toolbar-ipc tr[refitem="${refItem}"]`,
                `#toolbar-ipc tr[data-refitem="${refItem}"]`
            ];
            for (const s of selectors) {
                const el = document.querySelector(s);
                if (el) {
                    if (typeof el.click === 'function') el.click();
                    el.classList.add('ipc-selection-highlight');
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return true;
                }
            }

            // fallback: text-search within toolbar rows
            const rows = Array.from(document.querySelectorAll('#toolbar-ipc table tbody tr, #toolbar-ipc tbody tr'));
            for (const r of rows) {
                const txt = (r.innerText || '').toLowerCase();
                if (matchTextCandidates.some(c => c && txt.includes(c.toLowerCase()))) {
                    if (typeof r.click === 'function') r.click();
                    r.classList.add('ipc-selection-highlight');
                    r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return true;
                }
            }
            return false;
        }

        // ---------- render filtered parts for a view ----------
        function renderParts(viewId, filter) {
            const q = (filter || '').trim().toLowerCase();
            // collect item ids that belong to this view (from viewItemsMap)
            const idSet = viewItemsMap[viewId] ? new Set(Array.from(viewItemsMap[viewId])) : new Set();
            // also include items that explicitly reference this view via refViews
            items.forEach(it => { if (it.refViews && it.refViews.includes(viewId)) idSet.add(it.id); });

            const list = items.filter(it => idSet.has(it.id));
            const filtered = q ? list.filter(it =>
                (it.partNo && it.partNo.toLowerCase().includes(q)) ||
                (it.description && it.description.toLowerCase().includes(q)) ||
                (it.itemNo && it.itemNo.toLowerCase().includes(q))
            ) : list;

            partsList.innerHTML = '';
            if (!filtered.length) {
                partsList.innerHTML = `<div class="no-results">No parts found.</div>`;
                return;
            }

            const ul = document.createElement('ul');
            filtered.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="item-no">${escapeHtml(p.itemNo)}</span>
                                <span class="part-no">${escapeHtml(p.partNo)}</span>
                                <span class="desc">${escapeHtml(p.description)}</span>`;
                li.addEventListener('click', async () => {
                    // find native select option corresponding to this view and switch it
                    const viewName = (categories.find(c => c.id === viewId)?.name || '').trim();
                    const opt = Array.from(selectEl.options).find(o =>
                        (o.value && o.value.includes(viewId)) ||
                        ((o.text || '').toLowerCase().includes(viewName.toLowerCase()))
                    );
                    if (opt) {
                        selectEl.value = opt.value;
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        console.warn('Could not find select option for view:', viewId, viewName);
                    }

                    // close popup
                    popup.classList.remove('active');

                    // wait for table to update and try select/highlight
                    await waitForNativeTable(p.id, 2000);

                    // 1) try cortona API selection
                    if (tryCortonaApiSelect(p.id)) return;

                    // 2) fallback to DOM selection (by refItem or by text)
                    if (domSelectAndHighlight(p.id, [p.partNo, p.description, p.itemNo])) return;

                    console.warn('Could not programmatically highlight item in native table for', p);
                });
                ul.appendChild(li);
            });
            partsList.appendChild(ul);
        }

        // handlers
        catSelect.addEventListener('change', () => {
            renderParts(catSelect.value, searchInput.value);
        });
        searchInput.addEventListener('input', () => {
            renderParts(catSelect.value, searchInput.value);
        });

        // expose data for debugging
        window.__ipc_helper = { categories, items, partsMap, viewItemsMap };

        console.info('Parts browser ready. I parsed views/items from your IPC XML (hidden views excluded). If a specific view still shows fewer parts than expected, run: console.log(Object.fromEntries(Object.entries(viewItemsMap).map(([k,s])=>[k, s.size])) ) to inspect counts.');

    }).catch(err => {
        console.error('❌ Error loading model:', err);
    });
})(Cortona3DSolo);
