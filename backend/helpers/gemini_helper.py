import os
import re
import json
from dotenv import load_dotenv
import google.generativeai as genai

# Load API key from .env
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 🔧 Estimate budget from funding source and salary
def estimate_budget(source, salary):
    try:
        salary = float(salary)
    except:
        salary = 50000  # fallback if parsing fails

    source = source.lower()
    if "scholarship" in source:
        return "$30,000–$50,000"
    elif "employer" in source:
        return "$70,000+"
    elif "loan" in source:
        return "$50,000–$80,000"
    elif "self" in source:
        return f"${int(salary * 0.4):,}–${int(salary * 0.6):,}"
    else:
        return "$40,000–$60,000"

def fix_json_formatting(json_str: str) -> str:
    """
    Fix common JSON formatting issues in the string.
    Returns a properly formatted JSON string.
    """
    try:
        # Remove any markdown code block markers
        json_str = re.sub(r'```json\s*|\s*```', '', json_str)
        
        # Remove any leading/trailing whitespace
        json_str = json_str.strip()
        
        # Fix line breaks in text fields
        json_str = re.sub(r'(?<="[^"]*)\n(?=[^"]*")', ' ', json_str)
        
        # Fix multiple spaces in text fields
        json_str = re.sub(r'(?<="[^"]*)\s{2,}(?=[^"]*")', ' ', json_str)
        
        # Fix missing commas between array elements
        json_str = re.sub(r'}\s*{', '},{', json_str)
        json_str = re.sub(r']\s*{', '],{', json_str)
        json_str = re.sub(r'}\s*\[', '},{', json_str)
        
        # Fix missing commas between object properties
        json_str = re.sub(r'"([^"]+)"\s*:\s*([^,}\]]+)([^,}\]]*)([^,}\]]*)([^,}\]]*)(?=[^,}\]]*[}\]])', r'"\1": \2\3\4\5,', json_str)
        
        # Remove trailing commas
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        
        # Fix unquoted keys
        json_str = re.sub(r'([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', json_str)
        
        # Fix single quotes to double quotes
        json_str = re.sub(r"'", '"', json_str)
        
        # Fix missing quotes around string values
        json_str = re.sub(r':\s*([a-zA-Z][a-zA-Z0-9_]*)(?=[,}\]])', r': "\1"', json_str)
        
        # Fix boolean and null values
        json_str = re.sub(r':\s*true(?=[,}\]])', ': true', json_str)
        json_str = re.sub(r':\s*false(?=[,}\]])', ': false', json_str)
        json_str = re.sub(r':\s*null(?=[,}\]])', ': null', json_str)
        
        # Fix number formatting
        json_str = re.sub(r':\s*(\d+)(?=[,}\]])', r': \1', json_str)
        json_str = re.sub(r':\s*(\d+\.\d+)(?=[,}\]])', r': \1', json_str)
        
        # Remove any remaining whitespace between properties
        json_str = re.sub(r',\s+', ', ', json_str)
        
        # Fix any remaining line breaks outside of string values
        json_str = re.sub(r'\n\s*', ' ', json_str)
        
        return json_str
    except Exception as e:
        print(f"Error fixing JSON formatting: {str(e)}")
        return json_str

# 🧠 Clean JSON extractor
def extract_json_from_response(text):
    """Extract and clean JSON from Gemini response."""
    try:
        # First try to find JSON object in the text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON object found in response")
            
        json_str = json_match.group()
        
        # Try to parse the raw JSON first
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            print("Initial JSON parsing failed, attempting to fix formatting...")
            
            # Fix JSON formatting
            fixed_json = fix_json_formatting(json_str)
            
            try:
                return json.loads(fixed_json)
            except json.JSONDecodeError as e:
                print(f"JSON parsing error after fixing: {str(e)}")
                print("Raw response:", text)
                print("Fixed JSON:", fixed_json)
                raise
                
    except Exception as e:
        print("⚠️ Error processing Gemini response:", str(e))
        print("⚠️ Raw response:", text)
        
        # Return a default response with error information
        return {
            "match_score": 0,
            "predicted_salary": 0,
            "recommended_mba_field": "Unknown",
            "summary": f"Failed to parse Gemini output: {str(e)}",
            "rcm_improvement": "No suggestions available due to parsing error.",
            "recommended_mba_programs": [],
            "career_path": [],
            "recommended_skills": [],
            "best_locations": [],
            "risk_factors": {},
            "scholarship_probability": 0.0,
            "fit_type": "Unknown",
            "personality_match_summary": "N/A",
            "error": str(e)
        }

