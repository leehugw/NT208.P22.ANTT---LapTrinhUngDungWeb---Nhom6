document.addEventListener('DOMContentLoaded', () => {
    // Lấy token từ URL hoặc localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const token = urlToken || localStorage.getItem('token');
    fetchStudentProfile(token);
});

function attachNavbarEvents(token, role) {
    const logoutButton = document.querySelector('.logout-button');

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

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }
    if (role === "student") {
        document.querySelectorAll(".btn-student-progress").forEach(el => {
            el.addEventListener("click", function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                    window.location.href = "https://uit-chatbot.onrender.com/";
                } else {
                    window.location.href = "/api/student/academicstatistic";
                }
            });
        });

        document.querySelectorAll(".btn-student-schedule").forEach(el => {
            el.addEventListener("click", function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                    window.location.href = "https://uit-chatbot.onrender.com/";
                } else {
                    window.location.href = "/api/student/schedule-optimize";
                }
            });
        });

        document.querySelectorAll(".btn-student-english").forEach(el => {
            el.addEventListener("click", function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                    window.location.href = "https://uit-chatbot.onrender.com/";
                } else {
                    window.location.href = "/api/student/english-certificate";
                }
            });
        });

        document.querySelectorAll(".btn-student-info").forEach(el => {
            el.addEventListener("click", function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                    window.location.href = "https://uit-chatbot.onrender.com/";  // Điều hướng đến trang đăng nhập
                } else {
                    window.location.href = "/api/student/profile";
                }
            });
        });

        // Xử lý sự kiện khi click vào "Chatbot"
        document.querySelectorAll(".btn-student-chatbot").forEach(el => {
            el.addEventListener("click", function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                    window.location.href = "https://uit-chatbot.onrender.com/";  // Điều hướng đến trang đăng nhập
                } else {
                    // Nếu có token, điều hướng đến chatbot
                    window.location.href = "/api/student/chatbot?token=" + token;  // Điều hướng đến route chatbot
                }
            });
        });

        document.querySelectorAll('.btn-home').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                const token = localStorage.getItem('token');
                if (!token) {
                    alert("Chưa đăng nhập");
                    return window.location.href = "/";
                }

                // Gửi token kèm theo khi truy cập route được bảo vệ
                fetch('https://uit-chatbot.onrender.com/api/student/stu_menu', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }).then(res => {
                    if (res.ok) {
                        // Nếu token hợp lệ, điều hướng
                        window.location.href = '/Student_Menu/stu_menu.html';
                    } else {
                        alert('Phiên đăng nhập không hợp lệ!');
                        window.location.href = '/';
                    }
                });
            });
        });

    }
    else if (role === "admin") {
                const feedbackBtn = document.getElementById("feedbackBtn");
        if (feedbackBtn) {
            feedbackBtn.style.display = "none";
        }
                if (feedbackBtn) {
            feedbackBtn.remove(); 
        }
        document.querySelectorAll('.btn-admin-student').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập!");
                    window.location.href = '/';
                } else {
                    window.location.href = `/api/admin/students`;
                }
            });
        });

        // Theo dõi giảng viên
        document.querySelectorAll('.btn-admin-lecturer').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập!");
                    window.location.href = '/';
                } else {
                    window.location.href = `/api/admin/lecturers`;
                }
            });
        });

        // Tạo tài khoản giảng viên
        document.querySelectorAll('.btn-create-lecturer-account').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập!");
                    window.location.href = '/';
                } else {
                    window.location.href = `/api/admin/create-lecturer-account?token=${token}`;
                }
            });
        });

        // Thống kê
        document.querySelectorAll('.btn-admin-statistics').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập!");
                    window.location.href = '/';
                } else {
                    window.location.href = `/api/admin/statistics`;
                }
            });
        });

        // Danh sách phản hồi
        document.querySelectorAll('.btn-feedback').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập!");
                    window.location.href = '/';
                } else {
                    window.location.href = `/api/admin/feedbacks`;
                }
            });
        });

        document.querySelectorAll('.btn-home').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                const token = localStorage.getItem('token');
                if (!token) {
                    alert("Chưa đăng nhập");
                    return window.location.href = "/";
                }

                // Gửi token kèm theo khi truy cập route được bảo vệ
                fetch('https://uit-chatbot.onrender.com/api/admin/admin_menu', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }).then(res => {
                    if (res.ok) {
                        // Nếu token hợp lệ, điều hướng
                        window.location.href = '/Admin_Menu/admin_menu.html';
                    } else {
                        alert('Phiên đăng nhập không hợp lệ!');
                        window.location.href = '/';
                    }
                });
            });
        });
    }
    else {
        document.querySelectorAll(".btn-lecturer-info").forEach(el => {
            el.addEventListener("click", function (e) {
                e.preventDefault();
                const token = localStorage.getItem("token");
                if (!token) {
                    alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                    window.location.href = "https://uit-chatbot.onrender.com/";
                } else {
                    window.location.href = "/api/lecturer/profile";
                }
            });
        });

        document.querySelectorAll(".btn-lecturer-classlist").forEach(el => {
            const token = localStorage.getItem("token");
            el.addEventListener("click", function (e) {
                e.preventDefault();
                if (!token) {
                    alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                    window.location.href = "https://uit-chatbot.onrender.com/";
                } else {
                    window.location.href = "/api/lecturer/classlist";
                }
            });
        });
        document.querySelectorAll('.btn-home').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                const token = localStorage.getItem('token');
                if (!token) {
                    alert("Chưa đăng nhập");
                    return window.location.href = "/";
                }

                // Gửi token kèm theo khi truy cập route được bảo vệ
                fetch('https://uit-chatbot.onrender.com/api/lecturer/lec_menu', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }).then(res => {
                    if (res.ok) {
                        // Nếu token hợp lệ, điều hướng
                        window.location.href = '/Lecturer_Menu/lec_menu.html';
                    } else {
                        alert('Phiên đăng nhập không hợp lệ!');
                        window.location.href = '/';
                    }
                });
            });
        });
    }




    if (!token) {
        alert("Vui lòng đăng nhập để xem thông tin");
        window.location.href = "https://uit-chatbot.onrender.com/";
        return;
    }
}

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
        if (!token) {
            alert("Vui lòng đăng nhập để xem thông tin");
            window.location.href = "https://uit-chatbot.onrender.com/";
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        let StudentProfileDataUrl;

        if (urlParams.toString()) {
            const studentId = urlParams.get('student_id');
            StudentProfileDataUrl = `https://uit-chatbot.onrender.com/api/student/profile-data?student_id=${studentId}`;
        } else {
            StudentProfileDataUrl = `/api/student/profile-data`;
        }

        const response = await fetch(StudentProfileDataUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        let role = "student";
        if (data.type === "admin") role = "admin";
        else if (data.type === "lecturer") role = "lecturer";
        else if (data.type === "student") role = "student";

        document.querySelector('header').outerHTML = renderNavbar(role);
        setTimeout(() => { attachNavbarEvents(token, role); }, 0);

        if (data.success) {
            displayStudentData(data.data);
            localStorage.setItem('token', token);
        }
    } catch (error) {
        console.error('Error fetching student profile:', error);
        alert('Lỗi khi tải thông tin sinh viên: ' + error.message);
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
    setValue('class', student.class_id);
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

function renderNavbar(type = "student") {
    // type: "student", "admin", hoặc "lecturer"
    const isAdmin = type === "admin";
    const isLecturer = type === "lecturer";
    return `
    <header class="bg-white shadow navbar fixed-top font-roboto">
        <div class="container d-flex justify-content-between align-items-center py-2 px-6">
            <div class="d-none d-md-flex align-items-center logo-container">
                <img alt="Logo" height="80" src="${isAdmin ? '/Admin_Menu/logo.png' : isLecturer ? '/Lecturer_Menu/logo.png' : '/Student_Information/images/logo.png'
        }" width="80">
            </div>
            <nav class="d-none d-md-flex navbar-container align-items-center mx-auto">
                <a class="nav-link mx-2 text-decoration-none btn-home" role="button">Trang chủ</a>
                <div class="dropdown mx-2">
                    <a class="btn btn-secondary dropdown-toggle bg-white text-dark border-0" role="button"
                        id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
                        ${isAdmin ? 'Admin' : isLecturer ? 'Giảng viên' : 'Sinh viên'}
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                        ${isAdmin ? `
                            <li><a class="dropdown-item btn-admin-statistics" role="button">Thống kê</a></li>
                            <li><a class="dropdown-item btn-admin-student" role="button">Theo dõi sinh viên</a></li>
                            <li><a class="dropdown-item btn-admin-lecturer" role="button">Theo dõi giảng viên</a></li>
                            <li><a class="dropdown-item btn-create-lecturer-account" role="button">Tạo tài khoản giảng viên</a></li>
                            <li><a class="dropdown-item btn-feedback" role="button">Danh sách phản hồi</a></li>
                        ` : isLecturer ? `
                            <li><a class="dropdown-item btn-lecturer-classlist" role="button">Theo dõi lớp học</a></li>
                            <li><a class="dropdown-item btn-lecturer-info" role="button">Hồ sơ Giảng viên</a></li>
                        ` : `
                            <li><a class="dropdown-item btn-student-info" role="button">Hồ sơ Sinh viên</a></li>
                            <li><a class="dropdown-item btn-student-progress" role="button">Tiến độ học tập</a></li>
                            <li><a class="dropdown-item btn-student-english" role="button">Xác nhận chứng chỉ Anh Văn</a></li>
                            <li><a class="dropdown-item btn-student-schedule" role="button">Thời khóa biểu</a></li>
                            <li><a class="dropdown-item btn-student-chatbot" role="button">Chatbot</a></li>
                        `}
                    </ul>
                </div>
            </nav>
            <button class="d-md-none btn btn-link text-dark" id="menu-toggle">
                <i class="fas fa-bars"></i>
            </button>
            <button class="btn bg-white text-dark fw-bold rounded-0 ml-2 logout-button">
                <i class="fas fa-sign-out-alt"></i> Đăng xuất
            </button>
        </div>
        <nav class="fixed-top bg-white shadow-lg navbar-container" id="mobile-menu"
            style="width: 75%; height: 100%; display: none;">
            <div class="d-flex justify-content-start align-items-center p-4">
                <span class="h4 fw-bold">Chatbot UIT</span>
                <button class="btn btn-link text-dark ms-auto" id="menu-close">
                    <i class="fa-solid fa-x"></i>
                </button>
            </div>
            <a class="nav-link d-block text-decoration-none py-2 px-4 btn-home" role="button">
                <i class="fa-solid fa-house-chimney"></i> Trang chủ
            </a>
            <button class="nav-link d-block text-decoration-none py-2 px-4 btn text-start w-100"
                data-bs-toggle="collapse" data-bs-target="#${isAdmin ? 'adminDropdown' : isLecturer ? 'lecturerDropdown' : 'studentDropdown'}">
                <i class="fa-solid fa-user"></i> ${isAdmin ? 'Admin' : isLecturer ? 'Giảng viên' : 'Sinh viên'} <i class="fa-solid fa-chevron-down float-end"></i>
            </button>
            <div class="collapse" id="${isAdmin ? 'adminDropdown' : isLecturer ? 'lecturerDropdown' : 'studentDropdown'}">
                ${isAdmin ? `
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-admin-statistics" role="button">Thống kê</a>
                    <a class="btn-admin-student nav-link d-block text-decoration-none py-2 px-5 text-start" role="button">Theo dõi sinh viên</a>
                    <a class="btn-admin-lecturer nav-link d-block text-decoration-none py-2 px-5 text-start" role="button">Theo dõi giảng viên</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-create-lecturer-account" role="button">Tạo tài khoản giảng viên</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-feedback" role="button">Danh sách phản hồi</a>
                ` : isLecturer ? `
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-lecturer-classlist" role="button">Theo dõi lớp học</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-lecturer-info" role="button">Hồ sơ Giảng viên</a>
                ` : `
                    <a class="nav-link d-block text-decoration-none py-2 px-5 btn-student-info" role="button">Hồ sơ Sinh viên</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 btn-student-progress" role="button">Tiến độ học tập</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 btn-student-english" role="button">Xác nhận chứng chỉ Anh Văn</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 btn-student-schedule" role="button">Thời khóa biểu</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 btn-student-chatbot" role="button">ChatBot UIT</a>
                `}
            </div>
        </nav>
    </header>
    `;
}



