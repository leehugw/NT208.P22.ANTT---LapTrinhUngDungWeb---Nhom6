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
  
      const result = await res.json();
  
      if (res.ok) {
        responseMessage.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
        document.getElementById('feedbackForm').reset();
      } else {
        responseMessage.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
      }
    } catch (err) {
      responseMessage.innerHTML = `<div class="alert alert-danger">Lỗi gửi phản hồi. Vui lòng thử lại.</div>`;
    }
  });
  