/* ============================================================
   CIVIC AI — report-form.js
   Citizen Report Form
   ============================================================ */

const API = {
  issues: "https://civic-ai-backend-7wv2.onrender.com/api/issues",
  aiTest: "http://127.0.0.1:5000/api/ai-test"
};

let selectedCategory = null;
let uploadedImage = null;
let uploadedFile = null;
let aiResult = null;

/*
 * IMPORTANT:
 * These are completely separate from:
 * address, area, city
 *
 * They store ONLY the exact map location.
 */
let selectedLatitude = null;
let selectedLongitude = null;


/* ============================================================
   CATEGORY SELECTION
   ============================================================ */

function initCategoryCards() {

  const cards = document.querySelectorAll('.category-card');

  if (!cards.length) return;

  cards.forEach(card => {

    card.addEventListener('click', () => {

      cards.forEach(c =>
        c.classList.remove('selected')
      );

      card.classList.add('selected');

      selectedCategory =
        card.dataset.category;

      document
        .getElementById('categoryError')
        ?.classList.add('hidden');

    });

  });

}


/* ============================================================
   CITIZEN MAP
   ============================================================ */

function initCitizenMap() {

  const mapElement =
    document.getElementById('citizenMap');

  if (!mapElement) return;

  /*
   * Default map position
   * This does NOT become the selected location.
   */
  const map = L.map('citizenMap').setView(
    [22.3039, 70.8022],
    13
  );


  /*
   * OpenStreetMap
   */

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution:
        '&copy; OpenStreetMap contributors'
    }
  ).addTo(map);


  /*
   * Marker representing the EXACT
   * location selected by the citizen.
   */

  let marker = null;


  /*
   * Citizen clicks map
   */

  map.on('click', function(e) {

    selectedLatitude =
      e.latlng.lat;

    selectedLongitude =
      e.latlng.lng;


    console.log(
      "Selected map location:",
      selectedLatitude,
      selectedLongitude
    );


    /*
     * Remove old marker
     */

    if (marker) {
      map.removeLayer(marker);
    }


    /*
     * Create new marker
     */

    marker = L.marker([
      selectedLatitude,
      selectedLongitude
    ]).addTo(map);


    /*
     * Popup on marker
     */

    marker.bindPopup(`
      <div style="font-size:13px;">
        <strong>📍 Issue Location</strong>
        <br><br>
        Latitude:
        ${selectedLatitude.toFixed(6)}
        <br>
        Longitude:
        ${selectedLongitude.toFixed(6)}
      </div>
    `).openPopup();


    /*
     * Update information below map
     */

    const locationInfo =
      document.getElementById(
        'mapLocationInfo'
      );

    if (locationInfo) {

      locationInfo.textContent =
        `📍 Exact issue location selected: ` +
        `${selectedLatitude.toFixed(6)}, ` +
        `${selectedLongitude.toFixed(6)}`;

    }

  });

}


/* ============================================================
   IMAGE UPLOAD
   ============================================================ */

function initImageUpload() {

  const dropzone =
    document.getElementById('dropzone');

  const fileInput =
    document.getElementById('fileInput');

  const preview =
    document.getElementById('imagePreview');

  const analyzeBtn =
    document.getElementById('analyzeBtn');

  if (!dropzone) return;


  function handleFile(file) {

    if (
      !file ||
      !file.type.startsWith('image/')
    ) {
      return;
    }
    uploadedFile = file;


    const reader =
      new FileReader();


    reader.onload = (e) => {

      uploadedImage =
        e.target.result;


      dropzone.querySelector(
        '.dropzone-empty'
      ).style.display = 'none';


      preview.style.display =
        'block';


      preview.querySelector(
        'img'
      ).src = uploadedImage;


      analyzeBtn.style.display =
        'inline-flex';


      document.getElementById(
        'aiResultBox'
      ).style.display = 'none';


      aiResult = null;

    };


    reader.readAsDataURL(file);

  }


  /*
   * Click upload
   */

  dropzone.addEventListener(
    'click',
    (e) => {

      if (
        e.target.closest(
          '.remove-image'
        )
      ) {
        return;
      }

      fileInput.click();

    }
  );


  /*
   * File selected
   */

  fileInput.addEventListener(
    'change',
    (e) => {

      handleFile(
        e.target.files[0]
      );

    }
  );


  /*
   * Drag over
   */

  ['dragover', 'dragenter']
    .forEach(evt => {

      dropzone.addEventListener(
        evt,
        (e) => {

          e.preventDefault();

          dropzone.classList.add(
            'dragging'
          );

        }
      );

    });


  /*
   * Drag leave / drop
   */

  ['dragleave', 'drop']
    .forEach(evt => {

      dropzone.addEventListener(
        evt,
        (e) => {

          e.preventDefault();

          dropzone.classList.remove(
            'dragging'
          );

        }
      );

    });


  /*
   * Drop file
   */

  dropzone.addEventListener(
    'drop',
    (e) => {

      handleFile(
        e.dataTransfer.files[0]
      );

    }
  );


  /*
   * Remove image
   */

  document
    .getElementById('removeImageBtn')
    ?.addEventListener(
      'click',
      (e) => {

        e.stopPropagation();

        uploadedImage = null;

        aiResult = null;

        fileInput.value = '';

        dropzone.querySelector(
          '.dropzone-empty'
        ).style.display = 'flex';

        preview.style.display =
          'none';

        analyzeBtn.style.display =
          'none';

        document.getElementById(
          'aiResultBox'
        ).style.display = 'none';

      }
    );


  /*
   * Change image
   */

  document
    .getElementById('changeImageBtn')
    ?.addEventListener(
      'click',
      (e) => {

        e.stopPropagation();

        fileInput.click();

      }
    );

}


