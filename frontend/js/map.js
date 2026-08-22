/* ============================================================
   CIVIC AI — map.js (visual placeholder, ready for real map SDK)
   ============================================================ */

function renderCityMap(){
  const shell = document.getElementById('mapShell');
  if(!shell) return;
  const reports = getReports().slice(0, 14);

  // deterministic pseudo-random scatter based on id
  function hashPos(id){
    let h = 0;
    for(let i=0;i<id.length;i++) h = (h*31 + id.charCodeAt(i)) % 10000;
    const x = 8 + (h % 84);
    const y = 10 + ((h * 7) % 78);
    return { x, y };
  }

  shell.innerHTML = `<div class="map-badge-note glass">🗺️ Map integration coming soon — Leaflet / Mapbox / Google Maps ready</div>`;
  reports.forEach(r => {
    const pos = hashPos(r.id);
    const marker = document.createElement('div');
    marker.className = `map-marker ${r.priority.toLowerCase()}`;
    marker.style.left = pos.x + '%';
    marker.style.top = pos.y + '%';
    marker.title = r.issue;
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      showMapPopup(shell, r, pos);
    });
    shell.appendChild(marker);
  });
  shell.addEventListener('click', () => {
    const existing = shell.querySelector('.map-popup');
    if(existing) existing.remove();
  });
}

function showMapPopup(shell, r, pos){
  const existing = shell.querySelector('.map-popup');
  if(existing) existing.remove();
  const popup = document.createElement('div');
  popup.className = 'map-popup glass card';
  popup.style.left = pos.x + '%';
  popup.style.top = pos.y + '%';
  popup.innerHTML = `
    <div class="mono" style="font-size:11.5px;color:var(--gray-mist-dim);">${r.id}</div>
    <div style="font-weight:600;margin:4px 0 8px;">${r.issue}</div>
    <div style="font-size:12.5px;color:var(--gray-mist);margin-bottom:8px;">${CATEGORY_META[r.category]?.icon} ${r.category} · ${r.area}</div>
    <span class="badge ${STATUS_CLASS[r.status]}">${STATUS_ICON[r.status]} ${r.status}</span>
    <span class="mono ${priorityClass(r.priority)}" style="float:right;">${r.priority}</span>
  `;
  popup.addEventListener('click', (e) => e.stopPropagation());
  shell.appendChild(popup);
}

document.addEventListener('DOMContentLoaded', () => {
  seedReports();
  renderCityMap();
});
