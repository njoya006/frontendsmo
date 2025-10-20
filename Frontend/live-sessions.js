const BASE_URL = (window.getChopsmoApiBaseUrl && window.getChopsmoApiBaseUrl()) || 'https://api.chopsmo.site';
const NORMALIZED_BASE = BASE_URL.replace(/\/$/, '');
const ENDPOINTS = {
    list: () => `${NORMALIZED_BASE}/api/live-sessions/`,
    create: () => `${NORMALIZED_BASE}/api/live-sessions/`,
    start: (slug) => `${NORMALIZED_BASE}/api/live-sessions/${slug}/start/`,
    token: (slug) => `${NORMALIZED_BASE}/api/live-sessions/${slug}/token/`,
    join: (slug) => `${NORMALIZED_BASE}/api/live-sessions/${slug}/join/`
};

const statusBannerEl = document.getElementById('statusBanner');
const sessionGridEl = document.getElementById('sessionGrid');
const startSessionBtn = document.getElementById('startSessionBtn');
const startSessionFab = document.getElementById('startSessionFab');
const learnMoreBtn = document.getElementById('learnMoreBtn');
const searchInputEl = document.getElementById('searchInput');
const filterChipsEl = document.getElementById('filterChips');
const modalOverlay = document.getElementById('sessionModal');
const sessionForm = document.getElementById('sessionForm');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const toastContainer = document.getElementById('toastContainer');

const state = {
    loading: false,
    sessions: [],
    searchTerm: '',
    filter: 'all',
    pollingId: null,
    sessionMeta: new Map()
};

function asTruthy(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return ['true', '1', 'yes', 'y'].includes(normalized);
    }
    return Boolean(value);
}

function getSessionKeys(session) {
    if (!session) return [];
    const keys = [session.slug, session.id, session.uuid, session.pk, session.identifier].filter(Boolean);
    return [...new Set(keys.map((key) => key.toString()))];
}

function getSessionKey(session) {
    const keys = getSessionKeys(session);
    return keys.length ? keys[0] : null;
}

function setStatus(message, isError = false) {
    if (!statusBannerEl) return;
    statusBannerEl.textContent = message;
    statusBannerEl.classList.toggle('error', Boolean(isError));
}

function showToast(message, type = 'default') {
    if (!toastContainer) {
        alert(message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        setTimeout(() => toast.remove(), 220);
    }, 3200);
}

function formatDateTime(value) {
    if (!value) return 'TBD';
    try {
        const date = new Date(value);
        return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    } catch (error) {
        return value;
    }
}

function formatRelative(value) {
    if (!value) return '';
    try {
        const date = new Date(value);
        const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
        const diff = date.getTime() - Date.now();
        const minutes = Math.round(diff / 60000);
        const hours = Math.round(diff / 3600000);
        const days = Math.round(diff / 86400000);
        if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
        if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
        return formatter.format(days, 'day');
    } catch (error) {
        return '';
    }
}

function normalizeSessions(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.sessions)) return payload.sessions;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
}

function cacheSessionMetadata(session, data) {
    const key = getSessionKey(session);
    if (!key || !data) return;

    const meta = {
        external_room_name: data.external_room_name
            || data.daily_room_name
            || data.room_name
            || data.external_room?.name
            || session.external_room_name
            || null,
        external_room_url: data.external_room_url
            || data.daily_room_url
            || data.room_url
            || data.external_room?.url
            || session.external_room_url
            || null,
        external_room_data: data.external_room_data
            || data.external_room
            || session.external_room_data
            || null,
        has_active_room: [
            data.has_active_room,
            data.is_live,
            data.active,
            data.is_active,
            data.external_room?.is_live,
            session.has_active_room,
            session.is_live
        ].some(asTruthy),
        is_host: [
            data.is_host,
            data.permissions && data.permissions.can_start,
            session.is_host
        ].some(asTruthy),
        can_start: [
            data.can_start,
            data.permissions?.can_start,
            session.can_start,
            session.permissions && session.permissions.can_start
        ].some(asTruthy)
    };

    getSessionKeys(session).forEach((identifier) => {
        state.sessionMeta.set(identifier, meta);
    });
    Object.assign(session, meta);

    if (meta.has_active_room && !session.ended_at) {
        session.is_live = true;
        session.status = 'live';
    }

    if (meta.is_host) {
        session.is_host = true;
        session.can_start = true;
        session.permissions = { ...(session.permissions || {}), can_start: true };
    }
}

