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
    attachEvent(token);
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

let currentSessionId = null; // Biến toàn cục để lưu session_id


// UI_ChatBot.js
function setInputEnabled(enabled) {
    const inputField = document.getElementById('user-input');
    const sendButton = document.querySelector('.send-btn');
    if (inputField) {
        inputField.disabled = !enabled;
    }
    if (sendButton) {
        sendButton.disabled = !enabled;
    }
}
// Tạo session mới
// UI_ChatBot.js
async function createNewSessionOnServer(firstMessage = '') {
  const token = checkTokenAndRedirect();
  if (!token) return null;

  try {
    console.log('Gửi yêu cầu tạo session:', { firstMessage, token }); // Debug
    const res = await fetch('http://localhost:3000/api/student/chat-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ firstMessage })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Lỗi khi tạo session: ${res.status} - ${errorData.error || res.statusText}`);
    }

    const data = await res.json();
    console.log('Session được tạo:', data); // Debug
    currentSessionId = data.session_id;
    return data;
  } catch (error) {
    console.error('Lỗi tạo session:', error);
    alert(`Không thể tạo phiên chat mới: ${error.message}`);
    return null;
  }
}

// Gửi tin nhắn khi người dùng gửi tin nhắn
// FrontEnd/UI_ChatBot/UI_ChatBot.js
async function sendMessage() {
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();
    if (!message) return;

    const token = checkTokenAndRedirect();
    if (!token) return;

    console.log('Gửi tin nhắn:', { message, currentSessionId }); // Debug
    addMessage(message, 'user');
    inputField.value = '';
    setInputEnabled(false);

    const faqElement = document.querySelector('.faq');
    if (faqElement) {
        faqElement.remove();
    }

    try {
        if (!currentSessionId) {
            console.log('Tạo session mới vì currentSessionId rỗng'); // Debug
            const sessionData = await createNewSessionOnServer(message);
            if (!sessionData) {
                setInputEnabled(true);
                return;
            }
        }

        console.log('Gửi tin nhắn người dùng:', { sessionId: currentSessionId });
        const userMessageRes = await fetch(`http://localhost:3000/api/student/chat-sessions/${currentSessionId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message, sender: 'user' })
        });

        if (!userMessageRes.ok) {
            const errorData = await userMessageRes.json();
            throw new Error(`Lỗi lưu tin nhắn người dùng: ${userMessageRes.status} - ${errorData.error}`);
        }

        console.log('Gọi API chatbot:', { message });
        const botRes = await fetch(`http://localhost:3000/api/student/chatbot-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });

        if (!botRes.ok) {
            const errorData = await botRes.json();
            throw new Error(`Lỗi từ API chatbot: ${botRes.status} - ${errorData.error}`);
        }

        const botData = await botRes.json();
        console.log('Phản hồi từ chatbot:', botData); // Debug
        const botResponse = botData.answer || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.';
        console.log('Tin nhắn bot sẽ hiển thị:', botResponse); // Debug
        addMessage(botResponse, 'bot');

        console.log('Lưu tin nhắn bot:', { botResponse, sessionId: currentSessionId });
        const botMessageRes = await fetch(`http://localhost:3000/api/student/chat-sessions/${currentSessionId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: botResponse, sender: 'bot' })
        });

        if (!botMessageRes.ok) {
            const errorData = await botMessageRes.json();
            throw new Error(`Lỗi lưu tin nhắn bot: ${botMessageRes.status} - ${errorData.error}`);
        }

        setInputEnabled(true);
    } catch (error) {
        console.error('Lỗi khi gửi tin nhắn:', error);
        addMessage(`Lỗi: ${error.message}`, 'bot'); // Hiển thị lỗi chi tiết hơn
        setInputEnabled(true);
    }
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

async function loadSessionToChatBox(sessionId) {
    const token = checkTokenAndRedirect();
    if (!token) return;

    currentSessionId = sessionId;
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return;

    try {
        const res = await fetch(`http://localhost:3000/api/student/chat-sessions/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Lỗi khi tải session: ${res.status} - ${errorData.error || res.statusText}`);
        }

        const data = await res.json();
        const session = data.data;

        chatBox.innerHTML = '';
        // Chỉ hiển thị FAQ nếu session không có tin nhắn
        renderInputAndFAQ(session.messages.length === 0);

        session.messages.forEach(item => {
            addMessage(item.text, item.sender);
        });

        closeChatHistory();
    } catch (error) {
        console.error('Lỗi khi tải session:', error);
        alert(`Không thể tải phiên chat: ${error.message}`);
    }
}

async function openChatHistory() {
  const token = checkTokenAndRedirect();
  if (!token) return;

  const panel = document.getElementById('chat-history-panel');
  const content = document.getElementById('chat-history-content');

  try {
    const res = await fetch('http://localhost:3000/api/student/chat-sessions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Lỗi khi tải lịch sử: ${res.status} - ${errorData.error || res.statusText}`);
    }

    const data = await res.json();
    const sessions = data.data || [];

    if (sessions.length === 0) {
      content.innerHTML = '<em>Chưa có lịch sử trò chuyện.</em>';
    } else {
      content.innerHTML = sessions.map(s => `
        <div class="chat-session-title" style="cursor:pointer; margin-bottom:10px; padding:8px; border-radius:6px; background:#f5f5f5;"
            onclick="loadSessionToChatBox('${s.session_id}')">
            <b>${s.title || s.messages[0]?.text?.slice(0, 30) || 'Phiên trò chuyện'}</b><br>
            <span style="font-size:12px;color:#888;">${s.created_at_formatted}</span>
        </div>
      `).join('');
    }
    panel.style.display = 'block';
  } catch (error) {
    console.error('Lỗi khi tải lịch sử chat:', error);
    content.innerHTML = `<em>Lỗi khi tải lịch sử: ${error.message}</em>`;
    panel.style.display = 'block';
  }
}

// Đóng panel
function closeChatHistory() {
    document.getElementById('chat-history-panel').style.display = 'none';
}

// Render chỉ ô input
function renderInput() {
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return;
    if (!chatBox.querySelector('.chat-input')) {
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
    }
}

// Render FAQ
function renderFAQ() {
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return;
    if (!chatBox.querySelector('.faq')) {
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
        `);
    }
}

// Kết hợp cả hai (thay thế rederInputAndFAQ)
function renderInputAndFAQ(showFAQ = true) {
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return;

    // Luôn render input
    renderInput();

    // Chỉ render FAQ nếu showFAQ là true
    if (showFAQ) {
        renderFAQ();
    }
}

async function startNewChatSession() {
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return;

    try {
        // Tạo session mới trên server
        const sessionData = await createNewSessionOnServer();
        if (!sessionData) return;

        // Xóa nội dung cũ và thêm input + FAQ
        chatBox.innerHTML = '';
        renderInputAndFAQ(true); // Hiển thị FAQ cho session mới
    } catch (error) {
        console.error('Lỗi khi bắt đầu session mới:', error);
        alert('Không thể bắt đầu phiên chat mới. Vui lòng thử lại.');
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const chatBox = document.querySelector('.chat-box');
    if (chatBox) chatBox.innerHTML = '';
    renderInputAndFAQ(true); // Hiển thị FAQ ban đầu
    await startNewChatSession();
});


function attachEvent(token) {
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

    document.querySelectorAll(".btn-student-progress").forEach(el => {
        el.addEventListener("click", function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                window.location.href = "http://localhost:3000/";
            } else {
                window.location.href = "/api/student/academicstatistic";
            }
        });
    });

    document.querySelectorAll(".btn-student-schedule").forEach(el => {
        el.addEventListener("click", function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                window.location.href = "http://localhost:3000/";
            } else {
                window.location.href = "/api/student/schedule-optimize";
            }
        });
    });

    document.querySelectorAll(".btn-student-english").forEach(el => {
        el.addEventListener("click", function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                window.location.href = "http://localhost:3000/";
            } else {
                window.location.href = "/api/student/english-certificate";
            }
        });
    });

    document.querySelectorAll(".btn-student-info").forEach(el => {
        el.addEventListener("click", function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
                window.location.href = "http://localhost:3000/";  // Điều hướng đến trang đăng nhập
            } else {
                window.location.href = "/api/student/profile";
            }
        });
    });

    // Xử lý sự kiện khi click vào "Chatbot"
    document.querySelectorAll("btn-student-chatbot").forEach(function (btn) {btn.addEventListener("click", function (e) {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Bạn chưa đăng nhập. Vui lòng đăng nhập lại!");
            window.location.href = "http://localhost:3000/";  // Điều hướng đến trang đăng nhập
        } else {
            // Nếu có token, điều hướng đến chatbot
            window.location.href = "/api/student/chatbot?token=" + token;  // Điều hướng đến route chatbot
        }
    });
    });

    document.querySelectorAll('.btn-home').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            const token = localStorage.getItem('token');
            if (!token) {
                alert("Chưa đăng nhập");
                return window.location.href = "/";
            }

            // Gửi token kèm theo khi truy cập route được bảo vệ
            fetch('http://localhost:3000/api/student/stu_menu', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => {
                if (res.ok) {
                    // Nếu token hợp lệ, điều hướng
                    window.location.href = '/Student_Menu/stu_menu.html';
                } else {
                    alert('Phiên đăng nhập không hợp lệ!');
                    window.location.href = '/';
                }
            });
        });
    });
}

