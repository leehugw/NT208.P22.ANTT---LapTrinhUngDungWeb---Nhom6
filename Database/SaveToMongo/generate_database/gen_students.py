import random
from datetime import datetime, timedelta
import json
from pathlib import Path
from faker import Faker
import unicodedata
from faker.providers import BaseProvider

# Initialize Faker with Vietnamese locale
faker = Faker('vi_VN')

# Custom provider for Vietnamese addresses (simplified version)
class VietnamAddressProvider(BaseProvider):
    def city(self):
        return random.choice([
            "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", 
            "Bình Dương", "Đồng Nai", "Khánh Hòa", "Huế", "Quảng Ninh"
        ])

    def district(self, city=None):
        districts = {
            "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Cầu Giấy"],
            "Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 5", "Quận 10", "Tân Bình"],
            "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn"],
            "Hải Phòng": ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An"],
            "Cần Thơ": ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn"]
        }
        if city and city in districts:
            return random.choice(districts[city])
        return random.choice(["Quận " + str(i) for i in range(1, 13)])

    def street_name(self):
        streets = [
            "Nguyễn Huệ", "Lê Lợi", "Trần Hưng Đạo", "Hai Bà Trưng", 
            "Lý Thường Kiệt", "Phạm Ngọc Thạch", "Võ Văn Tần"
        ]
        return random.choice(streets)

faker.add_provider(VietnamAddressProvider)

def generate_vietnamese_address(city=None):
    if not city:
        city = faker.city()

    street_number = faker.building_number()
    street_name = faker.street_name()
    ward = f"Phường {faker.random_int(min=1, max=20)}"
    district = faker.district(city)  # Sử dụng district theo city nếu có

    return f"Số {street_number}, đường {street_name}, {ward}, {district}, {city}"


birthplaces = [
    "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng",
    "An Giang", "Bình Dương", "Đồng Nai", "Khánh Hòa", "Lâm Đồng",
    "Thừa Thiên Huế", "Quảng Ninh", "Thanh Hóa", "Nghệ An", "Bình Định"
]

def generate_birthplace():
    return random.choice(birthplaces)

def generate_student_id(year: int):
    """
    Sinh mã sinh viên theo năm nhập học.
    Ví dụ: 2023 → 23520001
    """
    prefix = f"{year % 100:02d}52"
    suffix = f"{faker.unique.random_int(min=0, max=9999):04d}"
    return prefix + suffix

def generate_students(n, year):
    students = []
    for _ in range(n):
        student_id = generate_student_id(year)
        name = faker.name()
        dob = faker.date_of_birth(minimum_age=19, maximum_age=22).strftime("%Y-%m-%d")
        address = faker.address().replace("\n", ", ")
        email = faker.email()
        phone = faker.phone_number()

        student = {
            "student_id": student_id,
            "name": name,
            "dob": dob,
            "address": address,
            "email": email,
            "phone": phone
        }
        students.append(student)
    return students

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    no_accent = ''.join([c for c in nfkd_form if not unicodedata.combining(c)])
    return no_accent.replace('đ', 'd').replace('Đ', 'D')

