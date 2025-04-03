import json
from pathlib import Path

# Đường dẫn hiện tại của file
current_file_path = Path(__file__).absolute()

input_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp
    / "Database" 
    / "SaveToMongo" 
    / "Json" 
    / "students.json"
)

output_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp
    / "Database"
    / "SaveToMongo"
    / "Json"
    / "student_accounts.json"
)

with open(input_path, "r", encoding="utf-8") as f:
    student_data = json.load(f)

# Function to generate accounts
def generate_student_accounts(students):
    accounts = []
    for student in students:
        student_id = student["student_id"]
        username = f"{student_id}@gm.uit.edu.vn"
        password = f"abcd{student_id[-4:]}"
        
        account = {
            "username": username,
            "role": "student",
            "student_id": student_id
        }
        accounts.append(account)
    return accounts

# Generate the accounts
data = generate_student_accounts(student_data)

# Save to JSON file
with output_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {output_path.absolute()}")