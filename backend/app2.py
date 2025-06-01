from flask import Flask, Blueprint, render_template, send_from_directory, json

app = Flask(__name__)

tab2_bp = Blueprint('tab2', __name__, template_folder='templates');

def get_tab2_data():
    with open("tab2/data.json", "r") as f:
        data = json.load(f)
    return data

@tab2_bp.route('/tab2')
def tab2_home():
    return render_template('index2.html', chart_data=chart_data)

@app.route("/data.json")
def data():
    return send_from_directory("tab2", "data.json")

@app.route("/style2.css")
def css():
    return send_from_directory("tab2", "style2.css")

@app.route("/script2.js")
def js():
    return send_from_directory("tab2", "script2.js")

app.register_blueprint(tab2_bp)

if __name__ == "__main__":
    app.run(debug=True)