function applyCachedMetadata(sessions = []) {
    sessions.forEach((session) => {
        const keys = getSessionKeys(session);
        for (let i = 0; i < keys.length; i += 1) {
            const cached = state.sessionMeta.get(keys[i]);
            if (cached) {
                Object.assign(session, cached);
                break;
            }
        }
    });
}

function resolveJoinUrl({ providedUrl, roomName }) {
    if (providedUrl) return providedUrl;

    if (roomName) {
        const baseCandidate = NORMALIZED_BASE.replace('api.', '');
        return `${baseCandidate.replace(/\/$/, '')}/live/${roomName}`;
    }

    return null;
}

function getSessionStatus(session) {
    if (!session) return 'upcoming';

    if (session.ended_at) return 'past';
    if (asTruthy(session.is_live)
        || asTruthy(session.isLive)
        || asTruthy(session.has_active_room)
        || asTruthy(session.active_room)
        || asTruthy(session.active)
        || asTruthy(session.is_active)) {
        return 'live';
    }

    const raw = (session.status || session.state || session.lifecycle || '').toString().toLowerCase();

    if (raw) {
        if (['live', 'active', 'started', 'running', 'in_progress'].includes(raw)) return 'live';
        if (['ended', 'complete', 'completed', 'archived', 'cancelled', 'canceled', 'finished', 'past'].includes(raw)) return 'past';
        if (['upcoming', 'scheduled', 'pending', 'created', 'draft', 'ready', 'waiting'].includes(raw)) return 'upcoming';
    }

    let cachedMeta;
    const keys = getSessionKeys(session);
    for (let i = 0; i < keys.length; i += 1) {
        const found = state.sessionMeta.get(keys[i]);
        if (found) {
            cachedMeta = found;
            break;
        }
    }

    const hasLiveSignal = Boolean(
        session.started_at
        || session.start_time
        || session.external_room_url
        || session.external_room?.url
        || session.external_room_data?.url
        || cachedMeta?.external_room_url
        || asTruthy(cachedMeta?.has_active_room)
    );

    if (hasLiveSignal && !session.ended_at) {
        return 'live';
    }

    return 'upcoming';
}

function filterSessions() {
    const searchTerm = state.searchTerm.trim().toLowerCase();
    const filter = state.filter;

    return state.sessions.filter((session) => {
    const status = getSessionStatus(session);
    if (filter === 'live' && status !== 'live') return false;
    if (filter === 'upcoming' && status !== 'upcoming') return false;
    if (filter === 'past' && status !== 'past') return false;

        if (!searchTerm) return true;

        const haystack = [
            session.title,
            session.description,
            session.cuisine_focus,
            session.host_display_name,
            session.host?.display_name,
            session.host?.username
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return haystack.includes(searchTerm);
    });
}

function renderSessions() {
    if (!sessionGridEl) return;

    const filteredSessions = filterSessions();

    if (filteredSessions.length === 0) {
        sessionGridEl.innerHTML = '<div class="empty-state">No sessions match this view yet. Check back soon or start your own live class.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    filteredSessions.forEach((session) => {
        fragment.appendChild(createSessionCard(session));
    });

    sessionGridEl.innerHTML = '';
    sessionGridEl.appendChild(fragment);
}

