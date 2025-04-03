import random
import unicodedata
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
    / "contacts.json"
)

with open(input_path, "r", encoding="utf-8") as f:
    contact = json.load(f)

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    no_accent = ''.join([c for c in nfkd_form if not unicodedata.combining(c)])
    return no_accent.replace('đ', 'd').replace('Đ', 'D')  # Xử lý riêng chữ "đ" và "Đ"

def generate_contact_info(students):
    contact_data = []
    
    for student in students:
        student_id = student["student_id"]
        full_name = student["name"]
        
        # Generate school email
        school_email = f"{student_id}@gm.uit.edu.vn"
        
        # Generate personal email (without accents)
        name_no_accents = remove_accents(full_name).lower().replace(" ", "")
        personal_email = f"{name_no_accents}@gmail.com"
        
        # Generate phone number (Vietnamese format)
        phone = f"09{random.randint(10000000, 99999999)}"
        
        contact_info = {
            "student_id": student_id,
            "school_email": school_email,
            "alias_email": "",
            "personal_email": personal_email,
            "phone": phone
        }
        
        contact_data.append(contact_info)
    
    return contact_data

# Generate contact information
data = generate_contact_info(contact)

# Save to JSON file
with output_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {output_path.absolute()}")