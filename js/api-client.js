// Thin client for the optional Node server (see /server). When the game runs without a server
// (opened from a file or hosted on GitHub Pages) every call fails safely and `available()` is false.
window.jpApi = (() => {
  const BASE = '/api';

  async function request(method, path, body) {
    const res = await fetch(BASE + path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return null;
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || `Request failed (${res.status})`);
    return payload;
  }

  /** True when the server answers its health check quickly. */
  async function available() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${BASE}/health`, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok && (await res.json()).status === 'ok';
    } catch (e) {
      return false;
    }
  }

  return {
    available,
    list: () => request('GET', '/boards'),
    load: (id) => request('GET', `/boards/${encodeURIComponent(id)}`),
    save: (name, data) => request('POST', '/boards', { name, data }),
    remove: (id) => request('DELETE', `/boards/${encodeURIComponent(id)}`),
  };
})();
