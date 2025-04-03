import random
from faker import Faker
from custom_faker import VietnamAddressProvider  # Import Provider vừa tạo
import json
from pathlib import Path

fake = Faker('vi_VN')

fake.add_provider(VietnamAddressProvider)  # Thêm Provider mới vào Faker

def generate_family_data(student_ids):
    data = []
    
    # Vietnamese name components
    male_last_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"]
    female_last_names = ["Nguyễn Thị", "Trần Thị", "Lê Thị", "Phạm Thị", "Hoàng Thị", "Huỳnh Thị", "Phan Thị"]
    middle_names = ["Văn", "Quang", "Đức", "Minh", "Hữu", "Công", "Thanh", "Duy", "Anh", "Bảo"]
    first_names = ["A", "B", "C", "D", "E", "F", "G", "H", "K", "L", "M", "N", "P", "Q", "S", "T"]
    
    # Job titles
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
    
    # Government positions for some fathers
    gov_positions = [
        "Ủy viên ban chấp hành Đảng Bộ",
        "Phó chủ tịch UBND quận",
        "Trưởng phòng Tài chính",
        "Chánh văn phòng Sở",
        "Phó giám đốc Sở"
    ]
    
    for student_id in student_ids:
        # Father information
        father_last = random.choice(male_last_names)
        father_middle = random.choice(middle_names)
        father_first = random.choice(first_names)
        father_name = f"{father_last} {father_middle} {father_first}"
        
        # 30% chance to have a government position
        if random.random() < 0.3:
            father_job = f"{random.choice(gov_positions)}; {random.choice(father_jobs)}"
        else:
            father_job = random.choice(father_jobs)
            
        father_phone = f"09{random.randint(10000000, 99999999)}"
        father_address = fake.address()
        
        # Mother information
        mother_last = random.choice(female_last_names)
        mother_first = random.choice(first_names)
        mother_name = f"{mother_last} {mother_first}"
        mother_job = random.choice(mother_jobs)
        mother_phone = f"09{random.randint(10000000, 99999999)}"
        
        # 80% chance to have same address as father
        if random.random() < 0.8:
            mother_address = father_address
        else:
            mother_address = fake.address()
        
        # Guardian information (10% chance to have)
        if random.random() < 0.1:
            guardian_name = f"{random.choice(male_last_names + female_last_names)} {random.choice(first_names)}"
            guardian_phone = f"09{random.randint(10000000, 99999999)}"
            guardian_address = fake.address()
        else:
            guardian_name = ""
            guardian_phone = ""
            guardian_address = ""
        
        family_info = {
            "student_id": student_id,
            "father_name": father_name,
            "father_job": father_job,
            "father_phone": father_phone,
            "father_address": father_address,
            "mother_name": mother_name,
            "mother_job": mother_job,
            "mother_phone": mother_phone,
            "mother_address": mother_address,
            "guardian_name": guardian_name,
            "guardian_phone": guardian_phone,
            "guardian_address": guardian_address
        }
        
        data.append(family_info)
    
    return data

# Example usage with student IDs from your previous data
student_ids = [f"25525{str(i).zfill(3)}" for i in range(1, 51)]
data = generate_family_data(student_ids)

current_file_path = Path(__file__).absolute()

data_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp từ vị trí hiện tại
    / "Database" 
    / "SaveToMongo" 
    / "Json" 
    / "families.json"
)

# Save to JSON file
with data_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {data_path.absolute()}")