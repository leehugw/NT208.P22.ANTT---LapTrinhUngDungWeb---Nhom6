document.addEventListener('DOMContentLoaded', () => {
    // Lấy token từ URL hoặc localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const token = urlToken || localStorage.getItem('token');
    fetchLecturerProfile(token);
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


function renderNavbar(type = "lecturer") {
    // type: "admin" hoặc "lecturer"
    const isAdmin = type === "admin";
    const isLecturer = type === "lecturer";
    return `
    <header class="bg-white shadow navbar fixed-top font-roboto">
        <div class="container d-flex justify-content-between align-items-center py-2 px-6">
            <div class="d-none d-md-flex align-items-center logo-container">
                <img alt="Logo" height="80" src="${isAdmin ? '/Admin_Menu/logo.png' : '/Lecturer_Menu/logo.png'}" width="80">
            </div>
            <nav class="d-none d-md-flex navbar-container align-items-center mx-auto">
                <a class="nav-link mx-2 text-decoration-none btn-home" role="button">Trang chủ</a>
                <div class="dropdown mx-2">
                    <a class="btn btn-secondary dropdown-toggle bg-white text-dark border-0" role="button"
                        id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
                        ${isAdmin ? 'Admin' : 'Giảng viên'}
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                        ${isAdmin ? `
                            <li><a class="dropdown-item btn-admin-statistics" role="button">Thống kê</a></li>
                            <li><a class="dropdown-item btn-admin-student" role="button">Theo dõi sinh viên</a></li>
                            <li><a class="dropdown-item btn-admin-lecturer" role="button">Theo dõi giảng viên</a></li>
                            <li><a class="dropdown-item btn-create-lecturer-account" role="button">Tạo tài khoản giảng viên</a></li>
                            <li><a class="dropdown-item btn-feedback" role="button">Danh sách phản hồi</a></li>
                        ` : `
                            <li><a class="dropdown-item btn-lecturer-classlist" role="button">Theo dõi lớp học</a></li>
                            <li><a class="dropdown-item btn-lecturer-info" role="button">Hồ sơ Giảng viên</a></li>
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
                data-bs-toggle="collapse" data-bs-target="#${isAdmin ? 'adminDropdown' : 'lecturerDropdown'}">
                <i class="fa-solid fa-user"></i> ${isAdmin ? 'Admin' : 'Giảng viên'} <i class="fa-solid fa-chevron-down float-end"></i>
            </button>
            <div class="collapse" id="${isAdmin ? 'adminDropdown' : 'lecturerDropdown'}">
                ${isAdmin ? `
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-admin-statistics" role="button">Thống kê</a>
                    <a class="btn-admin-student nav-link d-block text-decoration-none py-2 px-5 text-start" role="button">Theo dõi sinh viên</a>
                    <a class="btn-admin-lecturer nav-link d-block text-decoration-none py-2 px-5 text-start" role="button">Theo dõi giảng viên</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-create-lecturer-account" role="button">Tạo tài khoản giảng viên</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-feedback" role="button">Danh sách phản hồi</a>
                ` : `
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-lecturer-classlist" role="button">Theo dõi lớp học</a>
                    <a class="nav-link d-block text-decoration-none py-2 px-5 text-start btn-lecturer-info" role="button">Hồ sơ Giảng viên</a>
                `}
            </div>
        </nav>
    </header>
    `;
}

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
    if (role === "admin") {
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
                fetch('http://localhost:3000/api/admin/admin_menu', {
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
                    window.location.href = "http://localhost:3000/";
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
                    window.location.href = "http://localhost:3000/";
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
                fetch('http://localhost:3000/api/lecturer/lec_menu', {
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
        window.location.href = "http://localhost:3000/";
        return;
    }
}

async function fetchLecturerProfile(token) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let LecturerProfileData;

        if (urlParams.toString()) {
            const lecturerId = urlParams.get('lecturer_id');
            LecturerProfileData = `http://localhost:3000/api/lecturer/profile-data?lecturer_id=${lecturerId}`;
        }
        else {
            LecturerProfileData = `http://localhost:3000/api/lecturer/profile-data`;
        }

        const token = localStorage.getItem("token");
        const response = await fetch(LecturerProfileData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = `${window.location.origin}/`;
                return;
            }
            throw new Error('Lỗi khi tải thông tin');
        }

        const data = await response.json();

        if (data.success) {
            displayLecturerData(data.data);
        }

        let role = "lecturer";
        if (data.type === "admin") role = "admin";
        else if (data.type === "lecturer") role = "lecturer";

         document.querySelector('header').outerHTML = renderNavbar(role);
        setTimeout(() => { attachNavbarEvents(token, role); }, 0);

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
    setValue('lecturer-name', lecturer.fullname);
    setValue('lecturer-email', lecturer.email);
    setValue('lecturer-id', lecturer.lecturer_id);

    // Thông tin cá nhân
    setValue('fullname', lecturer.fullname);
    setValue('birth-place', lecturer.birthplace);
    setValue('birth-date', lecturer.birthdate);
    setValue('faculty', lecturer.faculty);
    setValue('class-management', lecturer.class_id);

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
    setValue('personal-email', lecturer.email);
    setValue('phone', lecturer.phonenumber);
}

