from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

def get_db_connection():
    return mysql.connector.connect(
        host="127.0.0.1",
        port=3306,
        user="root",
        password="",
        database="civic_ai"
    )

@app.route("/api/db-test")
def db_test():
    try:
        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("SELECT 1")
        result = cursor.fetchone()

        cursor.close()
        db.close()

        return jsonify({
            "success": True,
            "message": "MySQL connection is working!",
            "result": result
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

issues = []

# calculation severity:::::

def calculate_severity(data):
    category = data['category']
    description = data["description"].lower()

    if category == "Road Damage":
        severity = 70
    elif category == "Drainage Problem":
        severity = 65
    elif category == "Water Leakage":
        severity = 60
    elif category == "Garbage":
        severity = 50
    elif category == "Broken Street Light":
        severity = 40
    else :
        severity = 30

    keywords = ["huge", "dangerous", "accident", "blocked", "major"]
    if any(word in description for word in keywords):
        return severity +15    

    return severity

# assigning the department:::::

def assign_department(data):
    category = data['category']

    if category == "Road Damage":
            department = "Public Works"
    elif category == "Drainage Problem":
            department = "Drainage Authority"
    elif category == "Water Leakage":
            department = "Water Board"
    elif category == "Garbage":
            department = "Sanitation Dept"
    elif category == "Broken Street Light":
            department = "Electrical Dept"
    else :
            department = "General Services"

    return department

# calculating priority

def calculate_priority(data):
    severity = data["severity"]

    if severity >= 75:
        return "High"
    elif severity >= 60:
        return "Medium"
    else:
        return "Low"

    
@app.route("/")
def home():
    return "civicai backend is working"

@app.route("/api/issues", methods=["GET"])
def issue():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            id,
            report_id,
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
            ai_detected,
            confidence,
            created_at AS date,
            gov_response AS govResponse
        FROM reports
        ORDER BY created_at DESC
    """)

    reports = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify({
        "issues": reports
    })

@app.route("/api/issues", methods=["POST"])
def create_issue():

    data = request.get_json()

    # Calculate severity
    data["severity"] = calculate_severity(data)

    # Calculate priority
    data["priority"] = calculate_priority(data)

    # Assign department
    data["department"] = assign_department(data)

    # Backend controls initial status
    data["status"] = "Pending"

    # Generate report ID
    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute("SELECT COUNT(*) FROM reports")
    count = cursor.fetchone()[0]

    report_id = "CIVIC-" + str(count + 1)

    # Combine location fields
    location = (
        f"{data.get('address', '')}, "
        f"{data.get('area', '')}, "
        f"{data.get('city', '')}"
    )

    sql = """
        INSERT INTO reports
        (
            report_id,
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
            %s, %s, %s, %s, %s,
            %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s
        )
    """

    values = (
        report_id,
        data.get("issue"),
        data.get("category"),
        data.get("description"),
        location,

        # 🗺️ Map coordinates
        data.get("latitude"),
        data.get("longitude"),

        data["severity"],
        data["priority"],
        data["status"],
        data.get("image"),
        data.get("department"),
        data.get("aiDetected"),
        data.get("confidence"),
        data.get("govResponse", "")
    )

    cursor.execute(sql, values)
    db.commit()

    saved_id = cursor.lastrowid

    cursor.close()
    db.close()

    return jsonify({
        "id": saved_id,
        "report_id": report_id,
        "issue": data.get("issue"),
        "category": data.get("category"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "status": data["status"]
    }), 201

@app.route("/api/issues/<int:issue_id>", methods=["PUT"])
def update_issue(issue_id):

    data = request.get_json()

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    try:
        # Update the report in MySQL
        sql = """
            UPDATE reports
            SET
                status = %s,
                priority = %s,
                gov_response = %s
            WHERE id = %s
        """

        values = (
            data.get("status"),
            data.get("priority"),
            data.get("govResponse", ""),
            issue_id
        )

        cursor.execute(sql, values)
        db.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Issue not found"
            }), 404

        # Get the updated report
        cursor.execute(
            "SELECT * FROM reports WHERE id = %s",
            (issue_id,)
        )

        updated_issue = cursor.fetchone()

        return jsonify(updated_issue)

    except Exception as e:
        db.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        db.close()
if __name__ == "__main__" :
    app.run(debug=True)