/* ============================================================
   AI ANALYSIS
   ============================================================ */

/* ============================================================
   AI ANALYSIS — REAL YOLO
   ============================================================ */

function initAnalyze() {

  const btn =
    document.getElementById('analyzeBtn');

  if (!btn) return;


  btn.addEventListener(
    'click',
    async () => {

      const loadingBox =
        document.getElementById('analyzeLoading');

      const resultBox =
        document.getElementById('aiResultBox');

      const fill =
        document.getElementById('analyzeFill');

      const pct =
        document.getElementById('analyzePct');


      /* --------------------------------
         Check image
         -------------------------------- */

      if (!uploadedFile) {

        showToast(
          'Please upload an image first',
          'warn'
        );

        return;

      }


      /* --------------------------------
         Show loading
         -------------------------------- */

      resultBox.style.display =
        'none';

      loadingBox.style.display =
        'block';

      btn.disabled = true;

      fill.style.width = '20%';
      pct.textContent = '20%';


      try {

        /* --------------------------------
           Create FormData
           -------------------------------- */

        const formData =
          new FormData();

        formData.append(
          'image',
          uploadedFile
        );


        fill.style.width = '40%';
        pct.textContent = '40%';


        /* --------------------------------
           Send image to YOLO backend
           -------------------------------- */

        const response =
          await fetch(
            API.aiTest,
            {
              method: 'POST',
              body: formData
            }
          );


        fill.style.width = '70%';
        pct.textContent = '70%';


        if (!response.ok) {

          throw new Error(
            `AI server returned ${response.status}`
          );

        }


        const data =
          await response.json();


        console.log(
          'REAL YOLO RESULT:',
          data
        );


        /* --------------------------------
           Check response
           -------------------------------- */

        if (
          !data.success ||
          !data.detection
        ) {

          throw new Error(
            data.error ||
            'No AI detection result'
          );

        }


        const detected =
          data.detection.detected;

        const confidence =
          data.detection.confidence;


        /* --------------------------------
           No detection
           -------------------------------- */

        if (!detected) {

          aiResult = {

            detected:
              'No issue detected',

            confidence: 0,

            severity:
              'Low',

            priority:
              'Low'

          };

        }

        else {

          /* --------------------------------
             YOLO → Civic AI names
             -------------------------------- */

          const displayNames = {

            'POTHOLES':
              'Pothole',

            'GARBAGE':
              'Garbage',

            'GRAFFITI':
              'Graffiti',

            'BAD_STREETLIGHT':
              'Bad Streetlight',

            'BROKEN_SIGNAGE':
              'Broken Signage',

            'FADED_SIGNAGE':
              'Faded Signage',

            'BAD_BILLBOARD':
              'Bad Billboard',

            'CLUTTER_SIDEWALK':
              'Cluttered Sidewalk',

            'CONSTRUCTION_ROAD':
              'Construction Road',

            'SAND_ON_ROAD':
              'Sand on Road',

            'UNKEPT_FACADE':
              'Unkept Facade'

          };


          const displayName =
            displayNames[detected]
            || detected;


          /* --------------------------------
             Severity
             -------------------------------- */

          let severity =
            'Low';


          if (
            detected === 'POTHOLES' ||
            detected === 'CONSTRUCTION_ROAD'
          ) {

            severity =
              'High';

          }

          else if (
            detected === 'GARBAGE' ||
            detected === 'CLUTTER_SIDEWALK' ||
            detected === 'SAND_ON_ROAD'
          ) {

            severity =
              'Medium';

          }


          /* --------------------------------
             Priority
             -------------------------------- */

          const priority =
            severity === 'High'
              ? 'High'
              : severity === 'Medium'
                ? 'Medium'
                : 'Low';


          /* --------------------------------
             Save AI result
             -------------------------------- */

          aiResult = {

            detected:
              displayName,

            confidence:
              confidence,

            severity:
              severity,

            priority:
              priority

          };

        }


        /* --------------------------------
           Finish loading
           -------------------------------- */

        fill.style.width =
          '100%';

        pct.textContent =
          '100%';


        setTimeout(
          () => {

            loadingBox.style.display =
              'none';

            resultBox.style.display =
              'block';


            /* --------------------------------
               Display detected issue
               -------------------------------- */

            document.getElementById(
              'resDetected'
            ).textContent =
              aiResult.detected;


            document.getElementById(
              'resConfidence'
            ).textContent =
              aiResult.confidence + '%';


            document.getElementById(
              'resSeverity'
            ).textContent =
              aiResult.severity;


            document.getElementById(
              'resPriority'
            ).textContent =
              aiResult.priority;


            btn.disabled =
              false;

            btn.textContent =
              'Re-analyze with AI';


          },
          400
        );


      }

      catch (error) {

        console.error(
          'REAL YOLO AI ERROR:',
          error
        );


        loadingBox.style.display =
          'none';

        btn.disabled =
          false;

        btn.textContent =
          'Analyze with AI';


        showToast(
          'AI analysis failed. Check the backend.',
          'warn'
        );

      }

    }
  );

}


