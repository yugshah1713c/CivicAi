/* ============================================================
   CIVIC AI — map.js
   Government Infrastructure Map
   ============================================================ */

const API = {
  issues: "https://civic-ai-backend-7wv2.onrender.com/api/issues"
};

let cityMap = null;

function createPriorityIcon(priority) {

  let color;

  if (priority === "High") {
    color = "#ff5470";
  } 
  else if (priority === "Medium") {
    color = "#ff9f45";
  } 
  else {
    color = "#35d399";
  }

  return L.divIcon({
    className: "priority-marker",
    html: `
      <div style="
        width: 18px;
        height: 18px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid rgba(255,255,255,0.8);
        box-shadow: 0 0 15px ${color};
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
} 

async function renderCityMap() {

  const shell = document.getElementById('mapShell');

  if (!shell) return;

  /*
   * Create Leaflet map
   * Rajkot coordinates
   */
  cityMap = L.map('mapShell').setView(
    [22.3039, 70.8022],
    13
  );

  /*
   * OpenStreetMap tiles
   */
  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }
  ).addTo(cityMap);


  /*
   * Get reports from backend
   */
  try {

    const response = await fetch(API.issues);

    if (!response.ok) {
      throw new Error("Failed to fetch issues");
    }

    const data = await response.json();

    const reports = data.issues || [];

    console.log("Reports received:", reports);


    /*
     * Create marker for every report
     */
    reports.forEach(report => {

      /*
       * Skip reports that don't have coordinates
       */
      if (
        report.latitude === null ||
        report.longitude === null ||
        report.latitude === undefined ||
        report.longitude === undefined
      ) {
        return;
      }


      const latitude = Number(report.latitude);
      const longitude = Number(report.longitude);


      /*
       * Create marker
       */
      const marker = L.marker([
        latitude,
        longitude
      ],
      {
    icon: createPriorityIcon(report.priority)
      }).addTo(cityMap);


      /*
       * Marker popup
       */
      marker.bindPopup(`
        <div style="min-width:220px;">

          <div style="font-size:11px;color:#666;">
            ${report.report_id}
          </div>

          <h3 style="margin:5px 0;">
            ${report.issue}
          </h3>

          <div style="font-size:13px;">
            ${report.category}
          </div>

          <hr>

          <div>
            <b>Priority:</b>
            ${report.priority}
          </div>

          <div>
            <b>Severity:</b>
            ${report.severity}
          </div>

          <div>
            <b>Status:</b>
            ${report.status}
          </div>

          <div>
            <b>Department:</b>
            ${report.department}
          </div>

          <div style="margin-top:8px;color:#666;">
            ${report.location}
          </div>

        </div>
      `);

    });

  } catch (error) {

    console.error(
      "Map loading error:",
      error
    );

  }

}


document.addEventListener(
  'DOMContentLoaded',
  () => {

    renderCityMap();

  }
);