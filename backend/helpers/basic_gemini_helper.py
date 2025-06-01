import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

# Load API key from .env
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
generation_config = genai.types.GenerationConfig(
    response_mime_type="application/json"
)
model = genai.GenerativeModel('models/gemini-2.0-flash')

def get_basic_assessment(age, work_experience, major, job_title, gmat_score, reason):
    try:
        prompt = f"""
You are an expert MBA admissions advisor. Given the following candidate profile, provide a JSON object with these fields:
- match_score (integer 0-100, REQUIRED)
- recommended_mba_field (string)
- recommended_skills (array of strings, 3-5 skills relevant for career growth)
- summary (2-3 sentence executive summary, highlight strengths, MBA potential, and any notable opportunities or risks; do NOT just repeat the input)
- risk_factors (array of objects with 'factor' and 'score' 1-10, at least 3 risk factors) 
- scholarship_probability (float 0.0-1.0)

Example output:
{{
  "match_score": 78,
  "recommended_mba_field": "Marketing",
  "summary": "This candidate has strong marketing interest and solid work experience, making them a good fit for an MBA. Their GMAT is competitive, but they should clarify their post-MBA goals.",
  "risk_factors": [{{"factor": "Low Work Experience", "score": 4}}, {{"factor": "Low GMAT Score", "score": 2}}],
  "scholarship_probability": 0.5,
  "recommended_skills": ["Financial Modeling", "Strategic Planning", "Data Analysis"]
}}

Candidate Profile:
- Age: {age}
- Work Experience: {work_experience} years
- Undergraduate Major: {major}
- Current Job Title: {job_title}
- GMAT Score: {gmat_score}
- Motivation: {reason}

Respond ONLY with the JSON object. All fields are REQUIRED.
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        print(f"DEBUG: Raw response text from Gemini (Basic):\n---\n{text}\n---") # ADDED FOR DEBUGGING
        # Extract JSON object from the response
        start = text.find('{')
        end = text.rfind('}') + 1
        json_str = text[start:end]
        print(f"DEBUG: Extracted JSON string (Basic):\n---\n{json_str}\n---") # ADDED FOR DEBUGGING
        result = json.loads(json_str)
        print(f"DEBUG: Parsed JSON result (Basic):\n---\n{result}\n---") # ADDED FOR DEBUGGING

        # Ensure all required fields are present and match frontend expectations
        return {
            "match_score": result.get("match_score", 0),
            "recommended_mba_field": result.get("recommended_mba_field", "Unknown"),
            "summary": result.get("summary", "No summary provided."),
            "risk_factors": result.get("risk_factors", []),
            "scholarship_probability": result.get("scholarship_probability", 0.0),
            "recommended_skills": result.get("recommended_skills", []), # Add this line
        }
    except Exception as e:
        print("Error in get_basic_assessment:", e)
        return {
            "match_score": 0,
            "recommended_mba_field": "Error",
            "summary": "Unable to generate assessment",
            "risk_factors": [],
            "scholarship_probability": 0.0,
            "recommended_skills": []  # Ensure this field is always present
        }