function createSessionCard(session) {
    const card = document.createElement('article');
    card.className = 'session-card';

    let cachedMeta;
    const keys = getSessionKeys(session);
    for (let i = 0; i < keys.length; i += 1) {
        const candidate = state.sessionMeta.get(keys[i]);
        if (candidate) {
            cachedMeta = candidate;
            break;
        }
    }

    const status = getSessionStatus(session);
    const pillClass = status === 'live' ? 'live' : status === 'upcoming' ? 'upcoming' : 'past';
    const statusLabel = status === 'live' ? 'Live Now' : status === 'upcoming' ? 'Upcoming' : 'Past Session';
    const hostName = session.host_display_name || session.host?.display_name || session.host?.username || 'Unknown host';

    const viewers = session.current_viewers ?? session.live_viewers ?? 0;
    const cuisine = session.cuisine_focus || 'General';
    const startTime = session.scheduled_start || session.start_time;
    const relativeStart = startTime ? formatRelative(startTime) : '';
    const relativeStarted = session.started_at ? formatRelative(session.started_at) : (session.start_time ? formatRelative(session.start_time) : '');
    const relativeEnded = session.ended_at ? formatRelative(session.ended_at) : '';
    const canStart = Boolean(session.is_host || session.can_start || session.permissions?.can_start);
    const primaryAction = canStart && status !== 'live' ? 'start' : 'join';
    const canJoinEarly = Boolean(
        session.external_room_url
        || session.external_room?.url
        || session.external_room_data?.url
        || session.join_url
        || session.public_url
        || cachedMeta?.external_room_url
        || cachedMeta?.external_room?.url
    );
    const joinLabel = status === 'live'
        ? '<i class="fas fa-play"></i> Join Live'
        : canJoinEarly
            ? '<i class="fas fa-door-open"></i> Join Room'
            : '<i class="fas fa-bell"></i> RSVP';

    card.innerHTML = `
        <div class="session-header">
            <span class="status-pill ${pillClass}"><i class="fas fa-circle"></i>${statusLabel}</span>
            <span class="session-title">${session.title || 'Live cooking session'}</span>
        </div>
        <p class="session-description">${session.description || 'Real-time cooking with the ChopSmo community.'}</p>
        <div class="session-meta">
            <div class="meta-row"><i class="fas fa-user"></i><span>Host: ${hostName}</span></div>
            <div class="meta-row"><i class="fas fa-utensils"></i><span>Cuisine: ${cuisine}</span></div>
            ${status === 'live'
                ? `<div class="meta-row"><i class="fas fa-eye"></i><span>${viewers} viewing${relativeStarted ? ` • Started ${relativeStarted}` : ''}</span></div>`
                : status === 'upcoming'
                    ? `<div class="meta-row"><i class="fas fa-clock"></i><span>Starts ${formatDateTime(startTime)}${relativeStart ? ` • ${relativeStart}` : ''}</span></div>`
                    : `<div class="meta-row"><i class="fas fa-history"></i><span>Ended ${relativeEnded || formatDateTime(session.ended_at)}</span></div>`}
        </div>
        <div class="session-actions">
            <button class="action-button primary" data-action="${primaryAction}">${primaryAction === 'start'
                ? '<i class="fas fa-rocket"></i> Start Session'
                : status === 'past'
                    ? '<i class="fas fa-play-circle"></i> Replay'
                    : joinLabel}</button>
            <button class="action-button secondary" data-action="copy"><i class="fas fa-link"></i> Copy Link</button>
        </div>
    `;

    const primaryBtn = card.querySelector('[data-action="join"],[data-action="start"]');
    const copyBtn = card.querySelector('[data-action="copy"]');

    primaryBtn.disabled = status === 'past' && !session.replay_url;
    primaryBtn.addEventListener('click', () => {
        if (primaryAction === 'start') {
            handleStartTransition(session);
        } else {
            handleJoinSession(session);
        }
    });
    copyBtn.addEventListener('click', () => handleCopyLink(session));

    return card;
}

function renderSkeleton(count = 4) {
    if (!sessionGridEl) return;
    sessionGridEl.innerHTML = '';
    for (let i = 0; i < count; i += 1) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        sessionGridEl.appendChild(skeleton);
    }
}

