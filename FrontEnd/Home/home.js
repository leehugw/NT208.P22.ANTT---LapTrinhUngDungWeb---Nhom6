window.addEventListener('scroll', function () {
    let sections = document.querySelectorAll('section'); // Chọn tất cả các phần có id 
    let navbarLinks = document.querySelectorAll('.navbar-container .nav-link'); // Các liên kết trong navbar
    let currentSection = "";

    // Lặp qua các phần để tìm ra phần đang được hiển thị
    sections.forEach(section => {
        let sectionTop = section.offsetTop;
        let sectionHeight = section.clientHeight;

        if (window.scrollY >= sectionTop - sectionHeight / 3) {
            currentSection = section.getAttribute('id');
        }
    });

    // Cập nhật navbar để thay đổi màu
    navbarLinks.forEach(link => {
        link.classList.remove('active'); // Xóa lớp active khỏi tất cả các liên kết
        if (link.getAttribute('href').substring(1) === currentSection) {
            link.classList.add('active'); // Thêm lớp active cho liên kết tương ứng với phần đang hiển thị
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const loginBtn = document.getElementById('login-button');
    const logoutBtn = document.getElementById('logout-button');
    if (!token) {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    } else {
        try {
            const payloadBase64 = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            const role = decodedPayload.role; 

            if (role === 'student') {
                window.location.href = '/Student_Menu/stu_menu.html';
            } else if (role === 'lecturer') {
                window.location.href = '/Lecturer_Menu/lec_menu.html';
            } else if (role === 'admin') {
                window.location.href = '/Admin_Menu/admin_menu.html';
            } else {
                alert('Không xác định được vai trò người dùng!');
                window.location.href = '/';
            }
        } catch (e) {
            console.error('Token không hợp lệ hoặc không thể giải mã:', e);
            localStorage.removeItem('token');
            window.location.href = '/';
        }
    }
});

//api đăng xuất
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

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

// Khi nhấn nút đăng nhập DAA
document.getElementById('login-daa-btn').onclick = function() {
    window.location.href = '/api/student/crawl'; // đường dẫn này sẽ chạy luôn trên trình duyệt
};

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