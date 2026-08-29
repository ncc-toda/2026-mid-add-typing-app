const STORAGE_KEY = "tb_player_id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getPlayerId(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing && UUID_RE.test(existing)) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
