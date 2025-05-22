// student_info.js
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

// Gắn sự kiện submit
document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();

    const type = document.querySelector('select').value;
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    const studentId = localStorage.getItem('student_id') || '20521111'; // tạm hardcode nếu chưa có auth

    if (!type || !file || !studentId) {
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
                body: JSON.stringify({ studentId, type, imageUrl })
            });

            const data = await response.json();
            if (response.ok) {
                alert('Nộp chứng chỉ thành công!');
                fileInput.value = ''; // clear file input
                loadCertificates(); // reload danh sách
            } else {
                alert(data.error || 'Lỗi khi nộp chứng chỉ!');
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi kết nối máy chủ');
        }
    };

    reader.readAsDataURL(file);
});

async function loadCertificates() {
    const studentId = localStorage.getItem('student_id') || '20521111';
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';

    try {
        const res = await fetch(`/api/student/certificate?studentId=${studentId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);
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

        // 👇 Gắn SỰ KIỆN SAU KHI render xong bảng
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
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="5">Lỗi khi tải danh sách</td></tr>';
    }
}

//api đăng xuất
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.login-button');

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

window.addEventListener('DOMContentLoaded', loadCertificates);