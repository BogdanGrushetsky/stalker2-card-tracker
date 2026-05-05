import { Card } from '@/types';
import { getToken, clearAuth } from './auth';

const BASE = '/api';

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes(res: Response) {
  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchCards(): Promise<Card[]> {
  const res = await fetch(`${BASE}/cards`, {
    cache: 'no-store',
    headers: authHeaders(),
  });
  return handleRes(res);
}

export async function updateOwned(id: number, owned: number): Promise<Card> {
  const res = await fetch(`${BASE}/cards/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ owned }),
  });
  return handleRes(res);
}

export async function updateName(id: number, name: string): Promise<Card> {
  const res = await fetch(`${BASE}/cards/${id}/name`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  return handleRes(res);
}

export interface UserStats {
  id: number;
  username: string;
  display_name: string;
  owned_unique: number;
  total_cards: number;
}

export async function fetchUsers(): Promise<UserStats[]> {
  const res = await fetch(`${BASE}/users`, { headers: authHeaders() });
  return handleRes(res);
}

export async function fetchUserCards(userId: number): Promise<Card[]> {
  const res = await fetch(`${BASE}/cards/user/${userId}`, { headers: authHeaders() });
  return handleRes(res);
}

export async function parseNotes(text: string): Promise<{ cardNumber: number; owned: number }[]> {
  const res = await fetch(`${BASE}/cards/parse-notes`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify({ text }),
  });
  return handleRes(res);
}

export async function applyParsed(
  entries: { cardNumber: number; owned: number }[],
  mode: 'full' | 'merge',
): Promise<Card[]> {
  const res = await fetch(`${BASE}/cards/apply-parsed`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify({ entries, mode }),
  });
  return handleRes(res);
}

export async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleRes(res);
}

export async function register(username: string, password: string, displayName: string) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, displayName }),
  });
  return handleRes(res);
}
