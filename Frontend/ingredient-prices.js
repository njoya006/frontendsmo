import { fetchIngredientPrices } from './ingredientApi.js';

const statusMessage = document.getElementById('statusMessage');
const tableBody = document.getElementById('priceTableBody');
const searchInput = document.getElementById('searchInput');
const currencyFilter = document.getElementById('currencyFilter');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const orderingSelect = document.getElementById('orderingSelect');
const refreshBtn = document.getElementById('refreshBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageInfo = document.getElementById('pageInfo');

const state = {
    page: 1,
    pageSize: pageSizeSelect ? (parseInt(pageSizeSelect.value, 10) || 20) : 20,
    search: '',
    ordering: orderingSelect ? orderingSelect.value : '',
    filters: {}
};

let debounceTimer = null;

function setStatus(message, isError = false) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.classList.toggle('error', !!isError);
}

function formatPrice(entry) {
    const amount = entry.price ?? entry.amount ?? entry.value ?? null;
    const currency = entry.currency ?? entry.currency_code ?? entry.currency_symbol ?? '';
    if (amount === null || amount === undefined) {
        return '—';
    }
    return `${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`.trim();
}

function formatDate(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString();
    } catch (error) {
        return value;
    }
}

function renderTable(results = []) {
    const priceList = document.getElementById('priceList');
    if (!priceList) return;

    if (!Array.isArray(results) || results.length === 0) {
        priceList.innerHTML = '<div class="empty">No ingredient prices found.</div>';
        return;
    }

    const unknowns = [];
    priceList.innerHTML = results.map(entry => {
        // Be tolerant: try multiple fields for ingredient name
        const ingredientName = entry.ingredient?.name || entry.ingredient_name || entry.name || entry.item_name || entry.title || 'Unknown';
        const price = formatPrice(entry) || entry.value || entry.amount || entry.price || '\u2014';
        const unit = entry.unit || entry.unit_name || entry.unit_label || '\u2014';
        const vendor = entry.vendor?.name || entry.vendor_name || '\u2014';
        const city = entry.market?.city || entry.market?.location || entry.city || entry.location || '\u2014';
        const updated = formatDate(entry.updated_at || entry.modified_at || entry.created_at);

        return `
            <article class="price-card" role="listitem" tabindex="0">
                <div class="price-head">
                    <div>
                        <div class="ingredient">${escapeHtml(ingredientName)}</div>
                        <div class="meta"><span class="vendor">${escapeHtml(vendor)}</span><span>${escapeHtml(city)}</span></div>
                    </div>
                    <div style="text-align:right">
                        <div class="price-badge">${escapeHtml(price)}</div>
                        <div class="small">${escapeHtml(unit)}</div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="updated">Updated ${escapeHtml(updated)}</div>
                    <button class="details-btn" aria-expanded="false">Details</button>
                </div>
            </article>
        `;
    }).join('');

    // Log entries that still map to 'Unknown' to help backend debugging
    results.forEach((entry, idx) => {
        const name = entry.ingredient?.name || entry.ingredient_name || entry.name || entry.item_name || entry.title || null;
        if (!name) {
            unknowns.push({ index: idx, entry });
        }
    });
    if (unknowns.length > 0) {
        console.group(`Ingredient-prices: ${unknowns.length} entries missing ingredient name`);
        unknowns.slice(0, 10).forEach(u => console.warn('Missing name at index', u.index, u.entry));
        if (unknowns.length > 10) console.warn(`...and ${unknowns.length - 10} more`);
        console.groupEnd();
        setStatus(`Loaded ${results.length} entries — ${unknowns.length} missing names (see console)`, true);
    }

    // Hook up details buttons for accessibility/expand
    priceList.querySelectorAll('.details-btn').forEach((btn, idx) => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.price-card');
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!expanded));
            btn.textContent = expanded ? 'Details' : 'Hide';
            card.classList.toggle('expanded', !expanded);
        });
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[m]; });
}

// No-op: previous table row toggle behavior removed (card-based list now)

// Add ARIA roles/labels for accessibility
function enhanceAccessibility() {
    const table = document.querySelector('table');
    if (table) {
        table.setAttribute('role', 'table');
        table.querySelectorAll('th').forEach(th => th.setAttribute('scope', 'col'));
    }
    const controls = document.querySelector('.controls');
    if (controls) controls.setAttribute('role', 'region');
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', enhanceAccessibility);
} else {
    enhanceAccessibility();
}

function updatePagination(meta) {
    const { page } = state;
    const totalCount = meta?.count ?? 0;
    const pageSize = state.pageSize;
    const totalPages = pageSize ? Math.ceil(totalCount / pageSize) || 1 : 1;

    if (pageInfo) {
        pageInfo.textContent = `Page ${page} of ${totalPages}`;
    }

    if (prevPageBtn) prevPageBtn.disabled = page <= 1 || !meta?.previous;
    if (nextPageBtn) nextPageBtn.disabled = page >= totalPages || !meta?.next;
}

async function loadPrices({ showSpinner = true } = {}) {
    if (showSpinner) {
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Loading...</td></tr>';
        }
        setStatus('Loading latest prices...');
    }

    const response = await fetchIngredientPrices({
        page: state.page,
        pageSize: state.pageSize,
        search: state.search,
        ordering: state.ordering,
        filters: state.filters
    });

    if (!response.success) {
        renderTable([]);
        setStatus(response.error || 'Unable to load ingredient prices.', true);
        return;
    }

    renderTable(response.results || []);
    updatePagination(response);

    const from = ((state.page - 1) * state.pageSize) + 1;
    const to = from + (response.results?.length || 0) - 1;
    const total = response.count ?? response.results?.length ?? 0;
    const rangeText = total > 0 ? `Showing ${from}-${to} of ${total}` : 'No results to display';

    setStatus(`Updated ${formatDate(response.generated_at || response.timestamp)} • ${rangeText}`);
}

function applySearch(value) {
    state.search = value.trim();
    state.page = 1;
    loadPrices();
}

function debounceSearch(handler) {
    return function(event) {
        const value = event.target.value;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => handler(value), 400);
    };
}

if (searchInput) {
    searchInput.addEventListener('input', debounceSearch(applySearch));
    searchInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applySearch(event.target.value);
        }
    });
}

if (currencyFilter) {
    currencyFilter.addEventListener('change', event => {
        const value = event.target.value;
        if (value) {
            state.filters.currency = value;
        } else {
            delete state.filters.currency;
        }
        state.page = 1;
        loadPrices();
    });
}

if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', event => {
        state.pageSize = parseInt(event.target.value, 10) || 20;
        state.page = 1;
        loadPrices();
    });
}

if (orderingSelect) {
    orderingSelect.addEventListener('change', event => {
        state.ordering = event.target.value;
        state.page = 1;
        loadPrices();
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        loadPrices();
    });
}

if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (state.page > 1) {
            state.page -= 1;
            loadPrices({ showSpinner: false });
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        state.page += 1;
        loadPrices({ showSpinner: false });
    });
}

const start = () => loadPrices();

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
