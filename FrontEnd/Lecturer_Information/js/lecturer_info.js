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

// Load lecturer profile
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const lecturer_id = urlParams.get('lecturer_id');

    if (lecturer_id) {
        fetchLecturerProfile(lecturer_id);
    }
});

async function fetchLecturerProfile(lecturer_id) {
    try {
        const response = await fetch(`/api/lecturer/profile-data?lecturer_id=${lecturer_id}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Lỗi khi tải thông tin');
        }

        if (data.type !== "lecturer") {
            throw new Error("ID này không thuộc giảng viên");
        }
        
        displayLecturerData(data.data);
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi tải thông tin giảng viên: ' + error.message);
    }
}

function displayLecturerData(lecturer) {
    if (!lecturer) {
        console.error("Không có dữ liệu giảng viên");
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
    setValue('lecturer-name', lecturer.name);
    setValue('lecturer-email', lecturer.school_email || lecturer.personal_email);
    setValue('lecturer-id', lecturer.lecturer_id);

    // Thông tin cá nhân
    setValue('fullname', lecturer.name);
    setValue('birth-place', lecturer.birth_place);
    setValue('birth-date', lecturer.birth_date);
    setValue('faculty', lecturer.faculty_name);
    
    // Xử lý giới tính
    const genderElement = document.getElementById('gender-display');
    const maleRadio = document.getElementById('nam-display');
    const femaleRadio = document.getElementById('nu-display');
    
    if (maleRadio && femaleRadio) {
        const normalizedGender = lecturer?.gender?.toString().trim().toLowerCase();
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
    setValue('school-email', lecturer.school_email);
    setValue('personal-email', lecturer.personal_email);
    setValue('phone', lecturer.phone);
}