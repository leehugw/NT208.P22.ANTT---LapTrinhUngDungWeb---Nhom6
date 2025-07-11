document.getElementById('createLecturerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = {
        username: document.getElementById('username').value,
        fullname: document.getElementById('fullname').value,
        phonenumber: document.getElementById('phonenumber').value,
        gender: document.getElementById('gender').value,
        birthdate: document.getElementById('birthdate').value,
        birthplace: document.getElementById('birthplace').value,
        faculty: document.getElementById('faculty').value,
        class_id: document.getElementById('className').value
    };
    try {
        const res = await fetch(`${window.location.origin}/api/admin/lecturers`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth token
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Tạo tài khoản thành công!');
            this.reset();
        } else {
            alert('Có lỗi xảy ra!');
        }
    } catch (err) {
        alert('Không thể kết nối server!');
    }
});