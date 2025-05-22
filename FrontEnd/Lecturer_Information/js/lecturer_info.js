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

// Load lecturer profile
document.addEventListener('DOMContentLoaded', function() {
    // Lấy token từ URL hoặc localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const token = urlToken || localStorage.getItem('token');
    
    if (!token) {
        alert("Vui lòng đăng nhập để xem thông tin");
        window.location.href = `${window.location.origin}/`;
        return;
    }

    // Lưu token nếu có từ URL
    if (urlToken) {
        localStorage.setItem('token', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchLecturerProfile(token);
});

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

async function fetchLecturerProfile(token) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let LecturerProfileData;

        if(urlParams.toString()){
            const lecturerId = urlParams.get('lecturer_id');
            LecturerProfileData = `http://localhost:3000/api/lecturer/profile-data?lecturer_id=${lecturerId}`;
        }
        else {
            LecturerProfileData = `http://localhost:3000/api/lecturer/profile-data`;
        }

        const token = localStorage.getItem("token");
        const response = await fetch(LecturerProfileData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = `${window.location.origin}/`;
                return;
            }
            throw new Error('Lỗi khi tải thông tin');
        }

        const data = await response.json();
        
        if (data.success && data.type === "lecturer") {
            displayLecturerData(data.data);
        } else {
            throw new Error(data.message || "Dữ liệu không hợp lệ");
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi khi tải thông tin giảng viên: ' + error.message);
    }
}

function displayLecturerData(lecturer) {
    if (!lecturer) {
        console.error("Không có dữ liệu giảng viên");
        return;
    }

    // Hàm helper để đặt giá trị an toàn
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT') {
                element.value = value || '';
            } else {
                element.textContent = value || 'Chưa cập nhật';
            }
        }
    }

    // Hiển thị thông tin chính
    setValue('lecturer-name', lecturer.fullname);
    setValue('lecturer-email', lecturer.email);
    setValue('lecturer-id', lecturer.lecturer_id);

    // Thông tin cá nhân
    setValue('fullname', lecturer.fullname);
    setValue('birth-place', lecturer.birthplace);
    setValue('birth-date', lecturer.birthdate); 
    setValue('faculty', lecturer.faculty);
    setValue('class-management', lecturer.class_id);

    // Xử lý giới tính
    const genderElement = document.getElementById('gender-display');
    const maleRadio = document.getElementById('nam-display');
    const femaleRadio = document.getElementById('nu-display');
    
    if (maleRadio && femaleRadio) {
        const normalizedGender = lecturer?.gender?.toString().trim().toLowerCase();
        maleRadio.checked = false;
        femaleRadio.checked = false;

        if (normalizedGender === 'nữ' || normalizedGender === 'nu' || normalizedGender === 'female') {
            femaleRadio.checked = true;
            if (genderElement) genderElement.textContent = 'Nữ';
        } else {
            maleRadio.checked = true; // Mặc định là Nam
            if (genderElement) genderElement.textContent = 'Nam';
        }
    }
    // Thông tin liên lạc
    setValue('personal-email', lecturer.email);
    setValue('phone', lecturer.phonenumber);
}