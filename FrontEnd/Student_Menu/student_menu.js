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
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
        console.log("🔑 Lấy được token từ URL:", urlToken);
        localStorage.setItem('token', urlToken); // hoặc sessionStorage nếu bạn thích
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem('token');
    console.log("🗂 Token hiện tại trong localStorage:", token);

    if (!token) {
        alert("Bạn chưa đăng nhập. Chuyển về trang chủ...");
        window.location.href = "http://localhost:3000/";
        return;
    }

    // Nếu có token → gọi API lấy dữ liệu:
    fetchStudentProfile(token);
});

document.getElementById("btn-student-card").addEventListener("click", function(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "http://localhost:3000/";
    } else {
        window.location.href = "/api/student/profile?token=" + token;
    }
});

document.getElementById("btn-student-info").addEventListener("click", function(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "http://localhost:3000/";
    } else {
        // Sửa thành redirect đến trang HTML thay vì API endpoint
        window.location.href = "/api/student/profile?token=" + token;
    }
});