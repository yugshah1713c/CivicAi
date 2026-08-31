
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)

# ============================================================
# CORS
# ============================================================

CORS(app, resources={
    r"/api/*": {
        "origins": "*"
    }
})


# ============================================================
# DATABASE CONNECTION — AIVEN MYSQL
# ============================================================

from dotenv import load_dotenv
import os

load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl_disabled=False
    )


# ============================================================
# HOME
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "message": "Civic AI backend is working"
    })


# ============================================================
# DATABASE TEST
# ============================================================

@app.route("/api/db-test", methods=["GET"])
def db_test():

    db = None
    cursor = None

    try:

        db = get_db_connection()

        cursor = db.cursor()

        cursor.execute("SELECT 1")

        result = cursor.fetchone()

        return jsonify({

            "success": True,

            "message":
                "MySQL connection is working!",

            "result":
                result

        })

    except Exception as e:

        print("DATABASE ERROR:")
        print(type(e).__name__)
        print(str(e))

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# ============================================================
# CALCULATE SEVERITY
# ============================================================

def calculate_severity(data):

    category = (
        data.get("category")
        or ""
    )

    description = (
        data.get("description")
        or ""
    ).lower()


    if category == "Road Damage":
        severity = 70

    elif category == "Pothole":
        severity = 75

    elif category == "Drainage Problem":
        severity = 65

    elif category == "Water Leakage":
        severity = 60

    elif category == "Garbage":
        severity = 50

    elif category == "Broken Street Light":
        severity = 40

    elif category == "Bad Streetlight":
        severity = 40

    elif category == "Broken Signage":
        severity = 40

    elif category == "Faded Signage":
        severity = 35

    elif category == "Bad Billboard":
        severity = 40

    elif category == "Cluttered Sidewalk":
        severity = 50

    elif category == "Graffiti":
        severity = 30

    elif category == "Sand on Road":
        severity = 55

    elif category == "Unkept Facade":
        severity = 35

    else:
        severity = 30


    keywords = [
        "huge",
        "dangerous",
        "accident",
        "blocked",
        "major",
        "severe",
        "critical"
    ]


    if any(
        word in description
        for word in keywords
    ):

        severity += 15


    return min(
        severity,
        100
    )


# ============================================================
# CALCULATE PRIORITY
# ============================================================

def calculate_priority(severity):

    if severity >= 75:

        return "High"

    elif severity >= 60:

        return "Medium"

    else:

        return "Low"


# ============================================================
# ASSIGN DEPARTMENT
# ============================================================

def assign_department(category):

    departments = {

        "Road Damage":
            "Public Works",

        "Pothole":
            "Public Works",

        "Drainage Problem":
            "Drainage Authority",

        "Water Leakage":
            "Water Board",

        "Garbage":
            "Sanitation Dept",

        "Broken Street Light":
            "Electrical Dept",

        "Bad Streetlight":
            "Electrical Dept",

        "Broken Signage":
            "Signage Department",

        "Faded Signage":
            "Signage Department",

        "Bad Billboard":
            "Municipal Advertising Dept",

        "Graffiti":
            "Municipal Corporation",

        "Sand on Road":
            "Public Works",

        "Cluttered Sidewalk":
            "Municipal Corporation",

        "Unkept Facade":
            "Municipal Corporation"

    }


    return departments.get(
        category,
        "General Services"
    )


# ============================================================
# GET ALL REPORTS
# ============================================================

@app.route(
    "/api/issues",
    methods=["GET"]
)
def get_issues():

    db = None
    cursor = None

    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        # ----------------------------------------------------
        # OPTIONAL USER FILTER
        # ----------------------------------------------------

        user_email = request.args.get(
            "email"
        )


        # ----------------------------------------------------
        # USER REPORTS
        # ----------------------------------------------------

        if user_email:

            print(
                "GET REPORTS FOR USER:",
                user_email
            )


            cursor.execute(
                """
                SELECT
                    id,
                    report_id,
                    user_email,
                    issue_name AS issue,
                    category,
                    description,
                    location,
                    latitude,
                    longitude,
                    severity,
                    priority,
                    status,
                    image,
                    department,
                    ai_detected AS aiDetected,
                    confidence,
                    created_at AS date,
                    gov_response AS govResponse
                FROM reports
                WHERE user_email = %s
                ORDER BY created_at DESC
                """,
                (
                    user_email,
                )
            )


        # ----------------------------------------------------
        # ALL REPORTS — GOVERNMENT
        # ----------------------------------------------------

        else:

            print(
                "GETTING ALL REPORTS"
            )


            cursor.execute(
                """
                SELECT
                    id,
                    report_id,
                    user_email,
                    issue_name AS issue,
                    category,
                    description,
                    location,
                    latitude,
                    longitude,
                    severity,
                    priority,
                    status,
                    image,
                    department,
                    ai_detected AS aiDetected,
                    confidence,
                    created_at AS date,
                    gov_response AS govResponse
                FROM reports
                ORDER BY created_at DESC
                """
            )


        reports = cursor.fetchall()


        print(
            "REPORTS FOUND:",
            len(reports)
        )


        return jsonify({

            "success":
                True,

            "count":
                len(reports),

            "issues":
                reports

        })


    except Exception as e:

        print()
        print(
            "===================================="
        )
        print(
            "❌ GET REPORTS ERROR"
        )
        print(
            "===================================="
        )
        print(
            type(e).__name__
        )
        print(
            str(e)
        )
        print(
            "===================================="
        )


        return jsonify({

            "success":
                False,

            "error":
                str(e),

            "issues":
                []

        }), 500


    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# ============================================================