async function fetchSessions() {
    if (state.loading) return;
    state.loading = true;
    setStatus('Refreshing live sessions...');
    renderSkeleton();

    try {
        const url = new URL(ENDPOINTS.list());
        if (state.searchTerm) url.searchParams.set('search', state.searchTerm);

        const response = await fetch(url.toString(), {
            headers: window.authHeaders ? window.authHeaders({ Accept: 'application/json' }) : { Accept: 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Unable to fetch live sessions (${response.status})`);
        }

        const payload = await response.json().catch(() => []);
        state.sessions = normalizeSessions(payload);
        applyCachedMetadata(state.sessions);
        renderSessions();
        setStatus(`Updated ${new Date().toLocaleTimeString()}`);
    } catch (error) {
        console.error('Live sessions fetch failed:', error);
        setStatus(error.message || 'Unable to load live sessions right now.', true);
        if (sessionGridEl) {
            sessionGridEl.innerHTML = '<div class="empty-state">We couldn\'t load sessions. Check your connection or try again later.</div>';
        }
    } finally {
        state.loading = false;
    }
}

async function handleJoinSession(session) {
    try {
        setStatus('Requesting secure join link...');

        const headers = window.authHeaders
            ? window.authHeaders(window.csrfHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }))
            : { 'Content-Type': 'application/json', Accept: 'application/json' };

        const key = getSessionKey(session);
        if (!key) throw new Error('Missing session identifier for join');

        // Fire-and-forget join call to increment view count when available
        fetch(ENDPOINTS.join(key), {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({})
        }).catch((err) => console.debug('Join counter request failed:', err));

        const response = await fetch(ENDPOINTS.token(key), {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const detail = await response.json().catch(() => ({}));
            throw new Error(detail.detail || detail.error || 'Unable to join session');
        }

        const data = await response.json().catch(() => ({}));

        cacheSessionMetadata(session, data);

    const cachedMeta = key ? state.sessionMeta.get(key) : null;

        const joinUrl = data.external_room_url
            || data.daily_room_url
            || data.room_url
            || data.join_url
            || data.launch_url
            || data.start_url
            || data.url
            || data.room?.url
            || cachedMeta?.external_room_url
            || cachedMeta?.external_room?.url
            || session.external_room_url
            || session.external_room?.url
            || session.join_url
            || session.public_url;
        const roomName = data.external_room_name
            || data.daily_room_name
            || data.room_name
            || data.room?.name
            || cachedMeta?.external_room_name
            || session.external_room_name
            || session.room_name;
        const participantToken = data.participant_token || data.provider_token || data.token;
        const resolvedJoinUrl = resolveJoinUrl({ providedUrl: joinUrl, roomName });

        showToast('Launching live session...', 'success');

        if (participantToken) {
            try {
                await ensureDailyLoaded();
                launchEmbeddedRoom({ token: participantToken, roomName, url: resolvedJoinUrl });
                setStatus('Connected to the live session. Enjoy!');
                return;
            } catch (embedError) {
                // Try to surface which CDN(s) failed for diagnostics
                const diagnostics = (ensureDailyLoaded.lastFailedSources || []).map((f) => `${f.src} -> ${f.reason}`).join('; ') || embedError.message;
                console.warn('Daily embed unavailable, falling back to direct link:', embedError, diagnostics);
                console.info('Daily loader diagnostics:', ensureDailyLoaded.lastFailedSources || ensureDailyLoaded.lastSuccessfulSource || 'none');
                // Show a concise status to the user while preserving details in the console
                setStatus('Daily embed unavailable; opened the live room in a new tab.', true);
                if (resolvedJoinUrl) {
                    window.open(resolvedJoinUrl, '_blank', 'noopener');
                    setStatus('Opened live room in a new tab. Enjoy!');
                    return;
                }
                throw new Error('Live room token received but the embed library failed to load.');
            }
        }

        if (resolvedJoinUrl) {
            window.open(resolvedJoinUrl, '_blank', 'noopener');
            setStatus('Opened live room in a new tab. Enjoy!');
            return;
        }

        throw new Error('No join link returned by the server.');
    } catch (error) {
        console.error('Join session failed:', error);
        setStatus(error.message || 'Unable to join this session.', true);
        showToast(error.message || 'Unable to join this session right now.', 'error');
    }
}

async function handleCopyLink(session) {
    try {
        const shareUrl = session.public_url || session.share_url || session.join_url || `${window.location.origin}/LiveSessions.html#${session.id}`;
        await navigator.clipboard.writeText(shareUrl);
        setStatus('Copied session link to clipboard. Share it with your audience!');
        showToast('Session link copied to clipboard.', 'success');
    } catch (error) {
        console.warn('Copy failed, falling back to prompt:', error);
        const shareUrl = session.public_url || session.share_url || session.join_url || `${window.location.origin}/LiveSessions.html#${session.id}`;
        window.prompt('Copy this link to share the session:', shareUrl);
    }
}

async function submitSessionForm(event) {
    event.preventDefault();

    try {
        if (!window.getAuthToken || !window.getAuthToken()) {
            setStatus('You need to log in before hosting a session.', true);
            showToast('Log in to host a session.', 'error');
            closeModal();
            return;
        }

        const formData = new FormData(sessionForm);
        const tagsRaw = (formData.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean);

        const payload = {
            title: formData.get('title')?.trim(),
            description: formData.get('description')?.trim(),
            cuisine_focus: formData.get('cuisine_focus')?.trim() || null,
            scheduled_start: formData.get('scheduled_start') || null,
            estimated_duration: formData.get('estimated_duration') ? parseInt(formData.get('estimated_duration'), 10) : null,
            provider: 'daily'
        };

        if (tagsRaw.length) {
            payload.tags = tagsRaw;
        }

        const headers = window.authHeaders ? window.authHeaders(window.csrfHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' })) : { 'Content-Type': 'application/json', Accept: 'application/json' };
        const response = await fetch(ENDPOINTS.create(), {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const detail = await response.json().catch(() => ({}));
            throw new Error(detail.detail || detail.error || 'Unable to create live session');
        }

        const data = await response.json().catch(() => ({}));
        setStatus('Live session created. Opening host controls...');
        showToast('Live session created successfully.', 'success');

        cacheSessionMetadata(data, data.external_room_data || data);

        data.is_host = true;
        data.can_start = true;
        data.permissions = { ...(data.permissions || {}), can_start: true };

        const hostJoinUrl = data.host_join_url || data.join_url || data.url;
        if (hostJoinUrl) {
            window.open(hostJoinUrl, '_blank', 'noopener');
        }

        closeModal();
        sessionForm.reset();
        state.sessions.unshift(data);
        applyCachedMetadata(state.sessions);
        renderSessions();
    } catch (error) {
        console.error('Start session failed:', error);
        setStatus(error.message || 'Unable to start live session.', true);
        showToast(error.message || 'Unable to start live session right now.', 'error');
    }
}

async function handleStartTransition(session) {
    try {
        setStatus('Starting live session...');

        const key = getSessionKey(session);
        if (!key) throw new Error('Missing session identifier for start');

        const headers = window.authHeaders
            ? window.authHeaders(window.csrfHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }))
            : { 'Content-Type': 'application/json', Accept: 'application/json' };

        const response = await fetch(ENDPOINTS.start(key), {
            method: 'POST',
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const detail = await response.json().catch(() => ({}));
            throw new Error(detail.detail || detail.error || 'Unable to start live session');
        }

    const data = await response.json().catch(() => ({}));
    data.is_live = true;
    data.has_active_room = true;
    data.status = data.status || 'live';
    cacheSessionMetadata(session, data);

        const hostUrl = data.external_room_url || data.daily_room_url || data.room_url;
        const roomName = data.external_room_name || data.daily_room_name || data.room_name;
        const hostToken = data.provider_token || data.host_token || data.token;

        showToast('Session is live! Opening host controls...', 'success');

    session.status = 'live';
    session.is_live = true;
    renderSessions();
        if (state.filter !== 'live') {
            state.filter = 'live';
            if (filterChipsEl) {
                [...filterChipsEl.querySelectorAll('.filter-chip')].forEach((chip) => {
                    chip.classList.toggle('active', chip.dataset.filter === 'live');
                });
            }
        }
    fetchSessions();

        if (hostUrl && hostToken) {
            await ensureDailyLoaded();
            launchEmbeddedRoom({ token: hostToken, roomName, url: hostUrl });
            setStatus('Host view connected.');
        } else if (hostUrl) {
            window.open(hostUrl, '_blank', 'noopener');
            setStatus('Opened host controls in a new tab.');
        } else {
            setStatus('Session started without launch URL.');
        }
    } catch (error) {
        console.error('Start transition failed:', error);
        setStatus(error.message || 'Unable to start this session.', true);
        showToast(error.message || 'Unable to start this session.', 'error');
    }
}

async function ensureDailyLoaded() {
    if (window.DailyIframe) return;

    if (ensureDailyLoaded.loadingPromise) {
        await ensureDailyLoaded.loadingPromise;
        if (window.DailyIframe) return;
    }

    const sources = [
        // Local vendor fallback (place daily-iframe.min.js at this path to avoid CDN failures)
        '/assets/vendor/daily-iframe.min.js',
        'https://unpkg.com/@daily-co/daily-js/dist/daily-iframe.min.js',
        'https://cdn.jsdelivr.net/npm/@daily-co/daily-js/dist/daily-iframe.min.js',
        'https://cdn.daily.co/daily-js/daily-iframe.min.js'
    ];

    // Quick probe helper: attempt HEAD then fallback to GET (with no-cors) to detect basic reachability
    async function probeUrl(url, timeoutMs = 4000) {
        return new Promise((resolve) => {
            let finished = false;
            const timer = window.setTimeout(() => {
                if (finished) return;
                finished = true;
                resolve({ url, ok: false, status: 0, error: 'timeout' });
            }, timeoutMs);

            // Try a HEAD request first for a fast response
            fetch(url, { method: 'HEAD', cache: 'no-cache', mode: 'cors' })
                .then((res) => {
                    if (finished) return;
                    finished = true;
                    window.clearTimeout(timer);
                    resolve({ url, ok: res.ok, status: res.status, statusText: res.statusText });
                })
                .catch(() => {
                    // HEAD may be blocked by CORS; try a GET with no-cors so we at least know the network path succeeded
                    fetch(url, { method: 'GET', cache: 'no-cache', mode: 'no-cors' })
                        .then(() => {
                            if (finished) return;
                            finished = true;
                            window.clearTimeout(timer);
                            // opaque response — can't inspect status, but network reached
                            resolve({ url, ok: true, status: 0, statusText: 'opaque' });
                        })
                        .catch((err) => {
                            if (finished) return;
                            finished = true;
                            window.clearTimeout(timer);
                            resolve({ url, ok: false, status: 0, error: String(err && err.message ? err.message : err) });
                        });
                });
        });
    }

    async function testDailySources(sources, perSourceTimeout = 4000) {
        const results = [];
        for (let i = 0; i < sources.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const res = await probeUrl(sources[i], perSourceTimeout);
            results.push(res);
        }
        return results;
    }

    ensureDailyLoaded.loadingPromise = (async () => {
        // Run a quick probe to surface which CDNs are reachable before attempting script injection
        try {
            const probe = await testDailySources(sources, 3500);
            ensureDailyLoaded.probeResults = probe;
            console.info('Daily CDN probe results:', probe);
        } catch (probeErr) {
            console.warn('Daily CDN probe failed:', probeErr);
        }

        // Try each source with a short per-source timeout and record failures to help diagnostics
        const perSourceTimeoutMs = 8000;
        const failures = [];

        for (let i = 0; i < sources.length; i += 1) {
            const src = sources[i];
            try {
                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve, reject) => {
                    const existing = document.querySelector(`script[src="${src}"]`);
                    if (existing && existing.dataset.loaded === 'true') {
                        resolve();
                        return;
                    }

                    const script = existing || document.createElement('script');
                    let timedOut = false;
                    const timer = window.setTimeout(() => {
                        timedOut = true;
                        try { script.remove(); } catch (e) {}
                        reject(new Error(`Timed out loading Daily embed library from ${src}`));
                    }, perSourceTimeoutMs);

                    script.src = src;
                    script.async = true;
                    script.dataset.dailyLoader = 'true';
                    script.onload = () => {
                        if (timedOut) return;
                        window.clearTimeout(timer);
                        script.dataset.loaded = 'true';
                        resolve();
                    };
                    script.onerror = () => {
                        if (timedOut) return;
                        window.clearTimeout(timer);
                        try { script.remove(); } catch (e) {}
                        reject(new Error(`Failed to load Daily embed library from ${src}`));
                    };
                    if (!existing) {
                        document.head.appendChild(script);
                    }
                });

                if (window.DailyIframe) {
                    // Success
                    ensureDailyLoaded.lastSuccessfulSource = src;
                    return;
                }
                // If the script loaded but didn't expose DailyIframe, record and continue
                failures.push({ src, reason: 'loaded-broken' });
            } catch (error) {
                failures.push({ src, reason: error.message });
                console.warn('Daily loader:', error.message);
            }
        }

        // Attach diagnostic info for higher-level error handling
        ensureDailyLoaded.lastFailedSources = failures;
        throw new Error(`Failed to load Daily embed library from all sources. Tried: ${sources.join(', ')}`);
    })();

    await ensureDailyLoaded.loadingPromise;
}

function launchEmbeddedRoom({ token, roomName, url: providedUrl }) {
    const containerId = 'dailyEmbeddedContainer';
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.width = '360px';
        container.style.height = '540px';
        container.style.zIndex = '100000';
        container.style.borderRadius = '16px';
        container.style.overflow = 'hidden';
        container.style.boxShadow = '0 20px 45px rgba(15, 23, 42, 0.24)';
        document.body.appendChild(container);
    }

    const joinUrl = resolveJoinUrl({ providedUrl, roomName });

    // Defensive guard: if the join URL is missing or not a string, avoid calling
    // frame.join with an invalid value (Daily will throw). Instead open a fallback
    // link in a new tab or surface a clear error to the user.
    if (!joinUrl || typeof joinUrl !== 'string') {
        console.warn('Daily join aborted: invalid join URL', joinUrl);
        const fallback = providedUrl || (roomName ? NORMALIZED_BASE.replace(/\/$/, '') + '/live/' + roomName : null);
        if (fallback) {
            setStatus('Unable to launch embedded room (invalid join URL). Opening fallback join link...', true);
            window.open(fallback, '_blank', 'noopener');
        } else {
            setStatus('Unable to launch embedded room: no join URL available', true);
            showToast('No join URL available to open.', 'error');
        }
        return;
    }

    try {
        const frame = window.DailyIframe.createFrame(container, {
            showLeaveButton: true,
            iframeStyle: {
                width: '100%',
                height: '100%',
                border: '0'
            }
        });
        frame.join({ url: joinUrl, token }).catch((error) => {
            console.error('Daily join failed:', error);
            setStatus('Unable to launch embedded room. Opening fallback join link...', true);
            window.open(joinUrl, '_blank', 'noopener');
        });
    } catch (err) {
        console.error('Daily embed initialization failed:', err);
        const fallback = providedUrl || (roomName ? NORMALIZED_BASE.replace(/\/$/, '') + '/live/' + roomName : null);
        if (fallback) {
            setStatus('Unable to initialize embedded room. Opening fallback join link...', true);
            window.open(fallback, '_blank', 'noopener');
        } else {
            setStatus('Unable to initialize embedded room.', true);
            showToast('Unable to initialize embedded room.', 'error');
        }
    }
}

function startPolling() {
    if (state.pollingId) return;
    state.pollingId = window.setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        fetchSessions().catch(() => {});
    }, 60000);
}

