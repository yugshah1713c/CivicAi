/* ============================================================
   CIVIC AI — reports.js
   Shared data layer: localStorage-backed "reports" table
   ============================================================ */

const REPORTS_API = {
  issues: "https://civic-ai-backend-7wv2.onrender.com/api/issues"
};

const CATEGORY_META = {
  'Water Leakage':        { icon:'💧', dept:'Water Board' },
  'Garbage':               { icon:'🗑️', dept:'Sanitation Dept' },
  'Broken Street Light':   { icon:'💡', dept:'Electrical Dept' },
  'Road Damage':           { icon:'🛣️', dept:'Public Works' },
  'Drainage Problem':      { icon:'🚰', dept:'Drainage Authority' },
  'Other':                 { icon:'📌', dept:'General Services' },
};

const STATUS_ORDER = [
  'Submitted',
  'Pending',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved'
];
const STATUS_CLASS = {
  'Pending':'badge-submitted',
  'Submitted':'badge-submitted',
  'Under Review':'badge-review',
  'Assigned':'badge-assigned',
  'In Progress':'badge-progress',
  'Resolved':'badge-resolved',
  'Rejected':'badge-rejected'
};

const STATUS_ICON = {
  'Pending':'🟡',
  'Submitted':'🟡',
  'Under Review':'🔵',
  'Assigned':'🟣',
  'In Progress':'🟠',
  'Resolved':'🟢',
  'Rejected':'🔴'
};

