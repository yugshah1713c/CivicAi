/* =====================================================
   CIVICAI FRONTEND
   Backend API:
   GET  /api/issues
   POST /api/issues
===================================================== */


/* =====================================================
   GLOBAL STATE
===================================================== */

let issues = [];
let selectedIssue = null;


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showPage(pageId, button = null) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active");
    }

    if (button) {

        document.querySelectorAll("nav button").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (pageId === "dashboard") {
        loadIssues();
    }

    if (pageId === "issues") {
        loadIssues();
    }
}


/* =====================================================
   THEME
===================================================== */

function toggleTheme() {

    document.body.classList.toggle("light");

    const button = document.querySelector(".theme-btn");

    if (document.body.classList.contains("light")) {
        button.textContent = "🌙 Theme";
    } else {
        button.textContent = "☀ Theme";
    }
}


/* =====================================================
   IMAGE PREVIEW
===================================================== */

const photoInput = document.getElementById("photo");

if (photoInput) {

    photoInput.addEventListener("change", function(event) {

        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const image = document.getElementById("preview");

        image.src = URL.createObjectURL(file);

        image.style.display = "block";

    });
}


/* =====================================================
   SUBMIT REPORT
===================================================== */

const reportForm = document.getElementById("reportForm");

if (reportForm) {

    reportForm.addEventListener("submit", async function(event) {

        event.preventDefault();


        const description =
            document.getElementById("description").value.trim();

        const location =
            document.getElementById("location").value.trim();

        const category =
            document.getElementById("category").value;


        if (!description || !location || !category) {

            showResult(
                "error",
                "Please complete all required fields."
            );

            return;
        }


        const submitButton =
            document.getElementById("submitBtn");


        submitButton.disabled = true;

        submitButton.textContent = "Submitting...";


        /*
            This is the JSON sent to Flask.
        */

        const report = {

            description: description,

            location: location,

            category: category

        };


        console.log("Sending report:", report);


        try {

            const response = await fetch(
                "/api/issues",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(report)
                }
            );


            if (!response.ok) {

                throw new Error(
                    `Server returned ${response.status}`
                );

            }


            const data = await response.json();


            console.log(
                "Backend response:",
                data
            );


            showResult(
                "success",
                `
                    <h3>✓ Report Submitted</h3>

                    <p>
                        Your report has successfully
                        reached CivicAI.
                    </p>

                    <p>
                        <b>Location:</b>
                        ${escapeHTML(data.location)}
                    </p>

                    <p>
                        <b>Description:</b>
                        ${escapeHTML(data.description)}
                    </p>

                    <p>
                        <b>Category:</b>
                        ${escapeHTML(data.category)}
                    </p>
                `
            );


            reportForm.reset();

            document.getElementById("preview").style.display =
                "none";


            /*
                Reload the issue list after submission.
            */

            await loadIssues();


        } catch (error) {

            console.error(
                "Failed to submit report:",
                error
            );


            showResult(
                "error",
                `
                    <h3>⚠ Submission Failed</h3>

                    <p>
                        Could not connect to the
                        CivicAI backend.
                    </p>

                    <small>
                        Make sure the Flask server
                        is running.
                    </small>
                `
            );

        } finally {

            submitButton.disabled = false;

            submitButton.textContent =
                "Submit Report";

        }

    });

}


/* =====================================================
   RESULT MESSAGE
===================================================== */

function showResult(type, content) {

    const result =
        document.getElementById("result");

    result.classList.remove("hidden");

    result.classList.remove(
        "result-success",
        "result-error"
    );


    if (type === "success") {

        result.classList.add(
            "result-success"
        );

    } else {

        result.classList.add(
            "result-error"
        );

    }


    result.innerHTML = content;
}


/* =====================================================
   LOAD ISSUES FROM FLASK
===================================================== */

async function loadIssues() {

    try {

        const response = await fetch(
            "/api/issues"
        );


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        /*
            We expect Flask to eventually return:

            {
                "issues": [...]
            }

            For now this also supports
            a direct array.
        */

        if (Array.isArray(data)) {

            issues = data;

        } else {

            issues = data.issues || [];

        }


        console.log(
            "Issues received:",
            issues
        );


        renderIssues();

        updateDashboard();


    } catch (error) {

        console.error(
            "Could not load issues:",
            error
        );


        renderEmptyState(
            "priorityQueue",
            "Backend is not connected yet."
        );


        renderEmptyState(
            "issueTable",
            "Backend is not connected yet."
        );

    }
}


/* =====================================================
   RENDER ISSUE QUEUE
===================================================== */

