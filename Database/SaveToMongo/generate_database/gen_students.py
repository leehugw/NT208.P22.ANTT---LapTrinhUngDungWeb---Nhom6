import random
from datetime import datetime, timedelta
import unicodedata
import json
from pathlib import Path

def generate_student_data(num_students=50):
    data = []
    first_names_male = ["Nguyễn Văn", "Lê Văn", "Hoàng Văn", "Bùi Văn", "Vũ Văn", "Trần Văn", "Phạm Văn", "Đặng Văn", 
                        "Đỗ Văn", "Ngô Văn", "Lý Văn", "Mai Văn", "Đinh Văn", "Trịnh Văn", "Hồ Văn"]
    first_names_female = ["Trần Thị", "Phạm Thị", "Nguyễn Thị", "Lê Thị", "Đặng Thị", "Vũ Thị", "Hoàng Thị", "Bùi Thị",
                         "Đỗ Thị", "Ngô Thị", "Lý Thị", "Mai Thị", "Đinh Thị", "Trịnh Thị", "Hồ Thị"]
    
    last_names_male = ["Anh", "Bình", "Dũng", "Hiếu", "Khánh", "Minh", "Phương", "Quang", "Thành", "Việt", "Tuấn", "Sơn", "Nam", "Khoa", "Lâm", "Bảo"]

    last_names_female = ["Anh", "Chi", "Giang", "Linh", "Nga", "Phương", "Uyên", "Xuân", "Yến","Thảo", "Hoa", "Như", "Huyền", "Ngọc", "Nhi", "My"]

    majors = ["KHMT", "KTPM", "CNTT", "HTTT", "KHDL", "KTMT", "MMTT", "ATTT", "TKVM", "KHTN", "ATTN"]
    
    for i in range(1, num_students + 1):
        gender = random.choice(["Nam", "Nữ"])
        
        if gender == "Nam":
            first_name = random.choice(first_names_male)
            last_name = random.choice(last_names_male)
        else:
            first_name = random.choice(first_names_female)
            last_name = random.choice(last_names_female)
            
        name = f"{first_name} {last_name}"
        
        # Generate birth date between 2003-01-01 and 2005-12-31
        start_date = datetime(2004, 1, 1)
        end_date = datetime(2006, 12, 31)
        delta = end_date - start_date
        random_days = random.randint(0, delta.days)
        birth_date = start_date + timedelta(days=random_days)
        
        student_id = f"25525{str(i).zfill(3)}"
        birthplace = f"{str(random.randint(1, 64)).zfill(2)}"  # 64 provinces in Vietnam
        major = random.choice(majors)
        class_num = random.randint(1, 2)
        class_id = f"{major}{str(class_num).zfill(2)}"
        
        student = {
            "student_id": student_id,
            "name": name,
            "gender": gender,
            "birth_date": birth_date.strftime("%d-%m-%Y"),
            "birthplace": birthplace,
            "class_id": class_id
        }
        
        data.append(student)
    
    return data

# Generate 50 students
data = generate_student_data(50)

current_file_path = Path(__file__).absolute()

data_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp từ vị trí hiện tại
    / "Database" 
    / "SaveToMongo" 
    / "Json" 
    / "students.json"
)

# Save to JSON file
with data_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {data_path.absolute()}")