// --- Diagnostic UI for Daily loader (added for easier troubleshooting) ---
function createDailyDiagnosticUI() {
    const id = 'dailyDiagContainer';
    if (document.getElementById(id)) return;

    const container = document.createElement('div');
    container.id = id;
    container.style.position = 'fixed';
    container.style.bottom = '16px';
    container.style.left = '16px';
    container.style.zIndex = '100001';
    container.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial';

    const btn = document.createElement('button');
    btn.textContent = 'Daily diag';
    btn.title = 'Run Daily CDN probe and show loader diagnostics';
    btn.style.padding = '8px 10px';
    btn.style.borderRadius = '8px';
    btn.style.border = '1px solid rgba(0,0,0,0.12)';
    btn.style.background = '#fff';
    btn.style.boxShadow = '0 6px 18px rgba(2,6,23,0.16)';
    btn.style.cursor = 'pointer';

    const panel = document.createElement('pre');
    panel.style.maxWidth = '360px';
    panel.style.maxHeight = '320px';
    panel.style.overflow = 'auto';
    panel.style.marginTop = '8px';
    panel.style.padding = '8px';
    panel.style.background = 'rgba(0,0,0,0.03)';
    panel.style.borderRadius = '8px';
    panel.style.display = 'none';
    panel.style.whiteSpace = 'pre-wrap';
    panel.style.fontSize = '12px';

    btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Probing...';
        panel.style.display = 'block';
        panel.textContent = 'Running probe...';
        try {
            // Ensure ensureDailyLoaded helper and probe exist
            if (typeof testDailySources === 'function') {
                const probe = await testDailySources((ensureDailyLoaded && ensureDailyLoaded.sources) || [
                    '/assets/vendor/daily-iframe.min.js',
                    'https://unpkg.com/@daily-co/daily-js/dist/daily-iframe.min.js',
                    'https://cdn.jsdelivr.net/npm/@daily-co/daily-js/dist/daily-iframe.min.js',
                    'https://cdn.daily.co/daily-js/daily-iframe.min.js'
                ], 3500);
                ensureDailyLoaded.probeResults = probe;
                panel.textContent = JSON.stringify({ probe, lastFailed: ensureDailyLoaded.lastFailedSources || null, lastSuccess: ensureDailyLoaded.lastSuccessfulSource || null }, null, 2);
                console.info('Daily diag results:', probe);
            } else if (ensureDailyLoaded && ensureDailyLoaded.probeResults) {
                panel.textContent = JSON.stringify({ probe: ensureDailyLoaded.probeResults, lastFailed: ensureDailyLoaded.lastFailedSources || null, lastSuccess: ensureDailyLoaded.lastSuccessfulSource || null }, null, 2);
            } else {
                panel.textContent = 'Probe helper not available in this build.';
            }
        } catch (err) {
            panel.textContent = `Probe failed: ${err && err.message ? err.message : String(err)}`;
            console.warn('Daily diag failed:', err);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Daily diag';
        }
    });

    container.appendChild(btn);
    container.appendChild(panel);
    document.body.appendChild(container);
}

