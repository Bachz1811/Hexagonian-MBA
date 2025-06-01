import pandas as pd
import json
import os


# Read CSV
csv_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'MBA_data.csv')

print("Trying to load:", csv_path)
print("Exists?", os.path.exists(csv_path))
df = pd.read_csv(csv_path)
print(df.head())

# Define function to map experience to job level
def get_job_level(years):
    if years <= 1:
        return "Entry Level"
    elif years <= 3:
        return "Junior Level"
    elif years <= 6:
        return "Mid Level"
    else:
        return "Senior Level"

# Create new column for Job Level
df["Job_Level"] = df["Years_of_Work_Experience"].apply(get_job_level)

# Define experience ranges manually
experience_ranges = {
    "Entry Level": "0–1 years",
    "Junior Level": "2–3 years",
    "Mid Level": "4–6 years",
    "Senior Level": "7–9 years"
}

# Group data by Job Level and calculate means
result = {}
for level in ["Entry Level", "Junior Level", "Mid Level", "Senior Level"]:
    group = df[df["Job_Level"] == level]
    result[level] = {
        "experience_range": experience_ranges[level],
        "average_salary_before": round(group["Annual_Salary_Before_MBA"].mean(), 2),
        "average_salary_after": round(group["Expected_Post_MBA_Salary"].mean(), 2)
    }

# Save result to JSON
with open("tab2/data.json", "w") as f:
    json.dump(result, f, indent=2)

print("✅ Data processed and saved to tab2/data.json")
