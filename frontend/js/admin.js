/* ============================================================
   CIVIC AI — admin.js (Government Console)
   ============================================================ */

/* ---------- Dashboard ---------- */
function renderAdminDashboard(){
  const grid = document.getElementById('dashStats');
  if(!grid) return;
  const reports = getReports();
  const total = reports.length;
  const critical = reports.filter(r => r.severity === 'Critical').length;
  const high = reports.filter(r => r.priority === 'High').length;
  const progress = reports.filter(r => r.status === 'In Progress').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;

  const stats = [
    { label:'Total Reports', value: total, delta:'+12% this week', dir:'up' },
    { label:'Critical Issues', value: critical, delta:'Needs attention', dir:'down' },
    { label:'High Priority', value: high, delta:'+4 today', dir:'up' },
    { label:'In Progress', value: progress, delta:'Steady', dir:'up' },
    { label:'Resolved', value: resolved, delta:'+8% this week', dir:'up' },
    { label:'Avg. Resolution', value: 3, suffix:' days', delta:'-0.4d improved', dir:'up' },
  ];
  grid.innerHTML = stats.map(s => `
    <div class="glass card stat-card reveal in">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value"><span data-count="${s.value}">0</span>${s.suffix || ''}</div>
      <div class="stat-delta ${s.dir}">${s.dir==='up'?'▲':'▼'} ${s.delta}</div>
    </div>
  `).join('');
  initCounters();

  const recentWrap = document.getElementById('dashRecent');
  if(recentWrap){
    const recent = [...reports].sort((a,b)=> new Date(b.date)-new Date(a.date)).slice(0,6);
    recentWrap.innerHTML = recent.map(r => `
      <div class="priority-row">
        <div class="priority-dot ${r.priority.toLowerCase()}"></div>
        <div style="flex:1;">
          <div style="font-weight:600;">${r.issue}</div>
          <div class="mono" style="font-size:12px;color:var(--gray-mist-dim);">${r.id} · ${r.category} · ${r.area}</div>
        </div>
        <span class="badge ${STATUS_CLASS[r.status]}">${STATUS_ICON[r.status]} ${r.status}</span>
      </div>
    `).join('');
  }
}

/* ---------- Priority Queue ---------- */
function renderPriorityQueue(){
  const wrap = document.getElementById('priorityQueue');
  if(!wrap) return;
  const order = { High:0, Medium:1, Low:2 };
  const reports = [...getReports()].sort((a,b) => order[a.priority]-order[b.priority] || new Date(b.date)-new Date(a.date));

  wrap.innerHTML = reports.map(r => `
    <div class="priority-row reveal in" onclick="location.href='admin-report-view.html?redirect=1'" style="cursor:pointer;" data-id="${r.id}">
      <div class="priority-dot ${r.priority.toLowerCase()}"></div>
      <div style="min-width:110px;" class="mono" style="font-size:12.5px;color:var(--gray-mist-dim);">${r.id}</div>
      <div style="flex:1.4;">
        <div style="font-weight:600;">${r.issue}</div>
        <div style="font-size:12.5px;color:var(--gray-mist-dim);">${CATEGORY_META[r.category]?.icon} ${r.category} · ${r.area}</div>
      </div>
      <div style="font-size:13px;color:var(--gray-mist-dim);">${formatDate(r.date)}</div>
      <div class="mono" style="font-size:13px;">${r.confidence}% AI</div>
      <div class="mono ${priorityClass(r.priority)}" style="min-width:70px;">${r.priority}</div>
      <span class="badge ${STATUS_CLASS[r.status]}">${STATUS_ICON[r.status]} ${r.status}</span>
      <div class="tag">${r.department}</div>
    </div>
  `).join('');

  // Clicking opens the details/edit view on admin-reports page instead
  wrap.querySelectorAll('.priority-row').forEach(row => {
    row.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('selectedAdminReportId', row.dataset.id);
      window.location.href = 'admin-reports.html?open=' + row.dataset.id;
    });
  });
}

