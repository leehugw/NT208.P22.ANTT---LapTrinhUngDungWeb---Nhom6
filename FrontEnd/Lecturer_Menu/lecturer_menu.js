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
});

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

//api đăng xuất
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.logout-button');

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