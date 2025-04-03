import random
from datetime import datetime, timedelta
import json
from pathlib import Path

def generate_identity_data(student_ids):
    data = []
    
    ethnicities = ["Kinh", "Tày", "Thái", "Hoa", "Khơ-me", "Mường", "Nùng", "H'Mông", "Dao", "Gia-rai"]
    religions = ["Không", "Phật giáo", "Thiên chúa giáo", "Tin lành", "Cao đài", "Hòa hảo", "Hồi giáo"]
    origins = ["Cán bộ - Công chức", "Nông dân", "Công nhân", "Tiểu thương", "Doanh nhân", "Trí thức", "Nghệ sĩ"]
    
    for student_id in student_ids:
        # Generate random identity number (12 digits)
        identity_number = f"{random.randint(100000000, 999999999):012d}"
        
        # Generate issue date between 2010-2020
        issue_date = datetime(2010, 1, 1) + timedelta(days=random.randint(0, 365*10))
        
        # Issue place - 70% chance to be standard, 30% custom
        if random.random() < 0.7:
            issue_place = "Cục cảnh sát ĐKQL cư trú và DLQG về dân cư"
        else:
            issue_place = f"Công an {random.choice(['tỉnh', 'thành phố'])} {random.choice(['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'])}"
        
        # Random ethnicity with 80% chance to be Kinh
        ethnicity = "Kinh" if random.random() < 0.8 else random.choice(ethnicities[1:])
        
        # Religion - 70% chance to be "Không"
        religion = "Không" if random.random() < 0.7 else random.choice(religions[1:])
        
        # Origin
        origin = random.choice(origins)
        
        # Union join date (70% chance to have)
        if random.random() < 0.7:
            union_date = datetime(2020, 1, 1) + timedelta(days=random.randint(0, 365*3))
            union_join_date = union_date.strftime("%d-%m-%Y")
        else:
            union_join_date = ""
        
        # Party join date (10% chance to have)
        if random.random() < 0.1:
            party_date = datetime(2020, 1, 1) + timedelta(days=random.randint(0, 365*3))
            party_join_date = party_date.strftime("%d-%m-%Y")
        else:
            party_join_date = ""
        
        identity_info = {
            "student_id": student_id,
            "identity_number": identity_number,
            "identity_issue_date": issue_date.strftime("%d-%m-%Y"),
            "identity_issue_place": issue_place,
            "ethnicity": ethnicity,
            "religion": religion,
            "origin": origin,
            "union_join_date": union_join_date,
            "party_join_date": party_join_date
        }
        
        data.append(identity_info)
    
    return data

# Generate for 50 students
student_ids = [f"25525{str(i).zfill(3)}" for i in range(1, 51)]
data = generate_identity_data(student_ids)

current_file_path = Path(__file__).absolute()

data_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp từ vị trí hiện tại
    / "Database" 
    / "SaveToMongo" 
    / "Json" 
    / "identities.json"
)

# Save to JSON file
with data_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {data_path.absolute()}")