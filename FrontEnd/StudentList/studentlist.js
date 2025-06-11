document.addEventListener('DOMContentLoaded', () => {
    const studentCountElement = document.querySelector('.fs-3.fw-bold');
    const studentTableBody = document.querySelector('tbody');
    const clearMssvButton = document.getElementById('clear-mssv');
    const mssvInput = document.getElementById('filter-mssv');
    const resetFiltersButton = document.getElementById('reset-filters');
    let initialFilters = null;
    let currentPage = 1;
    const limit = 20; // Items per page
    let currentQuery = '';
    let isLoading = false;
    let allAbnormalStudents = new Map();

    // Infinite scroll setup
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            loadMoreStudents();
        }
    }, { threshold: 1.0 });

    // Observe the last row for infinite scroll
    const observeLastRow = () => {
        const rows = studentTableBody.querySelectorAll('tr');
        if (rows.length > 0) {
            observer.observe(rows[rows.length - 1]);
        }
    };

    // Pre-load abnormal students data
    async function preloadAbnormalData() {
        try {
            const token = localStorage.getItem('token');
            const abnormalRes = await fetch('/api/admin/abnormal/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (abnormalRes.ok) {
                const data = await abnormalRes.json();
                data.forEach(s => {
                    allAbnormalStudents.set(s.student_id, { status: s.status, note: s.note });
                });
            }
        } catch (err) {
            console.error('Error preloading abnormal data:', err);
        }
    }

    function populateDropdown(id, items, label) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = `<option value="">${label}</option>` + items.map(item =>
            `<option value="${item}">${item}</option>`).join('');
    }

    async function loadStudents(query = '', page = 1, isInitialLoad = false) {
        if (isLoading) return;
        isLoading = true;
        showLoading();
        
        try {
            const token = localStorage.getItem('token');
            const url = `/api/admin/students-data?page=${page}&limit=${limit}&${query}`;
            
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error("Token hết hạn hoặc API lỗi");
            
            const { data: students, total, filters } = await res.json();
            
            // Use preloaded abnormal data
            const mergedStudents = students;

            if (isInitialLoad) {
                studentTableBody.innerHTML = '';
                studentCountElement.textContent = total;
                
                if (filters) {
                    initialFilters = filters;
                    populateDropdown('filter-class', initialFilters.classes, 'Lớp học');
                    populateDropdown('filter-major', initialFilters.majors, 'Ngành học');
                    populateDropdown('filter-faculty', initialFilters.faculties, 'Khoa');
                    populateDropdown('filter-status', initialFilters.statuses, 'Trạng thái');
                }
            }

            // Append new students
            studentTableBody.innerHTML += mergedStudents.map(s => `
                <tr class="custom-row align-middle">
                    <td class="border-start">
                        <div class="d-flex align-items-center">
                            <img class="rounded-circle me-2" src="https://placehold.co/50x50" width="50" height="50" loading="lazy">
                            ${escapeHTML(s.name)}
                        </div>
                    </td>
                    <td class="text-center">${escapeHTML(s.student_id)}</td>
                    <td class="text-center">${escapeHTML(s.contact?.school_email || '-')}</td>
                    <td class="text-center">${escapeHTML(s.status)}</td>
                    <td class="text-center">${s.note}</td>
                    <td class="text-center">${escapeHTML(s.class_id || '-')}</td>
                    <td class="text-center">${escapeHTML(s.major_id || '-')}</td>
                    <td class="text-center">${escapeHTML(s.faculty_name || '-')}</td>
                    <td class="text-center">
                        <a class="text" href="/Student_Information/student_info.html?student_id=${encodeURIComponent(s.student_id)}">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    </td> 
                    <td class="text-center border-end"><a class="text" href="/api/student/academicstatistic?student_id=${encodeURIComponent(s.student_id)}"><i class="fas fa-chart-line"></i></a></td>
                </tr>
            `).join('');

            observeLastRow();
            currentPage = page;

        } catch (err) {
            console.error('Lỗi tải danh sách sinh viên:', err);
            if (isInitialLoad) {
                studentTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
            }
        } finally {
            isLoading = false;
            hideLoading();
        }
    }

    async function loadMoreStudents() {
        if (currentQuery !== '') {
            await loadStudents(currentQuery, currentPage + 1);
        } else {
            await loadStudents('', currentPage + 1);
        }
    }

    // Initial load
    async function init() {
        await preloadAbnormalData();
        await loadStudents('', 1, true);
    }

    // Search button handler
    document.getElementById('search-button').addEventListener('click', () => {
        const mssv = document.getElementById('filter-mssv')?.value.trim();
        const classId = document.getElementById('filter-class')?.value;
        const majorId = document.getElementById('filter-major')?.value;
        const facultyName = document.getElementById('filter-faculty')?.value;
        const status = document.getElementById('filter-status')?.value;

        const params = new URLSearchParams();
        if (mssv) params.append('student_id', mssv);
        if (classId) params.append('class_id', classId);
        if (majorId) params.append('major_id', majorId);
        if (facultyName) params.append('faculty_name', facultyName);
        if (status) params.append('status', status);

        currentQuery = params.toString();
        loadStudents(currentQuery, 1, true);
    });

    clearMssvButton.addEventListener('click', () => {
        mssvInput.value = '';
        currentQuery = '';
        loadStudents('', 1, true);
    });

    resetFiltersButton.addEventListener('click', () => {
        mssvInput.value = '';
        document.getElementById('filter-class').value = '';
        document.getElementById('filter-major').value = '';
        document.getElementById('filter-faculty').value = '';
        document.getElementById('filter-status').value = '';
        currentQuery = '';
        loadStudents('', 1, true);
    });

    // Initialize
    init();
});

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m];
    });
}

function showLoading() {
    document.getElementById('loading-indicator').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading-indicator').style.display = 'none';
}