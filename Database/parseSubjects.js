const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Đọc file HTML
const filePath = path.join(__dirname, 'HTML', 'Danh mục môn học _ Cổng thông tin đào tạo.html');
const subjectshtml = fs.readFileSync(filePath, 'utf8');
const $subjects = cheerio.load(subjectshtml);

const outputDir = path.join(__dirname, 'SaveToMongo', 'Json');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const subjectsFile = path.join(outputDir, 'subjects.json');

const subjects = [];

// Hàm lấy dữ liệu từ input
$subjects('table.tablesorter tbody tr').each((index, element) => {
    const row = $subjects(element);
    const cols = row.find('td');

    // Kiểm tra cột "Còn mở lớp" (cột thứ 5, index 4)
    const statusImg = $subjects(cols[4]).find('img').attr('src');
    if (!statusImg || !statusImg.includes('checked.png')) return; // Bỏ qua nếu không mở

    // Trích xuất thông tin từ các cột
    const subject = {
        subject_id: $subjects(cols[1]).text().trim(),
        subject_name: $subjects(cols[2]).text().trim(),
        subjectEL_name: $subjects(cols[3]).text().trim(),
        faculty_id: "KHOA_" + $subjects(cols[5]).text().trim(),
        subject_type: $subjects(cols[6]).text().trim(),
        old_id:  $subjects(cols[7]).html().trim().split(/<br\s*\/?>/i).map(s => s.trim()),
        equivalent_id:  $subjects(cols[8]).html().trim().split(/<br\s*\/?>/i).map(s => s.trim()),
        prerequisite_id: $subjects(cols[9]).html().trim().split(/<br\s*\/?>/i).map(s => s.trim()),
        previous_id: $subjects(cols[10]).html().trim().split(/<br\s*\/?>/i).map(s => s.trim()),
        theory_credits: parseInt($subjects(cols[11]).text().trim()) || 0,
        practice_credits: parseInt($subjects(cols[12]).text().trim()) || 0
    };

    subjects.push(subject);
});

// Ghi dữ liệu vào file JSON
fs.writeFileSync(subjectsFile, JSON.stringify(subjects, null, 2), 'utf8');

console.log('Dữ liệu đã được lưu vào', subjectsFile);
