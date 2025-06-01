def calculate_roi(predicted_salary, current_salary, mba_cost, years):
    return round((predicted_salary - current_salary) * years - mba_cost, 2)