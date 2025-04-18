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
}

// Thêm tin nhắn vào khung chat
function addMessage(text, sender) {
  const chatBox = document.querySelector(".chat-box");
  const messageElem = document.createElement("div");
  messageElem.className = `message ${sender}`;
  messageElem.innerText = text;
  chatBox.appendChild(messageElem);
  chatBox.scrollTop = chatBox.scrollHeight;  // Cuộn xuống cuối khung chat
}

// Điền vào ô chat khi nhấn vào FAQ
function fillMessage(button) {
  const message = button.innerText;
  document.getElementById("user-input").value = message;
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
