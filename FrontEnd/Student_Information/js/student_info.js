// student_info.js
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

document.addEventListener('DOMContentLoaded', function () {
    // Lấy token từ URL hoặc localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const token = urlToken || localStorage.getItem('token');

    if (!token) {
        alert("Vui lòng đăng nhập để xem thông tin");
        window.location.href = "http://localhost:3000/";
        return;
    }

    // Lưu token vào localStorage nếu có từ URL
    if (urlToken) {
        localStorage.setItem('token', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Lấy studentId từ localStorage
    const studentId = localStorage.getItem('selectedStudentId');

    if (studentId) {
        fetchStudentProfileAsAdmin(token, studentId)
            .then(() => {
                localStorage.removeItem('selectedStudentId');
            });
    } else {
        fetchStudentProfile(token);
    }

});

function openFeedbackPopup() {
    if (document.getElementById('feedbackPopup')) {
        document.getElementById('feedbackPopup').style.display = 'flex';
        return;
    }

    fetch('/FeedbackForm/feedbackForm.html')
        .then(res => res.text())
        .then(html => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            document.body.appendChild(wrapper);

            const script = document.createElement('script');
            script.src = '/FeedbackForm/Feedback.js';
            document.body.appendChild(script);
        });

    window.closeFeedbackForm = function () {
        const popup = document.getElementById('feedbackPopup');
        if (popup) popup.remove();
    };
}

async function fetchStudentProfile(token) {
    try {

        const urlParams = new URLSearchParams(window.location.search);
        let StudentProfileDataUrl;

        // Kiểm tra nếu URL có query 
        if (urlParams.toString()) {
            const studentId = urlParams.get('student_id');
            StudentProfileDataUrl = `http://localhost:3000/api/student/profile-data?student_id=${studentId}`;
        } else {
            StudentProfileDataUrl = `/api/student/profile-data`;
        }

        const response = await fetch(StudentProfileDataUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success && data.type === "student") {
            displayStudentData(data.data);
            localStorage.setItem('token', token); // hoặc sessionStorage
        } else {
            throw new Error(data.message || "Invalid data format");
        }
    } catch (error) {
        console.error('Error fetching student profile:', error);
        alert('Lỗi khi tải thông tin sinh viên: ' + error.message);
    }
}
//Hiển thị thông tin sinh viên cho admin
async function fetchStudentProfileAsAdmin(token, studentId) {
    try {
        const response = await fetch(`http://localhost:3000/api/admin/student/${studentId}/profile/api`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('🔵 Fetch admin student profile: Status', response.status);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/';
                return;
            }
            throw new Error('Không lấy được thông tin sinh viên');
        }

        const data = await response.json();
        console.log('✅ Admin profile data:', data);

        if (data.success) {
            displayStudentData(data.data);
        } else {
            throw new Error(data.message || 'Lỗi dữ liệu');
        }
    } catch (error) {
        console.error('🔥 Lỗi fetch hồ sơ sinh viên:', error);
        alert('Không thể tải thông tin sinh viên: ' + error.message);
    }
}



// Hàm hiển thị dữ liệu
function displayStudentData(data) {
    const { student, contact, address, family, identity } = data;


    if (!student) {
        console.error("Không có dữ liệu sinh viên");
        return;
    }

    // Hàm helper xử lý cả undefined/null
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        const displayValue = value ?? 'Chưa cập nhật';

        if (element.tagName === 'INPUT' || element.tagName === 'SELECT') {
            element.value = displayValue;
        } else {
            element.textContent = displayValue;
        }
    }


    // Thông tin cơ bản
    setValue('student-name', student.name);
    setValue('fullname', student.name);
    setValue('student-id', student.student_id);
    setValue('class', student.class_name);
    setValue('faculty-name', student.faculty_name);
    setValue('training-system', student.program_type);

    // Thông tin cá nhân
    setValue('birth-place', student.birthplace);
    setValue('birth-date', formatDate(student.birth_date));

    // Xử lý giới tính cải tiến
    const genderValue = student?.gender?.toString().trim().toLowerCase();
    const isFemale = ['nữ', 'nu', 'female'].includes(genderValue);

    document.getElementById('gender-display').textContent = isFemale ? 'Nữ' : 'Nam';
    if (document.getElementById('nam-display')) {
        document.getElementById('nam-display').checked = !isFemale;
        document.getElementById('nu-display').checked = isFemale;
    }

    // Thông tin liên lạc
    if (contact) {
        setValue('school-email', contact.school_email);
        setValue('student-email', contact.school_email);
        setValue('personal-email', contact.personal_email);
        setValue('phone', contact.phone);
    }

    // Thông tin địa chỉ
    if (address) {
        setValue('permanent-address', address.permanent_address);
        setValue('temporary-address', address.temporary_address);
    }

    // Thông tin gia đình (cải tiến với optional chaining)
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
        setValue('identity-issue-date', formatDate(identity.identity_issue_date));
        setValue('identity-issue-place', identity.identity_issue_place);
        setValue('ethnicity', identity.ethnicity);
        setValue('religion', identity.religion);
        setValue('origin', identity.origin);
        setValue('union-join-date', formatDate(identity.union_join_date));
        setValue('party-join-date', formatDate(identity.party_join_date));
    }
}

// Hàm phụ trợ định dạng ngày tháng
function formatDate(dateString) {
    if (!dateString) return 'Chưa cập nhật';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('vi-VN');
    } catch {
        return dateString;
    }
}

//api đăng xuất
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.login-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Xóa token khỏi localStorage vì lưu token trong localStorage
            localStorage.removeItem('token');

            // Thông báo đăng xuất(xóa nếu ko cần)
            //alert("Đăng xuất thành công!");

            // Chuyển về trang chủ
            window.location.href = '/';
        });
    }
});