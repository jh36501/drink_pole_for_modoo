export async function downloadOfflineHtml(): Promise<void> {
  try {
    const res = await fetch('/offline.html');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'offline.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.warn('Blob download fallback, triggering native download:', err);
    const link = document.createElement('a');
    link.href = '/offline.html';
    link.download = 'offline.html';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
