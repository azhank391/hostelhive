// Generic download helper for exporting CSV or JSON data
// Usage: downloadExport({ url: `/api/hostels/${hostelId}/rooms/export`, format: 'csv', filename: `rooms-${hostelId}` })

export interface DownloadExportOptions {
  url: string; // endpoint without format param
  format?: 'csv' | 'json';
  filename: string; // base filename without extension/date
  query?: Record<string,string|number|undefined>;
  token?: string | null;
  includeDate?: boolean; // default true
}

export async function downloadExport(opts: DownloadExportOptions): Promise<void> {
  const {
    url,
    format = 'csv',
    filename,
    query = {},
    token = (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null),
    includeDate = true
  } = opts;

  const params = new URLSearchParams();
  params.set('format', format);
  Object.entries(query).forEach(([k,v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v));
  });

  const fullUrl = `${url}?${params.toString()}`;

  const resp = await fetch(fullUrl, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!resp.ok) throw new Error(`Export failed (${resp.status})`);

  if (format === 'csv') {
    const blob = await resp.blob();
    triggerDownload(blob, `${filename}${includeDate?'-'+today():''}.csv`);
  } else {
    const data = await resp.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${filename}${includeDate?'-'+today():''}.json`);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function today() {
  return new Date().toISOString().split('T')[0];
}
