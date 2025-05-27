// student_info.js
// student_info.js

// Mở menu mobile
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

// ✅ Nhận studentId từ URL nếu có
const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('token');
const urlStudentId = urlParams.get('studentId');

if (urlToken) {
    localStorage.setItem('token', urlToken);
    if (urlStudentId) {
        localStorage.setItem('student_id', urlStudentId);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
}

// Gắn sự kiện submit chứng chỉ
document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const studentId = localStorage.getItem('student_id');
    if (!studentId) {
        alert('Không tìm thấy studentId. Vui lòng tải lại trang hoặc đăng nhập lại.');
        return;
    }

    const type = document.querySelector('select').value;
    const score = document.getElementById('score').value;
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    if (!type || !score || !file) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = async function () {
        const imageUrl = reader.result;

        try {
            const response = await fetch('/api/student/certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, type, score, imageUrl })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            const data = await response.json();
            alert('Nộp chứng chỉ thành công!');
            fileInput.value = ''; // clear file input
            loadCertificates();

        } catch (err) {
            console.error("Lỗi submit chứng chỉ:", err);
            alert('Lỗi kết nối hoặc dữ liệu không hợp lệ');
        }
    };

    reader.readAsDataURL(file);
});

// Tải danh sách chứng chỉ
async function loadCertificates() {
    const studentId = localStorage.getItem('student_id');
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';

    try {
        const res = await fetch(`/api/student/certificate?studentId=${studentId}`);

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text);
        }

        const data = await res.json();
        tbody.innerHTML = '';

        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.type}</td>
                <td>
                    <button class="btn btn-outline-primary btn-sm rounded-pill px-3 border-0 view-image-btn" data-image="${item.imageUrl}">
                        <i class="fa-solid fa-image"></i> Xem hình
                    </button>
                </td>
                <td><span class="badge px-3 py-2" style="background:#3D67BA;">${item.status}</span></td>
                <td>${new Date(item.submittedAt).toLocaleString('vi-VN')}</td>
            `;
            tbody.appendChild(row);
        });

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có chứng chỉ nào</td></tr>';
        }

        document.querySelectorAll('.view-image-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const imageUrl = this.dataset.image;
                const modalImg = document.getElementById('modalImage');
                modalImg.src = imageUrl;
                const modal = new bootstrap.Modal(document.getElementById('imageModal'));
                modal.show();
            });
        });

    } catch (err) {
        console.error("Không tải được danh sách chứng chỉ:", err);
        tbody.innerHTML = '<tr><td colspan="5">Lỗi khi tải danh sách</td></tr>';
    }
}

// Gọi API lấy điểm theo loại chứng chỉ
async function loadScore() {
    const scoreOptionsMap = {
        "TOEIC (Nghe-Đọc)": ['<500', '500-600', '601-700', '701-800', '>800'],
        "TOEIC (Nói-Viết)": ['<500', '500-600', '601-700', '701-800', '>800'],
        "TOEFL iBT": ['<42', '42-71', '72-94', '95-110', '>110'],
        "IELTS": ['<4.5', '4.5-5.5', '5.6-6.5', '6.6-7.5', '>7.5'],
        "VNU-EPT": ['<120', '120-150', '151-180', '181-210', '>210'],
        "PTE Academic": ['<36', '36-50', '51-65', '66-79', '≥80']
    };

    const typeSelect = document.querySelector('select');
    const scoreSelect = document.getElementById('score');

    if (typeSelect && scoreSelect) {
        typeSelect.addEventListener('change', () => {
            const selectedType = typeSelect.value;
            const ranges = scoreOptionsMap[selectedType] || [];

            scoreSelect.innerHTML = '<option value="">Chọn khoảng điểm</option>';
            ranges.forEach(range => {
                const option = document.createElement('option');
                option.value = range;
                option.textContent = range;
                scoreSelect.appendChild(option);
            });
        });
    }
}

// DOMContentLoaded để load dữ liệu ban đầu
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Bạn chưa đăng nhập. Chuyển về trang chủ...');
        window.location.href = "http://localhost:3000/";
        return;
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch (e) {
            return null;
        }
    }

    const decoded = parseJwt(token);
    if (decoded && decoded.student_id) {
        localStorage.setItem('student_id', decoded.student_id);
        loadCertificates();
        loadScore();
        return;
    }

    try {
        const res = await fetch('/api/student/profile-data', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok || !res.headers.get('content-type').includes('application/json')) {
            throw new Error('API trả về sai định dạng');
        }
        const data = await res.json();
        console.log('Profile data:', data); // Debug
        if (data.studentId) {
            localStorage.setItem('student_id', data.studentId);
            loadCertificates();
            loadScore();
        } else {
            throw new Error('Không có studentId trong response');
        }
    } catch (err) {
        console.error('Lỗi lấy studentId:', err);
        alert('Lỗi kết nối hoặc dữ liệu không hợp lệ!');
    }

    loadCertificates();
    loadScore();
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

document.querySelectorAll(".btn-student-schedule").forEach(el => {
    el.addEventListener("click", function(e) {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
            window.location.href = "http://localhost:3000/";
        } else {
            window.location.href = "/api/student/schedule-optimize";
        }
    });
});

document.querySelectorAll(".btn-student-english").forEach(el => {
    el.addEventListener("click", function(e) {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
            window.location.href = "http://localhost:3000/";
        } else {
            window.location.href = "/api/student/english-certificate";
        }
    });
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

document.querySelectorAll(".btn-student-chatbot").forEach(el => {
    el.addEventListener("click", function (e) {
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
        fetch('http://localhost:3000/api/student/stu_menu', {
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