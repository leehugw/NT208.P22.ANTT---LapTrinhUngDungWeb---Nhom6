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

document.getElementById('dropdownMenuLink').addEventListener('click', function () {
    let menu = document.querySelector('.dropdown-menu');
    menu.classList.toggle('show');
});

document.addEventListener("DOMContentLoaded", function () {
    const semesterSelect = document.getElementById("semesterSelect");
    const classSelect = document.getElementById("classSelect");
    const studentTableBody = document.getElementById("studentTableBody");
    const classInfo = document.getElementById("classInfo");
    const classList = document.getElementById("classList");
    const classSize = document.getElementById("size");
    const logoutButton = document.querySelector('.logout-button');
    const token = localStorage.getItem("token"); // hoặc từ cookie

    // Goi API lấy thông tin giảng viên
    fetch("/api/lecturer/profile/api", {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            console.log("Thông tin giảng viên:", data);
            document.getElementById("lecturerName").textContent = data.data.name;
            document.getElementById("lecturerEmail").textContent = data.data.school_email;
    });
        
    //api đăng xuất
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

    // Gọi API lấy học kỳ
    fetch("/api/lecturer/semesters", {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            console.log("Học kỳ:", data);
            data.forEach(sem => {
                semesterSelect.innerHTML += `<option value="${sem.semester_id}">${sem.semester_name}</option>`;
            });
        });

    // Khi chọn học kỳ -> gọi API lấy lớp
    semesterSelect.addEventListener("change", () => {
        classSelect.innerHTML = `<option value="">Chọn lớp</option>`;
        fetch(`/api/lecturer/classes?semester_id=${semesterSelect.value}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                data.forEach(cls => {
                    classSelect.innerHTML += `<option value="${cls.class_id}">${cls.class_id}</option>`;
                });
            });
    });

    // Khi chọn lớp -> gọi API lấy sinh viên và render bảng
    classSelect.addEventListener("change", () => {
        const semesterText = semesterSelect.options[semesterSelect.selectedIndex].text;
        const classText = classSelect.options[classSelect.selectedIndex].text;

        classInfo.innerText = `Lớp đang chọn: ${classText} - ${semesterText}`;
        classList.innerText = `Danh sách sinh viên lớp ${classText}`;

        fetch(`/api/lecturer/classes/${classSelect.value}/students`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(students => {

                const studentCount = students.length;
                classSize.innerText = `${studentCount}`;

                studentTableBody.innerHTML = "";
                students.forEach(student => {
                    studentTableBody.innerHTML += `
        <tr>
            <td class="border-start">
                <div class="d-flex align-items-center">
                    <img class="rounded-circle me-2" src="https://placehold.co/50x50" width="50" height="50">
                    ${student.name}
                </div>
            </td>
            <td class="text-center">${student.student_id}</td>
            <td class="text-center">${student.email}</td>
            <td class="text-center">${student.status}</td>
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
            <td class="text-center">
                <i class="bi bi-pencil-square" style="color:#3D67BA" onclick="editScore(this)"></i>
            </td>
        </tr>  
    `;
                });
            });
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

        fetch(`/api/lecturer/classes/${classId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const subjectId = data[0].subject_id;

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