/* ============================================================
   SUBMIT REPORT
   ============================================================ */

function initSubmit() {

  const form =
    document.getElementById(
      'reportForm'
    );

  if (!form) return;


  form.addEventListener(
    'submit',
    async (e) => {

      e.preventDefault();


      /* --------------------------------
         Get typed location
         -------------------------------- */

      const issue =
        document
          .getElementById('issueName')
          .value
          .trim();


      const description =
        document
          .getElementById('description')
          .value
          .trim();


      /*
       * These are the CITIZEN-TYPED values.
       */

      const address =
        document
          .getElementById('address')
          .value
          .trim();


      const area =
        document
          .getElementById('area')
          .value
          .trim();


      const city =
        document
          .getElementById('city')
          .value
          .trim();


      /* --------------------------------
         Validation
         -------------------------------- */

      let valid = true;


      if (
        !issue ||
        !description
      ) {

        showToast(
          'Please fill in issue name and description',
          'warn'
        );

        valid = false;

      }


      if (!selectedCategory) {

        showToast(
          'Please select a category',
          'warn'
        );

        valid = false;

      }


      /*
       * Validate typed location
       */

      if (
        !address ||
        !area ||
        !city
      ) {

        showToast(
          'Please complete the location fields',
          'warn'
        );

        valid = false;

      }


      /*
       * Validate MAP location separately.
       *
       * This does NOT check address/area/city.
       */

      if (
        selectedLatitude === null ||
        selectedLongitude === null
      ) {

        showToast(
          'Please select the exact issue location on the map',
          'warn'
        );

        valid = false;

      }


      if (!valid) {
        return;
      }


      /* --------------------------------
         Submit UI
         -------------------------------- */

      const submitBtn =
        document.getElementById(
          'submitBtn'
        );


      const overlay =
        document.getElementById(
          'submitOverlay'
        );


      overlay.style.display =
        'flex';

      submitBtn.disabled =
        true;


      setTimeout(
        async () => {

          try {


            /* --------------------------------
               Create report
               -------------------------------- */

            const report = {

              owner:
                localStorage.getItem(
                  'currentUser'
                ) || 'Demo',


              issue,

              description,

              category:
                selectedCategory,


              /*
               * USER ENTERED LOCATION
               */

              address,

              area,

              city,


              /*
               * EXACT MAP LOCATION
               */

              latitude:
                selectedLatitude,

              longitude:
                selectedLongitude,


              date:
                new Date().toISOString(),


              image:
                uploadedImage,


              aiDetected:
                aiResult?.detected ||
                selectedCategory,


              confidence:
                aiResult?.confidence ||
                85,


              status:
                'Submitted',


              department:
                CATEGORY_META[
                  selectedCategory
                ]?.dept ||
                'General Services',


              govResponse:
                ''

            };


            console.log(
              'Sending report:',
              report
            );


            /* --------------------------------
               Send to Flask
               -------------------------------- */

            const response =
              await fetch(
                API.issues,
                {

                  method: 'POST',

                  headers: {
                    'Content-Type':
                      'application/json'
                  },

                  body:
                    JSON.stringify(
                      report
                    )

                }
              );


            if (!response.ok) {

              throw new Error(
                'Failed to submit report'
              );

            }


            const savedReport =
              await response.json();


            console.log(
              'Saved by backend:',
              savedReport
            );


            uploadedImage =
              null;


            /* --------------------------------
               Success screen
               -------------------------------- */

            overlay.innerHTML = `

              <div
                class="glass card text-center"
                style="max-width:420px;"
              >

                <div
                  style="
                    font-size:46px;
                    margin-bottom:6px;
                  "
                >
                  ✓
                </div>


                <h3>
                  Report submitted successfully!
                </h3>


                <p
                  class="mono"
                  style="
                    color:var(--cyan-signal);
                  "
                >
                  Report ID:
                  ${savedReport.report_id}
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
              'Submit error:',
              error
            );


            submitBtn.disabled =
              false;


            overlay.style.display =
              'none';


            showToast(
              'Failed to submit report. Make sure the backend is running.',
              'warn'
            );

          }

        },
        1200
      );

    }
  );

}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initCategoryCards();

    initImageUpload();

    initAnalyze();

    initSubmit();

    initCitizenMap();

  }
);