# CREATE REPORT
# ============================================================

@app.route(
    "/api/issues",
    methods=["POST"]
)
def create_issue():

    data = request.get_json(
        silent=True
    )


    # --------------------------------------------------------
    # CHECK JSON
    # --------------------------------------------------------

    if not data:

        return jsonify({

            "success":
                False,

            "error":
                "No JSON data received"

        }), 400


    print()
    print(
        "===================================="
    )
    print(
        "NEW REPORT RECEIVED"
    )
    print(
        "===================================="
    )

    print(data)


    db = None
    cursor = None


    try:

        # ====================================================
        # REQUIRED DATA
        # ====================================================

        issue = (
            data.get("issue")
            or data.get("issue_name")
            or ""
        ).strip()


        category = (
            data.get("category")
            or ""
        ).strip()


        description = (
            data.get("description")
            or ""
        ).strip()


        if not issue:

            return jsonify({

                "success":
                    False,

                "error":
                    "Issue name is required"

            }), 400


        if not category:

            return jsonify({

                "success":
                    False,

                "error":
                    "Category is required"

            }), 400


        if not description:

            return jsonify({

                "success":
                    False,

                "error":
                    "Description is required"

            }), 400


        # ====================================================
        # USER EMAIL
        # ====================================================

        user_email = (
            data.get("user_email")
            or data.get("email")
            or ""
        ).strip()


        # ====================================================
        # CALCULATE VALUES
        # ====================================================

        severity = calculate_severity(
            data
        )


        priority = calculate_priority(
            severity
        )


        department = assign_department(
            category
        )


        status = "Pending"


        # ====================================================
        # LOCATION
        # ====================================================

        location_parts = []


        address = (
            data.get("address")
            or ""
        ).strip()


        area = (
            data.get("area")
            or ""
        ).strip()


        city = (
            data.get("city")
            or ""
        ).strip()


        if address:
            location_parts.append(
                address
            )


        if area:
            location_parts.append(
                area
            )


        if city:
            location_parts.append(
                city
            )


        location = ", ".join(
            location_parts
        )


        # ====================================================
        # OTHER DATA
        # ====================================================

        latitude = data.get(
            "latitude"
        )


        longitude = data.get(
            "longitude"
        )


        image = data.get(
            "image"
        )


        ai_detected = (
            data.get("aiDetected")
            or data.get("ai_detected")
            or category
        )


        confidence = data.get(
            "confidence",
            85
        )


        gov_response = (
            data.get("govResponse")
            or ""
        )


        # ====================================================
        # CONNECT DATABASE
        # ====================================================

        db = get_db_connection()

        cursor = db.cursor()


        # ====================================================
        # GENERATE REPORT ID
        # ====================================================

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM reports
            """
        )


        count = cursor.fetchone()[0]


        report_id = (
            "CIVIC-"
            + str(count + 1)
        )


        # ====================================================
        # INSERT
        # ====================================================

        sql = """
            INSERT INTO reports
            (
                report_id,
                user_email,
                issue_name,
                category,
                description,
                location,
                latitude,
                longitude,
                severity,
                priority,
                status,
                image,
                department,
                ai_detected,
                confidence,
                gov_response
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """


        values = (

            report_id,

            user_email,

            issue,

            category,

            description,

            location,

            latitude,

            longitude,

            severity,

            priority,

            status,

            image,

            department,

            ai_detected,

            confidence,

            gov_response

        )


        print(
            "INSERT VALUES:"
        )

        print(values)


        cursor.execute(
            sql,
            values
        )


        db.commit()


        saved_id = (
            cursor.lastrowid
        )


        print()
        print(
            "===================================="
        )
        print(
            "✅ REPORT SAVED SUCCESSFULLY"
        )
        print(
            "Report ID:",
            report_id
        )
        print(
            "Database ID:",
            saved_id
        )
        print(
            "User Email:",
            user_email
        )
        print(
            "Category:",
            category
        )
        print(
            "Severity:",
            severity
        )
        print(
            "Priority:",
            priority
        )
        print(
            "Department:",
            department
        )
        print(
            "===================================="
        )


        return jsonify({

            "success":
                True,

            "message":
                "Report created successfully",

            "id":
                saved_id,

            "report_id":
                report_id,

            "user_email":
                user_email,

            "issue":
                issue,

            "category":
                category,

            "severity":
                severity,

            "priority":
                priority,

            "status":
                status,

            "department":
                department

        }), 201


    except Exception as e:

        if db:

            db.rollback()


        print()
        print(
            "===================================="
        )
        print(
            "❌ CREATE REPORT ERROR"
        )
        print(
            "===================================="
        )
        print(
            type(e).__name__
        )
        print(
            str(e)
        )
        print(
            "===================================="
        )


        return jsonify({

            "success":
                False,

            "error":
                str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()


        if db:

            db.close()


# ============================================================
# GET SINGLE REPORT
# ============================================================

@app.route(
    "/api/issues/<int:issue_id>",
    methods=["GET"]
)
def get_single_issue(
    issue_id
):

    db = None
    cursor = None


    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        cursor.execute(
            """
            SELECT
                id,
                report_id,
                user_email,
                issue_name AS issue,
                category,
                description,
                location,
                latitude,
                longitude,
                severity,
                priority,
                status,
                image,
                department,
                ai_detected AS aiDetected,
                confidence,
                created_at AS date,
                gov_response AS govResponse
            FROM reports
            WHERE id = %s
            """,
            (
                issue_id,
            )
        )


        report = cursor.fetchone()


        if not report:

            return jsonify({

                "success":
                    False,

                "error":
                    "Report not found"

            }), 404


        return jsonify({

            "success":
                True,

            "issue":
                report

        })


    except Exception as e:

        print(
            "GET SINGLE REPORT ERROR:",
            e
        )


        return jsonify({

            "success":
                False,

            "error":
                str(e)

        }), 500


    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# ============================================================
# UPDATE REPORT — GOVERNMENT
# ============================================================

@app.route(
    "/api/issues/<int:issue_id>",
    methods=["PUT"]
)
def update_issue(
    issue_id
):

    data = request.get_json(
        silent=True
    )


    if not data:

        return jsonify({

            "success":
                False,

            "error":
                "No JSON data received"

        }), 400


    db = None
    cursor = None


    try:

        db = get_db_connection()

        cursor = db.cursor()


        # ====================================================
        # UPDATE
        # ====================================================

        sql = """
            UPDATE reports
            SET
                status = %s,
                priority = %s,
                department = %s,
                gov_response = %s
            WHERE id = %s
        """


        values = (

            data.get(
                "status"
            ),

            data.get(
                "priority"
            ),

            data.get(
                "department"
            ),

            data.get(
                "govResponse",
                ""
            ),

            issue_id

        )


        cursor.execute(
            sql,
            values
        )


        db.commit()


        if cursor.rowcount == 0:

            return jsonify({

                "success":
                    False,

                "error":
                    "Issue not found"

            }), 404


        # ====================================================
        # GET UPDATED REPORT
        # ====================================================

        cursor.close()


        cursor = db.cursor(
            dictionary=True
        )


        cursor.execute(
            """
            SELECT
                id,
                report_id,
                user_email,
                issue_name AS issue,
                category,
                description,
                location,
                latitude,
                longitude,
                severity,
                priority,
                status,
                image,
                department,
                ai_detected AS aiDetected,
                confidence,
                created_at AS date,
                gov_response AS govResponse
            FROM reports
            WHERE id = %s
            """,
            (
                issue_id,
            )
        )


        updated_issue = cursor.fetchone()


        return jsonify({

            "success":
                True,

            "message":
                "Issue updated successfully",

            "issue":
                updated_issue

        })


    except Exception as e:

        if db:

            db.rollback()


        print(
            "UPDATE ERROR:",
            e
        )


        return jsonify({

            "success":
                False,

            "error":
                str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()

        if db:

            db.close()


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    print()
    print(
        "===================================="
    )
    print(
        "       CIVIC AI BACKEND"
    )
    print(
        "===================================="
    )
    print(
        "Server:"
        " http://127.0.0.1:5000"
    )
    print(
        "Database: Aiven MySQL"
    )
    print(
        "===================================="
    )
    print()


    app.run(
    host="0.0.0.0",
    port=int(os.getenv("PORT", 5000)),
)
