(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    localStorage.setItem("token", token);
    // Xoá token khỏi URL nếu muốn:
    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("token");

  if (urlToken) {
    localStorage.setItem("token", urlToken); // hoặc sessionStorage nếu bạn thích
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Bạn chưa đăng nhập. Chuyển về trang chủ...");
    window.location.href = "https://chatbotuit.id.vn/";
    return;
  }

  document.querySelectorAll(".btn-student-progress").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "https://chatbotuit.id.vn/";
      } else {
        window.location.href = "/api/student/academicstatistic";
      }
    });
  });

  document.querySelectorAll(".btn-student-schedule").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "https://chatbotuit.id.vn/";
      } else {
        window.location.href = "/api/student/schedule-optimize";
      }
    });
  });

  document.querySelectorAll(".btn-student-english").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "https://chatbotuit.id.vn/";
      } else {
        window.location.href = "/api/student/english-certificate";
      }
    });
  });

  document.querySelectorAll(".btn-student-info").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "https://chatbotuit.id.vn/"; // Điều hướng đến trang đăng nhập
      } else {
        window.location.href = "/api/student/profile";
      }
    });
  });

  document.querySelectorAll(".btn-student-chatbot").forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
        window.location.href = "https://chatbotuit.id.vn/"; // Điều hướng đến trang đăng nhập
      } else {
        // Nếu có token, điều hướng đến chatbot
        window.location.href = "/api/student/chatbot?token=" + token; // Điều hướng đến route chatbot
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
      fetch("https://chatbotuit.id.vn/api/student/stu_menu", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (res.ok) {
          // Nếu token hợp lệ, điều hướng
          window.location.href = "/Student_Menu/stu_menu.html";
        } else {
          alert("Phiên đăng nhập không hợp lệ!");
          window.location.href = "/";
        }
      });
    });
  });

  document.querySelectorAll(".notification-button").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Bạn chưa đăng nhập. Chuyển về trang chủ...");
        return (window.location.href = "/");
      } else {
        fetch(`/api/student/abnormal`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Lấy thông báo thất bại!");
            return res.json();
          })
          .then((notifications) => {
            const list = document.getElementById("notificationList");
            const badge = document.getElementById("notificationBadge");
            const isVisible = list.style.display === "block";
            list.style.display = isVisible ? "none" : "block";

            if (!isVisible) {
              // Khi mở dropdown, ẩn badge vì coi như đã đọc
              badge.style.display = "none";

              // Gọi API đánh dấu đã đọc
              fetch("/api/student/notifications/mark-read", {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
                .then((res) => {
                  if (!res.ok)
                    console.warn("Đánh dấu thông báo đã đọc thất bại");
                  // Không cần xử lý gì thêm ở client
                })
                .catch(console.error);
            }

            if (!notifications.data || notifications.data.length === 0) {
              list.innerHTML =
                '<div style="padding:10px; text-align:center; color:#888;">Không có thông báo nào.</div>';
              badge.style.display = "none"; // ẩn badge
              return;
            }

            list.innerHTML = ""; // xóa nội dung cũ
            notifications.data.forEach((noti) => {
              const div = document.createElement("div");
              div.style.padding = "8px";
              div.style.borderBottom = "1px solid #eee";
              const noteText = noti.note
                ? noti.note.replace(/\n/g, "<br>")
                : "(Không có nội dung)";
              const timeText = new Date(noti.updatedAt).toLocaleString();

              div.innerHTML = `
                        <div>${noteText}</div>
                        <small style="color:#666;">${timeText}</small>
                    `;
              list.appendChild(div);
            });

            badge.textContent = notifications.data.length;
          })
          .catch((err) => {
            alert(err.message);
            console.error(err);
          });
      }
    });
  });
  const logoutButton = document.querySelector(".logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/";
    });
  }
  fetchNotificationsAndUpdateBadge();
});

function fetchNotificationsAndUpdateBadge() {
  const token = localStorage.getItem("token");
  if (!token) return;

  fetch(`/api/student/abnormal`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Lấy thông báo thất bại!");
      return res.json();
    })
    .then((notifications) => {
      const badge = document.getElementById("notificationBadge");
      if (!notifications.data || notifications.data.length === 0) {
        badge.style.display = "none";
        return;
      }

      // Tính số thông báo chưa đọc
      const unreadCount = notifications.data.filter((n) => !n.read).length;

      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    })

    .catch((err) => {
      console.error("Lỗi lấy thông báo:", err);
    });
}

function openFeedbackPopup() {
  if (document.getElementById("feedbackPopup")) {
    document.getElementById("feedbackPopup").style.display = "flex";
    return;
  }

  fetch("/FeedbackForm/feedbackForm.html")
    .then((res) => res.text())
    .then((html) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper);

      const script = document.createElement("script");
      script.src = "/FeedbackForm/Feedback.js";
      document.body.appendChild(script);
    });

  window.closeFeedbackForm = function () {
    const popup = document.getElementById("feedbackPopup");
    if (popup) popup.remove();
  };
}
