document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuClose = document.getElementById('menu-close');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.style.display = 'block';
            setTimeout(() => {
                mobileMenu.style.left = '0';
            }, 10);
        });
    }

    if (menuClose) {
        menuClose.addEventListener('click', function() {
            mobileMenu.style.left = '-75%';
            setTimeout(() => {
                mobileMenu.style.display = 'none';
            }, 300);
        });
    }
});

// Kiểm tra token khi tải trang
document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  const logoutButton = document.querySelector('.logout-button');

  if (urlToken) {
    localStorage.setItem('token', urlToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const token = localStorage.getItem('token');
  if (!token) {
    alert("Bạn chưa đăng nhập. Chuyển về trang chủ...");
    window.location.href = "http://localhost:3000/";
    return;
  }

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

// Hàm kiểm tra token chung
function checkTokenAndRedirect() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
    window.location.href = "http://localhost:3000/";
    return false;
  }
  return token;
}
// Gửi tin nhắn khi người dùng gửi tin nhắn
function sendMessage() {
  const inputField = document.getElementById("user-input");
  const message = inputField.value.trim();

  if (!message) return;

  addMessage(message, 'user');  // Thêm tin nhắn của người dùng vào khung chat
  inputField.value = '';  // Xóa ô nhập sau khi gửi

  // Ẩn phần FAQ sau khi gửi
  const faqSection = document.querySelector(".faq");
  if (faqSection) {
    faqSection.style.display = "none";
  }

  // Không trả lời lại nữa sau khi người dùng gửi tin nhắn
  // (Không thêm bất kỳ logic trả lời nào sau khi người dùng gửi tin nhắn)

  fetch(`http://localhost:3000/api/student/chatbot-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  })
    .then((response) => response.json())
    .then((data) => {
      const botResponse = data.answer || "Xin lỗi, tôi không hiểu câu hỏi của bạn.";
      addMessage(botResponse, 'bot'); // Thêm tin nhắn của bot vào khung chat
    })
    .catch((error) => {
      console.error("Lỗi khi gọi API:", error);
      addMessage("Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.", 'bot');
    });
}


// Thêm tin nhắn vào khung chat
function addMessage(text, sender) {
  const chatBox = document.querySelector(".chat-box");
  const messageElem = document.createElement("div");
  messageElem.className = `message ${sender}`;
  messageElem.innerText = text;
  chatBox.appendChild(messageElem);
  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 0); // Cuộn xuống cuối khung chat
}

// Điền vào ô chat khi nhấn vào FAQ
function fillMessage(button) {
    const message = button.textContent;
    const inputField = document.getElementById("user-input");
    if (inputField) {
        inputField.value = message;
        inputField.focus();
    }
}

// Toggle sidebar
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const isOpen = sidebar.style.transform === "translateX(0px)";
  sidebar.style.transform = isOpen ? "translateX(-60px)" : "translateX(0px)";
}

function openChatHistory() {
  alert("Tính năng xem lịch sử trò chuyện sẽ được cập nhật sau!");
}

