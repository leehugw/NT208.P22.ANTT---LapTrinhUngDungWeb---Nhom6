import random
from datetime import datetime, timedelta
import unicodedata
import json
from pathlib import Path

faculties = [
    {"faculty": "Kỹ thuật máy tính", "classes": ["KTMT", "TKVM"], "faculty_id": "KHOA_KTMT"},
    {"faculty": "Khoa học & Kỹ thuật thông tin", "classes": ["CNTT", "KHDL"], "faculty_id": "KHOA_KTTT"},
    {"faculty": "Khoa học máy tính", "classes": ["KHMT", "TTNT"], "faculty_id": "KHOA_KHMT"},
    {"faculty": "Công nghệ phần mềm", "classes": ["KTPM"], "faculty_id": "KHOA_CNPM"},
    {"faculty": "Hệ thống thông tin", "classes": ["HTTT", "TMDT"], "faculty_id": "KHOA_HTTT"},
    {"faculty": "Mạng máy tính & Truyền thông", "classes": ["ATTT", "MMTT"], "faculty_id": "KHOA_MTT"},
]

first_names_male = ["Nguyễn Văn", "Lê Văn", "Hoàng Văn", "Bùi Văn", "Vũ Văn", "Trần Văn", "Phạm Văn", "Đặng Văn", 
                   "Đỗ Văn", "Ngô Văn", "Lý Văn", "Mai Văn", "Đinh Văn", "Trịnh Văn", "Hồ Văn"]
first_names_female = ["Trần Thị", "Phạm Thị", "Nguyễn Thị", "Lê Thị", "Đặng Thị", "Vũ Thị", "Hoàng Thị", "Bùi Thị",
                     "Đỗ Thị", "Ngô Thị", "Lý Thị", "Mai Thị", "Đinh Thị", "Trịnh Thị", "Hồ Thị"]
last_names = ["An", "Bình", "Cường", "Dũng", "Giang", "Hải", "Khánh", "Long", "Minh", "Nga", "Phương", "Quân", 
             "Sơn", "Tú", "Uyên", "Việt", "Xuân", "Yến", "Tùng", "Thảo"]

provinces = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ", "Bình Dương", "Đồng Nai", "Nghệ An", "Huế", "Quảng Ninh"]

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    no_accent = ''.join([c for c in nfkd_form if not unicodedata.combining(c)])
    return no_accent.replace('đ', 'd').replace('Đ', 'D')

def generate_school_email(first_name, last_name):
    first_name = first_name.strip()
    last_name = last_name.strip().lower()
    first_initials = ''.join(word[0].lower() for word in first_name.split())
    first_initials = remove_accents(first_initials)
    last_name = remove_accents(last_name)
    school_email = f"{last_name}{first_initials}@uit.edu.vn"
    return school_email

def random_class(faculty_classes, used_classes):
    while True:
        year = random.randint(2021, 2024)
        semester = random.choice(["1", "2"])
        class_code = random.choice(faculty_classes)
        class_name = f"{class_code}{year}.{semester}"
        if class_name not in used_classes:
            used_classes.add(class_name)
            return class_name

def generate_lecturer_data(num_lecturers=30):
    data = []
    used_classes = set()
    for i in range(1, num_lecturers + 1):
        gender = random.choice(["Nam", "Nữ"])
        if gender == "Nam":
            first_name = random.choice(first_names_male)
        else:
            first_name = random.choice(first_names_female)
        last_name = random.choice(last_names)
        fullname = f"{first_name} {last_name}"
        name_no_accents = remove_accents(fullname)
        lecturer_id = f"GV{str(i).zfill(3)}"
        birthdate = (datetime(1990, 1, 1) + timedelta(days=random.randint(0, 365*10))).strftime("%Y-%m-%d")
        birthplace = random.choice(provinces)
        faculty_info = random.choice(faculties)
        faculty = faculty_info["faculty"]
        className = random_class(faculty_info["classes"], used_classes)
        phonenumber = f"09{random.randint(10000000, 99999999)}"
        personal_email = f"{''.join(name_no_accents.lower().split())}@gmail.com"
        email = personal_email
        faculty_id = faculty_info["faculty_id"]
        lecturer = {
            "lecturer_id": lecturer_id,
            "username": personal_email,
            "fullname": fullname,
            "gender": gender,
            "birthdate": birthdate,
            "birthplace": birthplace,
            "faculty": faculty,
            "faculty_id": faculty_id,
            "class_id": className,
            "phonenumber": phonenumber,
            "email": email
        }
        data.append(lecturer)
    return data

# Generate 30 lecturers
data = generate_lecturer_data(30)

# Đường dẫn tương đối từ thư mục gốc project
data_path = Path(__file__).parent.parent / "Json" / "lecturers.json"

# Save to JSON file
with data_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {data_path.absolute()}")