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

        // ---------- keep your custom menu (unchanged) ----------
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

        // ---------- popup button + DOM ----------
        const openBtn = document.createElement('button');
        openBtn.textContent = 'Open Parts List';
        openBtn.className = 'open-parts-btn';
        document.body.appendChild(openBtn);

        const popup = document.createElement('div');
        popup.className = 'parts-popup'; // we'll toggle .active
        popup.innerHTML = `
            <div class="popup-content">
                <button class="close-popup" title="Close">✖</button>
                <h3>Parts Browser</h3>
                <div class="row">
                    <label>Category</label>
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

        // click outside to close
        popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.classList.remove('active');
        });

        // ---------- minimal CSS injected so popup actually appears ----------
        const css = `
.parts-popup{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10000;background:#fff;border:1px solid #ccc;box-shadow:0 6px 20px rgba(0,0,0,0.15);padding:14px;max-width:720px;width:90%;display:none;max-height:70vh;overflow:auto;font-family:Arial,Helvetica,sans-serif}
.parts-popup.active{display:block}
.parts-popup .popup-content{position:relative}
.parts-popup .close-popup{position:absolute;right:8px;top:8px;border:0;background:transparent;font-size:16px;cursor:pointer}
.parts-popup .row{margin:8px 0;display:flex;gap:8px;align-items:center}
.parts-popup input#parts-search{flex:1;padding:6px;border:1px solid #bbb;border-radius:4px}
.parts-list ul{list-style:none;padding:0;margin:8px 0}
.parts-list li{display:flex;gap:12px;padding:8px;border-bottom:1px solid #eee;cursor:pointer;align-items:center}
.parts-list li:hover{background:#f6f6f6}
.parts-list .item-no{width:48px;flex:0 0 48px;font-weight:700}
.parts-list .part-no{background:#f0f0f0;padding:4px 6px;border-radius:4px;font-size:12px}
.parts-list .desc{flex:1}
.parts-list .no-results{padding:10px;color:#666}
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        // ---------- parse XML (views, parts, items) ----------
        let categories = [];   // {id, name}
        let partsMap = {};     // partId -> { partNo, description }
        let items = [];        // { id (item id), viewRef, itemNo, description, partNo, refPart }

        fetch(`./data/${interactivityFile}`)
            .then(r => r.text())
            .then(str => {
                const parser = new DOMParser();
                const xml = parser.parseFromString(str, 'application/xml');

                // parts map (parts section provides actual PARTNUMBER / Description)
                const partNodes = Array.from(xml.querySelectorAll('parts > part'));
                partNodes.forEach(p => {
                    const id = p.getAttribute('id') || '';
                    const partDesc = p.querySelector('metadata value[name="Description"]')?.textContent?.trim() || '';
                    const partNum = p.querySelector('metadata value[name="PARTNUMBER"]')?.textContent?.trim()
                        || p.querySelector('metadata value[name="PARTNUMBER"]')?.textContent?.trim()
                        || '';
                    partsMap[id] = { partNo: partNum, description: partDesc };
                });

                // categories: views are under <views><view><description>...</description></view></views>
                const viewNodes = Array.from(xml.querySelectorAll('views > view'));
                categories = viewNodes.map(v => {
                    return {
                        id: v.getAttribute('id'),
                        name: (v.querySelector('description')?.textContent || v.getAttribute('name') || v.getAttribute('title') || '').trim()
                    };
                });

                // items: each <item> has refview (view id), refPart (part id), metadata ITEM, commands->value[name="Description For Part"]
                const itemNodes = Array.from(xml.querySelectorAll('item'));
                items = itemNodes.map(it => {
                    const id = it.getAttribute('id') || '';
                    const viewRef = it.querySelector('refview')?.getAttribute('ref') || '';
                    const itemNo = it.querySelector('metadata value[name="ITEM"]')?.textContent?.trim() || '';
                    const refPartId = it.getAttribute('refPart') || '';
                    const cmdDesc = it.querySelector('commands command value[name="Description For Part"]')?.textContent?.trim() || '';
                    const partEntry = partsMap[refPartId] || {};
                    const partNo = partEntry.partNo || refPartId || '';
                    const description = cmdDesc || partEntry.description || '';
                    return { id, viewRef, itemNo, refPartId, partNo, description };
                });

                // populate category select
                catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${escapeHtml(c.name || c.id)}</option>`).join('');
                if (categories.length) {
                    catSelect.value = categories[0].id;
                    renderParts(categories[0].id, '');
                }
            })
            .catch(err => {
                console.error('Error parsing XML:', err);
            });

        // ---------- render & filter functions ----------
        function normalizeForSearch(s) { return (s || '').toLowerCase(); }
        function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[ch])); }

        function renderParts(viewId, filter) {
            const query = (filter || '').trim().toLowerCase();
            const list = items.filter(it => it.viewRef === viewId);
            const filtered = query ? list.filter(it =>
                (it.partNo && it.partNo.toLowerCase().includes(query)) ||
                (it.description && it.description.toLowerCase().includes(query)) ||
                (it.itemNo && it.itemNo.toLowerCase().includes(query))
            ) : list;

            partsList.innerHTML = '';
            if (!filtered.length) {
                partsList.innerHTML = `<div class="no-results">No parts found.</div>`;
                return;
            }

            const ul = document.createElement('ul');
            filtered.forEach(p => {
                const li = document.createElement('li');
                // item number | part number | description (separated visually)
                li.innerHTML = `<span class="item-no">${escapeHtml(p.itemNo)}</span>
                                <span class="part-no">${escapeHtml(p.partNo)}</span>
                                <span class="desc">${escapeHtml(p.description)}</span>`;
                li.addEventListener('click', () => {
                    // switch native #toolbar-ipc select to view that contains this part
                    const viewName = (categories.find(c => c.id === viewId)?.name || '').trim();
                    // try to find option by value includes viewId OR text includes viewName
                    const opt = Array.from(selectEl.options).find(o =>
                        (o.value && o.value.includes(viewId)) ||
                        ((o.text || '').toLowerCase().includes(viewName.toLowerCase()))
                    );
                    if (opt) {
                        selectEl.value = opt.value;
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                    } else {
                        // fallback: try find by text match (loose)
                        const loose = Array.from(selectEl.options).find(o => (o.text || '').toLowerCase().includes(viewName.toLowerCase().split(' ')[0] || ''));
                        if (loose) {
                            selectEl.value = loose.value;
                            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                        } else {
                            console.warn('Could not find matching select option for view:', viewId, viewName);
                        }
                    }
                    // close popup
                    popup.classList.remove('active');
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

    }).catch(err => {
        console.error('❌ Error loading model:', err);
    });
})(Cortona3DSolo);