function getReports(){
  return JSON.parse(localStorage.getItem('reports') || '[]');
}
async function getBackendReports(email) {
  const response = await fetch(
    `${REPORTS_API.issues}?email=${encodeURIComponent(email)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  const data = await response.json();

  return data.issues;
}

function saveReports(reports){
  localStorage.setItem('reports', JSON.stringify(reports));
}
function generateReportId(){
  return 'CIV-' + Math.floor(10000 + Math.random()*89999);
}

function seedReports(){
  if(localStorage.getItem('reportsSeeded')) return;
  const areas = ['Ward 3 - Riverside','Ward 7 - North Zone','Ward 5 - Market Street','Ward 2 - Old Town','Ward 9 - Tech Park'];
  const demo = [
    ['Overflowing garbage bin','Garbage','High',92,'In Progress'],
    ['Broken street light near park','Broken Street Light','Medium',87,'Assigned'],
    ['Pothole causing traffic issues','Road Damage','Critical',95,'Under Review'],
    ['Water pipe leaking on main road','Water Leakage','High',90,'Submitted'],
    ['Blocked drainage after rain','Drainage Problem','Medium',81,'Resolved'],
    ['Garbage pile near school','Garbage','Critical',96,'Assigned'],
    ['Street light flickering all night','Broken Street Light','Low',78,'Resolved'],
    ['Large pothole, vehicles damaged','Road Damage','High',93,'In Progress'],
    ['Sewage overflow near market','Drainage Problem','Critical',97,'Under Review'],
    ['Leaking public tap wasting water','Water Leakage','Medium',84,'Submitted'],
    ['Uncollected garbage for a week','Garbage','High',89,'Under Review'],
    ['Damaged footpath tiles','Road Damage','Low',72,'Resolved'],
  ];
  const reports = demo.map(([issue, category, severity, confidence, status], i) => {
    const d = new Date();
    d.setDate(d.getDate() - (demo.length - i) * 2);
    return {
      id: generateReportId(),
      owner: 'Demo',
      issue, category,
      description: `Citizen-reported ${category.toLowerCase()} issue requiring civic attention. Reported via mobile upload.`,
      address: `${12+i} Sector Road`, area: areas[i % areas.length], city: 'Rajkot',
      date: d.toISOString(),
      image: null,
      aiDetected: category, confidence,
      severity,
      priority: severity === 'Critical' || severity === 'High' ? 'High' : (severity === 'Medium' ? 'Medium' : 'Low'),
      status,
      department: CATEGORY_META[category]?.dept || 'General Services',
      govResponse: status === 'Resolved' ? 'Issue verified and resolved by field team.' : ''
    };
  });
  saveReports(reports);
  localStorage.setItem('reportsSeeded', 'true');
}

function severityToPercent(sev){
  return { Low: 32, Medium: 58, High: 82, Critical: 95 }[sev] || 50;
}
function severityClass(sev){
  return { Low:'low', Medium:'medium', High:'high', Critical:'critical' }[sev] || 'medium';
}
function priorityClass(p){
  return { High:'priority-high', Medium:'priority-medium', Low:'priority-low' }[p] || '';
}
function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

/* ---------------- My Reports Page ---------------- */
async function renderMyReports(){

  // 🔐 Citizen must be logged in
  requireCitizen();

  const list = document.getElementById('reportsList');
  const emptyState = document.getElementById('emptyState');

  if(!list) return;

  const email = localStorage.getItem('currentUserEmail');

  if (!email) {
    window.location.href = 'login.html';
    return;
  }

  let all = await getBackendReports(email);

  all = all.sort((a, b) => new Date(b.date) - new Date(a.date));

  const search = document.getElementById('searchInput');
  const catFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const priorityFilter = document.getElementById('priorityFilter');

  function apply(){
    let rows = all;
    const q = (search?.value || '').toLowerCase();
    if(q) {
  rows = rows.filter(r =>
    r.issue.toLowerCase().includes(q) ||
    String(r.id).toLowerCase().includes(q)
  );
}
    if(catFilter?.value) rows = rows.filter(r => r.category === catFilter.value);
    if(statusFilter?.value) rows = rows.filter(r => r.status === statusFilter.value);
    if(priorityFilter?.value) rows = rows.filter(r => r.priority === priorityFilter.value);

    if(rows.length === 0){
      list.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    list.innerHTML = rows.map(r => `
      <div class="card glass reveal in report-row" onclick="openReport('${r.id}')" style="cursor:pointer; margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:16px; min-width:220px;">
          <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(79,224,232,0.08);">${CATEGORY_META[r.category]?.icon || '📌'}</div>
          <div>
            <div style="font-weight:600;">${r.issue}</div>
            <div class="mono" style="font-size:12px;color:var(--gray-mist-dim);">${r.id} · ${formatDate(r.date)}</div>
          </div>
        </div>
        <div class="tag">${r.category}</div>
        <div class="mono ${priorityClass(r.priority)}" style="font-size:13px;">${r.priority} priority</div>
        <span class="badge ${STATUS_CLASS[r.status]}">${STATUS_ICON[r.status]} ${r.status}</span>
      </div>
    `).join('');
  }
  [search, catFilter, statusFilter, priorityFilter].forEach(el => el && el.addEventListener('input', apply));
  apply();
}

function openReport(id){
  localStorage.setItem('selectedReportId', id);
  window.location.href = 'report-details.html';
}

/* ---------------- Report Details Page ---------------- */
async function renderReportDetails(){
  const wrap = document.getElementById('reportDetailWrap');
  if(!wrap) return;

  const id = localStorage.getItem('selectedReportId');


  if(!id){
    wrap.innerHTML = `
      <div class="glass card text-center">
        <h3>No report selected</h3>
        <p>Head back to My Reports to choose a report.</p>
        <a href="reports.html" class="btn btn-primary">My Reports</a>
      </div>
    `;
    return;
  }

  try {

    // Get reports from Flask backend
    const email = localStorage.getItem('currentUserEmail');

  if (!email) {
  window.location.href = 'login.html';
  return;
  }

  const allReports = await getBackendReports(email);

    // Find the selected report
    const report = allReports.find(r => String(r.id) === String(id));

    if(!report){
      wrap.innerHTML = `
        <div class="glass card text-center">
          <h3>Report not found</h3>
          <p>This report could not be found in the backend.</p>
          <a href="reports.html" class="btn btn-primary">My Reports</a>
        </div>
      `;
      return;
    }

    const statusIndex = STATUS_ORDER.indexOf(report.status);

    wrap.innerHTML = `
      <div class="grid-2" style="align-items:start;">

        <div class="glass card reveal in">

          <div class="eyebrow">${report.id}</div>

          <h2>${report.issue}</h2>

          <p>${report.description}</p>

          <div class="divider"></div>

          <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:16px;
            font-size:14px;
          ">

            <div>
              <div style="color:var(--gray-mist-dim);font-size:12px;">
                CATEGORY
              </div>

              ${CATEGORY_META[report.category]?.icon || '📌'}
              ${report.category}
            </div>


            <div>
              <div style="color:var(--gray-mist-dim);font-size:12px;">
                DATE FILED
              </div>

              ${formatDate(report.date)}
            </div>


            <div>
              <div style="color:var(--gray-mist-dim);font-size:12px;">
                LOCATION
              </div>

             ${report.location || 'Location not provided'}
            </div>


            <div>
              <div style="color:var(--gray-mist-dim);font-size:12px;">
                DEPARTMENT
              </div>

              ${report.department}
            </div>


            <div>
              <div style="color:var(--gray-mist-dim);font-size:12px;">
                STATUS
              </div>

              <span class="badge ${STATUS_CLASS[report.status] || 'badge-submitted'}">
                ${STATUS_ICON[report.status] || '🟡'}
                ${report.status}
              </span>
            </div>


            <div>
              <div style="color:var(--gray-mist-dim);font-size:12px;">
                PRIORITY
              </div>

              <span class="mono ${priorityClass(report.priority)}">
                ${report.priority}
              </span>
            </div>

          </div>


          ${
            report.image
            ?
            `
            <div class="divider"></div>

            <img
              src="${report.image}"
              style="
                border-radius:14px;
                max-height:260px;
                object-fit:cover;
                width:100%;
              "
            >
            `
            :
            ''
          }


          <div class="divider"></div>

          <div class="eyebrow" style="margin-bottom:8px;">
            AI Detection
          </div>

          <div style="
            display:flex;
            gap:24px;
            flex-wrap:wrap;
            font-size:14px;
          ">

            <div>
              Detected:
              <b>${report.aiDetected}</b>
            </div>

            <div>
              Confidence:
              <b class="mono">${report.confidence}%</b>
            </div>

            <div>
              Severity:
              <b>${report.severity}</b>
            </div>

          </div>


          ${
            report.govResponse
            ?
            `
            <div class="divider"></div>

            <div class="eyebrow">
              Government Response
            </div>

            <p>${report.govResponse}</p>
            `
            :
            ''
          }

        </div>


        <div class="glass card reveal in">

          <h3>Report Timeline</h3>

          <div class="timeline">

            ${STATUS_ORDER.map((s, i) => `

              <div class="timeline-item ${
                i < statusIndex
                  ? 'done'
                  : i === statusIndex
                    ? 'active'
                    : ''
              }">

                <div class="timeline-dot">
                  ${
                    i < statusIndex
                      ? '✓'
                      : i === statusIndex
                        ? '●'
                        : '○'
                  }
                </div>

                <div>

                  <div class="timeline-label">
                    ${
                      s === 'Submitted'
                        ? 'Report Submitted'
                        : s === 'Under Review'
                          ? 'Government Review'
                          : s
                    }
                  </div>

                  ${
                    i === 0
                      ? '<div class="timeline-sub">AI analysis complete on submission</div>'
                      : ''
                  }

                </div>

              </div>

            `).join('')}

          </div>

        </div>

      </div>
    `;

  } catch(error) {

    console.error("Failed to load report details:", error);

    wrap.innerHTML = `
      <div class="glass card text-center">
        <h3>Unable to load report</h3>
        <p>Please make sure the Flask backend is running.</p>
        <a href="reports.html" class="btn btn-primary">
          My Reports
        </a>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderMyReports();
  renderReportDetails();
});