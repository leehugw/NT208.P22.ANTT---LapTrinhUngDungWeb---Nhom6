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

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM đã tải xong!");
    
    // Lấy student_id từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const student_id = urlParams.get('student_id');
    console.log("Student ID từ URL:", student_id);

    if (student_id) {
        console.log("Bắt đầu fetch dữ liệu...");
        fetchStudentProfile(student_id);
    } else {
        console.error("Không tìm thấy student_id trong URL");
        // Nếu không có student_id, có thể lấy từ localStorage hoặc session nếu đã đăng nhập
    }
});

async function fetchStudentProfile(student_id) {
    try {
        console.log(`Fetching data for student_id: ${student_id}`);
        const response = await fetch(`/api/student/profile-data?student_id=${student_id}`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(errorData.message || 'Failed to fetch student data');
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.success && data.type === "student") {
            displayStudentData(data.data);
        } else {
            throw new Error(data.message || "Invalid data format");
        }
    } catch (error) {
        console.error('Error fetching student profile:', error);
        alert('Error loading student data: ' + error.message);
    }
}

function displayStudentData(data) {
    const student = data.student;
    const contact = data.contact;
    const address = data.address;
    const family = data.family;
    const identity = data.identity;
    
    if (!student) {
        console.error("Không có dữ liệu sinh viên");
        return;
    }

    // Hàm helper để đặt giá trị an toàn
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = value || '';
            } else {
                element.textContent = value || 'Chưa cập nhật';
            }
        }
    }

    // Hiển thị thông tin chính
    setValue('student-name', student.name);
    setValue('student-id', student.student_id);
    setValue('class-name', student.class_name);
    setValue('faculty-name', student.faculty_name);
    setValue('training-system', student.program_type);

    setValue('fullname', student.name);
    setValue('class', student.class_name);
    setValue('origin', identity?.origin);
    setValue('union-join-date', identity?.union_join_date);
    setValue('party-join-date', identity?.party_join_date);    

    // Thông tin cá nhân
    setValue('birth-place', student.birthplace);
    setValue('birth-date', student.birth_date);
    
    // Xử lý giới tính
    const genderElement = document.getElementById('gender-display');
    const maleRadio = document.getElementById('nam-display');
    const femaleRadio = document.getElementById('nu-display');
    
    if (maleRadio && femaleRadio) {
        const normalizedGender = student?.gender?.toString().trim().toLowerCase();
        maleRadio.checked = false;
        femaleRadio.checked = false;

        if (normalizedGender === 'nữ' || normalizedGender === 'nu' || normalizedGender === 'female') {
            femaleRadio.checked = true;
            if (genderElement) genderElement.textContent = 'Nữ';
        } else {
            maleRadio.checked = true; // Mặc định là Nam
            if (genderElement) genderElement.textContent = 'Nam';
        }
    }

    // Thông tin liên lạc
    if (contact) {
        setValue('school-email', contact.school_email);
        setValue('personal-email', contact.personal_email);
        setValue('phone', contact.phone);
        setValue('student-email', contact?.school_email || 'Chưa cập nhật');
    }

    // Thông tin địa chỉ
    if (address) {
        setValue('permanent-address', address.permanent_address);
        setValue('temporary-address', address.temporary_address);
    }

    // Thông tin gia đình
    if (family) {
        setValue('father-name', family.father?.name);
        setValue('father-job', family.father?.job);
        setValue('father-phone', family.father?.phone);
        setValue('father-address', family.father?.address);
        
        setValue('mother-name', family.mother?.name);
        setValue('mother-job', family.mother?.job);
        setValue('mother-phone', family.mother?.phone);
        setValue('mother-address', family.mother?.address);
        
        setValue('guardian-name', family.guardian?.name);
        setValue('guardian-phone', family.guardian?.phone);
        setValue('guardian-address', family.guardian?.address);
        
    }

    // Thông tin căn cước
    if (identity) {
        setValue('identity-number', identity.identity_number);
        setValue('identity-issue-date', identity.identity_issue_date);
        setValue('identity-issue-place', identity.identity_issue_place);
        setValue('ethnicity', identity.ethnicity);
        setValue('religion', identity.religion);
    }
}