# File: tab/backend/app6.py

from flask import Blueprint, request, jsonify, current_app
import csv
import os
import traceback # For detailed error logging

# Adjust the import path if your structure is different.
# Assuming your helper files (gemini_helper.py, etc.) are in tab/backend/helpers/
from .helpers.gemini_helper import query_gemini
from .helpers.basic_gemini_helper import get_basic_assessment
from .helpers.roi_calculator import calculate_roi

tab6_bp = Blueprint('tab6', __name__) # Removed template_folder and static_folder, main app usually handles this.

# --- Route for Tab 6 form submission ---
@tab6_bp.route('/submit_mba_profile_tab6', methods=['POST']) # Changed route to be more specific
def submit_mba_profile_tab6(): # Changed function name
    try:
        data = request.form.to_dict()
        assessment_type = data.pop('assessment_type', 'advanced')
        current_app.logger.info(f"Tab6: Received data for {assessment_type} assessment: {data}")
        
        if assessment_type == 'basic':
            # Use .get() for safer dictionary access to avoid KeyErrors
            basic_data_dict = get_basic_assessment(
                age=data.get('Age'),
                work_experience=data.get('Work_Experience'),
                major=data.get('Undergraduate_Major'),
                job_title=data.get('Current_Job_Title'),
                gmat_score=data.get('GMAT_GRE_Score'),
                reason=data.get('Reason_for_MBA')
            )
            
            mapped_result = {
                "recommended_mba_field": basic_data_dict.get("recommended_mba_field", "Unknown"),
                "summary": basic_data_dict.get("summary", "N/A"),
                "rcm_improvement": "N/A",
                "recommended_mba_programs": [],
                "career_path": [],
                "recommended_skills": basic_data_dict.get("recommended_skills", []), 
                "best_locations": [],
                "risk_factors": basic_data_dict.get("risk_factors", []), # Ensure this is list of dicts
                "scholarship_probability": basic_data_dict.get("scholarship_probability", 0),
                "fit_type": "Basic Assessment",
                "personality_match_summary": "N/A",
                "predicted_salary": None,
                "roi": None,
                "match_score": basic_data_dict.get("match_score", 0),
            }
        else: # Advanced assessment
            # Safer type conversions with defaults
            try:
                data['Annual_Salary_Before_MBA'] = float(data.get('Annual_Salary_Before_MBA', 0))
                data['Expected_PostMBA_Salary'] = float(data.get('Expected_PostMBA_Salary', 0))
                # Add other necessary conversions, e.g.:
                data['Undergraduate_GPA'] = float(data.get('Undergraduate_GPA', 0.0))
                data['GREGMAT_Score'] = int(data.get('GREGMAT_Score', 0)) # Or GMAT_GRE_Score from advanced form
                data['Years_of_Work_Experience'] = int(data.get('Years_of_Work_Experience', 0))
                # ... ensure all fields needed by query_gemini are present and correctly typed
            except ValueError as ve:
                current_app.logger.error(f"Tab6: ValueError during type conversion: {ve}")
                return jsonify({'error': f"Invalid data format for a numeric field: {ve}"}), 400


            gemini_data_from_helper = query_gemini(data)
            roi = calculate_roi(
                gemini_data_from_helper.get('predicted_salary', 0),
                data.get('Annual_Salary_Before_MBA',0), # Already converted to float
                120000, # MBA_Cost
                5       # Years for ROI
            )

            entry_for_csv = {
                **data,
                **gemini_data_from_helper,
                'ROI': roi,
                'MBA_Cost': 120000
            }

            # --- Corrected CSV Writing Path ---
            # current_app.root_path is usually the 'tab' directory (where main app.py is)
            # We want a 'data' folder at the project root (sibling to 'tab')
            project_root = os.path.abspath(os.path.join(current_app.root_path, '..'))
            csv_data_dir = os.path.join(project_root, 'data')
            os.makedirs(csv_data_dir, exist_ok=True) # Ensure this directory exists
            csv_file_path = os.path.join(csv_data_dir, 'MBA_data.csv')
            current_app.logger.info(f"Tab6: Saving CSV to {csv_file_path}")


            # Determine fieldnames more robustly
            all_possible_keys = set(data.keys()) | set(gemini_data_from_helper.keys()) | {'ROI', 'MBA_Cost'}
            fieldnames = sorted(list(all_possible_keys))
            
            file_exists = os.path.isfile(csv_file_path)
            with open(csv_file_path, 'a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                if not file_exists or f.tell() == 0:
                    writer.writeheader()
                writer.writerow(entry_for_csv)
            # --- End CSV Writing ---

            adv_risk_factors_raw = gemini_data_from_helper.get("risk_factors")
            normalized_adv_risk_factors = []
            if isinstance(adv_risk_factors_raw, dict):
                for factor, score_text in adv_risk_factors_raw.items():
                    score_val = 0
                    try: score_val = int(score_text)
                    except (ValueError, TypeError): pass
                    normalized_adv_risk_factors.append({"factor": str(factor), "score": score_val})
            elif isinstance(adv_risk_factors_raw, list):
                for item in adv_risk_factors_raw:
                    if isinstance(item, dict) and "factor" in item and "score" in item:
                        score_val = 0
                        try: score_val = int(item.get("score",0)) # Added default for .get()
                        except (ValueError, TypeError): pass
                        normalized_adv_risk_factors.append({"factor": str(item.get("factor","Unknown Factor")), "score": score_val})
            
            mapped_result = {
                "recommended_mba_field": gemini_data_from_helper.get("recommended_mba_field") or gemini_data_from_helper.get("best_fit_mba_specialization") or "Unknown",
                "summary": gemini_data_from_helper.get("summary") or gemini_data_from_helper.get("executive_summary") or "N/A",
                "rcm_improvement": (
                    gemini_data_from_helper.get("rcm_improvement") or
                    ". ".join(filter(lambda x: isinstance(x, str) and x.strip() and not x.strip().isdigit(), gemini_data_from_helper.get("areas_for_improvement", []))) or "N/A"
                ),
                "recommended_mba_programs": gemini_data_from_helper.get("recommended_mba_programs") or [],
                "career_path": gemini_data_from_helper.get("career_path") or [],
                "recommended_skills": gemini_data_from_helper.get("recommended_skills") or [],
                "best_locations": gemini_data_from_helper.get("best_locations") or gemini_data_from_helper.get("ideal_cities_countries") or [],
                "risk_factors": normalized_adv_risk_factors,
                "scholarship_probability": gemini_data_from_helper.get("scholarship_probability") or 0,
                "fit_type": gemini_data_from_helper.get("fit_type") or "Advanced Assessment",
                "personality_match_summary": gemini_data_from_helper.get("personality_match_summary") or "N/A",
                "predicted_salary": gemini_data_from_helper.get("predicted_salary") or 0,
                "roi": roi,
                "match_score": gemini_data_from_helper.get("match_score") or 0,
            }

            # Ensure each recommended MBA program has at least 5 strengths/axes and values
            for program in mapped_result.get("recommended_mba_programs", []): # Use .get for safety
                strengths_data = program.get("strengths")
                labels = []
                values = []
                if strengths_data and isinstance(strengths_data, list) and strengths_data: # Check if not empty
                    if isinstance(strengths_data[0], dict):
                        labels = [s.get("label") or s.get("axis") or "" for s in strengths_data]
                        values = [s.get("value", 0) for s in strengths_data]
                    elif isinstance(strengths_data[0], str): # If it's a list of strings
                        labels = strengths_data
                        values = program.get("strengths_values") or ([70] * len(labels)) # Default values
                
                default_axes = ["Leadership", "Global", "Technology", "Analytics", "Strategy", "Entrepreneurship", "Finance", "Consulting"]
                current_label_idx = 0
                while len(labels) < 5:
                    labels.append(default_axes[current_label_idx % len(default_axes)])
                    values.append(60) 
                    current_label_idx +=1
                
                # Reconstruct based on original format if necessary
                if strengths_data and isinstance(strengths_data, list) and strengths_data and isinstance(strengths_data[0], dict):
                    program["strengths"] = [{"label": l, "value": v} for l, v in zip(labels, values)]
                else: # Assume separate labels and values or default to it
                    program["strengths"] = labels 
                    program["strengths_values"] = values
        
        return jsonify(mapped_result)

    except Exception as e:
        current_app.logger.error(f"Tab6 Error in /submit_mba_profile_tab6: {str(e)}")
        current_app.logger.error(traceback.format_exc()) # Log the full traceback
        # Return a JSON error message, which the frontend can handle more gracefully
        return jsonify({'error': f'An internal server error occurred: {str(e)}', 'trace': traceback.format_exc() if current_app.debug else None}), 500