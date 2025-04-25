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

//api đăng xuất
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.logout-button');
    const studentTrackBtn = document.querySelector('.btn-admin-student');
    const studentDropDownBtn = document.getElementById('btn-admin-student');
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
        localStorage.setItem("token", token);
        console.log("Token đã được lưu vào localStorage:", token);
        // xóa token khỏi URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

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

    if (studentTrackBtn) {
        studentTrackBtn.addEventListener('click', function (e) {
            e.preventDefault();

            const token = localStorage.getItem("token");
            if (!token) {
                alert("Chưa đăng nhập");
                window.location.href = '/';
            } else {
                window.location.href = `/api/admin/students?token=${token}`;
            }
        });
    }
    if (studentDropDownBtn) {
        studentDropDownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!token) {
                alert("Chưa đăng nhập");
                window.location.href = '/';
            } else {
                window.location.href = `/api/admin/students?token=${token}`;
            }
        });
    };
    const createLecturerBtns = document.querySelectorAll('.btn-create-lecturer-account');
    if (createLecturerBtns) {
        createLecturerBtns.forEach(btn => {
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
    }
});

document.querySelector('.btn-admin-student').addEventListener('click', function (e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    console.log("📦 Token:", token);
    if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = '/';
    } else {
        window.location.href = 'FrontEnd/StudentList/students?token=' + token;
    }
});