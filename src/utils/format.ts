export function formatDate(value: string | null | undefined) {
  if (!value) return '–';
  return new Date(value).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '–';
  return new Date(value).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toDateInput(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function toDateTimeInput(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function parseDateTimeInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatBytes(value: number | null) {
  if (value === null) return 'Unbekannte Größe';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function apiErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const normalized = raw.toLowerCase();
  if (normalized.includes('row-level security')) return 'Für diese Aktion fehlt die erforderliche Berechtigung.';
  if (normalized.includes('duplicate key')) return 'Dieser Eintrag existiert bereits.';
  if (normalized.includes('foreign key')) return 'Der Eintrag wird noch an anderer Stelle verwendet.';
  if (normalized.includes('last admin')) return 'Der letzte Admin kann die eigene Adminrolle nicht entfernen.';
  if (normalized.includes('admin role required')) return 'Für diese Aktion ist eine Adminrolle erforderlich.';
  if (normalized.includes('invalid account role')) return 'Die ausgewählte Kontorolle ist ungültig.';
  if (normalized.includes('network')) return 'Die Verbindung zu Supabase ist fehlgeschlagen.';
  return raw || 'Die Aktion konnte nicht ausgeführt werden.';
}
