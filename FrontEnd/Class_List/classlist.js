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
    const token = localStorage.getItem("token"); // hoặc từ cookie
    const classStatisticsWrapper = document.getElementById("classStatisticsBtnWrapper");
    const classStatisticsBtn = document.getElementById("classStatisticsBtn");

    // Enable class dropdown by default
    classSelect.disabled = false;

    // Gọi API lấy thông tin giảng viên
    fetch("/api/lecturer/profile-data", {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            console.log("Thông tin giảng viên:", data);
            document.getElementById("lecturerName").textContent = data.data.fullname;
            document.getElementById("lecturerEmail").textContent = data.data.email;
        });

    // API đăng xuất
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Xóa token khỏi localStorage vì lưu token trong localStorage
            localStorage.removeItem('token');

            // Chuyển về trang chủ
            window.location.href = '/';
        });
    }

    // Gọi API lấy học kỳ và lớp khi trang tải
    fetchSemestersAndClasses();

    // Hàm lấy học kỳ và lớp khi trang tải
    function fetchSemestersAndClasses() {
        fetch("/api/lecturer/semesters", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                data.forEach(sem => {
                    semesterSelect.innerHTML += `<option value="${sem.semester_id}">${sem.semester_name}</option>`;
                });
            });

        // Gọi API lấy tất cả lớp ngay khi trang được tải
        fetchClasses();
    }

    // Hàm lấy tất cả lớp (không lọc theo học kỳ)
    async function fetchClasses(semesterId = '') {
        classSelect.innerHTML = `<option value="">Chọn lớp</option>`; // Xóa tất cả lớp cũ

        let url = '/api/lecturer/classes';  // API lấy tất cả lớp
        if (semesterId) {
            url += `?semester_id=${semesterId}`;  // Nếu có học kỳ, thêm tham số vào URL
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

    // Khi chọn học kỳ -> gọi API lấy lớp theo học kỳ
    semesterSelect.addEventListener("change", () => {
        fetchClasses(semesterSelect.value);  // Lọc lớp theo học kỳ đã chọn
    });

    statusSelect.addEventListener("change", () => {
        classSelect.dispatchEvent(new Event("change")); // Gọi lại hàm fetch khi đổi trạng thái
    });
    

    // Khi chọn lớp -> gọi API lấy sinh viên và render bảng
    classSelect.addEventListener("change", async () => {
        const semesterText = semesterSelect.options[semesterSelect.selectedIndex]?.text || "Không chọn học kỳ";
        const classText = classSelect.options[classSelect.selectedIndex]?.text || "Không chọn lớp";
        
        classInfo.innerText = `Lớp đang chọn: ${classText} - ${semesterText}`;
        classList.innerText = `Danh sách sinh viên lớp ${classText}`;

        const classId = classSelect.value;

        try {
            const [studentRes, abnormalRes] = await Promise.all([
                fetch(`/api/lecturer/classes/${classId}/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`/api/lecturer/abnormal/${classId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const studentData = await studentRes.json();
            const abnormalData = await abnormalRes.json();


            const studentCount = studentData.students.length;
            classSize.innerText = `${studentCount}`;

            // Map sinh viên bất thường theo student_id
            const abnormalMap = {};
            abnormalData.data.forEach(s => {
                abnormalMap[s.student_id] = s;
            });

            studentTableBody.innerHTML = "";

            if (studentData.isAdvisorClass) {
                classStatisticsWrapper.style.display = "inline-block";
                classStatisticsBtn.href = `/api/lecturer/classstatistic?class_id=${classSelect.value}`;
                studentTableThread.innerHTML = `
                    <tr>
                        <th scope="col" class="thread border-0">Sinh viên</th>
                        <th scope="col" class="thread border-0 text-center">MSSV</th>
                        <th scope="col" class="thread border-0 text-center">Email</th>
                        <th scope="col" class="thread border-0 text-center">Trạng thái</th>
                        <th scope="col" class="thread border-0 text-center">Ghi chú</th>
                        <th scope="col" class="thread border-0 text-center">Lớp</th>
                        <th scope="col" class="thread border-0 text-center">Ngành</th>
                        <th scope="col" class="thread border-0 text-center">Khoa</th>
                        <th scope="col" class="thread border-0 text-center">Thông tin</th>
                        <th scope="col" class="thread border-0 text-center">Tiến độ</th>
                    </tr>
                `;

                studentData.students.forEach(student => {
                    const abnormal = abnormalMap[student.student_id];
                    const statusText = abnormal ? abnormal.status : "Đang học";
                    const noteText = (abnormal?.note || "").replace(/\n/g, "<br>");
                    
                    const selectedStatus = statusSelect.value; 
                    if(selectedStatus && selectedStatus !== statusText) {
                        return; // Nếu trạng thái không khớp, bỏ qua sinh viên này
                    }

                    studentTableBody.innerHTML += `
                        <tr class="custom-row align-middle">
                            <td class="border-start">
                                <div class="d-flex align-items-center">
                                    <img class="rounded-circle me-2" src="https://placehold.co/50x50" width="50" height="50">
                                    ${student.name}
                                </div>
                            </td>
                            <td class="text-center">${student.student_id}</td>
                            <td class="text-center">${student.school_email}</td>
                            <td class="text-center">${statusText}</td>
                            <td class="text-center">${noteText}</td>
                            <td class="text-center">${student.class_name || '-'}</td>
                            <td class="text-center">${student.major_name || '-'}</td>
                            <td class="text-center">${student.faculty_name || '-'}</td>
                            <td class="text-center"><a class="text" href="http://localhost:3000/api/student/profile?student_id=${student.student_id}"><i class="fas fa-external-link-alt"></i></a></td>
                            <td class="text-center border-end"><a class="text" href="http://localhost:3000/api/student/academicstatistic?student_id=${student.student_id}"><i class="fas fa-chart-line"></i></a></td>
                        </tr>
                    `;
                }
                );
            }
            else {
                studentTableThread.innerHTML = `
                        <tr>
                            <th scope="col" class="thread border-0">Sinh viên</th>
                            <th scope="col" class="thread border-0 text-center">MSSV</th>
                            <th scope="col" class="thread border-0 text-center">Email</th>
                            <th scope="col" class="thread border-0 text-center">Điểm QT</th>
                            <th scope="col" class="thread border-0 text-center">Điểm GK</th>
                            <th scope="col" class="thread border-0 text-center">Điểm TH</th>
                            <th scope="col" class="thread border-0 text-center">Điểm CK</th>
                            <th scope="col" class="thread border-0 text-center">Điểm HP</th>
                            <th scope="col" class="thread border-0 text-center">Hành động</th> <!-- Cột Hành vi -->
                        </tr>
                    `;

                studentData.students.forEach(student => {
                studentTableBody.innerHTML += `
                            <tr class="custom-row align-middle">
                                <td class="border-start">
                                    <div class="d-flex align-items-center">
                                        <img class="rounded-circle me-2" src="https://placehold.co/50x50" width="50" height="50">
                                        ${student.name}
                                    </div>
                                </td>
                                <td class="text-center">${student.student_id}</td>
                                <td class="text-center">${student.school_email}</td>
                                <td class="text-center">
                                    <span class="score-text">${student.score_QT || "-"}</span>
                                    <input class="score-input form-control form-control-sm m-auto" value="${student.score_QT || ""}" style="display:none;" />
                                </td>
                                <td class="text-center">
                                    <span class="score-text">${student.score_GK || "-"}</span>
                                    <input class="score-input form-control form-control-sm m-auto" value="${student.score_GK || ""}" style="display:none;" />
                                </td>
                                <td class="text-center">
                                    <span class="score-text">${student.score_TH || "-"}</span>
                                    <input class="score-input form-control form-control-sm m-auto" value="${student.score_TH || ""}" style="display:none;" />
                                </td>
                                <td class="text-center">
                                    <span class="score-text">${student.score_CK || "-"}</span>
                                    <input class="score-input form-control form-control-sm m-auto" value="${student.score_CK || ""}" style="display:none;" />
                                </td>
                                <td class="text-center">
                                    <span class="score-text">${student.score_HP || "-"}</span>
                                    <input class="score-input form-control form-control-sm m-auto" value="${student.score_HP || ""}" style="display:none;" />
                                </td>
                                <td class="text-center border-end">
                                    <i class="bi bi-pencil-square" style="color:#3D67BA" onclick="editScore(this)"></i>
                                </td>
                            </tr>  
                        `;
                });
            }
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    });
});



// Gọi API để cập nhật điểm khi người dùng sửa
function editScore(iconElement) {
    const row = iconElement.closest("tr");
    iconElement.style.display = "none"; // Ẩn icon bút chì

    const scoreTexts = row.querySelectorAll(".score-text");
    const scoreInputs = row.querySelectorAll(".score-input");

    scoreTexts.forEach((span, i) => {
        span.style.display = "none";
        scoreInputs[i].style.display = "inline";
    });

    // Tạo nút Lưu duy nhất
    let saveAllBtn = document.createElement("button");
    saveAllBtn.className = "btn button text-white btn-sm";
    saveAllBtn.innerText = "Lưu";
    saveAllBtn.style.marginTop = "5px";

    const lastCell = row.lastElementChild;
    lastCell.appendChild(saveAllBtn);

    saveAllBtn.onclick = () => {
        const studentId = row.children[1].innerText; // cột mã SV

        const scoreFields = ["score_QT", "score_GK", "score_TH", "score_CK", "score_HP"];
        const values = Array.from(scoreInputs).map(input => input.value);

        const classId = document.getElementById("classSelect").value;
        const semesterId = document.getElementById("semesterSelect").value;
        const token = localStorage.getItem("token");

        if (!semesterId) {
            alert("Vui lòng chọn học kỳ trước khi lưu điểm.");

            // Khôi phục giao diện ban đầu
            scoreTexts.forEach((span, i) => {
                span.style.display = "inline";
                scoreInputs[i].style.display = "none";
            });

            iconElement.style.display = "inline"; // Hiện lại icon bút chì
            saveAllBtn.remove(); // Xóa nút lưu

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

                // Gán từng điểm vào payload
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
                console.log("Đã cập nhật:", updated);

                // Cập nhật lại giao diện: hiện text, ẩn input và nút
                scoreTexts.forEach((span, i) => {
                    span.innerText = values[i] || "-";
                    span.style.display = "inline";
                    scoreInputs[i].style.display = "none";
                });

                saveAllBtn.remove(); // Xoá nút lưu
                iconElement.style.display = "inline"; // Hiện lại icon bút chì
            });
    };
}


