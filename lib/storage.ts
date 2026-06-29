export interface HistoryEntry {
  code: string;
  name: string;
  lastVisited: string; // ISO string
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older eReader browsers that lack crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const isBrowser = () => typeof window !== 'undefined';

export function getDisplayName(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem('paperchat_name');
}

export function setDisplayName(name: string): void {
  if (!isBrowser()) return;
  localStorage.setItem('paperchat_name', name);
}

export function getUID(): string {
  if (!isBrowser()) return '';
  let uid = localStorage.getItem('paperchat_uid');
  if (!uid) {
    uid = generateUUID();
    localStorage.setItem('paperchat_uid', uid);
  }
  return uid;
}

export function getHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const historyRaw = localStorage.getItem('paperchat_history');
    if (!historyRaw) return [];
    const parsed = JSON.parse(historyRaw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse paperchat_history', e);
  }
  return [];
}

export function addToHistory(code: string, name: string): void {
  if (!isBrowser()) return;
  const history = getHistory();
  // Remove existing entry for this code if present
  const filtered = history.filter((entry) => entry.code !== code);
  
  // Add to the front
  filtered.unshift({
    code,
    name,
    lastVisited: new Date().toISOString(),
  });
  
  // Limit history to 10 entries
  const limited = filtered.slice(0, 10);
  localStorage.setItem('paperchat_history', JSON.stringify(limited));
}

export function clearHistory(): void {
  if (!isBrowser()) return;
  localStorage.removeItem('paperchat_history');
}
