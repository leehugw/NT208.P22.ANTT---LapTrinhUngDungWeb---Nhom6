from faker.providers import BaseProvider
import random

class VietnamAddressProvider(BaseProvider):
    provinces = [
        "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
        "Bình Dương", "Đồng Nai", "Khánh Hòa", "Huế", "Quảng Ninh"
    ]

    districts = {
        "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa", "Tây Hồ", "Cầu Giấy", "Thanh Xuân", "Hoàng Mai", "Long Biên", "Hà Đông"],
        "Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 5", "Quận 7", "Thủ Đức", "Quận 10", "Quận 12", "Bình Thạnh", "Tân Bình", "Gò Vấp"],
        "Đà Nẵng": ["Hải Châu", "Sơn Trà", "Ngũ Hành Sơn", "Thanh Khê", "Cẩm Lệ", "Liên Chiểu", "Hòa Vang"],
        "Hải Phòng": ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An", "Đồ Sơn", "An Dương", "An Lão", "Vĩnh Bảo", "Cát Hải"],
        "Cần Thơ": ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Thốt Nốt", "Phong Điền", "Cờ Đỏ", "Vĩnh Thạnh"],
        "Bình Dương": ["Thủ Dầu Một", "Dĩ An", "Thuận An", "Tân Uyên", "Bến Cát"],
        "Đồng Nai": ["Biên Hòa", "Long Khánh", "Trảng Bom", "Nhơn Trạch", "Long Thành"],
        "Khánh Hòa": ["Nha Trang", "Cam Ranh", "Vạn Ninh", "Diên Khánh", "Ninh Hòa"],
        "Huế": ["Huế", "Phong Điền", "Quảng Điền", "Phú Lộc", "A Lưới"],
        "Quảng Ninh": ["Hạ Long", "Cẩm Phả", "Uông Bí", "Móng Cái", "Quảng Yên"]
    }

    

    streets = [
        "Nguyễn Trãi", "Lê Lợi", "Trần Hưng Đạo", "Hai Bà Trưng", "Hoàng Diệu",
        "Phan Chu Trinh", "Điện Biên Phủ", "Nguyễn Thị Minh Khai", "Pasteur", "Nam Kỳ Khởi Nghĩa",
        "Nguyễn Văn Cừ", "Lý Thường Kiệt", "Trường Chinh", "Tôn Đức Thắng", "Hoàng Văn Thụ",
        "Phạm Văn Đồng", "Võ Văn Kiệt", "Trần Phú", "Cách Mạng Tháng 8", "Nguyễn Đình Chiểu",
        "Lê Quý Đôn", "Đinh Tiên Hoàng", "Bạch Đằng", "Phạm Ngũ Lão", "Tô Hiến Thành",
        "Võ Thị Sáu", "Trần Quang Khải", "Nguyễn Hữu Cảnh", "Hàm Nghi", "Nguyễn Khuyến"
    ]

    def street_name(self):
        return random.choice(self.streets)

    def city(self):
        return random.choice(self.provinces)

    def district(self, city_name=None):
        if city_name is None:
            city_name = self.city()
        return random.choice(self.districts.get(city_name, ["Trung tâm"]))

    def address(self):
        city_name = self.city()
        district_name = self.district(city_name)
        return f"Số {random.randint(1, 200)}, Đường {self.street_name()}, {district_name}, {city_name}"

