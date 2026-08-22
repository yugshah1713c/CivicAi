/* ============================================================
   CIVIC AI — analytics.js
   ============================================================ */

function renderBarChart(containerId, dataObj, colorVar){
  const el = document.getElementById(containerId);
  if(!el) return;
  const max = Math.max(...Object.values(dataObj), 1);
  el.innerHTML = Object.entries(dataObj).map(([label, value]) => `
    <div class="bar-col">
      <div class="bar-value">${value}</div>
      <div class="bar" data-h="${(value/max*100).toFixed(0)}"></div>
      <div class="bar-label">${label}</div>
    </div>
  `).join('');
  requestAnimationFrame(() => {
    el.querySelectorAll('.bar').forEach(b => { b.style.height = b.dataset.h + '%'; });
  });
}

function groupBy(arr, key){
  return arr.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function renderLineChart(containerId, points){
  const el = document.getElementById(containerId);
  if(!el) return;
  const w = 560, h = 200, pad = 20;
  const max = Math.max(...points.map(p=>p.value), 1);
  const stepX = (w - pad*2) / (points.length - 1);
  const coords = points.map((p,i) => {
    const x = pad + i*stepX;
    const y = h - pad - (p.value/max) * (h - pad*2);
    return { x, y, ...p };
  });
  const path = coords.map((c,i) => (i===0?'M':'L') + c.x.toFixed(1) + ',' + c.y.toFixed(1)).join(' ');
  const area = path + ` L${coords[coords.length-1].x},${h-pad} L${coords[0].x},${h-pad} Z`;

  el.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;">
      <defs>
        <linearGradient id="lineFillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(79,224,232,0.35)"/>
          <stop offset="100%" stop-color="rgba(79,224,232,0)"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#lineFillGrad)"/>
      <path d="${path}" fill="none" stroke="#4fe0e8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      ${coords.map(c => `<circle cx="${c.x}" cy="${c.y}" r="3.4" fill="#0d1730" stroke="#4fe0e8" stroke-width="2"/>`).join('')}
      ${coords.map(c => `<text x="${c.x}" y="${h-2}" font-size="10" fill="#8c9bb8" text-anchor="middle">${c.label}</text>`).join('')}
    </svg>`;
}

function renderAnalytics(){
  const page = document.getElementById('analyticsPage');
  if(!page) return;
  const reports = getReports();

  renderBarChart('chartCategory', groupBy(reports, 'category'));
  renderBarChart('chartSeverity', groupBy(reports, 'severity'));
  renderBarChart('chartStatus', groupBy(reports, 'status'));
  renderBarChart('chartArea', groupBy(reports, 'area'));

  // Reports over time — group by day bucket (last 7 buckets)
  const byDate = {};
  reports.forEach(r => {
    const d = new Date(r.date);
    const label = d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    byDate[label] = (byDate[label] || 0) + 1;
  });
  const points = Object.entries(byDate).slice(-8).map(([label,value]) => ({ label, value }));
  if(points.length < 2){ points.push({label:'Today', value: reports.length}); }
  renderLineChart('chartTimeline', points);
}

document.addEventListener('DOMContentLoaded', () => {
  seedReports();
  renderAnalytics();
});