/* ---------- All Reports (management table) ---------- */
let adminEditingId = null;

function renderAdminReportsTable(){
  const tbody = document.getElementById('adminReportsBody');
  if(!tbody) return;

  const search = document.getElementById('adminSearch');
  const catFilter = document.getElementById('adminCategoryFilter');
  const statusFilter = document.getElementById('adminStatusFilter');
  const priorityFilter = document.getElementById('adminPriorityFilter');

  function apply(){
    let rows = [...getReports()].sort((a,b)=> new Date(b.date)-new Date(a.date));
    const q = (search?.value || '').toLowerCase();
    if(q) rows = rows.filter(r => r.issue.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    if(catFilter?.value) rows = rows.filter(r => r.category === catFilter.value);
    if(statusFilter?.value) rows = rows.filter(r => r.status === statusFilter.value);
    if(priorityFilter?.value) rows = rows.filter(r => r.priority === priorityFilter.value);

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td data-label="ID" class="mono">${r.id}</td>
        <td data-label="Issue">${r.issue}</td>
        <td data-label="Category">${CATEGORY_META[r.category]?.icon} ${r.category}</td>
        <td data-label="Severity">${r.severity}</td>
        <td data-label="Priority" class="mono ${priorityClass(r.priority)}">${r.priority}</td>
        <td data-label="Status"><span class="badge ${STATUS_CLASS[r.status]}">${STATUS_ICON[r.status]} ${r.status}</span></td>
        <td data-label="Department">${r.department}</td>
        <td data-label="Action"><button class="btn btn-ghost btn-sm" onclick="openAdminEdit('${r.id}')">Manage</button></td>
      </tr>
    `).join('');
  }
  [search, catFilter, statusFilter, priorityFilter].forEach(el => el && el.addEventListener('input', apply));
  apply();

  const urlParams = new URLSearchParams(window.location.search);
  const openId = urlParams.get('open');
  if(openId) openAdminEdit(openId);
}

function openAdminEdit(id){
  adminEditingId = id;
  const report = getReports().find(r => r.id === id);
  if(!report) return;
  const modal = document.getElementById('adminEditModal');
  document.getElementById('editReportId').textContent = report.id;
  document.getElementById('editIssue').textContent = report.issue;
  document.getElementById('editDesc').textContent = report.description;
  document.getElementById('editSeverityFill').style.width = severityToPercent(report.severity) + '%';
  document.getElementById('editSeverityFill').className = 'severity-fill ' + severityClass(report.severity);
  document.getElementById('editSeverityLabel').textContent = report.severity.toUpperCase();
  document.getElementById('editConfidence').textContent = report.confidence + '%';
  document.getElementById('editStatusSelect').value = report.status;
  document.getElementById('editPrioritySelect').value = report.priority;
  document.getElementById('editDeptSelect').value = report.department;
  document.getElementById('editResponse').value = report.govResponse || '';
  modal.style.display = 'flex';
}
function closeAdminEdit(){
  document.getElementById('adminEditModal').style.display = 'none';
}
function saveAdminEdit(){
  const reports = getReports();
  const idx = reports.findIndex(r => r.id === adminEditingId);
  if(idx === -1) return;
  reports[idx].status = document.getElementById('editStatusSelect').value;
  reports[idx].priority = document.getElementById('editPrioritySelect').value;
  reports[idx].department = document.getElementById('editDeptSelect').value;
  reports[idx].govResponse = document.getElementById('editResponse').value;
  saveReports(reports);
  closeAdminEdit();
  showToast('Status updated', 'success');
  renderAdminReportsTable();
  renderPriorityQueue();
  renderAdminDashboard();
}

document.addEventListener('DOMContentLoaded', () => {
  seedReports();
  renderAdminDashboard();
  renderPriorityQueue();
  renderAdminReportsTable();
});
