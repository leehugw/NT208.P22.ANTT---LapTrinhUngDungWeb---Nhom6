import random
from datetime import datetime, timedelta
import unicodedata
import json
from pathlib import Path

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    no_accent = ''.join([c for c in nfkd_form if not unicodedata.combining(c)])
    return no_accent.replace('đ', 'd').replace('Đ', 'D')  # Xử lý riêng chữ "đ" và "Đ"

def generate_school_email(first_name, last_name):
    first_name = first_name.strip()
    last_name = last_name.strip().lower()

    first_initials = ''.join(word[0].lower() for word in first_name.split())  # Lấy chữ cái đầu của từng từ trong first_name
    first_initials = remove_accents(first_initials)  # Bỏ dấu
    last_name = remove_accents(last_name)  # Bỏ dấu
    
    school_email = f"{last_name}{first_initials}@uit.edu.vn"
    return school_email

def generate_lecturer_data(num_lecturers=30):
    data = []
    first_names_male = ["Nguyễn Văn", "Lê Văn", "Hoàng Văn", "Bùi Văn", "Vũ Văn", "Trần Văn", "Phạm Văn", "Đặng Văn", 
                       "Đỗ Văn", "Ngô Văn", "Lý Văn", "Mai Văn", "Đinh Văn", "Trịnh Văn", "Hồ Văn"]
    first_names_female = ["Trần Thị", "Phạm Thị", "Nguyễn Thị", "Lê Thị", "Đặng Thị", "Vũ Thị", "Hoàng Thị", "Bùi Thị",
                         "Đỗ Thị", "Ngô Thị", "Lý Thị", "Mai Thị", "Đinh Thị", "Trịnh Thị", "Hồ Thị"]
    last_names = ["An", "Bình", "Cường", "Dũng", "Giang", "Hải", "Khánh", "Long", "Minh", "Nga", "Phương", "Quân", 
                 "Sơn", "Tú", "Uyên", "Việt", "Xuân", "Yến", "Tùng", "Thảo"]
    faculties = {
        "KHOA_KHMT": "Khoa Khoa học Máy tính",
        "KHOA_CNPM": "Khoa Công nghệ Phần mềm",
        "KHOA_KTMT": "Khoa Kỹ thuật máy tính",
        "KHOA_HTTT": "Khoa Hệ thống Thông tin",
        "KHOA_MMT": "Khoa Mạng Máy tính & Truyền thông",
        "KHOA_KTTT": "Khoa Khoa học & Kỹ thuật thông tin"
    }
    provinces = [
        "Hà Nội", "Hồ Chí Minh", "Hải Phòng", "Đà Nẵng", "Cần Thơ", 
        "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", 
        "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", 
        "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", 
        "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", 
        "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình", 
        "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", 
        "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", 
        "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", 
        "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", 
        "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", 
        "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", 
        "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
    ]

    for i in range(1, num_lecturers + 1):
        gender = random.choice(["Nam", "Nữ"])
        
        if gender == "Nam":
            first_name = random.choice(first_names_male)
        else:
            first_name = random.choice(first_names_female)
            
        last_name = random.choice(last_names)
        name = f"{first_name} {last_name}"
        name_no_accents = remove_accents(name)
        
        # Generate birth date between 1970-01-01 and 1985-12-31
        start_date = datetime(1970, 1, 1)
        end_date = datetime(1985, 12, 31)
        delta = end_date - start_date
        random_days = random.randint(0, delta.days)
        birth_date = start_date + timedelta(days=random_days)
        
        lecturer_id = f"GV{str(i).zfill(3)}"
        faculty_id = random.choice(list(faculties.keys()))
        birth_place = random.choice(provinces)
        
        # Generate emails without accents
        name_parts = name_no_accents.lower().split()
        school_email = generate_school_email(first_name, last_name)
        personal_email = f"{''.join([part.lower() for part in name_parts])}@gmail.com"
        
        # Generate phone number
        phone = f"09{random.randint(10000000, 99999999)}"
        
        lecturer = {
            "lecturer_id": lecturer_id,
            "name": name,
            "gender": gender,
            "birth_date": birth_date.strftime("%d-%m-%Y"),
            "faculty_id": faculty_id,
            "birth_place": birth_place,
            "school_email": school_email,
            "alias_email": "",  # Empty as in example
            "personal_email": personal_email,
            "phone": phone
        }
        
        data.append(lecturer)
    
    return data

# Generate 20 lecturers with proper Vietnamese names but emails without accents
data = generate_lecturer_data(20)

current_file_path = Path(__file__).absolute()

# data_path = (
#    current_file_path.parent.parent.parent.parent
#    / "Database" 
#    / "SaveToMongo" 
#    / "Json" 
#    / "lecturers.json"
#)

data_path = Path("lecturers.json")

# Save to JSON file
with data_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {data_path.absolute()}")