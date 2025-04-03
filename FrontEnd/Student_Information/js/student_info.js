document.getElementById('menu-toggle').addEventListener('click', function () {
    var menu = document.getElementById('mobile-menu');
    menu.style.display = 'block';
    setTimeout(function () {
        menu.classList.add('open');
    }, 10);
});
document.getElementById('menu-close').addEventListener('click', function () {
    var menu = document.getElementById('mobile-menu');
    menu.classList.remove('open');
    setTimeout(function () {
        menu.style.display = 'none';
    }, 300);
});

document.addEventListener('DOMContentLoaded', async () => {
    // Lấy student_id từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const student_id = urlParams.get('student_id');

    if (!student_id) {
        alert("Vui lòng cung cấp student_id qua URL (?student_id=...)");
        return;
    }
    
    // Gọi API lấy thông tin sinh viên
    await loadStudentProfileById(student_id);
});

async function loadStudentProfileById(student_id) {
    try {
        const response = await fetch(`/api/profile?student_id=${encodeURIComponent(student_id)}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Lỗi khi tải thông tin');
        }
        
        // Hiển thị thông tin sinh viên
        displayStudentData(data.data);
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi tải thông tin sinh viên: ' + error.message);
    }
}

function displayStudentData(data) {
    const { student, contact, address, family, identity } = data;
    
    // Hàm helper để đặt giá trị an toàn
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = value || '';
            } else {
                element.textContent = value || '';
            }
        } else {
            console.warn(`Element #${id} not found`);
        }
    }

    // Thông tin chính
    setValue('student-name', student?.name);
    setValue('student-email', contact?.school_email || contact?.personal_email);
    setValue('username', student?.name);
    
    // Thông tin cá nhân
    setValue('fullname', student?.name);
    setValue('birth-date', student?.birth_date);
    setValue('birth-place', student?.birthplace);
    setValue('class', student?.class_name);
    setValue('student-id', student?.student_id);
    setValue('training-system', student?.training_system);
    setValue('faculty-name', student?.faculty_name);
    
    // Debug: Kiểm tra dữ liệu nhận được
    console.log("Gender data from API:", student?.gender);
    
    // Xử lý giới tính cải tiến
    const genderElement = document.getElementById('gender-display');
    const maleRadio = document.getElementById('nam-display');
    const femaleRadio = document.getElementById('nu-display');
    
    if (!maleRadio || !femaleRadio) {
        console.error('Không tìm thấy radio buttons giới tính');
        return;
    }

    // Chuẩn hóa giá trị giới tính
    const normalizedGender = student?.gender?.toString().trim().toLowerCase();
    console.log("Normalized gender:", normalizedGender);

    // Reset trạng thái
    maleRadio.checked = false;
    femaleRadio.checked = false;

    // Thiết lập theo dữ liệu
    if (normalizedGender === 'nữ' || normalizedGender === 'nu') {
        femaleRadio.checked = true;
        if (genderElement) genderElement.textContent = 'Nữ';
    } else {
        maleRadio.checked = true; // Mặc định là Nam
        if (genderElement) genderElement.textContent = 'Nam';
    }
    
    // Thông tin liên lạc
    setValue('school-email', contact?.school_email);
    setValue('personal-email', contact?.personal_email);
    setValue('phone', contact?.phone);
    
    // Địa chỉ
    setValue('ward', address?.ward);
    setValue('district', address?.district);
    setValue('city', address?.city);
    setValue('permanent-address', address?.permanent_address);
    setValue('temporary-address', address?.temporary_address);
    
    // Thông tin gia đình
    setValue('father-name', family?.father_name);
    setValue('father-phone', family?.father_phone);
    setValue('father-job', family?.father_job);
    setValue('father-address', family?.father_address);
    setValue('mother-name', family?.mother_name);
    setValue('mother-phone', family?.mother_phone);
    setValue('mother-job', family?.mother_job);
    setValue('mother-address', family?.mother_address);
    setValue('guardian-name', family?.guardian_name);
    setValue('guardian-phone', family?.guardian_phone);
    setValue('guardian-address', family?.guardian_address);
    
    // Thông tin căn cước
    setValue('identity-number', identity?.identity_number);
    setValue('identity-issue-place', identity?.identity_issue_place);
    setValue('identity-issue-date', identity?.identity_issue_date);
    setValue('ethnicity', identity?.ethnicity);
    setValue('religion', identity?.religion);
    setValue('origin', identity?.origin);
    setValue('union-join-date', identity?.union_join_date);
    setValue('party-join-date', identity?.party_join_date);
}