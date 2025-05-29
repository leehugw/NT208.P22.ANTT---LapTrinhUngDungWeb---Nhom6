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