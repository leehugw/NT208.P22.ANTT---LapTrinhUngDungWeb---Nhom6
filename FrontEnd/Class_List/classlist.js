document.addEventListener("DOMContentLoaded", function () {
    const semesterSelect = document.getElementById("semesterSelect");
    const classSelect = document.getElementById("classSelect");
    const statusSelect = document.getElementById("statusSelect");
    const studentTableBody = document.getElementById("studentTableBody");
    const studentTableThread = document.getElementById("studentTableThread");
    const classInfo = document.getElementById("classInfo");
    const classList = document.getElementById("classList");
    const classSize = document.getElementById("size");
    const logoutButton = document.querySelector('.logout-button');
    const token = localStorage.getItem("token");
    const classStatisticsWrapper = document.getElementById("classStatisticsBtnWrapper");
    const classStatisticsBtn = document.getElementById("classStatisticsBtn");

    // Biến để lưu dữ liệu sinh viên gốc và trạng thái sắp xếp
    let originalStudentData = [];
    let currentSortField = '';
    let currentSortOrder = 'asc';

    // Enable class dropdown by default
    classSelect.disabled = false;

    // Gọi API lấy thông tin giảng viên
    fetch("/api/lecturer/profile-data", {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById("lecturerName").textContent = data.data.fullname;
            document.getElementById("lecturerEmail").textContent = data.data.email;
        });

    // Khi chọn lớp -> gọi API lấy sinh viên và render bảng
    classSelect.addEventListener("change", async () => {
        const classId = classSelect.value;
        if (classId) {
            const semesterId = semesterSelect.value;
            await fetchStudentsForClass(classId, semesterId);
        }
    });

    // API đăng xuất
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }

    // Gọi API lấy học kỳ và lớp khi trang tải
    fetchSemestersAndClasses();

    function fetchSemestersAndClasses() {
        fetch("/api/lecturer/semesters", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                data.forEach(sem => {
                    semesterSelect.innerHTML += `<option value="${sem.semester_id}">${sem.semester_name}</option>`;
                });
            });

        fetchClasses();
    }

    async function fetchClasses(semesterId = '') {
        classSelect.innerHTML = `<option value="">Chọn lớp</option>`;

        let url = '/api/lecturer/classes';
        if (semesterId) {
            url += `?semester_id=${semesterId}`;
        }

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                data.forEach(cls => {
                    const option = document.createElement("option");
                    option.value = cls.class_id;
                    option.textContent = cls.class_id;
                    classSelect.appendChild(option);
                });
            } else {
                console.error("Error fetching classes:", response.status);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    }

    semesterSelect.addEventListener("change", () => {
        fetchClasses(semesterSelect.value);
        // Nếu đã chọn lớp, gọi lại API để cập nhật thông tin sinh viên theo học kỳ mới
        if (classSelect.value) {
            fetchStudentsForClass(classSelect.value, semesterSelect.value);
        }
    });

    statusSelect.addEventListener("change", () => {
        if (originalStudentData && originalStudentData.students) {
            renderStudentTable(originalStudentData);
        }
    });

    // Hàm tạo header cho bảng sinh viên lớp chủ nhiệm
    function createAdvisorClassHeader() {
        return `
            <tr>
                <th scope="col" class="thread border-0">Sinh viên</th>
                <th scope="col" class="thread border-0 text-center">MSSV</th>
                <th scope="col" class="thread border-0 text-center">Trạng thái</th>
                <th scope="col" class="thread border-0 text-center">Ghi chú</th>
                <th scope="col" class="thread border-0 text-center sortable" data-field="gpa">
                    GPA 
                    <i class="fas fa-sort sort-icon"></i>
                </th>
                <th scope="col" class="thread border-0 text-center sortable" data-field="credits">
                    Tổng tín chỉ 
                    <i class="fas fa-sort sort-icon"></i>
                </th>
                <th scope="col" class="thread border-0 text-center sortable" data-field="credits_this_semester">
                    TC đăng ký kỳ này 
                    <i class="fas fa-sort sort-icon"></i>
                </th>
                <th scope="col" class="thread border-0 text-center sortable" data-field="gpa_diff">
                    Chênh lệch điểm 
                    <i class="fas fa-sort sort-icon"></i>
                </th>
                <th scope="col" class="thread border-0 text-center">Thông tin</th>
                <th scope="col" class="thread border-0 text-center">Tiến độ</th>
            </tr>
        `;
    }

    // Hàm tạo header cho bảng lớp học phần
    function createSubjectClassHeader() {
        return `
            <tr>
                <th scope="col" class="thread border-0">Sinh viên</th>
                <th scope="col" class="thread border-0 text-center">MSSV</th>
                <th scope="col" class="thread border-0 text-center">Điểm QT</th>
                <th scope="col" class="thread border-0 text-center">Điểm GK</th>
                <th scope="col" class="thread border-0 text-center">Điểm TH</th>
                <th scope="col" class="thread border-0 text-center">Điểm CK</th>
                <th scope="col" class="thread border-0 text-center">Điểm HP</th>
                <th scope="col" class="thread border-0 text-center">Hành động</th>
            </tr>
        `;
    }

    // Hàm sắp xếp dữ liệu
    function sortStudentData(students, field, order) {
        return [...students].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            // Xử lý giá trị null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return order === 'asc' ? 1 : -1;
            if (bVal == null) return order === 'asc' ? -1 : 1;

            // Chuyển đổi sang số nếu cần
            if (typeof aVal === 'string' && !isNaN(aVal)) aVal = parseFloat(aVal);
            if (typeof bVal === 'string' && !isNaN(bVal)) bVal = parseFloat(bVal);

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Hàm render bảng sinh viên
    function renderStudentTable(studentData) {
        const selectedStatus = statusSelect.value;
        let filteredStudents = studentData.students;

        // Lọc theo trạng thái nếu được chọn
        if (selectedStatus && studentData.isAdvisorClass) {
            filteredStudents = studentData.students.filter(student => {
                const abnormal = studentData.abnormalMap[student.student_id];
                const statusText = abnormal ? abnormal.status : "Đang học";
                return statusText === selectedStatus;
            });
        }

        // Cập nhật số lượng sinh viên
        classSize.innerText = `${filteredStudents.length}`;
        studentTableBody.innerHTML = "";

        if (studentData.isAdvisorClass) {
            // Render cho lớp chủ nhiệm
            filteredStudents.forEach(student => {
                const abnormal = studentData.abnormalMap[student.student_id];
                const statusText = abnormal ? abnormal.status : "Đang học";
                const noteText = (abnormal?.note || "").replace(/\n/g, "<br>");

                studentTableBody.innerHTML += `
                    <tr class="custom-row align-middle">
                        <td class="border-start">
                            <div class="d-flex align-items-center">
                                <img class="rounded-circle me-2" src="https://placehold.co/50x50" width="50" height="50">
                                ${escapeHTML(student.name)}
                            </div>
                        </td>
                        <td class="text-center">${escapeHTML(student.student_id)}</td>
                        <td class="text-center">${escapeHTML(statusText)}</td>
                        <td class="text-center">${noteText}</td>
                        <td class="text-center">${student.gpa != null ? student.gpa.toFixed(2) : '-'}</td>
                        <td class="text-center">${student.credits || 0}</td>
                        <td class="text-center">${student.credits_this_semester || 0}</td>
                        <td class="text-center ${getGpaChangeClass(student.gpa_diff)}">
                            ${student.gpa_diff != null ? (student.gpa_diff > 0 ? '+' : '') + student.gpa_diff : '-'}
                        </td>
                        <td class="text-center">
                            <a class="text" href="https://chatbotuit.id.vn/api/student/profile?student_id=${encodeURIComponent(student.student_id)}">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        </td>
                        <td class="text-center border-end">
                            <a class="text" href="https://chatbotuit.id.vn/api/student/academicstatistic?student_id=${encodeURIComponent(student.student_id)}">
                                <i class="fas fa-chart-line"></i>
                            </a>
                        </td>
                    </tr>
                `;
            });
        } else {
            // Render cho lớp học phần
            filteredStudents.forEach(student => {
                studentTableBody.innerHTML += `
                    <tr class="custom-row align-middle">
                        <td class="border-start">
                            <div class="d-flex align-items-center">
                                <img class="rounded-circle me-2" src="https://placehold.co/50x50" width="50" height="50">
                                ${escapeHTML(student.name)}
                            </div>
                        </td>
                        <td class="text-center">${escapeHTML(student.student_id)}</td>
                        <td class="text-center">
                            <span class="score-text">${escapeHTML(student.score_QT || "-")}</span>
                            <input class="score-input form-control form-control-sm m-auto" value="${escapeHTML(student.score_QT || "")}" style="display:none;" />
                        </td>
                        <td class="text-center">
                            <span class="score-text">${escapeHTML(student.score_GK || "-")}</span>
                            <input class="score-input form-control form-control-sm m-auto" value="${escapeHTML(student.score_GK || "")}" style="display:none;" />
                        </td>
                        <td class="text-center">
                            <span class="score-text">${escapeHTML(student.score_TH || "-")}</span>
                            <input class="score-input form-control form-control-sm m-auto" value="${escapeHTML(student.score_TH || "")}" style="display:none;" />
                        </td>
                        <td class="text-center">
                            <span class="score-text">${escapeHTML(student.score_CK || "-")}</span>
                            <input class="score-input form-control form-control-sm m-auto" value="${escapeHTML(student.score_CK || "")}" style="display:none;" />
                        </td>
                        <td class="text-center">
                            <span class="score-text">${escapeHTML(student.score_HP || "-")}</span>
                            <input class="score-input form-control form-control-sm m-auto" value="${escapeHTML(student.score_HP || "")}" style="display:none;" />
                        </td>
                        <td class="text-center border-end">
                            <i class="bi bi-pencil-square" style="color:#3D67BA" onclick="editScore(this)"></i>
                        </td>
                    </tr>
                `;
            });
        }
    }

    // Hàm lấy class CSS cho chênh lệch điểm
    function getGpaChangeClass(gpaDiff) {
        if (gpaDiff == null) return '';
        if (gpaDiff > 0) return 'text-success';
        if (gpaDiff < 0) return 'text-danger';
        return '';
    }

    // Hàm cập nhật icon sắp xếp
    function updateSortIcons(field, order) {
        // Reset tất cả icon
        document.querySelectorAll('.sort-icon').forEach(icon => {
            icon.className = 'fas fa-sort sort-icon';
        });

        // Cập nhật icon cho field hiện tại
        const activeIcon = document.querySelector(`[data-field="${field}"] .sort-icon`);
        if (activeIcon) {
            activeIcon.className = order === 'asc' ? 'fas fa-sort-up sort-icon' : 'fas fa-sort-down sort-icon';
        }
    }

    // Event listener cho sắp xếp
    function addSortEventListeners() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-field');

                // Đổi thứ tự sắp xếp
                if (currentSortField === field) {
                    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortField = field;
                    currentSortOrder = 'asc';
                }

                // Sắp xếp và render lại
                const sortedStudents = sortStudentData(originalStudentData.students, field, currentSortOrder);
                const sortedData = { ...originalStudentData, students: sortedStudents };
                renderStudentTable(sortedData);
                updateSortIcons(field, currentSortOrder);
            });
        });
    }

    // Hàm lấy thông tin sinh viên cho lớp cụ thể
    async function fetchStudentsForClass(classId, semesterId = null) {
        const semesterText = semesterSelect.options[semesterSelect.selectedIndex]?.text || "Không chọn học kỳ";
        const classText = classSelect.options[classSelect.selectedIndex]?.text || "Không chọn lớp";

        classInfo.innerText = `Lớp đang chọn: ${classText} - ${semesterText}`;
        classList.innerText = `Danh sách sinh viên lớp ${classText}`;

        // Reset sort state
        currentSortField = '';
        currentSortOrder = 'asc';

        try {
            // Thêm semesterId vào URL nếu có
            let url = `/api/lecturer/classes/${classId}/students`;
            if (semesterId) {
                url += `?semester_id=${semesterId}`;
            }

            const studentRes = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const studentData = await studentRes.json();

            if (studentData.isAdvisorClass) {
                statusSelect.disabled = false;

                // Lấy dữ liệu sinh viên bất thường
                const abnormalRes = await fetch(`/api/lecturer/abnormal?classId=${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const abnormalData = await abnormalRes.json();

                // Map sinh viên bất thường theo student_id
                const abnormalMap = {};
                abnormalData.data.forEach(s => {
                    abnormalMap[s.student_id] = s;
                });

                studentData.abnormalMap = abnormalMap;

                classStatisticsWrapper.style.display = "inline-block";
                classStatisticsBtn.href = `/api/lecturer/classstatistic?class_id=${classId}`;

                // Tạo header cho lớp chủ nhiệm với thông tin học kỳ
                const headerTitle = semesterId ? `TC đăng ký ${semesterText}` : 'TC đăng ký kỳ này';
                studentTableThread.innerHTML = `
                    <tr>
                        <th scope="col" class="thread border-0">Sinh viên</th>
                        <th scope="col" class="thread border-0 text-center">MSSV</th>
                        <th scope="col" class="thread border-0 text-center">Trạng thái</th>
                        <th scope="col" class="thread border-0 text-center">Ghi chú</th>
                        <th scope="col" class="thread border-0 text-center sortable" data-field="gpa">
                            GPA 
                            <i class="fas fa-sort sort-icon"></i>
                        </th>
                        <th scope="col" class="thread border-0 text-center sortable" data-field="credits">
                            Tổng tín chỉ 
                            <i class="fas fa-sort sort-icon"></i>
                        </th>
                        <th scope="col" class="thread border-0 text-center sortable" data-field="credits_this_semester">
                            ${headerTitle}
                            <i class="fas fa-sort sort-icon"></i>
                        </th>
                        <th scope="col" class="thread border-0 text-center sortable" data-field="gpa_diff">
                            Chênh lệch điểm 
                            <i class="fas fa-sort sort-icon"></i>
                        </th>
                        <th scope="col" class="thread border-0 text-center">Thông tin</th>
                        <th scope="col" class="thread border-0 text-center">Tiến độ</th>
                    </tr>
                `;

                // Thêm event listener cho sắp xếp
                addSortEventListeners();
            } else {
                statusSelect.disabled = true;
                classStatisticsWrapper.style.display = "none";

                // Tạo header cho lớp học phần
                studentTableThread.innerHTML = createSubjectClassHeader();
            }

            // Lưu dữ liệu gốc và render bảng
            originalStudentData = studentData;
            renderStudentTable(studentData);

        } catch (error) {
            console.error("Error fetching students:", error);
        }
    }
});

// Gọi API để cập nhật điểm khi người dùng sửa
function editScore(iconElement) {
    const row = iconElement.closest("tr");
    iconElement.style.display = "none";

    const scoreTexts = row.querySelectorAll(".score-text");
    const scoreInputs = row.querySelectorAll(".score-input");

    scoreTexts.forEach((span, i) => {
        span.style.display = "none";
        scoreInputs[i].style.display = "inline";
    });

    let saveAllBtn = document.createElement("button");
    saveAllBtn.className = "btn button text-white btn-sm";
    saveAllBtn.innerText = "Lưu";
    saveAllBtn.style.marginTop = "5px";

    const lastCell = row.lastElementChild;
    lastCell.appendChild(saveAllBtn);

    saveAllBtn.onclick = () => {
        const studentId = row.children[1].innerText;
        const scoreFields = ["score_QT", "score_GK", "score_TH", "score_CK", "score_HP"];
        const values = Array.from(scoreInputs).map(input => input.value);

        const classId = document.getElementById("classSelect").value;
        const semesterId = document.getElementById("semesterSelect").value;
        const token = localStorage.getItem("token");

        if (!semesterId) {
            alert("Vui lòng chọn học kỳ trước khi lưu điểm.");

            scoreTexts.forEach((span, i) => {
                span.style.display = "inline";
                scoreInputs[i].style.display = "none";
            });

            iconElement.style.display = "inline";
            saveAllBtn.remove();
            return;
        }

        fetch(`/api/lecturer/classes/${classId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const subjectId = data.students[0].subject_id;

                const payload = {
                    student_id: studentId,
                    subject_id: subjectId,
                    semester_id: semesterId
                };

                scoreFields.forEach((field, i) => {
                    const val = values[i];
                    payload[field] = field === "score_HP" ? val : parseFloat(val);
                });

                return fetch(`/api/lecturer/update/scores`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            })
            .then(res => res.json())
            .then(updated => {
                scoreTexts.forEach((span, i) => {
                    span.innerText = values[i] || "-";
                    span.style.display = "inline";
                    scoreInputs[i].style.display = "none";
                });

                saveAllBtn.remove();
                iconElement.style.display = "inline";
            });
    };
}

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