def generate_students(num_students=50):
    students = []
    
    # Vietnamese name components
    first_names_male = ["Nguyễn Văn", "Lê Văn", "Hoàng Văn", "Bùi Văn", "Vũ Văn", "Trần Văn", "Phạm Văn", "Đặng Văn", 
                        "Đỗ Văn", "Ngô Văn", "Lý Văn", "Mai Văn", "Đinh Văn", "Trịnh Văn", "Hồ Văn"]
    first_names_female = ["Trần Thị", "Phạm Thị", "Nguyễn Thị", "Lê Thị", "Đặng Thị", "Vũ Thị", "Hoàng Thị", "Bùi Thị",
                         "Đỗ Thị", "Ngô Thị", "Lý Thị", "Mai Thị", "Đinh Thị", "Trịnh Thị", "Hồ Thị"]
    
    last_names_male = ["Anh", "Bình", "Dũng", "Hiếu", "Khánh", "Minh", "Phương", "Quang", "Thành", "Việt", "Tuấn", "Sơn", "Nam", "Khoa", "Lâm", "Bảo"]
    last_names_female = ["Anh", "Chi", "Giang", "Linh", "Nga", "Phương", "Uyên", "Xuân", "Yến","Thảo", "Hoa", "Như", "Huyền", "Ngọc", "Nhi", "My"]
    
    # Các khóa học từ 2021-2024
    
    for i in range(1, num_students + 1):
        gender = random.choice(["Male", "Female"])
        
        if gender == "Male":
            first_name = random.choice(first_names_male)
            last_name = random.choice(last_names_male)
        else:
            first_name = random.choice(first_names_female)
            last_name = random.choice(last_names_female)
            
        name = f"{first_name} {last_name}"
        
        # Chỉ cho phép sinh năm 2003–2005
        birth_year = random.choice([2003, 2004, 2005])
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        birth_date = datetime(birth_year, birth_month, birth_day)

        # Giả định vào đại học năm 18 tuổi
        cohort = birth_year + 18
        student_id = generate_student_id(cohort)
        birthplace = generate_birthplace()  # 64 provinces in Vietnam
        program_id = f"CTDT{cohort}"
        
        # Chọn ngành học, khóa và loại chương trình
        if cohort < 2024:
            majors = ["ATTT", "MMTT", "CNTT", "HTTT", "KHMT", "TTNT", "KTPM", "KTMT", "TMDT", "KHDL"]
        else:
            majors = ["ATTT", "MMTT", "CNTT", "HTTT", "KHMT", "TTNT", "KTPM", "KTMT", "TMDT", "KHDL", "TKVM"]
        major_id = random.choice(majors)
        if major_id in ["ATTT", "KHMT"]:
            program_types = ["CQUI", "CNTN"]
            program_type = random.choice(program_types)
        else:
            program_type = "CQUI"
        
        # Tạo class_name theo định dạng {major_id}{cohort}.{lớp}
        class_num = random.randint(1, 2)
        if program_type == "CNTN":
            if major_id == "ATTT":
                class_id = f"ATTN{cohort}{class_num}"
                class_name = f"ATTN{cohort}.{class_num}"
            else:
                class_id = f"KHTN{cohort}{class_num}"
                class_name = f"KHTN{cohort}.{class_num}"
            
        else:
            class_id = f"{major_id}{cohort}{class_num}"
            class_name = f"{major_id}{cohort}.{class_num}"
        
        # Generate contact info
        school_email = f"{student_id}@gm.uit.edu.vn"
        name_no_accents = remove_accents(name).lower().replace(" ", "")
        personal_email = f"{name_no_accents}@gmail.com"
        phone = f"09{random.randint(10000000, 99999999)}"
        
        # Generate address info
        permanent_address = generate_vietnamese_address()
        
        if random.random() > 0.5:
            temp_address = "Ký túc xá đại học quốc gia thành phố Hồ Chí Minh, Số 6, Phường Linh Trung, Quận Thủ Đức, Thành phố Hồ Chí Minh"
        else:
            temp_city = faker.city()
            temp_district = faker.district(temp_city)
            temp_address = f"Số {random.randint(1, 200)}, Đường {faker.street_name()}, {temp_district}, {temp_city}"
        
        # Generate identity info
        identity_number = f"{random.randint(100000000, 999999999):012d}"
        issue_date = datetime(2010, 1, 1) + timedelta(days=random.randint(0, 365*10))
        
        ethnicities = ["Kinh", "Tày", "Thái", "Hoa", "Khơ-me", "Mường", "Nùng", "H'Mông", "Dao", "Gia-rai"]
        religions = ["Không", "Phật giáo", "Thiên chúa giáo", "Tin lành", "Cao đài", "Hòa hảo", "Hồi giáo"]
        origins = ["Cán bộ - Công chức", "Nông dân", "Công nhân", "Tiểu thương", "Doanh nhân", "Trí thức", "Nghệ sĩ"]
        
        # Generate family info
        male_last_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"]
        female_last_names = ["Nguyễn Thị", "Trần Thị", "Lê Thị", "Phạm Thị", "Hoàng Thị", "Huỳnh Thị", "Phan Thị"]
        middle_names = ["Văn", "Quang", "Đức", "Minh", "Hữu", "Công", "Thanh", "Duy", "Anh", "Bảo"]
        first_names = ["A", "B", "C", "D", "E", "F", "G", "H", "K", "L", "M", "N", "P", "Q", "S", "T"]
        
        father_jobs = [
            "Kỹ sư xây dựng", "Bác sĩ", "Giảng viên đại học", "Doanh nhân", 
            "Cán bộ nhà nước", "Kỹ sư phần mềm", "Giám đốc công ty", 
            "Trưởng phòng kinh doanh", "Chuyên viên tài chính", "Kiến trúc sư"
        ]
        
        mother_jobs = [
            "Giáo viên", "Bác sĩ", "Kế toán", "Nhân viên văn phòng", 
            "Kinh doanh tự do", "Y tá", "Dược sĩ", "Kiểm toán viên", 
            "Chuyên viên nhân sự", "Nội trợ"
        ]
        
        gov_positions = [
            "Ủy viên ban chấp hành Đảng Bộ",
            "Phó chủ tịch UBND quận",
            "Trưởng phòng Tài chính",
            "Chánh văn phòng Sở",
            "Phó giám đốc Sở"
        ]
        
        # Father information
        father_last = random.choice(male_last_names)
        father_middle = random.choice(middle_names)
        father_first = random.choice(first_names)
        father_name = f"{father_last} {father_middle} {father_first}"
        
        if random.random() < 0.3:
            father_job = f"{random.choice(gov_positions)}; {random.choice(father_jobs)}"
        else:
            father_job = random.choice(father_jobs)
            
        father_phone = f"09{random.randint(10000000, 99999999)}"
        father_address = generate_vietnamese_address()
        
        # Mother information
        mother_last = random.choice(female_last_names)
        mother_first = random.choice(first_names)
        mother_name = f"{mother_last} {mother_first}"
        mother_job = random.choice(mother_jobs)
        mother_phone = f"09{random.randint(10000000, 99999999)}"
        
        if random.random() < 0.8:
            mother_address = father_address
        else:
            mother_address = generate_vietnamese_address()
        
        # Guardian information (10% chance to have)
        if random.random() < 0.1:
            guardian_name = f"{random.choice(male_last_names + female_last_names)} {random.choice(first_names)}"
            guardian_phone = f"09{random.randint(10000000, 99999999)}"
            guardian_address = generate_vietnamese_address()
        else:
            guardian_name = ""
            guardian_phone = ""
            guardian_address = ""
        
        # Union join date (70% chance to have)
        if random.random() < 0.7:
            union_join_date = (datetime(2020, 1, 1) + timedelta(days=random.randint(0, 365*3))).strftime("%d-%m-%Y")
        else:
            union_join_date = ""
        
        # Party join date (10% chance to have)
        if random.random() < 0.1:
            party_join_date = (datetime(2020, 1, 1) + timedelta(days=random.randint(0, 365*3))).strftime("%d-%m-%Y")
        else:
            party_join_date = ""
        
        # Build the student document
        student = {
            "student_id": student_id,
            "name": name,
            "gender": gender,
            "birth_date": birth_date.strftime("%d-%m-%Y"),
            "birthplace": birthplace,
            "class_id": class_name,
            "major_id": major_id,
            "program_id": program_id,
            "program_type": program_type,
            "has_english_certificate": random.random() < 0.3,
            
            "contact": {
                "school_email": school_email,
                "alias_email": "",
                "personal_email": personal_email,
                "phone": phone
            },
            
            "address": {
                "permanent_address": permanent_address,
                "temporary_address": temp_address
            },
            
            "identity": {
                "identity_number": identity_number,
                "identity_issue_date": issue_date.strftime("%d-%m-%Y"),
                "identity_issue_place": "Cục cảnh sát ĐKQL cư trú và DLQG về dân cư",
                "ethnicity": "Kinh" if random.random() < 0.8 else random.choice(ethnicities[1:]),
                "religion": "Không" if random.random() < 0.7 else random.choice(religions[1:]),
                "origin": random.choice(origins),
                "union_join_date": union_join_date,
                "party_join_date": party_join_date
            },
            
            "family": {
                "father": {
                    "name": father_name,
                    "job": father_job,
                    "phone": father_phone,
                    "address": father_address
                },
                "mother": {
                    "name": mother_name,
                    "job": mother_job,
                    "phone": mother_phone,
                    "address": mother_address
                },
                "guardian": {
                    "name": guardian_name,
                    "phone": guardian_phone,
                    "address": guardian_address
                }
            }
        }
        
        students.append(student)
    
    return students

# Generate 300 students
students = generate_students(300)

# Save to JSON file
data_path = Path(__file__).parent.parent / "Json" / "students.json"

with data_path.open('w', encoding='utf-8') as f:
    json.dump(students, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {data_path.absolute()}")