document.addEventListener("DOMContentLoaded", () => {
  // Lưu token từ URL vào localStorage nếu có
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");
  if (urlToken) {
    localStorage.setItem("token", urlToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Theo dõi sinh viên
  document.querySelectorAll(".btn-admin-student").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/";
      } else {
        window.location.href = `/api/admin/students`;
      }
    });
  });

  // Theo dõi giảng viên
  document.querySelectorAll(".btn-admin-lecturer").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/";
      } else {
        window.location.href = `/api/admin/lecturers`;
      }
    });
  });

  // Tạo tài khoản giảng viên
  document.querySelectorAll(".btn-create-lecturer-account").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/";
      } else {
        window.location.href = `/api/admin/create-lecturer-account?token=${token}`;
      }
    });
  });

  // Thống kê
  document.querySelectorAll(".btn-admin-statistics").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/";
      } else {
        window.location.href = `/api/admin/statistics`;
      }
    });
  });

  // Danh sách phản hồi
  document.querySelectorAll(".btn-feedback").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập!");
        window.location.href = "/";
      } else {
        window.location.href = `/api/admin/feedbacks`;
      }
    });
  });

  document.querySelectorAll(".btn-home").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Chưa đăng nhập");
        return (window.location.href = "/");
      }

      // Gửi token kèm theo khi truy cập route được bảo vệ
      fetch("https://chatbotuit.id.vn/api/admin/admin_menu", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (res.ok) {
          // Nếu token hợp lệ, điều hướng
          window.location.href = "/Admin_Menu/admin_menu.html";
        } else {
          alert("Phiên đăng nhập không hợp lệ!");
          window.location.href = "/";
        }
      });
    });
  });
  document.querySelectorAll(".logout-button").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  });
});
