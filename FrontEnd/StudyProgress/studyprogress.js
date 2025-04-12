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

document.addEventListener('DOMContentLoaded', function () {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');

    if (!token) {
        alert("Vui lòng đăng nhập để xem thông tin");
        window.location.href = "http://localhost:3000/";
        return;
    }

    // Gọi API lấy dữ liệu
    StudentAcademicData(token);
});


let scoresemesterData = []; // Khai báo biến toàn cục để chứa dữ liệu điểm theo học kỳ

function StudentAcademicData(token) {
    const searchInput = document.getElementById('search-input');  // Lấy input tìm kiếm
    const semesterScores = document.getElementById("semester-scores"); // Lấy phần tử chứa bảng điểm


    // Lấy student_id từ URL
    const path = window.location.pathname;
    const studentId = path.split('/')[3];  // Lấy student_id từ params

    if (studentId) {
        // Gọi API để lấy thông tin sinh viên, tiến độ tốt nghiệp và GPA
        Promise.all([
            fetch(`/api/student/student-academic-data`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            fetch(`/api/student/group-by-semester-data`, {
                headers: { Authorization: `Bearer ${token}` }
            })
        ])        
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(([academicData, semesterData]) => {
                scoresemesterData = semesterData; // Lưu trữ dữ liệu semesterData

                console.log(academicData); // Kiểm tra dữ liệu trả về từ API
                // Cập nhật checkbox "Đã nộp chứng chỉ anh văn"

                const nameElement = document.getElementById('student-name');
                nameElement.textContent = academicData.student_name;

                const emailElement = document.getElementById('student-email');
                emailElement.textContent = academicData.user_gmail;

                const englishProficiencyCheckbox = document.getElementById('englishProficiency');
                englishProficiencyCheckbox.checked = academicData.has_english_certificate;

                // Tính toán phần trăm tiến độ tốt nghiệp
                const progress = academicData.data.graduation_progress;

                // Cập nhật thanh tiến độ hình tròn
                const progressBar = document.getElementById('progress-bar');
                const progressText = document.getElementById('progress-text');
                progressBar.style.strokeDasharray = `${progress}, 100`;
                progressText.textContent = `${progress}%`;

                const data = academicData.data;

                // Hiển thị các dữ liệu GPA lên trang web
                document.querySelector('.total-credits-attempted').textContent = data.total_credits_attempted;
                document.querySelector('.total-credits-earned').textContent = data.total_credits_earned;
                document.querySelector('.gpa').textContent = data.gpa;
                document.querySelector('.cumulative-gpa').textContent = data.cumulative_gpa;

                const ctx = document.getElementById('progressChart').getContext('2d');
                const progressDetails = academicData.data.progress_details;
                const requiredProgress = academicData.required_progress_details;

                const progressChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Đại Cương', 'Cơ Sở Ngành', 'Chuyên ngành', 'Tự Do'],
                        datasets: [
                            {
                                label: 'Tín chỉ đã hoàn thành',
                                data: [
                                    progressDetails.general_education,
                                    progressDetails.major_foundation,
                                    progressDetails.major_core,
                                    progressDetails.elective_credits
                                ],
                                backgroundColor: '#80C1FE',
                            },
                            {
                                label: 'Tín chỉ yêu cầu',
                                data: [
                                    requiredProgress.required_general_education,
                                    requiredProgress.required_major_foundation,
                                    requiredProgress.required_major_core,
                                    requiredProgress.required_elective_credits
                                ],
                                backgroundColor: '#2B57D6',
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Số tín chỉ',
                                    color: '#000000'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Loại tín chỉ',
                                    color: '#000000'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    color: '#000000'
                                }
                            },
                        }
                    }
                });

                const semesterGpaMap = {};
                academicData.data.semester_gpas.forEach(item => {
                    semesterGpaMap[item.semester_id] = item.semester_gpa;
                });

                scoresemesterData.forEach(semester => {
                    const semesterWrapper = document.createElement("div");
                    semesterWrapper.className = "mb-4";
                    const gpa = semesterGpaMap[semester.semester.semester_id] ?? '-';


                    const semesterTitle = document.createElement("h3");
                    semesterTitle.className = "text-dark";
                    semesterTitle.textContent = semester.semester.semester_name;

                    const tableHTML = `
                    <div class="table-responsive mb-4">
                        <table class="table table-hover">
                            <thead class="table-primary text-primary">
                                <tr>
                                    <th scope="col">Mã môn học</th>
                                    <th scope="col">Tên môn học</th>
                                    <th scope="col">Trạng thái</th>
                                    <th scope="col">Điểm QT</th>
                                    <th scope="col">Điểm GK</th>
                                    <th scope="col">Điểm TH</th>
                                    <th scope="col">Điểm CK</th>
                                    <th scope="col">Điểm HP</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${semester.subjects.map(sub => `
                                    <tr>
                                        <td>${sub.subject_code}</td>
                                        <td>${sub.subject_name}</td>
                                        <td><span class="${sub.status === 'Đậu' ? 'status-badge-pass' : 'status-badge-fail'}">${sub.status}</span></td>
                                        <td>${sub.score_QT ?? '-'}</td>
                                        <td>${sub.score_GK ?? '-'}</td>
                                        <td>${sub.score_TH ?? '-'}</td>
                                        <td>${sub.score_CK ?? '-'}</td>
                                        <td class="${sub.status === 'Đậu' ? 'highlight-pass' : 'highlight-fail'}">${sub.score_HP}</td>
                                    </tr>
                                `).join("")}
                                <tr class="table-secondary">
                                    <td colspan="7" class="text-start fw-bold">Trung bình học kỳ</td>
                                    <td class="fw-bold text-primary">${gpa}</td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                    `;

                    semesterWrapper.appendChild(semesterTitle);
                    semesterWrapper.appendChild(document.createRange().createContextualFragment(tableHTML));

                    semesterScores.appendChild(semesterWrapper);
                });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    } else {
        alert('Student ID không hợp lệ');
    }

    // Lắng nghe sự kiện input để tìm kiếm theo mã môn học hoặc tên môn học
    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase();  // Chuyển giá trị tìm kiếm thành chữ thường

        // Xóa tất cả các học kỳ hiện tại trong semesterScores
        semesterScores.innerHTML = '';

        // Lọc dữ liệu dựa trên từ khóa tìm kiếm
        scoresemesterData.forEach(semester => {
            const semesterWrapper = document.createElement("div");
            semesterWrapper.className = "mb-4";

            const semesterTitle = document.createElement("h3");
            semesterTitle.className = "text-dark";
            semesterTitle.textContent = semester.semester.semester_name;

            // Lọc các môn học theo mã môn học hoặc tên môn học
            const filteredSubjects = semester.subjects.filter(sub =>
                sub.subject_code.toLowerCase().includes(searchTerm) ||
                sub.subject_name.toLowerCase().includes(searchTerm)
            );

            // Nếu có môn học thỏa mãn tìm kiếm
            if (filteredSubjects.length > 0) {
                const tableHTML = `
                    <div class="table-responsive mb-4">
                        <table class="table table-hover">
                            <thead class="table-primary text-primary">
                                <tr>
                                    <th scope="col">Mã môn học</th>
                                    <th scope="col">Tên môn học</th>
                                    <th scope="col">Trạng thái</th>
                                    <th scope="col">Điểm QT</th>
                                    <th scope="col">Điểm GK</th>
                                    <th scope="col">Điểm TH</th>
                                    <th scope="col">Điểm CK</th>
                                    <th scope="col">Điểm HP</th>
                                </tr>
                            </thead>
                            ${filteredSubjects.map(sub => {
                                `<tr>
                                    <td>${sub.subject_code}</td>
                                    <td>${sub.subject_name}</td>
                                    <td><span class="${sub.status === 'Đậu' ? 'status-badge-pass' : 'status-badge-fail'}">${sub.status}</span></td>
                                    <td>${sub.score_QT ?? '-'}</td>
                                    <td>${sub.score_GK ?? '-'}</td>
                                    <td>${sub.score_TH ?? '-'}</td>
                                    <td>${typeof sub.score_CK === 'number' ? sub.score_CK : '-'}</td>
                                    <td class="${sub.status === 'Đậu' ? 'highlight-pass' : 'highlight-fail'}">
                                        ${sub.score_HP !== null && sub.score_HP !== undefined ? Number(sub.score_HP) : '-'}
                                    </td>
                                </tr>`;
                                 }).join("")}
                            
                        </table>
                    </div>
                `;

                semesterWrapper.appendChild(semesterTitle);
                semesterWrapper.appendChild(document.createRange().createContextualFragment(tableHTML));

                semesterScores.appendChild(semesterWrapper);
            }
        });
    });
}


// Export button click handler
document.getElementById('export-excel-btn').addEventListener('click', function () {
    if (scoresemesterData.length === 0) {
        alert('Dữ liệu chưa được tải, vui lòng thử lại sau.');
        return;
    }

    const dataToExport = [];

    scoresemesterData.forEach(semester => {
        semester.subjects.forEach(sub => {
            const subjectData = {
                "Mã môn học": sub.subject_code,
                "Tên môn học": sub.subject_name,
                "Trạng thái": sub.status,
                "Điểm QT": sub.score_QT ?? '-',
                "Điểm GK": sub.score_GK ?? '-',
                "Điểm TH": sub.score_TH ?? '-',
                "Điểm CK": sub.score_CK ?? '-',
                "Điểm HP": sub.score_HP ?? '-'
            };
            dataToExport.push(subjectData);
        });
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scores");
    XLSX.writeFile(wb, "subject_scores.xlsx");
});