# 🎓 Core function to query Gemini
def query_gemini(user_data):
    budget_range = estimate_budget(
        user_data['MBA_Funding_Source'],
        user_data['Annual_Salary_Before_MBA']
    )

    prompt = f"""
You are an expert MBA advisor AI with deep knowledge of admissions, career outcomes, salaries, and top global business schools.

Use the following candidate profile to generate an intelligent, structured analysis and advice in JSON format.

### Candidate Profile:
- Age: {user_data['Age']}
- Gender: {user_data['Gender']}
- Undergraduate Major: {user_data['Undergraduate_Major']}
- GPA: {user_data['Undergraduate_GPA']}
- Work Experience: {user_data['Years_of_Work_Experience']} years
- Current Job Title: {user_data['Current_Job_Title']}
- Current Salary: ${user_data['Annual_Salary_Before_MBA']}
- Management Experience: {user_data['Has_Management_Experience']}
- GRE/GMAT Score: {user_data['GREGMAT_Score']}
- Undergraduate University Ranking: {user_data['Undergrad_University_Ranking']}
- Entrepreneurial Interest (1-10): {user_data['Entrepreneurial_Interest']}
- Networking Importance (1-10): {user_data['Networking_Importance']}
- MBA Funding Source: {user_data['MBA_Funding_Source']}
- Estimated MBA Budget: {budget_range}
- Desired Post-MBA Role: {user_data['Desired_PostMBA_Role']}
- Expected Post-MBA Salary: ${user_data['Expected_PostMBA_Salary']}
- Location Preference After MBA: {user_data['Location_Preference_PostMBA']}
- Reason for MBA: {user_data['Reason_for_MBA']}
- Preferred Format: {user_data['Online_vs_OnCampusMBA']}
- Has Decided to Pursue MBA: {user_data['Decided_to_Pursue_MBA']}

---

### TASKS:

1. Calculate a match score (0-100) indicating MBA suitability.
2. Predict post-MBA salary (USD).
3. Recommend the best-fit MBA specialization.
4. Provide a 1-paragraph executive summary of your assessment.
5. Suggest 2–3 areas for improvement to strengthen MBA success.
Follow these formatting guidelines strictly:
    - Each distinct improvement suggestion must be on a new line. (Use a newline character to separate suggestions).
    - For any critical keywords, phrases, or actionable items within each suggestion that should be emphasized, enclose them in double asterisks. For example: "Focus on improving your **GMAT score** by at least **20 points**." or "Gain more **leadership experience** through **managing a small project**."
6. Recommend 3 MBA programs that match this profile, including 1 dream school, 1 safety school with ranking under 200, and 1 target school:
   For each program, provide:
   - school: Full school name (e.g., "Harvard Business School")
   - program_type: "Full-time / Online / Executive / Part-time"
   - fit_reason: Detailed explanation of why this school fits their profile
   - location: "City, Country" format
   - tuition: Estimated tuition in USD
   - employment_rate: Post-graduation employment rate
   - average_salary: Average post-MBA salary
   - strengths: Array of at least 5 objects, each with:
     - label: the name of the strength (e.g., "Entrepreneurship")
     - value: a number from 0 to 100 indicating how well the candidate matches this strength for the program
     Example:
     "strengths": [
       {{"label": "Entrepreneurship", "value": 92}},
       {{"label": "Finance", "value": 78}},
       {{"label": "Leadership", "value": 85}},
       {{"label": "Technology", "value": 60}},
       {{"label": "Global Business", "value": 73}}
     ]
     The values must be tailored to the candidate's profile and program fit. Do NOT use the same values for every program

   Note: For each school's logo_url:
   - For top 20 schools: Use their official logo URL
   - For other schools: Use "/static/school-logos/default.svg"
   - If a school's logo is not available, use "/static/school-logos/default.svg"

7. Predict the user's potential career path (post-MBA + 5 years).
8. List 3 skills the user should build pre- or during MBA.
9. Suggest 2-3 ideal cities/countries for post-MBA career.
    For each city, return:
    - city: City name
    - reason: Why it fits (from career, industry, lifestyle, immigration, etc.)
    - top_industries: List of 2–3 top sectors for MBAs in that city
    - average_salary: Typical MBA-level salary in USD
    - top_employers: 2–3 well-known companies in that city hiring MBAs
10. Identify 3 risk factors that could weaken the user's MBA application.
Each must be:
- A clear factor name (e.g., "Low GPA", "Short Work Experience")
- An integer risk score from 1 to 10 (1 = low risk, 10 = high risk)
11. Estimate probability of scholarship (0.0-1.0).
12. Analyze soft-skills/personality fit for MBA and provide a summary.

---

### STRICT JSON OUTPUT REQUIREMENTS:

1. **Valid JSON Only**: Ensure the output is a valid JSON object. Do not include any text, markdown, or explanations outside the JSON object.
2. **No Newlines in Strings**: Replace any newline characters (`\n`) in string values with spaces.
3. **No Trailing Commas**: Ensure there are no trailing commas in arrays or objects.
4. **Proper Escaping**: Escape any special characters (e.g., quotes) in string values to ensure valid JSON.
5. **No Extra Text**: Do not include any text before or after the JSON object.
6. **Compact Format**: Ensure the JSON is compact, with no unnecessary whitespace or line breaks.
7. **Logo URLs**: For each school's logo_url, use the following format:
   - For top 20 schools: Use their official logo URL
   - For other schools: Use "/static/school-logos/default.svg"
   - If a school's logo is not available, use "/static/school-logos/default.svg"
8. **Program Details**: Ensure all program details are accurate and up-to-date, including:
   - Tuition fees (in USD)
   - Program duration (in months)
   - Class size (number of students)
   - International student percentage
   - Employment rate (percentage)
   - Average salary (in USD)
   - Application deadlines (specific dates)
   - Scholarship information (specific types and amounts)
   - Website URLs (official program websites)
   - Rankings (global and regional)
   - Accreditation status

IMPORTANT: Your JSON output MUST include ALL of the following fields, even if empty, zero, or 'Unknown':
- match_score (integer)
- predicted_salary (float)
- recommended_mba_field (string)
- summary (string)
- rcm_improvement (string)
- recommended_mba_programs (array)
- career_path (array)
- recommended_skills (array)
- best_locations (array)
- risk_factors (object)
- scholarship_probability (float)
- fit_type (string)
- personality_match_summary (string)
- roi (float)
If you do not have a value, use 0, an empty array/object, or 'Unknown' as appropriate.
Return ONLY valid JSON, no extra text.
"""

    model = genai.GenerativeModel('models/gemini-1.5-flash')
    response = model.generate_content(prompt)
    gemini_result = extract_json_from_response(response.text)

    print("Gemini result:", gemini_result)

    roi = gemini_result.get("roi") or 0

    best_locations = gemini_result.get("best_locations") or gemini_result.get("ideal_cities_countries") or []
    normalized_locations = []
    for loc in best_locations:
        if isinstance(loc, dict):
            loc = dict(loc)  # Make a copy
            loc['reason'] = loc.get('reason') or loc.get('why') or "N/A"
            loc['city'] = loc.get('city') or loc.get('location') or "N/A"
            loc['top_industries'] = loc.get('top_industries') or []
            loc['avesrage_salary'] = loc.get('average_salary') or 0
            loc['top_employers'] = loc.get('top_employers') or []
            normalized_locations.append(loc)
        elif isinstance(loc, str):
            # If loc is a string, tsreat it as a city with no details
            normalized_locations.append({
                'city': loc,
                'reason': "N/A",
                'top_industries': [],
                'average_salary': 0,
                'top_employers': []
            })
        else:
            # If loc is not a dict or string, skip or handle as needed
            pass

    mapped_result = {
        "recommended_mba_field": gemini_result.get("recommended_mba_field") or gemini_result.get("best_fit_mba_specialization") or "Unknown",
        "summary": gemini_result.get("summary") or gemini_result.get("executive_summary") or "N/A",
        "rcm_improvement": (
            gemini_result.get("rcm_improvement")
            or ". ".join(
                [
                    item for item in gemini_result.get("areas_for_improvement", [])
                    if not str(item).strip().isdigit()
                ]
            )
            or "N/A"
        ),
        "improvements": (
            gemini_result.get("rcm_improvement")
            or ". ".join(
                [
                    item for item in gemini_result.get("areas_for_improvement", [])
                    if not str(item).strip().isdigit()
                ]
            )
            or "N/A"
        ),
        "recommended_mba_programs": gemini_result.get("recommended_mba_programs") or [],
        "career_path": gemini_result.get("career_path") or [],
        "recommended_skills": gemini_result.get("recommended_skills") or [],
        "best_locations": normalized_locations,
        "risk_factors": gemini_result.get("risk_factors") or {},
        "scholarship_probability": gemini_result.get("scholarship_probability") or 0,
        "fit_type": gemini_result.get("fit_type") or "Unknown",
        "personality_match_summary": gemini_result.get("personality_match_summary") or "N/A",
        "predicted_salary": gemini_result.get("predicted_salary") or 0,
        "roi": roi,
        "match_score": gemini_result.get("match_score") or 0,
    }

    # Ensure each recommended MBA program has at least 5 strengths/axes and values
    for program in mapped_result["recommended_mba_programs"]:
        strengths = program.get("strengths") or []
        # If strengths is a list of objects, extract labels and values
        if strengths and isinstance(strengths[0], dict):
            labels = [s.get("label") or s.get("axis") or "" for s in strengths]
            values = [s.get("value", 0) for s in strengths]
        else:
            labels = strengths
            values = program.get("strengths_values") or [70] * len(labels)
        # Ensure at least 5 axes/values
        default_axes = ["Leadership", "Global", "Technology", "Analytics", "Strategy", "Entrepreneurship", "Finance", "Consulting"]
        while len(labels) < 5:
            labels.append(default_axes[len(labels) % len(default_axes)])
            values.append(60)
        # Write back to program
        if strengths and isinstance(strengths[0], dict):
            program["strengths"] = [{"label": l, "value": v} for l, v in zip(labels, values)]
        else:
            program["strengths"] = labels
            program["strengths_values"] = values

    return mapped_result

def query_basic_assess(prompt):
    try:
        response = genai.generate_content(prompt)
        return json.loads(response.text if hasattr(response, 'text') else response)
    except Exception as e:
        return {'error': str(e)}

