document.addEventListener('DOMContentLoaded', () => {
    // Lấy token từ URL hoặc localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const token = urlToken || localStorage.getItem('token');

    StudentAcademicData(token);
});

function renderNavbar(type = "student") {
    // type: "student", "admin", hoặc "lecturer"
    const isAdmin = type === "admin";
    const isLecturer = type === "lecturer";
        const isStudent = type === "student";

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
            ${isStudent ? `
            <div class="d-flex align-items-center justify-content-end gap-2 flex-shrink-0">
                <button class="btn btn-link text-dark position-relative notification-button" title="Thông báo">
                    <i class="fas fa-bell fa-lg"></i>
                    <span id="notificationBadge"
                        class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display: none;"></span>
                </button>

                <button class="btn bg-white text-dark fw-bold rounded-0 logout-button">
                    <i class="fas fa-sign-out-alt"></i> Đăng xuất
                </button>
            </div>



            <!-- Hộp hiện thông báo -->
            <div id="notificationList"
                style="position:absolute; top:40px; right:0; width:300px; max-height:400px; overflow-y:auto; background:#fff; border:1px solid #ccc; box-shadow:0 0 5px rgba(0,0,0,0.2); display:none; z-index:1000;">
                <!-- Thông báo sẽ được chèn vào đây -->
            </div>`: ``}
${(isAdmin || isLecturer) ? `
    <button class="btn bg-white text-dark fw-bold rounded-0 logout-button">
        <i class="fas fa-sign-out-alt"></i> Đăng xuất
    </button>
` : ``}

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

function attachNavbarEvents(token, role) {
    fetchNotificationsAndUpdateBadge();

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
                    window.location.href = "https://uit-chatbot-orno.onrender.com/";
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
                    window.location.href = "https://uit-chatbot-orno.onrender.com/";
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
                    window.location.href = "https://uit-chatbot-orno.onrender.com/";
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
                    window.location.href = "https://uit-chatbot-orno.onrender.com/";  // Điều hướng đến trang đăng nhập
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
                    window.location.href = "https://uit-chatbot-orno.onrender.com/";  // Điều hướng đến trang đăng nhập
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
                fetch('https://uit-chatbot-orno.onrender.com/api/student/stu_menu', {
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
        document.querySelectorAll('.notification-button').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem('token');
                if (!token) {
                    alert("Bạn chưa đăng nhập. Chuyển về trang chủ...");
                    return window.location.href = "/";
                } else {

                    fetch(`/api/student/abnormal`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })
                        .then(res => {
                            if (!res.ok) throw new Error("Lấy thông báo thất bại!");
                            return res.json();
                        })
                        .then(notifications => {
                            const list = document.getElementById('notificationList');
                            const badge = document.getElementById('notificationBadge');
                            const isVisible = list.style.display === 'block';
                            list.style.display = isVisible ? 'none' : 'block';

                            if (!isVisible) {
                                // Khi mở dropdown, ẩn badge vì coi như đã đọc
                                badge.style.display = 'none';

                                // Gọi API đánh dấu đã đọc
                                fetch('/api/student/notifications/mark-read', {
                                    method: 'PUT',
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                }).then(res => {
                                    if (!res.ok) console.warn('Đánh dấu thông báo đã đọc thất bại');
                                    // Không cần xử lý gì thêm ở client
                                }).catch(console.error);
                            }

                            if (!notifications.data || notifications.data.length === 0) {
                                list.innerHTML = '<div style="padding:10px; text-align:center; color:#888;">Không có thông báo nào.</div>';
                                badge.style.display = 'none'; // ẩn badge
                                return;
                            }

                            list.innerHTML = ''; // xóa nội dung cũ
                            notifications.data.forEach(noti => {
                                const div = document.createElement('div');
                                div.style.padding = '8px';
                                div.style.borderBottom = '1px solid #eee';
                                const noteText = noti.note ? noti.note.replace(/\n/g, '<br>') : '(Không có nội dung)';
                                const timeText = new Date(noti.updatedAt).toLocaleString();

                                div.innerHTML = `
                        <div>${noteText}</div>
                        <small style="color:#666;">${timeText}</small>
                    `;
                                list.appendChild(div);
                            });

                            badge.textContent = notifications.data.length;
                        })
                        .catch(err => {
                            alert(err.message);
                            console.error(err);
                        });
                }

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
                fetch('https://uit-chatbot-orno.onrender.com/api/admin/admin_menu', {
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
                    window.location.href = "https://uit-chatbot-orno.onrender.com/";
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
                    window.location.href = "https://uit-chatbot-orno.onrender.com/";
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
                fetch('https://uit-chatbot-orno.onrender.com/api/lecturer/lec_menu', {
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
        window.location.href = "https://uit-chatbot-orno.onrender.com/";
        return;
    }
}

function fetchNotificationsAndUpdateBadge() {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`/api/student/abnormal`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(res => {
            if (!res.ok) throw new Error("Lấy thông báo thất bại!");
            return res.json();
        })
        .then(notifications => {
            const badge = document.getElementById('notificationBadge');
            if (!notifications.data || notifications.data.length === 0) {
                badge.style.display = 'none';
                return;
            }

            // Tính số thông báo chưa đọc
            const unreadCount = notifications.data.filter(n => !n.read).length;

            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        })

        .catch(err => {
            console.error("Lỗi lấy thông báo:", err);
        });
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


let scoresemesterData = []; // Khai báo biến toàn cục để chứa dữ liệu điểm theo học kỳ

function StudentAcademicData(token) {
    const searchInput = document.getElementById('search-input');  // Lấy input tìm kiếm
    const semesterScores = document.getElementById("semester-scores"); // Lấy phần tử chứa bảng điểm

    semesterScores.innerHTML = '';


    const urlParams = new URLSearchParams(window.location.search);
    let StudentAcademicDataUrl;
    let GroupSemesterDataUrl;

    // Kiểm tra nếu URL có query 
    if (urlParams.toString()) {
        const studentId = urlParams.get('student_id');
        StudentAcademicDataUrl = `https://uit-chatbot-orno.onrender.com/api/student/student-academic-data?student_id=${studentId}`;
        GroupSemesterDataUrl = `https://uit-chatbot-orno.onrender.com/api/student/group-by-semester-data?student_id=${studentId}`

    } else {
        StudentAcademicDataUrl = `/api/student/student-academic-data`;
        GroupSemesterDataUrl = `/api/student/group-by-semester-data`;
    }

    // Gọi API để lấy thông tin sinh viên, tiến độ tốt nghiệp và GPA
    Promise.all([
        fetch(StudentAcademicDataUrl, {
            headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(GroupSemesterDataUrl, {
            headers: { Authorization: `Bearer ${token}` }
        })
    ])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(([academicData, semesterData]) => {
            scoresemesterData = semesterData; // Lưu trữ dữ liệu semesterData

            let role = "student";
            if (academicData.type === "admin") role = "admin";
            else if (academicData.type === "lecturer") role = "lecturer";
            else if (academicData.type === "student") role = "student";

            document.querySelector('header').outerHTML = renderNavbar(role);
            setTimeout(() => { attachNavbarEvents(token, role); }, 0);

            const nameElement = document.getElementById('student-name');
            nameElement.textContent = academicData.student_name;

            const emailElement = document.getElementById('student-email');
            emailElement.textContent = academicData.user_gmail;

            const englishProficiencyCheckbox = document.getElementById('englishProficiency');
            englishProficiencyCheckbox.checked = academicData.has_english_certificate;

            // Tính toán phần trăm tiến độ tốt nghiệp
            const progress = academicData.data.graduation_progress;

            // Cập nhật thanh tiến độ hình tròn
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            progressBar.style.strokeDasharray = `${progress}, 100`;
            progressText.textContent = `${progress}%`;

            const data = academicData.data;

            // Hiển thị các dữ liệu GPA lên trang web
            document.querySelector('.total-credits-attempted').textContent = data.total_credits_attempted;
            document.querySelector('.total-credits-earned').textContent = data.total_credits_earned;
            document.querySelector('.gpa').textContent = data.gpa;
            document.querySelector('.cumulative-gpa').textContent = data.cumulative_gpa;

            const ctx = document.getElementById('progressChart').getContext('2d');
            const progressDetails = academicData.data.progress_details;
            const requiredProgress = academicData.required_progress_details;

            const progressChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Đại Cương', 'Cơ Sở Ngành', 'Chuyên ngành', 'Tốt nghiệp', 'Tự Do'],
                    datasets: [
                        {
                            label: 'Tín chỉ đã hoàn thành',
                            data: [
                                progressDetails.general_education,
                                progressDetails.major_foundation,
                                progressDetails.major_core,
                                progressDetails.graduation_progress,
                                progressDetails.elective_credits
                            ],
                            backgroundColor: '#80C1FE',
                        },
                        {
                            label: 'Tín chỉ yêu cầu',
                            data: [
                                requiredProgress.required_general_education,
                                requiredProgress.required_major_foundation,
                                requiredProgress.required_major_core,
                                requiredProgress.required_graduation_project,
                                requiredProgress.required_elective_credits
                            ],
                            backgroundColor: '#2B57D6',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Số tín chỉ',
                                color: '#000000'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Loại tín chỉ',
                                color: '#000000'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                color: '#000000'
                            }
                        },
                    }
                }
            });

            const semesterGpaMap = {};
            academicData.data.semester_gpas.forEach(item => {
                semesterGpaMap[item.semester_id] = item.semester_gpa;
            });

            scoresemesterData.sort((a, b) => {
                const getParts = (hk) => {
                    // hk.semester_id = "HK120232024"
                    // Tách học kỳ (HK1 hoặc HK2)
                    const term = hk.semester.semester_id.slice(2, 3); // '1' hoặc '2'
                    // Năm bắt đầu: 4 chữ số từ vị trí 3 đến 7
                    const startYear = parseInt(hk.semester.semester_id.slice(3, 7));
                    // Năm kết thúc: 4 chữ số từ vị trí 7 đến 11
                    const endYear = parseInt(hk.semester.semester_id.slice(7, 11));
                    return { term, startYear, endYear };
                };

                const A = getParts(a);
                const B = getParts(b);

                // So sánh năm bắt đầu
                if (A.startYear !== B.startYear) {
                    return A.startYear - B.startYear;
                }
                // So sánh năm kết thúc
                if (A.endYear !== B.endYear) {
                    return A.endYear - B.endYear;
                }
                // So sánh học kỳ (1 < 2)
                return A.term.localeCompare(B.term);
            });


            scoresemesterData.forEach(semester => {

                const semesterWrapper = document.createElement("div");
                semesterWrapper.className = "mb-4";
                const gpa = semesterGpaMap[semester.semester.semester_id] ?? '-';


                const semesterTitle = document.createElement("h3");
                semesterTitle.className = "text-dark";
                semesterTitle.textContent = semester.semester.semester_name;

                const tableHTML = `
                    <div class="table-responsive mb-4">
                        <table class="table table-hover">
                            <thead class="table-primary text-primary">
                                <tr>
                                    <th scope="col">Mã môn học</th>
                                    <th scope="col">Tên môn học</th>
                                    <th scope="col">Trạng thái</th>
                                    <th scope="col">Điểm QT</th>
                                    <th scope="col">Điểm GK</th>
                                    <th scope="col">Điểm TH</th>
                                    <th scope="col">Điểm CK</th>
                                    <th scope="col">Điểm HP</th>
                                </tr>
                            </thead>
                            <tbody>
                    ${semester.subjects.map(sub => `
                        <tr>
                            <td>${escapeHTML(sub.subject_code)}</td>
                            <td>${escapeHTML(sub.subject_name)}</td>
                            <td><span class="${sub.status === 'Đậu' ? 'status-badge-pass' : 'status-badge-fail'}">${escapeHTML(sub.status)}</span></td>
                            <td>${sub.score_QT !== undefined && sub.score_QT !== null ? escapeHTML(sub.score_QT) : '-'}</td>
                            <td>${sub.score_GK !== undefined && sub.score_GK !== null ? escapeHTML(sub.score_GK) : '-'}</td>
                            <td>${sub.score_TH !== undefined && sub.score_TH !== null ? escapeHTML(sub.score_TH) : '-'}</td>
                            <td>${sub.score_CK !== undefined && sub.score_CK !== null ? escapeHTML(sub.score_CK) : '-'}</td>
                            <td class="${sub.status === 'Đậu' ? 'highlight-pass' : 'highlight-fail'}">${sub.score_HP !== undefined && sub.score_HP !== null ? escapeHTML(sub.score_HP) : '-'}</td>
                        </tr>
                    `).join("")}
                    <tr class="table-secondary">
                        <td colspan="7" class="text-start fw-bold">Trung bình học kỳ</td>
                        <td class="fw-bold text-primary">${escapeHTML(gpa)}</td>
                    </tr>
                </tbody>
                        </table>
                    </div>
                    `;

                semesterWrapper.appendChild(semesterTitle);
                semesterWrapper.appendChild(document.createRange().createContextualFragment(tableHTML));

                semesterScores.appendChild(semesterWrapper);
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    // Lắng nghe sự kiện input để tìm kiếm theo mã môn học hoặc tên môn học
    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase();  // Chuyển giá trị tìm kiếm thành chữ thường

        // Xóa tất cả các học kỳ hiện tại trong semesterScores
        semesterScores.innerHTML = '';

        // Lọc dữ liệu dựa trên từ khóa tìm kiếm
        scoresemesterData.forEach(semester => {
            const semesterWrapper = document.createElement("div");
            semesterWrapper.className = "mb-4";

            const semesterTitle = document.createElement("h3");
            semesterTitle.className = "text-dark";
            semesterTitle.textContent = semester.semester.semester_name;

            // Lọc các môn học theo mã môn học hoặc tên môn học
            const filteredSubjects = semester.subjects.filter(sub =>
                sub.subject_code.toLowerCase().includes(searchTerm) ||
                sub.subject_name.toLowerCase().includes(searchTerm)
            );

            // Nếu có môn học thỏa mãn tìm kiếm
            if (filteredSubjects.length > 0) {
                const tableHTML = `
                    <div class="table-responsive mb-4">
                        <table class="table table-hover">
                            <thead class="table-primary text-primary">
                                <tr>
                                    <th scope="col">Mã môn học</th>
                                    <th scope="col">Tên môn học</th>
                                    <th scope="col">Trạng thái</th>
                                    <th scope="col">Điểm QT</th>
                                    <th scope="col">Điểm GK</th>
                                    <th scope="col">Điểm TH</th>
                                    <th scope="col">Điểm CK</th>
                                    <th scope="col">Điểm HP</th>
                                </tr>
                            </thead>
                             <tbody>
                    ${filteredSubjects.map(sub => `
                        <tr>
                            <td>${escapeHTML(sub.subject_code)}</td>
                            <td>${escapeHTML(sub.subject_name)}</td>
                            <td><span class="${sub.status === 'Đậu' ? 'status-badge-pass' : 'status-badge-fail'}">${escapeHTML(sub.status)}</span></td>
                            <td>${sub.score_QT !== undefined && sub.score_QT !== null ? escapeHTML(sub.score_QT) : '-'}</td>
                            <td>${sub.score_GK !== undefined && sub.score_GK !== null ? escapeHTML(sub.score_GK) : '-'}</td>
                            <td>${sub.score_TH !== undefined && sub.score_TH !== null ? escapeHTML(sub.score_TH) : '-'}</td>
                            <td>${typeof sub.score_CK === 'number' ? escapeHTML(sub.score_CK) : '-'}</td>
                            <td class="${sub.status === 'Đậu' ? 'highlight-pass' : 'highlight-fail'}">
                                ${sub.score_HP !== null && sub.score_HP !== undefined ? escapeHTML(sub.score_HP) : '-'}
                            </td>
                        </tr>
                    `).join("")}
                </tbody>

                            
                        </table>
                    </div>
                `;

                semesterWrapper.appendChild(semesterTitle);
                semesterWrapper.appendChild(document.createRange().createContextualFragment(tableHTML));

                semesterScores.appendChild(semesterWrapper);
            }
        });
    });
}


// Export button click handler
document.getElementById('export-excel-btn').addEventListener('click', function () {
    if (scoresemesterData.length === 0) {
        alert('Dữ liệu chưa được tải, vui lòng thử lại sau.');
        return;
    }

    const dataToExport = [];

    scoresemesterData.forEach(semester => {
        semester.subjects.forEach(sub => {
            const subjectData = {
                "Mã môn học": sub.subject_code,
                "Tên môn học": sub.subject_name,
                "Trạng thái": sub.status,
                "Điểm QT": sub.score_QT ?? '-',
                "Điểm GK": sub.score_GK ?? '-',
                "Điểm TH": sub.score_TH ?? '-',
                "Điểm CK": sub.score_CK ?? '-',
                "Điểm HP": sub.score_HP ?? '-'
            };
            dataToExport.push(subjectData);
        });
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scores");
    XLSX.writeFile(wb, "subject_scores.xlsx");
});

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m];
    });
}