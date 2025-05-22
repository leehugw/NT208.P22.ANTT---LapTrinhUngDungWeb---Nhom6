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

function getChatSessions() {
    const sessions = JSON.parse(localStorage.getItem('chatSessions') || '[]');
    // Lọc 7 ngày gần nhất
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessions.filter(s => s.createdAt >= sevenDaysAgo);
}

// Lưu lại danh sách session vào localStorage
function saveChatSessions(sessions) {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
}

// Tạo session mới
function createNewSession(firstMessage) {
    const id = 'session_' + Date.now();
    const title = firstMessage.length > 30 ? firstMessage.slice(0, 30) + '...' : firstMessage;
    return {
        id,
        title,
        createdAt: Date.now(),
        messages: [
            {
                sender: 'user',
                content: firstMessage,
                timestamp: Date.now()
            }
        ]
    };
}

// Thêm message vào session hiện tại
function addMessageToSession(sessionId, sender, content) {
    let sessions = getChatSessions();
    let session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    session.messages.push({
        sender,
        content,
        timestamp: Date.now()
    });
    saveChatSessions(sessions);
}

// Lưu message (tạo session mới nếu cần)
function saveMessage(sender, content) {
    let sessions = getChatSessions();
    let sessionId = localStorage.getItem('currentSessionId');
    let session = sessions.find(s => s.id === sessionId);

    if (!session) {
        // Tạo session mới nếu chưa có
        session = createNewSession(content);
        sessions.unshift(session); // Đưa lên đầu
        sessionId = session.id;
        localStorage.setItem('currentSessionId', sessionId);
    } else {
        // Thêm message vào session hiện tại
        session.messages.push({
            sender,
            content,
            timestamp: Date.now()
        });
    }
    saveChatSessions(sessions);
}

function setInputEnabled(enabled) {
    const input = document.getElementById('user-input');
    const sendBtn = document.querySelector('.send-btn');
    if (input) input.disabled = !enabled;
    if (sendBtn) sendBtn.disabled = !enabled;
}

// Gửi tin nhắn khi người dùng gửi tin nhắn
function sendMessage() {
  const inputField = document.getElementById("user-input");
  const message = inputField.value.trim();

  if (!message) return;

  addMessage(message, 'user');  // Thêm tin nhắn của người dùng vào khung chat
  saveMessage('user', message);
  inputField.value = '';  // Xóa ô nhập sau khi gửi
 
  setInputEnabled(false);
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
      saveMessage('bot', botResponse);
      setInputEnabled(true);
    })
    .catch((error) => {
      console.error("Lỗi khi gọi API:", error);
      const errorMsg = "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.";
      addMessage(errorMsg, 'bot');
      saveMessage('bot', errorMsg);
      setInputEnabled(true);
    });
}

function handleBotReply(reply) {
    // ...hiển thị reply lên giao diện...
    saveMessage('bot', reply);
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

function loadSessionToChatBox(sessionId) {
    const sessions = getChatSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    // Xóa toàn bộ nội dung chatbox (bao gồm cả chào hỏi và FAQ)
    const chatBox = document.querySelector('.chat-box');
    if (chatBox) chatBox.innerHTML = '';

    // Render lại toàn bộ tin nhắn của session này
    session.messages.forEach(item => {
        addMessage(item.content, item.sender);
    });

    // Đặt lại session hiện tại
    localStorage.setItem('currentSessionId', sessionId);
    chatBox.insertAdjacentHTML('beforeend', `
        <div class="chat-input">
            <input type="text" placeholder="Nhập gì đó..." id="user-input" />
            <button class="send-btn" onclick="sendMessage()">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                </svg>
            </button>
        </div>
    `);
    // Đóng panel lịch sử
    closeChatHistory();
}

function openChatHistory() {
    const panel = document.getElementById('chat-history-panel');
    const content = document.getElementById('chat-history-content');
    const sessions = getChatSessions();

    if (sessions.length === 0) {
        content.innerHTML = '<em>Chưa có lịch sử trò chuyện.</em>';
    } else {
        content.innerHTML = sessions.map(s => `
          <div class="chat-session-title" style="cursor:pointer; margin-bottom:10px; padding:8px; border-radius:6px; background:#f5f5f5;"
          onclick="loadSessionToChatBox('${s.id}')">
          <b>${s.title}</b><br>
          <span style="font-size:12px;color:#888;">${new Date(s.createdAt).toLocaleString()}</span>
          </div>
      `).join('');
    }
    panel.style.display = 'block';
}

// Hiển thị tin nhắn của một session
function showSessionMessages(sessionId) {
    // Ẩn tất cả các session-messages khác
    document.querySelectorAll('[id^="session-messages-"]').forEach(div => div.style.display = 'none');
    const sessions = getChatSessions();
    const session = sessions.find(s => s.id === sessionId);
    const div = document.getElementById('session-messages-' + sessionId);
    if (!session || !div) return;
    div.innerHTML = session.messages.map(item => `
        <div style="margin-bottom:10px;">
            <span style="font-size:12px;color:#888;">${new Date(item.timestamp).toLocaleString()} - <b>${item.sender === 'user' ? 'Bạn' : 'Bot'}</b></span>
            <div style="padding:6px 10px; background:${item.sender === 'user' ? '#e6f7ff' : '#f6ffe6'}; border-radius:6px; margin-top:2px;">
                ${item.content}
            </div>
        </div>
    `).join('');
    div.style.display = 'block';
}

// Đóng panel
function closeChatHistory() {
    document.getElementById('chat-history-panel').style.display = 'none';
}

function rederInputAndFAQ() {
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return;
    // Thêm phần FAQ và input vào cuối chatbox, KHÔNG xóa nội dung cũ
    chatBox.insertAdjacentHTML('beforeend', `
        <div class="faq">
            <div class="divider"></div>
            <p class="faq-title">Các câu hỏi thường gặp</p>
            <div class="faq-buttons">
                <button onclick="fillMessage(this)">Đăng ký môn thế nào?</button>
                <button onclick="fillMessage(this)">Tôi nên học môn gì tiếp theo?</button>
                <button onclick="fillMessage(this)">Chính sách học bổng năm nay</button>
            </div>
        </div>
        <div class="chat-input">
            <input type="text" placeholder="Nhập gì đó..." id="user-input" />
            <button class="send-btn" onclick="sendMessage()">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                </svg>
            </button>
        </div>
    `);
}

function startNewChatSession() {
    localStorage.removeItem('currentSessionId');
    const chatBox = document.querySelector('.chat-box');
    if (chatBox) chatBox.innerHTML = '';
    rederInputAndFAQ();
}

document.addEventListener('DOMContentLoaded', function() {
    // Luôn bắt đầu bằng một session mới khi vào trang
    localStorage.removeItem('currentSessionId');
    // Nếu muốn xóa luôn nội dung chatbox khi vào trang:
    const chatBox = document.querySelector('.chat-box');
    if (chatBox) chatBox.innerHTML = '';
    rederInputAndFAQ();
});