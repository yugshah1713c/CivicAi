/* =========================================================
   CIVICAI — SMART CITY FRONTEND
   Vanilla JavaScript
   Backend Contract
   ---------------------------------------------------------
   GET  /api/issues
   POST /api/issues

   Future-ready endpoints can be added without changing
   the UI architecture.
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API = {
    issues: "/api/issues"
};


/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {
    issues: [],
    selectedIssue: null,
    currentPage: "dashboard",
    isLoading: false,
    theme: localStorage.getItem("civicai-theme") || "dark"
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeTheme();
    initializeImagePreview();
    initializeReportForm();
    initializeModal();
    initializeKeyboardShortcuts();

    loadIssues();

});


/* =========================================================
   THEME
========================================================= */

function initializeTheme() {

    if (state.theme === "light") {
        document.body.classList.add("light");
    }

    updateThemeButton();
}


function toggleTheme() {

    document.body.classList.toggle("light");

    state.theme =
        document.body.classList.contains("light")
            ? "light"
            : "dark";

    localStorage.setItem(
        "civicai-theme",
        state.theme
    );

    updateThemeButton();
}


function updateThemeButton() {

    const button = $(".theme-btn");

    if (!button) {
        return;
    }

    button.textContent =
        document.body.classList.contains("light")
            ? "🌙 Theme"
            : "☀ Theme";
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId, button = null) {

    const pages = $$(".page");

    pages.forEach(page => {
        page.classList.remove("active");
    });


    const targetPage =
        document.getElementById(pageId);

    if (!targetPage) {
        console.warn(
            `Page "${pageId}" does not exist.`
        );
        return;
    }


    targetPage.classList.add("active");

    state.currentPage = pageId;


    /*
        Update navigation buttons.

        We determine the active button from
        the page name rather than depending
        completely on inline onclick.
    */

    const navButtons =
        document.querySelectorAll("nav button");

    navButtons.forEach(navButton => {

        navButton.classList.remove("active");

        const text =
            navButton.textContent
                .trim()
                .toLowerCase();

        if (
            (pageId === "dashboard" &&
                text.includes("dashboard")) ||

            (pageId === "report" &&
                text.includes("report")) ||

            (pageId === "issues" &&
                text.includes("queue")) ||

            (pageId === "about" &&
                text.includes("works"))
        ) {
            navButton.classList.add("active");
        }

    });


    if (button) {

        navButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    /*
        Refresh data when opening
        dashboard or issue queue.
    */

    if (
        pageId === "dashboard" ||
        pageId === "issues"
    ) {
        loadIssues();
    }
}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function initializeImagePreview() {

    const photoInput =
        $("#photo");

    const preview =
        $("#preview");


    if (!photoInput || !preview) {
        return;
    }


    photoInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];

            if (!file) {

                preview.removeAttribute("src");
                preview.style.display = "none";

                return;
            }


            /*
                Basic validation.
            */

            if (!file.type.startsWith("image/")) {

                showResult(
                    "error",
                    `
                    <h3>⚠ Invalid file</h3>
                    <p>Please select a valid image.</p>
                    `
                );

                photoInput.value = "";

                return;
            }


            /*
                Limit client-side image size
                to approximately 10 MB.
            */

            const maxSize =
                10 * 1024 * 1024;

            if (file.size > maxSize) {

                showResult(
                    "error",
                    `
                    <h3>⚠ Image too large</h3>
                    <p>Please choose an image smaller than 10 MB.</p>
                    `
                );

                photoInput.value = "";

                return;
            }


            const imageURL =
                URL.createObjectURL(file);

            preview.src = imageURL;
            preview.style.display = "block";


            preview.onload = () => {
                URL.revokeObjectURL(imageURL);
            };

        }
    );
}


/* =========================================================
   REPORT FORM
========================================================= */

function initializeReportForm() {

    const form =
        $("#reportForm");

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        submitReport
    );
}


/* =========================================================
   SUBMIT REPORT
========================================================= */

