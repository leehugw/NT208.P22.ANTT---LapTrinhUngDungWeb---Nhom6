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

document.getElementById('createLecturerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
        username: document.getElementById('username').value,
        fullname: document.getElementById('fullname').value,
        phonenumber: document.getElementById('phonenumber').value,
        gender: document.getElementById('gender').value,
        birthdate: document.getElementById('birthdate').value,
        birthplace: document.getElementById('birthplace').value,
        faculty: document.getElementById('faculty').value,
        className: document.getElementById('className').value,
        role: document.getElementById('role').value
    };
    try {
        const res = await fetch(`${window.location.origin}/api/admin/lecturers`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth token
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Tạo tài khoản thành công!');
            this.reset();
        } else {
            alert('Có lỗi xảy ra!');
        }
    } catch (err) {
        alert('Không thể kết nối server!');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Lưu token từ URL vào localStorage nếu có
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
        localStorage.setItem("token", urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Đăng xuất
    document.querySelectorAll('.logout-button').forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    });

    // Theo dõi sinh viên
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
});