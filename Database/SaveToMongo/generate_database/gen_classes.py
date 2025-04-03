import random
import json
from pathlib import Path

def generate_class_data():
    # Danh sách các khoa và ngành tương ứng
    faculties = {
        "KHOA_KHMT": ["KHMT", "TTNT"],
        "KHOA_CNPM": ["KTPM"],
        "KHOA_KTMT": ["KTMT", "TKVM"],
        "KHOA_KTTT": ["CNTT", "KHDL"],
        "KHOA_HTTT": ["TMDT", "HTTT"],
        "KHOA_MMT": ["ATTT", "MMTT"]
    }
    
    training_systems = ["Đại trà", "Chất lượng cao"]
    
    classes = []
    
    for faculty_id, majors in faculties.items():
        for major_id in majors:
            # Tạo 2 lớp cho mỗi ngành
            for i in range(1, 3):
                class_id = f"{major_id}{i:02d}"
                class_name = f"{major_id}.{i}"
                
                # Random chọn hệ đào tạo
                training_system = random.choice(training_systems)
                
                class_data = {
                    "class_id": class_id,
                    "class_name": class_name,
                    "faculty_id": faculty_id,
                    "training_system": training_system,
                    "major_id": major_id
                }
                
                classes.append(class_data)
    
    return classes

# Tạo dữ liệu lớp
class_data = generate_class_data()

current_file_path = Path(__file__).absolute()

data_path = (
    current_file_path.parent.parent.parent  # Lên 3 cấp từ vị trí hiện tại
    / "Database" 
    / "SaveToMongo" 
    / "Json" 
    / "classes.json"
)

# Save to JSON file
with data_path.open('w', encoding='utf-8') as f:
    json.dump(class_data, f, ensure_ascii=False, indent=2)

print(f"Data has been saved to {data_path.absolute()}")