async function submitReport(event) {

    event.preventDefault();


    const description =
        $("#description")?.value.trim();

    const location =
        $("#location")?.value.trim();

    const category =
        $("#category")?.value;

    const photo =
        $("#photo")?.files[0];


    /*
        Frontend validation.
    */

    if (!description) {

        showResult(
            "error",
            `
            <h3>⚠ Description required</h3>
            <p>Please describe the civic issue.</p>
            `
        );

        return;
    }


    if (!location) {

        showResult(
            "error",
            `
            <h3>⚠ Location required</h3>
            <p>Please provide the issue location.</p>
            `
        );

        return;
    }


    if (!category) {

        showResult(
            "error",
            `
            <h3>⚠ Category required</h3>
            <p>Please select an issue category.</p>
            `
        );

        return;
    }


    const submitButton =
        $("#submitBtn");


    setButtonLoading(
        submitButton,
        true,
        "Analyzing..."
    );


    try {

        /*
            IMPORTANT:

            If there is an image, we use FormData.

            If there is no image, we send JSON.

            This makes the frontend flexible for
            your future Flask AI/image pipeline.
        */

        let response;


        if (photo) {

            const formData =
                new FormData();

            formData.append(
                "description",
                description
            );

            formData.append(
                "location",
                location
            );

            formData.append(
                "category",
                category
            );

            formData.append(
                "image",
                photo
            );


            response =
                await fetch(
                    API.issues,
                    {
                        method: "POST",
                        body: formData
                    }
                );

        } else {

            const report = {

                description,
                location,
                category

            };


            response =
                await fetch(
                    API.issues,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(report)
                    }
                );

        }


        /*
            Parse backend response.
        */

        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                `Server returned ${response.status}`
            );

        }


        console.log(
            "CivicAI report created:",
            data
        );


        /*
            Show successful result.
        */

        showResult(
            "success",
            buildSubmissionResult(data, {
                description,
                location,
                category
            })
        );


        /*
            Reset form.
        */

        resetReportForm();


        /*
            Refresh issue data.
        */

        await loadIssues();


    } catch (error) {

        console.error(
            "Report submission failed:",
            error
        );


        showResult(
            "error",
            `
            <h3>⚠ Submission failed</h3>

            <p>
                ${escapeHTML(
                    getErrorMessage(error)
                )}
            </p>

            <small>
                Please make sure the CivicAI backend
                is running.
            </small>
            `
        );


    } finally {

        setButtonLoading(
            submitButton,
            false,
            "Submit Report"
        );

    }
}


/* =========================================================
   SUBMISSION RESULT
========================================================= */

function buildSubmissionResult(
    data,
    fallback
) {

    const issue =
        data.issue ||
        data;


    const location =
        issue.location ||
        fallback.location;


    const description =
        issue.description ||
        fallback.description;


    const category =
        issue.category ||
        fallback.category;


    const severity =
        issue.severity;


    const department =
        issue.department;


    let extraInfo = "";


    if (severity !== undefined) {

        const level =
            getSeverityLevel(
                Number(severity)
            );

        extraInfo += `
            <p>
                <b>AI Severity:</b>
                <span class="${level.textClass}">
                    ${escapeHTML(severity)}/100
                </span>
            </p>
        `;
    }


    if (department) {

        extraInfo += `
            <p>
                <b>Department:</b>
                ${escapeHTML(department)}
            </p>
        `;
    }


    return `
        <h3>✓ Report Submitted</h3>

        <p>
            Your civic issue has been successfully
            submitted to CivicAI.
        </p>

        <p>
            <b>Location:</b>
            ${escapeHTML(location)}
        </p>

        <p>
            <b>Description:</b>
            ${escapeHTML(description)}
        </p>

        <p>
            <b>Category:</b>
            ${escapeHTML(category)}
        </p>

        ${extraInfo}
    `;
}


/* =========================================================
   RESULT MESSAGE
========================================================= */

