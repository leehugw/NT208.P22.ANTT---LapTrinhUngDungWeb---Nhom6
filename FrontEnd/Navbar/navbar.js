document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }
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
})