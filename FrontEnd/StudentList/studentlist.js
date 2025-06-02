document.addEventListener('DOMContentLoaded', () => {
    const studentCountElement = document.querySelector('.fs-3.fw-bold');
    const studentTableBody = document.querySelector('tbody');
    const clearMssvButton = document.getElementById('clear-mssv');
    const mssvInput = document.getElementById('filter-mssv');
    const resetFiltersButton = document.getElementById('reset-filters');
    let initialFilters = null;

    function populateDropdown(id, items, label) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = `<option value="">${label}</option>` + items.map(item =>
            `<option value="${item}">${item}</option>`).join('');
    }

    async function loadStudents(query = '') {
        try {
            const token = localStorage.getItem('token');

            // 1. Lấy danh sách sinh viên
            const res1 = await fetch(`/api/admin/students-data?${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res1.ok) throw new Error("Token hết hạn hoặc API lỗi");
            const { data: students, filters } = await res1.json();
            console.log("Filters trả về từ server:", filters);


            // 2. Lưu filter ban đầu nếu chưa có
            if (!initialFilters && filters) {
                initialFilters = filters;
            }

            // 3. Lấy danh sách class_id duy nhất
            const classIds = [...new Set(students.map(s => s.class_id).filter(Boolean))];

            // 4. Gọi API abnormal cho từng class_id song song
            const abnormalResults = await Promise.all(classIds.map(async classId => {
                const res = await fetch(`/api/admin/abnormal?classId=${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) return [];
                const json = await res.json();
                return json.data || [];
            }));

            // 5. Gộp kết quả cảnh báo thành map student_id => {status, note}
            const abnormalMap = new Map();
            abnormalResults.flat().forEach(s => {
                abnormalMap.set(s.student_id, { status: s.status, note: s.note });
            });


            // 6. Ghép cảnh báo vào sinh viên
            let mergedStudents = students.map(s => ({
                ...s,
                status: abnormalMap.get(s.student_id)?.status || 'Đang học',
                note: (abnormalMap.get(s.student_id)?.note || "").replace(/\n/g, "<br>")
            }));

            // 7. Render
            studentCountElement.textContent = mergedStudents.length;
            studentTableBody.innerHTML = mergedStudents.map(s => `
                <tr class="custom-row align-middle">
                <td class="border-start">
                    <div class="d-flex align-items-center">
                        <img class="rounded-circle me-2" src="https://placehold.co/50x50" width="50" height="50">
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
                <td class="text-center"><a class="text" href="https://uit-chatbot-orno.onrender.com/api/student/profile?student_id=${encodeURIComponent(s.student_id)}"><i class="fas fa-external-link-alt"></i></a></td>
                <td class="text-center border-end"><a class="text" href="https://uit-chatbot-orno.onrender.com/api/student/academicstatistic?student_id=${encodeURIComponent(s.student_id)}"><i class="fas fa-chart-line"></i></a></td>
                </tr>
            `).join('');

            // 8. Cập nhật dropdown với initialFilters
            if (initialFilters) {
                populateDropdown('filter-class', initialFilters.classes, 'Lớp học');
                populateDropdown('filter-major', initialFilters.majors, 'Ngành học');
                populateDropdown('filter-faculty', initialFilters.faculties, 'Khoa');
                populateDropdown('filter-status', initialFilters.statuses, 'Trạng thái');
            }

        } catch (err) {
            console.error('Lỗi tải danh sách sinh viên:', err);
            studentTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
            // Vẫn hiển thị filter đầy đủ nếu có lỗi
            if (initialFilters) {
                populateDropdown('filter-class', initialFilters.classes, 'Lớp học');
                populateDropdown('filter-major', initialFilters.majors, 'Ngành học');
                populateDropdown('filter-faculty', initialFilters.faculties, 'Khoa');
                populateDropdown('filter-status', initialFilters.statuses, 'Trạng thái');
            }
        }
    }

    // Ban đầu load tất cả
    loadStudents();

    // Nút tìm kiếm
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

        loadStudents(params.toString());
    });

    clearMssvButton.addEventListener('click', () => {
        mssvInput.value = ''; // Xóa input
        loadStudents(); // Load lại tất cả sinh viên
    });

    resetFiltersButton.addEventListener('click', () => {
        // Xóa các input và select
        mssvInput.value = '';
        document.getElementById('filter-class').value = '';
        document.getElementById('filter-major').value = '';
        document.getElementById('filter-faculty').value = '';
        document.getElementById('filter-status').value = '';

        // Load lại danh sách gốc
        loadStudents();
    });
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