function openModal() {
    if (!window.getAuthToken || !window.getAuthToken()) {
        showToast('Log in to host a live session.', 'error');
        setStatus('You need to log in before hosting a session.', true);
        return;
    }
    if (modalOverlay) {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function registerEventListeners() {
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', openModal);
    }

    if (startSessionFab) {
        startSessionFab.addEventListener('click', openModal);
    }

    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
    }

    if (sessionForm) {
        sessionForm.addEventListener('submit', submitSessionForm);
    }

    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', () => {
            showToast('We\'ll email you tips for hosting a great session soon!', 'default');
        });
    }

    if (searchInputEl) {
        let debounceId = null;
        searchInputEl.addEventListener('input', (event) => {
            const value = event.target.value;
            window.clearTimeout(debounceId);
            debounceId = window.setTimeout(() => {
                state.searchTerm = value;
                renderSessions();
            }, 300);
        });
    }

    if (filterChipsEl) {
        filterChipsEl.addEventListener('click', (event) => {
            const chip = event.target.closest('.filter-chip');
            if (!chip) return;
            const { filter } = chip.dataset;
            if (!filter) return;

            state.filter = filter;
            [...filterChipsEl.querySelectorAll('.filter-chip')].forEach((c) => c.classList.toggle('active', c === chip));
            fetchSessions();
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            fetchSessions();
        }
    });
}

async function init() {
    registerEventListeners();
    fetchSessions();
    startPolling();
    // Add diagnostic UI for troubleshooting CDN/embed issues
    try { createDailyDiagnosticUI(); } catch (e) { /* ignore */ }
}

init().catch((error) => {
    console.error('Live sessions init failed:', error);
    setStatus('Live sessions are unavailable right now.', true);
    showToast('Live sessions are unavailable right now.', 'error');
});