function renderIssues() {

    const priorityQueue =
        document.getElementById(
            "priorityQueue"
        );


    const issueTable =
        document.getElementById(
            "issueTable"
        );


    if (!issues.length) {

        renderEmptyState(
            "priorityQueue",
            "No civic issues reported yet."
        );

        renderEmptyState(
            "issueTable",
            "No civic issues reported yet."
        );

        return;
    }


    /*
        Sort highest severity first.
    */

    const sortedIssues =
        [...issues].sort(
            (a, b) =>
                (b.severity || 0) -
                (a.severity || 0)
        );


    priorityQueue.innerHTML =
        sortedIssues
        .slice(0, 5)
        .map((issue, index) => {

            const severity =
                Number(issue.severity || 0);


            const level =
                getSeverityLevel(severity);


            return `

                <div
                    class="issue ${level.className}"
                    onclick="issueDetails(
                        ${issue.id ?? "null"}
                    )"
                >

                    <div class="issue-icon">
                        ${getCategoryIcon(issue.category)}
                    </div>

                    <div>

                        <b>
                            ${escapeHTML(
                                issue.title ||
                                issue.description ||
                                "Civic Issue"
                            )}
                        </b>

                        <p>
                            Severity
                            <strong>
                                ${severity}/100
                            </strong>

                            ·
                            ${issue.reports || 1}
                            report(s)
                        </p>

                    </div>

                    <strong>
                        P${Math.min(index + 1, 3)}
                    </strong>

                </div>

            `;

        })
        .join("");


    issueTable.innerHTML =
        sortedIssues
        .map(issue => {

            const severity =
                Number(issue.severity || 0);


            const level =
                getSeverityLevel(severity);


            return `

                <div class="row">

                    <span>
                        ${escapeHTML(
                            issue.title ||
                            issue.description ||
                            "Civic Issue"
                        )}
                    </span>

                    <b class="${level.textClass}">
                        ${severity}/100
                    </b>

                    <span>
                        ${escapeHTML(
                            issue.department ||
                            "Pending AI analysis"
                        )}
                    </span>

                    <span class="badge ${getStatusClass(issue.status)}">
                        ${escapeHTML(
                            issue.status ||
                            "Pending"
                        )}
                    </span>

                    <button
                        onclick="issueDetails(
                            ${issue.id ?? "null"}
                        )"
                    >
                        View
                    </button>

                </div>

            `;

        })
        .join("");
}


/* =====================================================
   DASHBOARD STATISTICS
===================================================== */

function updateDashboard() {

    const total =
        issues.length;


    const critical =
        issues.filter(
            issue =>
                Number(issue.severity || 0) >= 71
        ).length;


    const resolved =
        issues.filter(
            issue =>
                String(issue.status || "")
                .toLowerCase()
                === "resolved"
        ).length;


    document.getElementById("total")
        .textContent = total;


    document.getElementById("critical")
        .textContent = critical;


    document.getElementById("resolved")
        .textContent = resolved;


    /*
        We don't have resolution-time data yet.
    */

    document.getElementById("average")
        .textContent = "—";
}


/* =====================================================
   ISSUE DETAILS
===================================================== */

function issueDetails(id) {

    const issue =
        issues.find(
            item => item.id === id
        );


    if (!issue) {

        console.warn(
            "Issue not found:",
            id
        );

        return;
    }


    selectedIssue = issue;


    document.getElementById(
        "modalTitle"
    ).textContent =
        issue.title ||
        issue.description ||
        "Civic Issue";


    document.getElementById(
        "modalScore"
    ).textContent =
        `${issue.severity || 0}/100`;


    document.getElementById(
        "modalReports"
    ).textContent =
        issue.reports || 1;


    document.getElementById(
        "modalDepartment"
    ).textContent =
        issue.department ||
        "Pending AI analysis";


    document.getElementById(
        "modalStatus"
    ).textContent =
        issue.status ||
        "Pending";


    document.getElementById(
        "modal"
    ).classList.remove("hidden");
}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal() {

    document.getElementById(
        "modal"
    ).classList.add("hidden");

}


/* =====================================================
   RESOLVE ISSUE

   Backend endpoint will be added later.
===================================================== */

function resolveIssue() {

    if (!selectedIssue) {
        return;
    }


    alert(
        "Resolution API will be connected next."
    );

}


/* =====================================================
   LOCATION
===================================================== */

function locate() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            alert(
                `Current location\n\nLatitude: ${latitude}\nLongitude: ${longitude}`
            );

        },

        function() {

            alert(
                "Unable to access your location."
            );

        }

    );

}


/* =====================================================
   EMPTY STATE
===================================================== */

function renderEmptyState(
    elementId,
    message
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.innerHTML = `
        <div class="empty">
            ${escapeHTML(message)}
        </div>
    `;
}


/* =====================================================
   HELPERS
===================================================== */

function getSeverityLevel(
    severity
) {

    if (severity >= 71) {

        return {
            className: "high",
            textClass: "red"
        };

    }


    if (severity >= 31) {

        return {
            className: "med",
            textClass: "orange"
        };

    }


    return {
        className: "low",
        textClass: "green"
    };
}


function getStatusClass(status) {

    const value =
        String(status || "")
        .toLowerCase();


    if (value === "resolved") {
        return "resolved";
    }


    if (
        value === "in progress" ||
        value === "progress"
    ) {

        return "progress";

    }


    return "pending";
}


function getCategoryIcon(category) {

    const value =
        String(category || "")
        .toLowerCase();


    if (
        value.includes("road") ||
        value.includes("pothole")
    ) {
        return "🛣";
    }


    if (
        value.includes("waste") ||
        value.includes("garbage")
    ) {
        return "🗑";
    }


    if (
        value.includes("light")
    ) {
        return "💡";
    }


    if (
        value.includes("water")
    ) {
        return "💧";
    }


    return "🏙";
}


/*
    Prevent user-entered text from
    being interpreted as HTML.
*/

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   MODAL CLICK OUTSIDE
===================================================== */

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "modal"
            );


        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadIssues();

    }
);