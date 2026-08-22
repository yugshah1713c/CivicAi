from flask import Flask, request, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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
    elif category == "Drainage Authority":
            department = "Drainage Department"
    elif category == "Water Leakage":
            department = "Water Board"
    elif category == "Garbage":
            department = "Sanitation Dept"
    elif category == "Broken Street Light":
            department = "Electrical Dept"
    else :
            department = "General Services"

    return department

@app.route("/")
def home():
    return "civicai backend is working"

@app.route("/api/issues",methods = ["GET"])
def issue():
    return {
        "issues" : issues
}

@app.route("/api/issues",methods = ["POST"])
def create_issue():
    data = request.json
    data['id'] = len(issues) + 1
    data["status"] = "Pending"
    data["severity"] = calculate_severity(data)
    data["department"] = assign_department(data)
    data["reports"] =  1
    issues.append(data)
    return jsonify(data)

if __name__ == "__main__" :
    app.run(debug=True)