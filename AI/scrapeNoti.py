import requests
from bs4 import BeautifulSoup
import json

hehe = {
    "thong_bao": "https://daa.uit.edu.vn/thongbao"
}

d = {}

for h, url in hehe.items():
    res = requests.get(url)
    soup = BeautifulSoup(res.text, "html.parser")

    h2_tags = soup.find_all("h2")

    khang = []

    for tag in h2_tags:
        title = tag.get_text(strip=True)
        khang.append({"title": title})

    d[h] = khang

with open("C:/Users/ACER/Desktop/Noti.json", "w", encoding="utf-8") as file:
    json.dump(d, file, ensure_ascii=False, indent=4)

print("Done")
