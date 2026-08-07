const TOKEN_KEY = 'token';
const USERNAME_KEY = 'username';

function readStore(key: string): string | null {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
}

export function getAuthToken(): string | null {
  return readStore(TOKEN_KEY);
}

export function getAuthUsername(): string | null {
  return readStore(USERNAME_KEY);
}

/** Persist session. remember=true → localStorage (survives browser close); false → sessionStorage. */
export function setAuthSession(token: string, username: string, remember: boolean) {
  clearAuthSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, token);
  store.setItem(USERNAME_KEY, username);
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USERNAME_KEY);
}

export function setAuthUsername(username: string) {
  if (sessionStorage.getItem(TOKEN_KEY)) {
    sessionStorage.setItem(USERNAME_KEY, username);
  } else {
    localStorage.setItem(USERNAME_KEY, username);
  }
}
