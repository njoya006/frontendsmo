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
    if (!tableBody) return;

    if (!Array.isArray(results) || results.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No ingredient prices found.</td></tr>';
        return;
    }

    tableBody.innerHTML = results.map(entry => {
        const ingredientName = entry.ingredient?.name || entry.ingredient_name || 'Unknown';
        const price = formatPrice(entry);
        const unit = entry.unit || entry.unit_name || entry.unit_label || '—';
        const vendor = entry.vendor?.name || entry.vendor_name || '—';
        const city = entry.market?.city || entry.market?.location || entry.city || entry.location || '—';
        const updated = formatDate(entry.updated_at || entry.modified_at || entry.created_at);

        return `
                <tr>
                    <td data-label="Ingredient">${ingredientName}</td>
                    <td data-label="Price">${price}</td>
                    <td data-label="Unit">${unit}</td>
                    <td data-label="Vendor">${vendor}</td>
                    <td data-label="City">${city}</td>
                    <td data-label="Updated">${updated}</td>
                    <td class="row-toggle-cell"><button class="row-toggle" aria-expanded="false" aria-label="Show details">Details</button></td>
                </tr>
            `;
    }).join('');
}

// Delegate row toggle clicks for expand/collapse on small screens
document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.row-toggle');
    if (!btn) return;
    const tr = btn.closest('tr');
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.textContent = expanded ? 'Details' : 'Hide';
    if (tr) tr.classList.toggle('expanded');
});

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
