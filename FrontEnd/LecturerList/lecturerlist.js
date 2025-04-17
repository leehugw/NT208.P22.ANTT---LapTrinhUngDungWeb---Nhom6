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

// DOM ready
document.addEventListener("DOMContentLoaded", function () {
  fetchLecturers(); // Không truyền token nữa

  // Sự kiện menu mobile
  document.getElementById("menu-toggle").addEventListener("click", function () {
    document.getElementById("mobile-menu").style.display = "block";
  });
  document.getElementById("menu-close").addEventListener("click", function () {
    document.getElementById("mobile-menu").style.display = "none";
  });
});

// Mã khoa sang tên khoa
const facultyMap = {
  "KHOA_MMT": "Mạng máy tính và truyền thông",
  "KHOA_CNPM": "Công nghệ phần mềm",
  "KHOA_KHMT": "Khoa học máy tính",
  "KHOA_HTTT": "Hệ thống thông tin",
  "KHOA_TGMT": "Thị giác máy tính và truyền thông",
  "KHOA_TTNT": "Trí tuệ nhân tạo",
  "KHOA_KTTT": "Kĩ thuật thông tin",
  "KHOA_KTMT": "Kĩ thuật máy tính"
};

// Gọi API không cần token
function fetchLecturers() {
  fetch("http://localhost:3000/api/admin/lecturers-data")
    .then((response) => response.json())
    .then((data) => {
      // 🟦 Sắp xếp theo tên giảng viên (tăng dần A → Z)
      data.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });

      renderLecturers(data);
      updateLecturerCount(data);
    })
    .catch((error) => {
      console.error("Lỗi khi lấy dữ liệu giảng viên:", error);
    });
}

// Hiển thị bảng
function renderLecturers(data) {
  const tbody = document.getElementById("lecturerTableBody");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Không có giảng viên nào.</td></tr>`;
    return;
  }

  data.forEach((lecturer) => {
    const id = lecturer._id?.$oid || "";
    const name = lecturer.name || "Không rõ";
    const email = lecturer.school_email || "Không rõ";
    const faculty = facultyMap[lecturer.faculty_id] || lecturer.faculty_id || "Không rõ";
   
    const tr = document.createElement("tr");
    tr.classList.add("custom-row");
    tr.innerHTML = `
      <td class="d-flex align-items-center border-start">
        <img src="https://placehold.co/50x50" class="rounded-circle me-2" width="50" height="50" alt="avatar">
        ${name}
      </td>
      <td class="text-center">${email}</td>
      <td class="text-center">${faculty}</td>
      <td class="text-center">
        <a href="/giangvien/${id}" class="text-primary"><i class="fas fa-external-link-alt"></i></a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Tổng số giảng viên
function updateLecturerCount(data) {
  const count = data.length;
  const countElement = document.getElementById("lecturerCount");
  if (countElement) {
    countElement.textContent = `${count}`;
  }
}

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