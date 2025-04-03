import json
from pathlib import Path

# Đường dẫn hiện tại của file
current_file_path = Path(__file__).absolute()

input_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp
    / "Database" 
    / "SaveToMongo" 
    / "Json" 
    / "lecturers.json"
)

output_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp
    / "Database"
    / "SaveToMongo"
    / "Json"
    / "lecturer_accounts.json"
)

with open(input_path, "r", encoding="utf-8") as f:
    lecturer_data = json.load(f)

# Function to generate lecturer accounts
def generate_lecturer_accounts(lecturers):
    accounts = []
    for lecturer in lecturers:
        lecturer_id = lecturer["lecturer_id"]
        # Use school_email if available, otherwise generate from lecturer_id
        username = lecturer.get("school_email", f"{lecturer_id.lower()}@gm.uit.edu.vn")
        password = f"gv{lecturer_id[-3:].lower()}"  # Example: "gv001" for GV001
        
        account = {
            "username": username,
            "role": "lecturer",
            "lecturer_id": lecturer_id
        }
        accounts.append(account)
    return accounts

# Generate the accounts
data = generate_lecturer_accounts(lecturer_data)

# Save to JSON file
with output_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {output_path.absolute()}")