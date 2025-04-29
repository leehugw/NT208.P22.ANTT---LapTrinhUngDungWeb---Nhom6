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

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.logout-button');
    const studentCountElement = document.querySelector('.fs-3.fw-bold');
    const studentTableBody = document.querySelector('tbody');
    const clearMssvButton = document.getElementById('clear-mssv');
    const mssvInput = document.getElementById('filter-mssv');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }

    function populateDropdown(id, items) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = `<option value="">Tất cả</option>` + items.map(item =>
            `<option value="${item}">${item}</option>`).join('');
    }

    function loadStudents(query = '') {
        fetch(`/api/admin/students-data?${query}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(res => {
            if (!res.ok) throw new Error("Token hết hạn hoặc API lỗi");
            return res.json();
        })
        .then(data => {
            const { data: students, filters } = data;

            // Render sinh viên
            studentCountElement.textContent = students.length;
            studentTableBody.innerHTML = students.map(s => `
                <tr class="custom-row align-middle">
                    <td class="border-start">
                        <div class="d-flex align-items-center">
                            <img alt="Avatar ${s.name}" class="rounded-circle me-2" height="50"
                                src="https://placehold.co/50x50" width="50" />
                            ${s.name}
                        </div>
                    </td>
                    <td class="text-center">${s.student_id}</td>
                    <td class="text-center">${s.contact?.school_email || '-'}</td>
                    <td class="text-center">Đang học</td>
                    <td class="text-center">${s.class_name || '-'}</td>
                    <td class="text-center">${s.major_id}</td>
                    <td class="text-center">${s.faculty_name}</td>
                    <td class="text-center">
                        <a class="text view-profile" href="#" data-student-id="${s.student_id}">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    </td>
                    <td class="text-center border-end">
                        <a class="text"><i class="fas fa-chart-line"></i></a>
                    </td>
                </tr>
            `).join('');

            document.querySelectorAll('.view-profile').forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault(); // Chặn reload
                    const studentId = this.getAttribute('data-student-id');
                    if (studentId) {
                        localStorage.setItem('selectedStudentId', studentId);
                        window.location.href = `/api/admin/student/${studentId}/profile`; // <-- Trang hồ sơ sinh viên
                    }
                });
            });

            // Render dropdown filter
            if (filters) {
                populateDropdown('filter-class', filters.classes);
                populateDropdown('filter-major', filters.majors);
                populateDropdown('filter-faculty', filters.faculties);
            }
        })
        .catch(err => {
            console.error('❌ Lỗi tải danh sách sinh viên:', err);
            studentTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
        });
    }

    // Ban đầu load tất cả
    loadStudents();

    // Nút tìm kiếm
    document.getElementById('search-button').addEventListener('click', () => {
        const mssv = document.getElementById('filter-mssv')?.value.trim();
        const className = document.getElementById('filter-class')?.value;
        const majorId = document.getElementById('filter-major')?.value;
        const facultyName = document.getElementById('filter-faculty')?.value;

        const params = new URLSearchParams();
        if (mssv) params.append('student_id', mssv);
        if (className) params.append('class_name', className);
        if (majorId) params.append('major_id', majorId);
        if (facultyName) params.append('faculty_name', facultyName);

        loadStudents(params.toString());
    });

    clearMssvButton.addEventListener('click', () => {
        mssvInput.value = ''; // Xóa input
        loadStudents(); // Load lại tất cả sinh viên
    });
});