function showResult(type, content) {

    const result =
        $("#result");

    if (!result) {
        return;
    }


    result.classList.remove(
        "hidden",
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


    /*
        Scroll result into view on mobile.
    */

    result.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* =========================================================
   RESET REPORT FORM
========================================================= */

function resetReportForm() {

    const form =
        $("#reportForm");

    if (form) {
        form.reset();
    }


    const preview =
        $("#preview");

    if (preview) {

        preview.removeAttribute("src");
        preview.style.display = "none";

    }

}


/* =========================================================
   LOAD ISSUES
========================================================= */

async function loadIssues() {

    /*
        Prevent duplicate simultaneous requests.
    */

    if (state.isLoading) {
        return;
    }


    state.isLoading = true;


    try {

        showLoadingStates();


        const response =
            await fetch(
                API.issues,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache: "no-store"
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                `Server returned ${response.status}`
            );

        }


        /*
            Support both:

            [
                {...},
                {...}
            ]

            AND:

            {
                "issues": [...]
            }
        */

        if (Array.isArray(data)) {

            state.issues = data;

        } else if (
            data &&
            Array.isArray(data.issues)
        ) {

            state.issues = data.issues;

        } else {

            state.issues = [];

        }


        console.log(
            "Issues loaded:",
            state.issues
        );


        renderIssues();
        updateDashboard();


    } catch (error) {

        console.error(
            "Failed to load issues:",
            error
        );


        state.issues = [];


        renderEmptyState(
            "priorityQueue",
            "Unable to connect to CivicAI backend."
        );


        renderEmptyState(
            "issueTable",
            "Unable to load civic issues."
        );


        updateDashboard();


    } finally {

        state.isLoading = false;

    }
}


/* =========================================================
   LOADING STATES
========================================================= */

function showLoadingStates() {

    const priority =
        $("#priorityQueue");

    const table =
        $("#issueTable");


    if (priority) {

        priority.innerHTML = `
            <div class="empty">
                <span>⟳</span>
                Loading priority queue...
            </div>
        `;

    }


    if (table) {

        table.innerHTML = `
            <div class="empty">
                <span>⟳</span>
                Loading civic issues...
            </div>
        `;

    }
}


/* =========================================================
   RENDER ISSUES
========================================================= */

function renderIssues() {

    const priorityQueue =
        $("#priorityQueue");

    const issueTable =
        $("#issueTable");


    if (!state.issues.length) {

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
        Highest severity first.
    */

    const sortedIssues =
        [...state.issues].sort(
            (a, b) => {

                const severityA =
                    Number(a.severity ?? 0);

                const severityB =
                    Number(b.severity ?? 0);

                return severityB - severityA;

            }
        );


    /*
        PRIORITY QUEUE
    */

    if (priorityQueue) {

        priorityQueue.innerHTML =
            sortedIssues
                .slice(0, 5)
                .map(
                    (issue, index) =>
                        createPriorityCard(
                            issue,
                            index
                        )
                )
                .join("");

    }


    /*
        ISSUE TABLE
    */

    if (issueTable) {

        issueTable.innerHTML =
            sortedIssues
                .map(
                    issue =>
                        createIssueRow(issue)
                )
                .join("");

    }
}


/* =========================================================
   PRIORITY CARD
========================================================= */

function createPriorityCard(
    issue,
    index
) {

    const severity =
        Number(issue.severity ?? 0);


    const level =
        getSeverityLevel(severity);


    const title =
        issue.title ||
        issue.description ||
        "Civic Issue";


    return `
        <div
            class="issue ${level.className}"
            onclick="issueDetails(${safeId(issue.id)})"
            role="button"
            tabindex="0"
            data-issue-id="${escapeHTML(issue.id ?? "")}"
        >

            <div class="issue-icon">
                ${getCategoryIcon(issue.category)}
            </div>

            <div>

                <b>
                    ${escapeHTML(
                        truncate(title, 55)
                    )}
                </b>

                <p>
                    Severity
                    <strong>
                        ${severity}/100
                    </strong>

                    ·

                    ${Number(issue.reports ?? 1)}
                    report(s)
                </p>

            </div>

            <strong>
                P${index + 1}
            </strong>

        </div>
    `;
}


/* =========================================================
   ISSUE TABLE ROW
========================================================= */

function createIssueRow(issue) {

    const severity =
        Number(issue.severity ?? 0);


    const level =
        getSeverityLevel(severity);


    const title =
        issue.title ||
        issue.description ||
        "Civic Issue";


    const department =
        issue.department ||
        "Pending AI analysis";


    const status =
        issue.status ||
        "Pending";


    return `
        <div class="row">

            <span>
                ${escapeHTML(
                    truncate(title, 70)
                )}
            </span>

            <b class="${level.textClass}">
                ${severity}/100
            </b>

            <span>
                ${escapeHTML(department)}
            </span>

            <span
                class="badge ${getStatusClass(status)}"
            >
                ${escapeHTML(status)}
            </span>

            <button
                onclick="issueDetails(${safeId(issue.id)})"
            >
                View
            </button>

        </div>
    `;
}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboard() {

    const issues =
        state.issues;


    const total =
        issues.length;


    const critical =
        issues.filter(
            issue =>
                Number(issue.severity ?? 0) >= 71
        ).length;


    const resolved =
        issues.filter(
            issue =>
                String(issue.status ?? "")
                    .toLowerCase()
                    .trim()
                    .replace("_", " ")
                    === "resolved"
        ).length;


    setText(
        "#total",
        total
    );


    setText(
        "#critical",
        critical
    );


    setText(
        "#resolved",
        resolved
    );


    /*
        Calculate average resolution time
        if backend eventually provides it.

        Supported fields:

        resolution_time
        resolutionTime
        resolution_minutes
    */

    const resolutionValues =
        issues
            .map(issue => {

                return Number(
                    issue.resolution_time ??
                    issue.resolutionTime ??
                    issue.resolution_minutes
                );

            })
            .filter(
                value =>
                    Number.isFinite(value) &&
                    value > 0
            );


    if (resolutionValues.length) {

        const average =
            resolutionValues.reduce(
                (sum, value) =>
                    sum + value,
                0
            ) / resolutionValues.length;


        setText(
            "#average",
            formatDuration(average)
        );

    } else {

        setText(
            "#average",
            "—"
        );

    }
}


/* =========================================================
   ISSUE MODAL
========================================================= */

function issueDetails(id) {

    const issue =
        findIssueById(id);


    if (!issue) {

        console.warn(
            "Issue not found:",
            id
        );

        return;
    }


    state.selectedIssue =
        issue;


    setText(
        "#modalTitle",
        issue.title ||
        issue.description ||
        "Civic Issue"
    );


    const severity =
        Number(issue.severity ?? 0);


    setText(
        "#modalScore",
        `${severity}/100`
    );


    setText(
        "#modalReports",
        issue.reports ?? 1
    );


    setText(
        "#modalDepartment",
        issue.department ||
        "Pending AI analysis"
    );


    const statusElement =
        $("#modalStatus");


    if (statusElement) {

        const status =
            issue.status ||
            "Pending";


        statusElement.textContent =
            status;


        statusElement.className =
            `badge ${getStatusClass(status)}`;

    }


    const modal =
        $("#modal");


    if (modal) {

        modal.classList.remove(
            "hidden"
        );

        document.body.style.overflow =
            "hidden";

    }
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    const modal =
        $("#modal");


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    document.body.style.overflow =
        "";
}


/* =========================================================
   RESOLVE ISSUE
   ---------------------------------------------------------
   Backend endpoint can later become:

   PATCH /api/issues/<id>

   The frontend function is already isolated
   so backend integration is easy.
========================================================= */

async function resolveIssue() {

    const issue =
        state.selectedIssue;


    if (!issue) {
        return;
    }


    /*
        Do not fake a backend update.

        Until the PATCH endpoint exists,
        tell the user clearly.
    */

    if (!issue.id) {

        alert(
            "This issue does not have a valid ID."
        );

        return;
    }


    const button =
        document.querySelector(
            ".modal-box .full"
        );


    setButtonLoading(
        button,
        true,
        "Resolving..."
    );


    try {

        const response =
            await fetch(
                `${API.issues}/${encodeURIComponent(issue.id)}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        status: "Resolved"
                    })
                }
            );


        const data =
            await parseResponse(response);


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                `Server returned ${response.status}`
            );

        }


        closeModal();

        await loadIssues();


    } catch (error) {

        console.error(
            "Resolution failed:",
            error
        );


        alert(
            "Unable to resolve this issue yet. " +
            "Make sure the PATCH endpoint exists."
        );


    } finally {

        setButtonLoading(
            button,
            false,
            "✓ Mark as Resolved"
        );

    }
}


/* =========================================================
   LOCATION
========================================================= */

function locate() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        position => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            console.log(
                "User location:",
                {
                    latitude,
                    longitude
                }
            );


            /*
                For now we display coordinates.

                Later these coordinates can be sent
                to Flask and used by the map.
            */

            alert(
                `📍 Current Location\n\n` +
                `Latitude: ${latitude.toFixed(6)}\n` +
                `Longitude: ${longitude.toFixed(6)}`
            );

        },


        error => {

            console.warn(
                "Geolocation error:",
                error
            );


            alert(
                "Unable to access your location. " +
                "Please allow location permission."
            );

        },


        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        }

    );
}


/* =========================================================
   EMPTY STATE
========================================================= */

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


/* =========================================================
   SEVERITY
========================================================= */

function getSeverityLevel(
    severity
) {

    severity =
        Number(severity) || 0;


    if (severity >= 71) {

        return {
            className: "high",
            textClass: "red",
            label: "Critical"
        };

    }


    if (severity >= 31) {

        return {
            className: "med",
            textClass: "orange",
            label: "Medium"
        };

    }


    return {
        className: "low",
        textClass: "green",
        label: "Low"
    };
}


/* =========================================================
   STATUS
========================================================= */

function getStatusClass(status) {

    const value =
        String(status ?? "")
            .toLowerCase()
            .trim();


    if (
        value === "resolved" ||
        value === "closed"
    ) {

        return "resolved";

    }


    if (
        value === "in progress" ||
        value === "in_progress" ||
        value === "progress"
    ) {

        return "progress";

    }


    return "pending";
}


/* =========================================================
   CATEGORY ICONS
========================================================= */

function getCategoryIcon(
    category
) {

    const value =
        String(category ?? "")
            .toLowerCase();


    if (
        value.includes("road") ||
        value.includes("pothole")
    ) {
        return "🛣️";
    }


    if (
        value.includes("waste") ||
        value.includes("garbage") ||
        value.includes("trash")
    ) {
        return "🗑️";
    }


    if (
        value.includes("light") ||
        value.includes("street")
    ) {
        return "💡";
    }


    if (
        value.includes("water") ||
        value.includes("leak")
    ) {
        return "💧";
    }


    if (
        value.includes("drain") ||
        value.includes("sewer")
    ) {
        return "🌊";
    }


    if (
        value.includes("traffic")
    ) {
        return "🚦";
    }


    if (
        value.includes("park") ||
        value.includes("tree")
    ) {
        return "🌳";
    }


    return "🏙️";
}


/* =========================================================
   BACKEND RESPONSE PARSER
========================================================= */

async function parseResponse(
    response
) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        return await response.json();

    }


    const text =
        await response.text();


    /*
        Try JSON anyway.

        Useful when Flask doesn't
        correctly set Content-Type.
    */

    try {

        return JSON.parse(text);

    } catch {

        return {
            message: text
        };

    }
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(error) {

    if (
        error instanceof TypeError
    ) {

        return (
            "Could not connect to the CivicAI server."
        );

    }


    return (
        error?.message ||
        "Something went wrong."
    );
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   ISSUE LOOKUP
========================================================= */

function findIssueById(id) {

    return state.issues.find(
        issue =>
            String(issue.id) ===
            String(id)
    );
}


/* =========================================================
   SAFE ID
========================================================= */

function safeId(id) {

    if (
        id === null ||
        id === undefined
    ) {
        return "null";
    }


    /*
        IDs from the backend should normally
        be numbers or strings.

        Escape quotes to keep inline onclick safe.
    */

    return `'${String(id)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")}'`;
}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(
    selector,
    value
) {

    const element =
        $(selector);


    if (element) {
        element.textContent =
            value;
    }
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.dataset.originalText =
            button.textContent;

        button.disabled =
            true;

        button.textContent =
            loadingText;

    } else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            loadingText;

    }
}


/* =========================================================
   TRUNCATE TEXT
========================================================= */

function truncate(
    text,
    maxLength
) {

    const value =
        String(text ?? "");


    if (
        value.length <= maxLength
    ) {
        return value;
    }


    return (
        value.substring(
            0,
            maxLength
        ) + "..."
    );
}


/* =========================================================
   FORMAT DURATION
========================================================= */

function formatDuration(
    minutes
) {

    minutes =
        Number(minutes);


    if (!Number.isFinite(minutes)) {
        return "—";
    }


    if (minutes < 60) {

        return `${Math.round(minutes)} min`;

    }


    const hours =
        minutes / 60;


    if (hours < 24) {

        return `${hours.toFixed(1)} hrs`;

    }


    const days =
        hours / 24;


    return `${days.toFixed(1)} days`;
}


/* =========================================================
   MODAL EVENTS
========================================================= */

function initializeModal() {

    const modal =
        $("#modal");


    if (!modal) {
        return;
    }


    /*
        Close when clicking outside modal box.
    */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeModal();

            }

        }
    );
}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function initializeKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            /*
                ESC → close modal
            */

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        }
    );
}


/* =========================================================
   EXPORT GLOBAL FUNCTIONS
   ---------------------------------------------------------
   Your HTML currently uses inline onclick handlers.
   Therefore these functions must remain globally available.
========================================================= */

window.showPage =
    showPage;

window.toggleTheme =
    toggleTheme;

window.loadIssues =
    loadIssues;

window.issueDetails =
    issueDetails;

window.closeModal =
    closeModal;

window.resolveIssue =
    resolveIssue;

window.locate =
    locate;