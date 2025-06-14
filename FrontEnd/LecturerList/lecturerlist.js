
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.logout-button');
    const lecturerCountElement = document.querySelector('.fs-3.fw-bold');
    const lecturerTableBody = document.querySelector('tbody');

    function populateDropdown(id, items) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = `<option value="">-- Tất cả khoa --</option>` + items.map(item =>
            `<option value="${item}">${item}</option>`).join('');
    }

    function loadLecturers(query = '') {
        fetch(`/api/admin/lecturers-data?${query}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("Token hết hạn hoặc API lỗi");
                return res.json();
            })
            .then(data => {
                const { data: lecturers, filters } = data;

                // Render giảng viên
                lecturerCountElement.textContent = lecturers.length;
                lecturerTableBody.innerHTML = lecturers.map(l => `
    <tr class="custom-row align-middle">
        <td class="border-start">
            <div class="d-flex align-items-center">
                <img alt="Ảnh của ${escapeHTML(l.fullname)}" class="rounded-circle me-2" height="50"
                    src="https://placehold.co/50x50" width="50" />
                ${escapeHTML(l.fullname)}
            </div>
        </td>
        <td class="text-center">${escapeHTML(l.lecturer_id)}</td>
        <td class="text-center">${escapeHTML(l.email) ||"-" }</td>
        <td class="text-center">${escapeHTML(l.faculty) ||"-"}</td>
        <td class="text-center">
            <a class="text" href="https://chatbotuit.id.vn/api/lecturer/profile?lecturer_id=${escapeHTML(l.lecturer_id)}"><i class="fas fa-external-link-alt"></i></a>
        </td>
    </tr>
`).join('');

                // Render dropdown filter
                if (filters) {
                    populateDropdown('filter-faculty', filters.faculties);
                    populateDropdown('filter-lecturer-id', filters.ids);
                    populateDropdown('filter-lecturer-name', filters.names)
                }
            })
            .catch(err => {
                console.error('Lỗi tải danh sách giảng viên:', err);
                lecturerTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
            });
    }

    // Ban đầu load tất cả
    loadLecturers();

    // Nút tìm kiếm
    document.getElementById('search-button').addEventListener('click', () => {
        const lecturerId = document.getElementById('filter-lecturer-id')?.value.trim();
        const lecturerName = document.getElementById('filter-lecturer-name')?.value.trim();
        const faculty = document.getElementById('filter-faculty')?.value;

        const params = new URLSearchParams();
        if (lecturerId) params.append('lecturer_id', lecturerId);
        if (lecturerName) params.append('fullname', lecturerName);
        if (faculty) params.append('faculty', faculty);

        loadLecturers(params.toString());
    });

    document.getElementById('clear-lecturer-id').addEventListener('click', () => {
        document.getElementById('filter-lecturer-id').value = '';
        document.getElementById('filter-faculty').value = '';

        const lecturerName = document.getElementById('filter-lecturer-name')?.value.trim();
        const params = new URLSearchParams();
        if (lecturerName) params.append('fullname', lecturerName);

        loadLecturers(params.toString());
    });

    document.getElementById('clear-lecturer-name').addEventListener('click', () => {
        document.getElementById('filter-lecturer-name').value = '';
        document.getElementById('filter-faculty').value = '';

        const lecturerId = document.getElementById('filter-lecturer-id')?.value.trim();
        const params = new URLSearchParams();
        if (lecturerId) params.append('lecturer_id', lecturerId);

        loadLecturers(params.toString());
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
