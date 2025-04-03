from faker import Faker
import random
import json
from custom_faker import VietnamAddressProvider  # Import Provider vừa tạo
from pathlib import Path

fake = Faker('vi_VN')
fake.add_provider(VietnamAddressProvider)  # Thêm Provider mới vào Faker

def generate_student_addresses(student_ids):
    fake = Faker('vi_VN')
    fake.add_provider(VietnamAddressProvider)
    
    # Mapping of province names to codes
    province_codes = {
        "Hà Nội": "01",
        "Hồ Chí Minh": "02",
        "Đà Nẵng": "03",
        "Hải Phòng": "04",
        "Cần Thơ": "05",
        "Bình Dương": "06",
        "Đồng Nai": "07",
        "Khánh Hòa": "08",
        "Huế": "09",
        "Quảng Ninh": "10"
    }
    
    addresses = []
    
    for student_id in student_ids:
        # Permanent address
        city = fake.city()
        district_name = fake.district(city)
        district_code = str(random.randint(1, 24)).zfill(2)
        ward_code = str(random.randint(1, 10)).zfill(2)  # Giới hạn từ 1-10, có 2 chữ số
        
        permanent_address = f"Số nhà {random.randint(1, 300)} đường số {random.randint(1, 20)}"
        
        # Temporary address (50% chance to be in dormitory)
        if random.random() > 0.5:
            temp_address = "Ký túc xá đại học quốc gia thành phố Hồ Chí Minh, Số 6, Phường Linh Trung, Quận Thủ Đức, Thành phố Hồ Chí Minh"
        else:
            temp_city = fake.city()
            temp_district = fake.district(temp_city)
            temp_address = f"Số {random.randint(1, 200)}, Đường {fake.street_name()}, {temp_district}, {temp_city}"
        
        address_info = {
            "student_id": student_id,
            "permanent_address": permanent_address,
            "ward": ward_code,
            "district": district_code,
            "city": province_codes[city],
            "temporary_address": temp_address
        }
        
        addresses.append(address_info)
    
    return addresses

# Example usage with student IDs from your previous data
student_ids = [f"25525{str(i).zfill(3)}" for i in range(1, 51)]
data = generate_student_addresses(student_ids)

current_file_path = Path(__file__).absolute()

data_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp từ vị trí hiện tại
    / "Database" 
    / "SaveToMongo" 
    / "Json" 
    / "addresses.json"
)

# Save to JSON file
with data_path.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {data_path.absolute()}")