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
        localStorage.setItem('token', urlToken); // hoặc sessionStorage nếu bạn thích
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Bạn chưa đăng nhập. Chuyển về trang chủ...");
        window.location.href = "http://localhost:3000/";
        return;
    }
});

document.querySelectorAll(".btn-student-info").forEach(el => {
    el.addEventListener("click", function(e) {
        e.preventDefault(); 
        const token = localStorage.getItem("token"); 
        if (!token) {
            alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
            window.location.href = "http://localhost:3000/";  // Điều hướng đến trang đăng nhập
        } else {
            window.location.href = "/api/student/profile";  
        }
    });
});
document.getElementById("btn-student-chatbotcard").addEventListener("click", function(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "http://localhost:3000/";
    } else {
        window.location.href = "/api/student/chatbot?token=" + token;
    }
});
// Xử lý sự kiện khi click vào "Chatbot"
document.getElementById("btn-student-chatbot").addEventListener("click", function(e) {
    e.preventDefault(); 
    const token = localStorage.getItem("token"); 
    if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "http://localhost:3000/";  // Điều hướng đến trang đăng nhập
    } else {
        // Nếu có token, điều hướng đến chatbot
        window.location.href = "/api/student/chatbot?token=" + token;  // Điều hướng đến route chatbot
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

document.querySelectorAll(".btn-student-progress").forEach(el => {
    el.addEventListener("click", function(e) {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
            window.location.href = "http://localhost:3000/";
        } else {
            window.location.href = "/api/student/academicstatistic";
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

