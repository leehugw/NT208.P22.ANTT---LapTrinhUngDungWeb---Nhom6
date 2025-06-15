// FrontEnd\Student_Information\js\student_info.js
document.addEventListener("DOMContentLoaded", () => {
  // Lấy token từ URL hoặc localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("token");
  const student_id = urlParams.get("student_id");

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

  fetchStudentProfile(token, student_id);
});

async function fetchStudentProfile(token, student_id) {
  try {
    if (!token) {
      alert("Vui lòng đăng nhập để xem thông tin");
      window.location.href = "https://chatbotuit.id.vn/";
      return;
    }
    const response = await fetch(
      "/api/student/profile-data" +
        (student_id ? `?student_id=${student_id}` : ""),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.success) {
      displayStudentData(data.data);
      localStorage.setItem("token", token);
    }
  } catch (error) {
    console.error("Error fetching student profile:", error);
    alert("Lỗi khi tải thông tin sinh viên: " + error.message);
  }
}

// Hiển thị dữ liệu lên các trường giao diện
function displayStudentData(data) {
  const { student, contact, address, family, identity } = data;

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    const displayValue = value ?? "Chưa cập nhật";
    if (element.tagName === "INPUT" || element.tagName === "SELECT") {
      element.value = displayValue;
    } else {
      element.textContent = displayValue;
    }
  }

  setValue("student-name", student.name);
  setValue("fullname", student.name);
  setValue("student-id", student.student_id);
  setValue("class", student.class_id);
  setValue("faculty-name", student.major_id); // Chỉnh lại nếu cần
  setValue("training-system", student.program_type);

  setValue("birth-place", student.birthplace);
  setValue("birth-date", student.birth_date);

  // Xử lý giới tính
  const genderValue = (student?.gender || "").toString().trim().toLowerCase();
  const isFemale = ["nữ", "nu", "female"].includes(genderValue);
  document.getElementById("gender-display").textContent = isFemale
    ? "Nữ"
    : "Nam";
  if (document.getElementById("nam-display")) {
    document.getElementById("nam-display").checked = !isFemale;
    document.getElementById("nu-display").checked = isFemale;
  }

  // Thông tin liên lạc
  if (contact) {
    setValue("school-email", contact.school_email);
    setValue("student-email", contact.school_email);
    setValue("personal-email", contact.personal_email);
    setValue("phone", contact.phone);
  }

  // Địa chỉ
  if (address) {
    setValue("permanent-address", address.permanent_address);
    setValue("temporary-address", address.temporary_address);
  }

  // Gia đình
  if (family) {
    setValue("father-name", family.father?.name);
    setValue("father-job", family.father?.job);
    setValue("father-phone", family.father?.phone);
    setValue("father-address", family.father?.address);

    setValue("mother-name", family.mother?.name);
    setValue("mother-job", family.mother?.job);
    setValue("mother-phone", family.mother?.phone);
    setValue("mother-address", family.mother?.address);

    setValue("guardian-name", family.guardian?.name);
    setValue("guardian-phone", family.guardian?.phone);
    setValue("guardian-address", family.guardian?.address);
  }

  // Căn cước
  if (identity) {
    setValue("identity-number", identity.identity_number);
    setValue("identity-issue-date", identity.identity_issue_date);
    setValue("identity-issue-place", identity.identity_issue_place);
    setValue("ethnicity", identity.ethnicity);
    setValue("religion", identity.religion);
    setValue("origin", identity.origin);
    setValue("union-join-date", identity.union_join_date);
    setValue("party-join-date", identity.party_join_date);
  }
}
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

// Thêm đoạn này vào cuối file
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("token");

  if (urlToken) {
    localStorage.setItem("token", urlToken);
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
        window.location.href = "https://chatbotuit.id.vn/";
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
        window.location.href = "https://chatbotuit.id.vn/";
      } else {
        window.location.href = "/api/student/chatbot?token=" + token;
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

      fetch("https://chatbotuit.id.vn/api/student/stu_menu", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => {
        if (res.ok) {
          window.location.href = "/Student_Menu/stu_menu.html";
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
              badge.style.display = "none";
              fetch("/api/student/notifications/mark-read", {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
                .then((res) => {
                  if (!res.ok)
                    console.warn("Đánh dấu thông báo đã đọc thất bại");
                })
                .catch(console.error);
            }

            if (!notifications.data || notifications.data.length === 0) {
              list.innerHTML =
                '<div style="padding:10px; text-align:center; color:#888;">Không có thông báo nào.</div>';
              badge.style.display = "none";
              return;
            }

            list.innerHTML = "";
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
