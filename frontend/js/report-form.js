/* ============================================================
   CIVIC AI — report-form.js
   ============================================================ */

const API = {
    issues: "http://127.0.0.1:5000/api/issues"
};

let selectedCategory = null;
let uploadedImage = null;
let aiResult = null;

let selectedLatitude = null;
let selectedLongitude = null;

function initCategoryCards(){
  const cards = document.querySelectorAll('.category-card');
  if(!cards.length) return;
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedCategory = card.dataset.category;
      document.getElementById('categoryError')?.classList.add('hidden');
    });
  });
}

function initCitizenMap() {

  const mapElement = document.getElementById('citizenMap');

  if (!mapElement) return;

  const map = L.map('citizenMap').setView(
    [22.3039, 70.8022],
    13
  );

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }
  ).addTo(map);

  let marker = null;

  map.on('click', function(e) {

    const latitude = e.latlng.lat;
    const longitude = e.latlng.lng;

    selectedLatitude = latitude;
    selectedLongitude = longitude;

    console.log('Map clicked:', latitude, longitude);

    if (marker) {
      map.removeLayer(marker);
    }

    marker = L.marker([
      latitude,
      longitude
    ]).addTo(map);

    const locationInfo =
      document.getElementById('mapLocationInfo');

    if (locationInfo) {
      locationInfo.textContent =
        `📍 Selected: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }

  });

}

function initImageUpload(){
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const preview = document.getElementById('imagePreview');
  const analyzeBtn = document.getElementById('analyzeBtn');
  if(!dropzone) return;

  function handleFile(file){
    if(!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage = e.target.result;
      dropzone.querySelector('.dropzone-empty').style.display = 'none';
      preview.style.display = 'block';
      preview.querySelector('img').src = uploadedImage;
      analyzeBtn.style.display = 'inline-flex';
      document.getElementById('aiResultBox').style.display = 'none';
      aiResult = null;
    };
    reader.readAsDataURL(file);
  }

  dropzone.addEventListener('click', (e) => { if(e.target.closest('.remove-image')) return; fileInput.click(); });
  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  ['dragover','dragenter'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('dragging'); }));
  ['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('dragging'); }));
  dropzone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

  document.getElementById('removeImageBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    uploadedImage = null;
    aiResult = null;
    fileInput.value = '';
    dropzone.querySelector('.dropzone-empty').style.display = 'flex';
    preview.style.display = 'none';
    analyzeBtn.style.display = 'none';
    document.getElementById('aiResultBox').style.display = 'none';
  });

  document.getElementById('changeImageBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
}

function initAnalyze(){
  const btn = document.getElementById('analyzeBtn');
  if(!btn) return;

  btn.addEventListener('click', () => {

    const loadingBox = document.getElementById('analyzeLoading');
    const resultBox = document.getElementById('aiResultBox');
    const fill = document.getElementById('analyzeFill');
    const pct = document.getElementById('analyzePct');

    resultBox.style.display = 'none';
    loadingBox.style.display = 'block';
    btn.disabled = true;

    const detections = [
      { obj:'Garbage', sev:'High' },
      { obj:'Pothole', sev:'Critical' },
      { obj:'Water Leak', sev:'Medium' },
      { obj:'Broken Light Pole', sev:'Medium' }
    ];

    const pick =
      detections[Math.floor(Math.random()*detections.length)];

    const confidence =
      Math.floor(Math.random()*10) + 88;

    const priority =
      pick.sev === 'Critical' || pick.sev === 'High'
        ? 'High'
        : 'Medium';

    let progress = 0;

    const interval = setInterval(() => {

      progress += Math.random()*18 + 8;

      if(progress >= 100){

        progress = 100;
        clearInterval(interval);

        setTimeout(() => {

          loadingBox.style.display = 'none';
          resultBox.style.display = 'block';

          document.getElementById('resDetected').textContent = pick.obj;
          document.getElementById('resConfidence').textContent = confidence + '%';
          document.getElementById('resSeverity').textContent = pick.sev;
          document.getElementById('resPriority').textContent = priority;

          aiResult = {
            detected: pick.obj,
            confidence,
            severity: pick.sev,
            priority
          };

          btn.disabled = false;
          btn.textContent = 'Re-analyze with AI';

        }, 300);
      }

      fill.style.width = progress + '%';
      pct.textContent = Math.floor(progress) + '%';

    }, 220);
  });
}

function initSubmit(){

  const form = document.getElementById('reportForm');
  if(!form) return;

  form.addEventListener('submit', async(e) => {

    e.preventDefault();

    const issue =
      document.getElementById('issueName').value.trim();

    const description =
      document.getElementById('description').value.trim();

    const address =
      document.getElementById('address').value.trim();

    const area =
      document.getElementById('area').value.trim();

    const city =
      document.getElementById('city').value.trim();

    let valid = true;

    if(!issue || !description){
      showToast(
        'Please fill in issue name and description',
        'warn'
      );
      valid = false;
    }

    if(!selectedCategory){
      showToast(
        'Please select a category',
        'warn'
      );
      valid = false;
    }

    if(!address || !area || !city){
      showToast(
        'Please complete the location fields',
        'warn'
      );
      valid = false;
    }

    if(!valid) return;

    const submitBtn =
      document.getElementById('submitBtn');

    const overlay =
      document.getElementById('submitOverlay');

    overlay.style.display = 'flex';
    submitBtn.disabled = true;

    setTimeout(async () => {

      try {

        const report = {

          owner:
            localStorage.getItem('currentUser') || 'Demo',

          issue,
          description,
          category: selectedCategory,

          address,
          area,
          city,

          latitude: selectedLatitude,
          longitude: selectedLongitude,

          date: new Date().toISOString(),

          image: uploadedImage,

          aiDetected:
            aiResult?.detected || selectedCategory,

          confidence:
            aiResult?.confidence || 85,

          status: 'Submitted',

          department:
            CATEGORY_META[selectedCategory]?.dept ||
            'General Services',

          govResponse: ''
        };

        const response = await fetch(API.issues, {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(report)
        });

        if (!response.ok) {
          throw new Error("Failed to submit report");
        }

        const savedReport =
          await response.json();

        uploadedImage = null;

        console.log(
          "Saved by backend:",
          savedReport
        );

        overlay.innerHTML = `
          <div class="glass card text-center" style="max-width:420px;">
            <div style="font-size:46px;margin-bottom:6px;">✓</div>

            <h3>Report submitted successfully!</h3>

            <p class="mono" style="color:var(--cyan-signal);">
              Report ID: ${savedReport.id}
            </p>

            <a
              href="reports.html"
              class="btn btn-primary btn-block"
              style="margin-top:12px;"
            >
              View My Reports
            </a>
          </div>
        `;

      } catch (error) {

        console.error(
          "Submit error:",
          error
        );

        submitBtn.disabled = false;
        overlay.style.display = 'none';

        showToast(
          'Failed to submit report. Make sure the backend is running.',
          'warn'
        );
      }

    }, 1200);

  });
}

document.addEventListener('DOMContentLoaded', () => {

  initCategoryCards();
  initImageUpload();
  initAnalyze();
  initSubmit();
  initCitizenMap();

});