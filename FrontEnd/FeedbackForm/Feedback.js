document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const data = {
    role: document.getElementById('role').value,
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    type: document.getElementById('type').value,
    message: document.getElementById('message').value
  };

  const responseMessage = document.getElementById('responseMessage');
  responseMessage.innerHTML = '';

  try {
    const res = await fetch('/api/feedbacks-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    // Đọc response text trước
    const text = await res.text();

    // Nếu có text mới parse JSON, nếu không thì tạo object rỗng
    const result = text ? JSON.parse(text) : {};

    if (res.ok) {
      responseMessage.innerHTML = `<div class="alert alert-success">${result.message || 'Phản hồi đã gửi thành công!'}</div>`;
      document.getElementById('feedbackForm').reset();
    } else {
      responseMessage.innerHTML = `<div class="alert alert-danger">${result.error || 'Có lỗi xảy ra. Vui lòng thử lại.'}</div>`;
    }
  } catch (err) {
    responseMessage.innerHTML = `<div class="alert alert-danger">Lỗi gửi phản hồi. Vui lòng thử lại.</div>`;
    console.error('Lỗi khi gửi phản hồi:', err);
  }
});

  