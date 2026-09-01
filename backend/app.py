from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from ultralytics import YOLO
import base64
import uuid
import os
import time
from werkzeug.security import generate_password_hash, check_password_hash

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
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "ai",
    "best.pt"
)

model = YOLO(MODEL_PATH)

print("YOLO MODEL LOADED")

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
# YOLO IMAGE DETECTION
# ============================================================

def detect_issue(image_path):

    try:
        start = time.time()



        results = model.predict(
            source=image_path,
            conf=0.25,
            imgsz=640,
            verbose=False
        )

        result = results[0]

        if result.boxes is None or len(result.boxes) == 0:

            return {
                "detected": None,
                "confidence": 0
            }

        best_index = result.boxes.conf.argmax()

        class_id = int(
            result.boxes.cls[best_index]
        )

        confidence = float(
            result.boxes.conf[best_index]
        )

        detected_class = model.names[class_id]

        return {
            "detected": detected_class,
            "confidence": round(
                confidence * 100,
                2
            )
        }

    except Exception as e:

        print("YOLO ERROR:", e)

        return {
            "detected": None,
            "confidence": 0
        }

def save_base64_image(image_data):

    try:

        if not image_data:
            return None

        # Remove data URL prefix
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)

        os.makedirs("uploads", exist_ok=True)

        filename = f"{uuid.uuid4().hex}.jpg"

        image_path = os.path.join(
            "uploads",
            filename
        )

        with open(image_path, "wb") as f:
            f.write(image_bytes)

        return image_path

    except Exception as e:

        print("IMAGE SAVE ERROR:", e)

        return None


# ============================================================
# AI TEST ENDPOINT
# ============================================================

@app.route("/api/ai-test", methods=["POST"])
def ai_test():

    image = request.files.get("image")

    if not image:

        return jsonify({
            "success": False,
            "error": "No image uploaded"
        }), 400

    filename = image.filename

    upload_dir = "uploads"

    os.makedirs(upload_dir, exist_ok=True)

    image_path = os.path.join(
        upload_dir,
        filename
    )

    image.save(image_path)

    detection = detect_issue(
        image_path
    )

    return jsonify({

        "success": True,

        "filename": filename,

        "detection": detection

    }) 
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
    start_time = time.time()

    print("CREATE REPORT START")

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


        image = data.get("image")

        ai_detected = category
        confidence = 0

        detection = {
            "detected": None,
            "confidence": 0
        }


        # ====================================================
        # YOLO AI DETECTION
        # ====================================================

        # ====================================================
# AI RESULT FROM FRONTEND
# ====================================================

        print("IMAGE RECEIVED:", bool(image))

        ai_detected = (
            data.get("aiDetected")
            or category
        )

        confidence = data.get(      
            "confidence",
            0
        )

        print(
            "AI RESULT RECEIVED:",
            ai_detected,
            confidence
        )          


        gov_response = (
            data.get("govResponse")
            or ""
        )


        # ====================================================
        # CONNECT DATABASE
        # ====================================================
        print(
        "TIME BEFORE DB CONNECTION:",
        time.time() - start_time
        )
        db = get_db_connection()
        print(
        "DB CONNECTION TIME:",
        time.time() - start_time
        )

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
        print(
        "AFTER INSERT:",
        time.time() - start_time
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
        print(
        "AFTER COMMIT:",
        time.time() - start_time
        )


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
        print(
        "TOTAL CREATE REPORT TIME:",
        time.time() - start_time
        )


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
# REGISTER USER
# ============================================================

@app.route("/api/register", methods=["POST"])
def register_user():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "error": "No JSON data received"
        }), 400

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    role = (data.get("role") or "citizen").strip()

    # Validate required fields
    if not name or not email or not password:
        return jsonify({
            "success": False,
            "error": "Name, email and password are required"
        }), 400

    # Only allow valid roles
    if role not in ["citizen", "gov_person"]:
        role = "citizen"

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        # Check whether email already exists
        cursor.execute(
            "SELECT id FROM user WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "success": False,
                "error": "Email already registered"
            }), 409

        # Hash password before storing it
        hashed_password = generate_password_hash(password)

        # Create user
        cursor.execute(
            """
            INSERT INTO user
            (name, email, password, role)
            VALUES (%s, %s, %s, %s)
            """,
            (name, email, hashed_password, role)
        )

        db.commit()

        return jsonify({
            "success": True,
            "message": "Account created successfully"
        }), 201

    except Exception as e:

        if db:
            db.rollback()

        print("REGISTER ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

# ============================================================
# LOGIN USER
# ============================================================

@app.route("/api/login", methods=["POST"])
def login_user():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "error": "No JSON data received"
        }), 400

    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required"
        }), 400

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute(
            """
            SELECT id, name, email, password, role
            FROM user
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "error": "Invalid email or password"
            }), 401

        stored_password = user[3]

        if not check_password_hash(
            stored_password,
            password
        ):
            return jsonify({
                "success": False,
                "error": "Invalid email or password"
            }), 401

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "role": user[4]
            }
        }), 200

    except Exception as e:

        if db:
            db.rollback()

        print("LOGIN ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
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
