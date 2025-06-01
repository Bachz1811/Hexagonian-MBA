# index4.py (formerly app4.py)
from flask import Blueprint, render_template
import pandas as pd
import os

tab4_bp = Blueprint('tab4', __name__, template_folder='../templates')

def get_tab4_data():
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'MBA_data.csv')
    print("Trying to load:", csv_path)
    print("Exists?", os.path.exists(csv_path))
    df = pd.read_csv(csv_path)
    print(df.head())
    grouped_counts = df.groupby(['Reason_for_MBA', 'Gender']).size().unstack(fill_value=0)
    proportions = grouped_counts.div(grouped_counts.sum(axis=1), axis=0).mul(100).round(1)
    percentages = proportions.to_dict(orient='index')
    details = [
        {
            'name': reason,
            'male': proportions.at[reason, 'Male'],
            'female': proportions.at[reason, 'Female'],
            'other': proportions.at[reason, 'Other']
        }
        for reason in proportions.index
    ]
    return percentages, details

@tab4_bp.route('/tab4')
def index4():
    gender_percentages, reason_data = get_tab4_data()
    return render_template(
        'index4.html',
        gender_percentages=gender_percentages,
        reason_data=reason_data
    )