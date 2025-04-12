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