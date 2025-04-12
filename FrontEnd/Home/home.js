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



window.addEventListener('scroll', function () {
    let sections = document.querySelectorAll('section'); // Chọn tất cả các phần có id (các phần bạn muốn theo dõi)
    let navbarLinks = document.querySelectorAll('.navbar-container .nav-link'); // Các liên kết trong navbar
    let currentSection = "";

    // Lặp qua các phần để tìm ra phần đang được hiển thị
    sections.forEach(section => {
        let sectionTop = section.offsetTop;
        let sectionHeight = section.clientHeight;

        if (window.scrollY >= sectionTop - sectionHeight / 3) {
            currentSection = section.getAttribute('id');
        }
    });

    // Cập nhật navbar để thay đổi màu
    navbarLinks.forEach(link => {
        link.classList.remove('active'); // Xóa lớp active khỏi tất cả các liên kết
        if (link.getAttribute('href').substring(1) === currentSection) {
            link.classList.add('active'); // Thêm lớp active cho liên kết tương ứng với phần đang hiển thị
        }
    });
});

