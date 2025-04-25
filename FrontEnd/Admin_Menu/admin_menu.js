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
    document.querySelectorAll('#btn-admin-student').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Bạn chưa đăng nhập!");
                window.location.href = '/';
            } else {
                window.location.href = `/api/admin/students?token=${token}`;
            }
        });
    });

    // Theo dõi giảng viên
    document.querySelectorAll('#btn-admin-lecturer').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Bạn chưa đăng nhập!");
                window.location.href = '/';
            } else {
                window.location.href = `/api/admin/lecturers?token=${token}`;
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
});