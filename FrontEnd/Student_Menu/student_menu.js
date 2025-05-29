document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
        localStorage.setItem('token', urlToken); // hoặc sessionStorage nếu bạn thích
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Bạn chưa đăng nhập. Chuyển về trang chủ...");
        window.location.href = "https://uit-chatbot.onrender.com/";
        return;
    }

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



