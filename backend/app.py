from flask import Flask, request, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

issues = []

# calculation severity:::::

def calculate_severity(data):
    category = data['category']
    description = data["description"].lower()

    if category == "road":
        severity = 70
    elif category == "drainage":
        severity = 65
    elif category == "water":
        severity = 60
    elif category == "waste":
        severity = 50
    elif category == "streetlight":
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

    if category == "road":
            department = "Road & Infrastructure"
    elif category == "drainage":
            department = "Drainage Department"
    elif category == "water":
            department = "Water Supply"
    elif category == "waste":
            department = "Waste Management"
    elif category == "streetlight":
            department = "Electrical Department"
    else :
            department = "Municipal Services"

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