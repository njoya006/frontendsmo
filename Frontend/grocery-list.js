(function(){
    // Simple grocery list UI integration
    const apiBase = (typeof window !== 'undefined' && typeof window.getChopsmoApiBaseUrl === 'function')
        ? window.getChopsmoApiBaseUrl()
        : ((typeof window !== 'undefined' && window.CHOPSMO_CONFIG && window.CHOPSMO_CONFIG.API_BASE_URL)
            ? window.CHOPSMO_CONFIG.API_BASE_URL
            : 'https://api.chopsmo.site');
    const normalizedApiBase = apiBase.replace(/\/$/, '');
    const generateBtn = document.getElementById('generateBtn');
    const csvBtn = document.getElementById('csvBtn');
    const resultsInner = document.getElementById('resultsInner');
    const startInput = document.getElementById('start');
    const endInput = document.getElementById('end');
    const idsInput = document.getElementById('ids');
    const servingsInput = document.getElementById('servings');
    const groupBySelect = document.getElementById('groupBySelect');
    const collapseAllBtn = document.getElementById('collapseAllBtn');

    function showToast(msg, timeout=3000) {
        const root = document.getElementById('toastRoot');
        root.innerHTML = `<div class="toast">${msg}</div>`;
        setTimeout(()=> root.innerHTML = '', timeout);
    }

    function buildUrl() {
        const params = new URLSearchParams();
        const ids = idsInput.value.trim();
        const start = startInput.value;
        const end = endInput.value;
        const servings = servingsInput.value;
        if (ids) params.set('ids', ids);
        if (start) params.set('start', start);
        if (end) params.set('end', end);
        if (servings) params.set('servings', servings);
    return `${normalizedApiBase}/api/planner/meal-plan/grocery-list/?${params.toString()}`;
    }

    function renderList(data) {
        if (!data || !data.items) {
            resultsInner.innerHTML = '<p class="muted">No items returned.</p>';
            csvBtn.disabled = true;
            return;
        }
        window._lastGrocery = data;
        csvBtn.disabled = false;
        let html = `<div class="meta"><div><strong>Total items:</strong> ${data.items.length}</div><div class="muted">${data.meta?.range || ''}</div></div>`;
        html += '<div style="overflow:auto"><table><thead><tr><th>Ingredient</th><th>Unit</th><th>Total Quantity</th><th>Recipes</th></tr></thead><tbody>';
        data.items.forEach(item => {
            const recipes = (item.recipes || []).map(r => r.title || r.name).join(', ');
            html += `<tr><td>${item.name}</td><td>${item.unit || ''}</td><td>${item.quantity || ''}</td><td>${recipes}</td></tr>`;
        });
        html += '</tbody></table></div>';
        resultsInner.innerHTML = html;
    }

    function renderGrouped(data, groupBy) {
        if (!data || !data.items) return renderList(data);
        // Simple grouping by data.items[].category if present
        const groups = {};
        data.items.forEach(item => {
            const key = (item.category || 'Ungrouped');
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        let html = '';
        Object.keys(groups).forEach((key, idx) => {
            const gid = `group_${idx}`;
            html += `<div class="group-section card"><div class="group-header"><strong>${key} (${groups[key].length})</strong><button class="group-toggle" data-target="${gid}">Toggle</button></div><div id="${gid}"><table><thead><tr><th>Ingredient</th><th>Unit</th><th>Total</th></tr></thead><tbody>`;
            groups[key].forEach(i => {
                html += `<tr><td>${i.name}</td><td>${i.unit||''}</td><td>${i.quantity}</td></tr>`;
            });
            html += `</tbody></table></div></div>`;
        });
        resultsInner.innerHTML = html;
        // Attach toggles
        document.querySelectorAll('.group-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = document.getElementById(e.target.dataset.target);
                if (!target) return;
                target.style.display = target.style.display === 'none' ? '' : 'none';
            });
        });
    }

    async function fetchAndRender() {
        const url = buildUrl();
        showToast('Generating grocery list...', 2000);
        resultsInner.innerHTML = '<p class="muted">Loading...</p>';
        csvBtn.disabled = true;
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            // For GET requests avoid sending Content-Type; use Accept instead
            const headers = { 'Accept': 'application/json' };
            if (token) {
                // If token already contains a scheme (e.g. "Token ..." or "Bearer ..."), use it as-is.
                if (token.includes(' ')) {
                    headers['Authorization'] = token;
                } else if (token.split('.').length === 3) {
                    // Likely a JWT
                    headers['Authorization'] = `Bearer ${token}`;
                } else {
                    // Fallback to Token scheme used by some backends
                    headers['Authorization'] = `Token ${token}`;
                }
            }

            console.log('grocery-list: Fetching URL', url, 'with headers', headers);
            const res = await fetch(url, { method: 'GET', headers });

            if (!res.ok) {
                // Try to parse JSON error, fallback to text
                let errBody;
                try {
                    errBody = await res.json();
                } catch (jsonErr) {
                    errBody = await res.text().catch(() => 'Unable to read response body');
                }

                console.error('grocery-list: API error', res.status, errBody);
                const detail = (errBody && (errBody.detail || errBody.error || errBody.message)) || JSON.stringify(errBody);
                resultsInner.innerHTML = `<p class="muted">Error ${res.status}: ${detail}</p>`;
                showToast(`Failed to generate grocery list (${res.status})`, 4000);
                return;
            }

            const data = await res.json();

            // Render grouped view if selected
            window._lastGrocery = data;
            if (groupBySelect && groupBySelect.value === 'category') {
                renderGrouped(data, 'category');
            } else {
                renderList(data);
            }

            showToast('Grocery list generated', 2000);
            // store last result for CSV
            window._lastGrocery = data;
        } catch (e) {
            console.error('grocery-list: Network or script error', e);
            resultsInner.innerHTML = `<p class="muted">Network error: ${e.message}</p>`;
            showToast('Network error', 3000);
        }
    }

    function toCSV(data) {
        if (!data || !data.items) return '';
        const rows = [];
        rows.push(['ingredient','unit','total_quantity','recipes']);
        data.items.forEach(i => {
            const recipes = (i.recipes || []).map(r => r.title || r.name).join(' | ');
            rows.push([i.name, i.unit || '', i.quantity || '', recipes]);
        });
        return rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    }

    csvBtn.addEventListener('click', ()=>{
        const csv = toCSV(window._lastGrocery);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grocery-list-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    generateBtn.addEventListener('click', fetchAndRender);

    collapseAllBtn.addEventListener('click', ()=>{
        const all = document.querySelectorAll('[id^="group_"]');
        let anyOpen = false;
        all.forEach(el => { if (el.style.display !== 'none') anyOpen = true; });
        all.forEach(el => el.style.display = anyOpen ? 'none' : '');
        collapseAllBtn.textContent = anyOpen ? 'Expand All' : 'Collapse All';
    });

    groupBySelect.addEventListener('change', ()=>{
        const groupBy = groupBySelect.value;
        const lastData = window._lastGrocery;
        if (!lastData) return;
        if (groupBy === 'category') renderGrouped(lastData, groupBy);
        else renderList(lastData);
    });

    // Prefill from URL params and optionally auto-generate or open CSV
    (function initFromUrl() {
        try {
            const params = new URLSearchParams(window.location.search);
            const start = params.get('start');
            const end = params.get('end');
            const ids = params.get('ids');
            const servings = params.get('servings');
            const format = params.get('format'); // e.g. csv

            if (start) startInput.value = start;
            if (end) endInput.value = end;
            if (ids) idsInput.value = ids;
            if (servings) servingsInput.value = servings;

            // If user requested CSV directly and we have criteria, open CSV from server
            if (format && format.toLowerCase() === 'csv' && (ids || start || end)) {
                const csvParams = new URLSearchParams();
                if (ids) csvParams.set('ids', ids);
                if (start) csvParams.set('start', start);
                if (end) csvParams.set('end', end);
                if (servings) csvParams.set('servings', servings);
                csvParams.set('format', 'csv');
                const csvUrl = `${normalizedApiBase}/api/planner/meal-plan/grocery-list/?${csvParams.toString()}`;
                // open CSV in new tab so browser downloads or displays it
                window.open(csvUrl, '_blank');
                return;
            }

            // If page has query params (start/ids), auto-generate grocery list for convenience
            if (ids || (start && end)) {
                // small delay to allow UI to render
                setTimeout(() => {
                    fetchAndRender();
                }, 250);
            }
        } catch (e) {
            console.warn('grocery-list: initFromUrl error', e);
        }
    })();

})();
