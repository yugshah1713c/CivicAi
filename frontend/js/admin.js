/* ============================================================
   CIVIC AI — admin.js (Government Console)
   ============================================================ */

  const ADMIN_API = {
  issues: "https://civic-ai-backend-7wv2.onrender.com/api/issues"
};

/* ---------- Dashboard ---------- */
async function renderAdminDashboard(){
  const grid = document.getElementById('dashStats');
  if(!grid) return;

  const reports = await getBackendReports();

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
async function renderPriorityQueue(){
  const wrap = document.getElementById('priorityQueue');
  if(!wrap) return;

  const order = { High:0, Medium:1, Low:2 };

  const reports = [...await getBackendReports()].sort(
    (a,b) =>
      order[a.priority]-order[b.priority] ||
      new Date(b.date)-new Date(a.date)
  );

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

async function renderAdminReportsTable(){
  const tbody = document.getElementById('adminReportsBody');
  if(!tbody) return;

  const search = document.getElementById('adminSearch');
  const catFilter = document.getElementById('adminCategoryFilter');
  const statusFilter = document.getElementById('adminStatusFilter');
  const priorityFilter = document.getElementById('adminPriorityFilter');

  async function apply(){
    let rows = [...await getBackendReports()]
      .sort((a,b) => new Date(b.date)-new Date(a.date));

    const q = (search?.value || '').toLowerCase();

    if(q) {
      rows = rows.filter(r =>
        r.issue.toLowerCase().includes(q) ||
        String(r.id).toLowerCase().includes(q)
      );
    }

    if(catFilter?.value)
      rows = rows.filter(r => r.category === catFilter.value);

    if(statusFilter?.value)
      rows = rows.filter(r => r.status === statusFilter.value);

    if(priorityFilter?.value)
      rows = rows.filter(r => r.priority === priorityFilter.value);

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td data-label="ID" class="mono">${r.id}</td>
        <td data-label="Issue">${r.issue}</td>
        <td data-label="Category">${CATEGORY_META[r.category]?.icon} ${r.category}</td>
        <td data-label="Severity">${r.severity}</td>
        <td data-label="Priority" class="mono ${priorityClass(r.priority)}">${r.priority}</td>
        <td data-label="Status">
          <span class="badge ${STATUS_CLASS[r.status]}">
            ${STATUS_ICON[r.status]} ${r.status}
          </span>
        </td>
        <td data-label="Department">${r.department}</td>
        <td data-label="Action">
          <button class="btn btn-ghost btn-sm"
                  onclick="openAdminEdit('${r.id}')">
            Manage
          </button>
        </td>
      </tr>
    `).join('');
  }

  [search, catFilter, statusFilter, priorityFilter]
    .forEach(el => el && el.addEventListener('input', apply));

  await apply();

  const urlParams = new URLSearchParams(window.location.search);
  const openId = urlParams.get('open');

  if(openId) openAdminEdit(openId);
}

async function openAdminEdit(id) {

  console.log("1. Manage clicked");
  console.log("Report ID:", id);

  adminEditingId = id;

  try {

    console.log("2. Fetching reports from Flask...");

    const reports = await getBackendReports();

    console.log("3. Reports received:", reports);

    const report = reports.find(
      r => String(r.id) === String(id)
    );

    console.log("4. Selected report:", report);

    if (!report) {
      console.error("REPORT NOT FOUND");
      console.log("Looking for ID:", id);
      console.log("Available IDs:", reports.map(r => r.id));

      showToast("Report not found", "warn");
      return;
    }

    console.log("5. Filling modal...");

    const modal = document.getElementById('adminEditModal');

    if (!modal) {
      console.error("adminEditModal NOT FOUND");
      return;
    }

    document.getElementById('editReportId').textContent =
      report.id;

    document.getElementById('editIssue').textContent =
      report.issue;

    document.getElementById('editDesc').textContent =
      report.description;

    document.getElementById('editSeverityFill').style.width =
      severityToPercent(report.severity) + '%';

    document.getElementById('editSeverityFill').className =
      'severity-fill ' + severityClass(report.severity);

    document.getElementById('editSeverityLabel').textContent =
      String(report.severity).toUpperCase();

    document.getElementById('editConfidence').textContent =
      report.confidence + '%';


    const aiDetectedElement =
       document.getElementById('editAIDetected');

    if (aiDetectedElement) {
       aiDetectedElement.textContent =
      report.aiDetected || 'Not detected';
    }

    if(report.image != null){
      document.getElementById('editReportImage').src = 
      report.image;
    }else{
      document.getElementById("image_holder").style="none"
    }

    document.getElementById('editStatusSelect').value =
      report.status;

    document.getElementById('editPrioritySelect').value =
      report.priority;

    document.getElementById('editDeptSelect').value =
      report.department;

    document.getElementById('editResponse').value =
      report.govResponse || '';

    console.log("6. Opening modal");

    modal.style.display = 'flex';

    console.log("7. SUCCESS");

  } catch (error) {

    console.error("OPEN ADMIN EDIT ERROR:", error);

    showToast(
      "Could not load report details",
      "warn"
    );
  }
}
function closeAdminEdit(){
  document.getElementById('adminEditModal').style.display = 'none';
}


async function saveAdminEdit(){

  const status = document.getElementById('editStatusSelect').value;
  const priority = document.getElementById('editPrioritySelect').value;
  const department = document.getElementById('editDeptSelect').value;
  const govResponse = document.getElementById('editResponse').value;

  try {

    const response = await fetch(
      `${ADMIN_API.issues}/${adminEditingId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          priority,
          department,
          govResponse
        })
      }
    );

    if(!response.ok){
      throw new Error("Failed to update issue");
    }

    const updatedIssue = await response.json();

    console.log("Updated by backend:", updatedIssue);

    closeAdminEdit();

    showToast('Issue updated successfully', 'success');

    await renderAdminReportsTable();
    await renderPriorityQueue();
    await renderAdminDashboard();

  } catch(error){

    console.error("Update error:", error);

    showToast(
      'Failed to update issue. Make sure the backend is running.',
      'warn'
    );

  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderAdminDashboard();
  renderPriorityQueue();
  renderAdminReportsTable();
});