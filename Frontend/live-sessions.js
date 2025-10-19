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
    filter: 'live',
    pollingId: null,
    sessionMeta: new Map()
};

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
        has_active_room: data.has_active_room
            || data.is_live
            || data.active
            || data.is_active
            || data.external_room?.is_live
            || session.has_active_room
            || session.is_live
            || null
    };

    getSessionKeys(session).forEach((identifier) => {
        state.sessionMeta.set(identifier, meta);
    });
    Object.assign(session, meta);

    if (meta.has_active_room && !session.ended_at) {
        session.is_live = true;
        session.status = 'live';
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

function getSessionStatus(session) {
    if (!session) return 'upcoming';

    if (session.ended_at) return 'past';
    if (session.is_live || session.has_active_room || session.active_room || session.active || session.is_active) return 'live';

    const raw = (session.status || session.state || session.lifecycle || '').toString().toLowerCase();

    if (raw) {
        if (['live', 'active', 'started', 'running', 'in_progress'].includes(raw)) return 'live';
        if (['ended', 'complete', 'completed', 'archived', 'cancelled', 'canceled', 'finished', 'past'].includes(raw)) return 'past';
        if (['upcoming', 'scheduled', 'pending', 'created', 'draft', 'ready', 'waiting'].includes(raw)) return 'upcoming';
    }

    const hasLiveSignal = Boolean(
        session.started_at
        || session.start_time
        || session.external_room_url
        || session.external_room?.url
        || session.external_room_data?.url
        || state.sessionMeta.get(session.id)?.external_room_url
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
                : status === 'live'
                    ? '<i class="fas fa-play"></i> Join Live'
                    : status === 'upcoming'
                        ? '<i class="fas fa-bell"></i> RSVP'
                        : '<i class="fas fa-play-circle"></i> Replay'}</button>
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

        const joinUrl = data.external_room_url || data.daily_room_url || data.room_url || data.join_url || data.url;
        const roomName = data.external_room_name || data.daily_room_name || data.room_name || session.external_room_name;
        const participantToken = data.participant_token || data.provider_token || data.token;

        showToast('Launching live session...', 'success');

        if (joinUrl) {
            if (participantToken) {
                await ensureDailyLoaded();
                launchEmbeddedRoom({ token: participantToken, roomName, url: joinUrl });
                setStatus('Connected to the live session. Enjoy!');
            } else {
                window.open(joinUrl, '_blank', 'noopener');
                setStatus('Opened live room in a new tab. Enjoy!');
            }
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
    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@daily-co/daily-js/dist/daily-iframe.min.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Daily embed library.'));
        document.head.appendChild(script);
    });
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

    let joinUrl = providedUrl;
    if (!joinUrl) {
        const baseCandidate = NORMALIZED_BASE.replace('api.', '');
        joinUrl = `${baseCandidate}/live/${roomName}`;
    }
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
}

function startPolling() {
    if (state.pollingId) return;
    state.pollingId = window.setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        fetchSessions().catch(() => {});
    }, 60000);
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
}

init().catch((error) => {
    console.error('Live sessions init failed:', error);
    setStatus('Live sessions are unavailable right now.', true);
    showToast('Live sessions are unavailable right now.', 'error');
});
