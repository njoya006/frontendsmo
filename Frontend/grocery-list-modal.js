(function(){
    // Modal implementation embedded into MealPlans page
    // This file should be loaded on MealPlans.html to provide in-place grocery list generation
    const API_BASE = 'https://njoya.pythonanywhere.com';

    // Create modal HTML and append to body
    function createModal() {
        if (document.getElementById('groceryModal')) return; // already created
        const modal = document.createElement('div');
        modal.id = 'groceryModal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" id="groceryModalContent" style="max-width:900px; width:90%;">
                <div class="modal-header">
                    <h2>Grocery List</h2>
                    <button id="closeGroceryModal" class="close">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
                        <div style="flex:1;min-width:160px;">
                            <label class="muted">Start</label>
                            <input id="modalStart" type="date" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e6eef7" />
                        </div>
                        <div style="flex:1;min-width:160px;">
                            <label class="muted">End</label>
                            <input id="modalEnd" type="date" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e6eef7" />
                        </div>
                        <div style="min-width:200px;flex:1;">
                            <label class="muted">Meal plan IDs (optional)</label>
                            <input id="modalIds" type="text" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e6eef7" placeholder="12,13" />
                        </div>
                        <div style="width:120px;">
                            <label class="muted">Servings</label>
                            <input id="modalServings" type="number" min="1" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e6eef7" />
                        </div>
                        <div style="display:flex;align-items:flex-end;gap:8px;">
                            <button id="modalGenerateBtn" class="btn">Generate</button>
                            <button id="modalCsvBtn" class="btn secondary" disabled>Download CSV</button>
                        </div>
                    </div>
                    <div id="modalResults" class="card">
                        <div id="modalResultsInner"><p class="muted">No grocery list generated.</p></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close handler
        document.getElementById('closeGroceryModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Generate handler
        document.getElementById('modalGenerateBtn').addEventListener('click', async () => {
            const start = document.getElementById('modalStart').value;
            const end = document.getElementById('modalEnd').value;
            const ids = document.getElementById('modalIds').value;
            const servings = document.getElementById('modalServings').value;
            await generateAndRender({ start, end, ids, servings });
        });

        document.getElementById('modalCsvBtn').addEventListener('click', () => {
            if (window._lastGroceryModal) {
                const csv = toCSV(window._lastGroceryModal);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `grocery-list-${Date.now()}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            }
        });
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

    async function generateAndRender({ start, end, ids, servings }) {
        const modal = document.getElementById('groceryModal');
        const resultsInner = document.getElementById('modalResultsInner');
        const csvBtn = document.getElementById('modalCsvBtn');
        resultsInner.innerHTML = '<p class="muted">Loading...</p>';
        csvBtn.disabled = true;

        try {
            const params = new URLSearchParams();
            if (ids) params.set('ids', ids);
            if (start) params.set('start', start);
            if (end) params.set('end', end);
            if (servings) params.set('servings', servings);

            // Use auth token if available for user-specific plans
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = token.startsWith('Token ') ? token : `Token ${token}`;

            const url = `${API_BASE}/api/planner/mealplans/grocery-list/?${params.toString()}`;
            const res = await fetch(url, { headers });
            if (!res.ok) {
                const err = await res.json().catch(()=>({ detail: 'Unknown error' }));
                resultsInner.innerHTML = `<p class="muted">Error: ${err.detail || JSON.stringify(err)}</p>`;
                window.showToast('Failed to generate grocery list', true);
                return;
            }

            const data = await res.json();
            window._lastGroceryModal = data;
            renderDataToModal(data);
            csvBtn.disabled = false;
            window.showToast('Grocery list ready');

        } catch (e) {
            console.error('grocery-list-modal generate error', e);
            resultsInner.innerHTML = `<p class="muted">Network error: ${e.message}</p>`;
            window.showToast('Network error while generating grocery list', true);
        }
    }

    function renderDataToModal(data) {
        const resultsInner = document.getElementById('modalResultsInner');
        if (!data || !data.items) {
            resultsInner.innerHTML = '<p class="muted">No items returned.</p>';
            return;
        }
        let html = `<div class="meta"><div><strong>Total items:</strong> ${data.items.length}</div><div class="muted">${data.meta?.range || ''}</div></div>`;
        html += '<div style="overflow:auto"><table><thead><tr><th>Ingredient</th><th>Unit</th><th>Total Quantity</th><th>Recipes</th></tr></thead><tbody>';
        data.items.forEach(item => {
            const recipes = (item.recipes || []).map(r => r.title || r.name).join(', ');
            html += `<tr><td>${item.name}</td><td>${item.unit || ''}</td><td>${item.quantity || ''}</td><td>${recipes}</td></tr>`;
        });
        html += '</tbody></table></div>';

        if (data.breakdown) {
            html += `<div style="margin-top:12px;"><span class="toggle" id="modalToggleBreakdown">Show per-recipe breakdown</span></div>`;
            html += `<div id="modalBreakdown" style="margin-top:12px; display:none">`;
            data.breakdown.forEach(b => {
                html += `<div class="card" style="margin-bottom:10px;"><strong>${b.recipe_title}</strong> <div class="muted">Servings: ${b.servings}</div>`;
                html += '<ul>';
                b.items.forEach(i => { html += `<li>${i.name} — ${i.quantity} ${i.unit || ''}</li>` });
                html += '</ul></div>';
            });
            html += `</div>`;
        }

        resultsInner.innerHTML = html;

        const t = document.getElementById('modalToggleBreakdown');
        if (t) t.addEventListener('click', ()=>{
            const bd = document.getElementById('modalBreakdown');
            if (!bd) return;
            bd.style.display = bd.style.display === 'none' ? 'block' : 'none';
            t.textContent = bd.style.display === 'none' ? 'Show per-recipe breakdown' : 'Hide per-recipe breakdown';
        });
    }

    // Public API
    window.renderGroceryListModal = function(opts) {
        createModal();
        const modal = document.getElementById('groceryModal');
        modal.style.display = 'flex';
        // prefill if opts
        if (opts) {
            if (opts.start) document.getElementById('modalStart').value = opts.start;
            if (opts.end) document.getElementById('modalEnd').value = opts.end;
            if (opts.ids) document.getElementById('modalIds').value = opts.ids;
            if (opts.servings) document.getElementById('modalServings').value = opts.servings;
        }
    };

    // Auto-create modal on load
    setTimeout(createModal, 200);

})();
