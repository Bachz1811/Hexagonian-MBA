import pandas as pd
import os
from flask import Flask, jsonify, render_template, Blueprint, current_app # Import current_app

app = Flask(__name__)

tab3_bp = Blueprint('tab3', __name__, template_folder='../templates')

def get_tab3_data_dict(chart_type):
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'MBA_data.csv')
    print("Trying to load:", csv_path)
    print("Exists?", os.path.exists(csv_path))
    
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        current_app.logger.error(f"CSV file not found at path: {csv_path}")
        return {'error': 'Data source not found.'} # Return an error dict
    except Exception as e:
        current_app.logger.error(f"Error reading CSV file at path {csv_path}: {str(e)}")
        return {'error': f"Error reading data source: {str(e)}"}
    
    print(df.head())


    required_columns = ['Networking_Importance', 'Entrepreneurial_Interest']
    for col in required_columns:
        if col not in df.columns:
            current_app.logger.error(f"Dataset missing required column: {col}")
            return {'error': f'Dataset missing required column: {col}'}

    bins = [1.0, 2.5, 5.0, 7.5, 10.0]
    # Ensure labels are strings, which is good practice for JSON and JavaScript
    labels = ['1 - 2.5', '2.5 - 5.0', '5.0 - 7.5', '7.5 - 10.0']

    # Using right=True ensures that the bins are (lower, upper]
    # include_lowest=True makes the first bin inclusive of the lowest edge.
    networking_series = pd.cut(df['Networking_Importance'], bins=bins, labels=labels, include_lowest=True, right=True)
    entrepreneurial_series = pd.cut(df['Entrepreneurial_Interest'], bins=bins, labels=labels, include_lowest=True, right=True)

    if chart_type == 'networking':
        data = networking_series.value_counts(normalize=True).sort_index() * 100
        colors = ['#688d5c', '#1d4f43', '#6d7247', '#aa3b19'] 
        title = 'Networking Importance'
    elif chart_type == 'entrepreneurial':
        data = entrepreneurial_series.value_counts(normalize=True).sort_index() * 100
        colors = ['#8e5d2a', '#d6ac4e', '#c66e21', '#ed7e26'] 
        title = 'Entrepreneurial Interest'
    else:
        return None # Indicates invalid chart type to the route

    return {
        'labels': list(data.index.astype(str)), # Ensure labels are strings
        'values': list(data.values),
        'colors': colors,
        'title': title
    }

@tab3_bp.route('/tab3')
def tab3_page():
    return render_template('index3.html')

@tab3_bp.route('/get_chart_data/<chart_type>')
def get_chart_data_route(chart_type):
    try:
        data_dict = get_tab3_data_dict(chart_type)
        if data_dict is None:
            return jsonify({'error': 'Invalid chart type specified'}), 400
        # Check if get_tab3_data_dict itself returned an error (e.g., file not found)
        if 'error' in data_dict:
             return jsonify(data_dict), 500 # Or a more appropriate client/server error code
        return jsonify(data_dict)
    except Exception as e:
        # Use current_app.logger here
        current_app.logger.error(f"Error in /get_chart_data/{chart_type}: {str(e)}")
        return jsonify({'error': 'An internal server error occurred', 'details': str(e)}), 500


# Flask app setup
app = Flask(__name__)   