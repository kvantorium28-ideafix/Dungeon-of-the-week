// запросы к серверу. ключ героя лежит в localStorage

const KEY = 'danzh-hero-token';
let token = null;

export function loadToken() {
  // если в ссылке есть ?hero=, берём его
  const params = new URLSearchParams(location.search);
  const fromUrl = params.get('hero');
  if (fromUrl) {
    saveToken(fromUrl);
    params.delete('hero');
    const rest = params.toString();
    history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : ''));
    return fromUrl;
  }
  try { token = localStorage.getItem(KEY); } catch { token = null; }
  return token;
}

export function saveToken(value) {
  token = value;
  try { value ? localStorage.setItem(KEY, value) : localStorage.removeItem(KEY); } catch { /* ничего страшного */ }
}

export function getToken() { return token; }

export class AuthError extends Error {}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Hero-Token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new AuthError('Нужно войти заново');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data.detail) ? 'Проверьте поля формы' : data.detail;
    throw new Error(detail || `Сервер ответил ошибкой ${res.status}`);
  }
  return data;
}
