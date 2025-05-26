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
  const token = localStorage.getItem('token');
  fetch('/api/admin/feedbacks-data', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderFeedbackTable(sorted);
    })
    .catch(err => console.error('Lỗi khi tải phản hồi:', err));
});

document.addEventListener('DOMContentLoaded', () => {
  const bugElement = document.getElementById('bugCount');

  if (bugElement) {
    fetch('/api/admin/bug-statistic', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log('API response:', data);
        bugElement.textContent = `Số lượt báo lỗi: ${data.bugCount}`;
      })
      .catch(err => {
        console.error('Lỗi khi tải thống kê bug:', err);
      });
  }
});

function renderFeedbackTable(feedbacks) {
  const tbody = document.getElementById('feedbackTableBody');
  tbody.innerHTML = '';

  if (!feedbacks.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-muted">Không có phản hồi nào.</td></tr>';
    return;
  }

  feedbacks.forEach((fb, index) => {
    const role = fb.role === 'student' ? 'Sinh viên' : fb.role === 'teacher' ? 'Giảng viên' : 'Không rõ';
    const name = fb.name || 'Ẩn danh';
    const email = fb.email || 'Không có';
    const type = convertType(fb.type);
    const message = fb.message || 'Không có nội dung';
    const date = fb.createdAt ? new Date(fb.createdAt).toLocaleString('vi-VN') : 'Không rõ';

    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td>${index + 1}</td>
    <td>${escapeHTML(role)}</td>
    <td>${escapeHTML(name)}</td>
    <td>${escapeHTML(email)}</td>
    <td>${escapeHTML(type)}</td>
    <td class="text-start">${escapeHTML(message)}</td>
    <td>${escapeHTML(date)}</td>
`;

    tbody.appendChild(tr);
  });
}

function convertType(type) {
  switch (type) {
    case 'bug': return 'Báo lỗi';
    case 'feedback': return 'Góp ý';
    case 'question': return 'Câu hỏi';
    default: return 'Không rõ';
  }
}

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

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function(m) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m];
    });
}