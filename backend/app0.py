from flask import Flask, render_template, Blueprint

app = Flask(__name__)

tab0_bp = Blueprint('tab0', __name__, template_folder='templates');

def get_tab0_data():
    return render_template("index0.html")

@tab0_bp.route('/tab0')
def tab0_home():
    return render_template('index0.html')

app.register_blueprint(tab0_bp)

if __name__ == "__main__":
    app.run(debug=True)