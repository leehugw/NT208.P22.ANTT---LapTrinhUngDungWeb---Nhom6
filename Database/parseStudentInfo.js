const fs = require('fs');
const cheerio = require('cheerio');
const { get } = require('http');

// Đọc file HTML
const studenthtml = fs.readFileSync('Xem thông tin SV.html', 'utf8');
const $student = cheerio.load(studenthtml);

// Hàm lấy dữ liệu từ input
const getInputValue = ($, name) => $(`input[name="${name}"]`).attr('value') || '';

// Hàm lấy dữ liệu từ select (dropdown)
const getSelectValue = ($, name) => $(`select[name="${name}"] option[selected]`).text().trim() || '';

// Thông tin sinh viên
const studentData = {
    student_id: getInputValue($student,"txtmssv"),
    name: getInputValue($student, "txtten"),
    gender: getSelectValue($student, "ddlphai"), 
    birth_date: getInputValue($student, "dngaysinh"),
    birthplace: getInputValue($student, "txtnoisinh"),
    status: getSelectValue($student, "ddltinhtrang"),
    class: getInputValue($student, "txtlopsh"),
    faculty: getSelectValue($student, "ddlkhoa"),
    training_system: getSelectValue($student, "ddlHeDT")
};

// Thông tin CMND/CCCD & nguồn gốc
const identityData = {
    student_id: studentData.student_id,
    identity_number: getInputValue($student,"txtcmnd"),
    identity_issue_date: getInputValue($student,"txtcmndngay"),
    identity_issue_place: getInputValue($student, "txtcmndnoi"),
    ethnicity: getSelectValue($student,"ddldantoc"),
    religion: getSelectValue($student,"ddltongiao"),
    origin: getSelectValue($student, "ddlxuatthan"),
    union_join_date: getInputValue($student,"txtngayvd"),
    party_join_date: getInputValue($student, "txtngayvdg")
};

// Thông tin liên hệ
const contactData = {
    student_id: studentData.student_id,
    school_email: getInputValue($student, "txtemail"),
    alias_email: getInputValue($student, "txtemailalias"),
    personal_email: getInputValue($student, "txtemailcanhan"),
    phone: getInputValue($student,"txtsdt")
};

// Thông tin gia đình
const familyData = {
    student_id: studentData.student_id,
    father_name: getInputValue($student,"txtchaht"),
    father_job: getInputValue($student, "txtchann"),
    father_phone: getInputValue($student, "txtchasdt"),
    father_address: getInputValue($student, "txtdccha"),
    mother_name: getInputValue($student, "txtmeht"),
    mother_job: getInputValue($student, "txtmenn"),
    mother_phone: getInputValue($student, "txtmesdt"),
    mother_address: getInputValue($student,"txtdcme"),
    guardian_name: getInputValue($student, "txtbaohoht"),
    guardian_phone: getInputValue($student, "txtbaohosdt"),
    guardian_address: getInputValue($student,"txtdcbaoho")
};

// Địa chỉ sinh viên
const addressData = {
    student_id: studentData.student_id,
    permanent_address: getInputValue($student,"txtthuongtru"),
    ward: getInputValue($student,"txtphuongxa"),
    district: getInputValue($student,"txtquanhuyen"),
    city: getInputValue($student,"txttinhtp"),
    temporary_address: getInputValue($student,"txttamtru")
};

// Lưu vào file JSON để kiểm tra
fs.writeFileSync('student.json', JSON.stringify(studentData, null, 2), 'utf8');
fs.writeFileSync('identity.json', JSON.stringify(identityData, null, 2), 'utf8');
fs.writeFileSync('contact.json', JSON.stringify(contactData, null, 2), 'utf8');
fs.writeFileSync('family.json', JSON.stringify(familyData, null, 2), 'utf8');
fs.writeFileSync('address.json', JSON.stringify(addressData, null, 2), 'utf8');

console.log("Dữ liệu đã được trích xuất và lưu vào JSON!");
