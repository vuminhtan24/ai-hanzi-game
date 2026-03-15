// ══════════════════════════════════════════════
// api.js — Fetch wrapper tự động đính kèm JWT
// ══════════════════════════════════════════════

const API_BASE = "https://ai-hanzi-game-api.onrender.com"

const Api = {
  // ── Token helpers ────────────────────────

  getToken() {
    return localStorage.getItem('hanzi_token');
  },

  setToken(token) {
    localStorage.setItem('hanzi_token', token);
  },

  removeToken() {
    localStorage.removeItem('hanzi_token');
    localStorage.removeItem('hanzi_user');
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('hanzi_user') || 'null');
    } catch { return null; }
  },

  setUser(user) {
    localStorage.setItem('hanzi_user', JSON.stringify(user));
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  // ── Core fetch ───────────────────────────

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    // Token hết hạn → logout
    if (res.status === 401) {
      this.removeToken();
      window.location.href = '/index.html';
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || `Lỗi ${res.status}`);
    }

    return data;
  },

  get(path)         { return this.request(path, { method: 'GET' }); },
  post(path, body)  { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },

  // ── Auth endpoints ───────────────────────

  async register(username, password) {
    const data = await this.post('/api/auth/register', { username, password });
    this.setToken(data.access_token);
    this.setUser({ username: data.username });
    return data;
  },

  async login(username, password) {
    const data = await this.post('/api/auth/login', { username, password });
    this.setToken(data.access_token);
    this.setUser({ username: data.username });
    return data;
  },

  logout() {
    this.removeToken();
    window.location.href = '/index.html';
  },

  // ── Game endpoints ───────────────────────

  getProgress()              { return this.get('/api/progress'); },
  getWords(level)            { return this.get(`/api/words/${level}`); },
  completeLevel(level, score){ return this.post('/api/progress/complete', { level, score }); },
};
