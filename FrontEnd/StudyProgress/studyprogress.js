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
    // Lấy student_id từ URL
    const path = window.location.pathname;
    const studentId = path.split('/')[3];  // Lấy student_id từ params
    
    if (studentId) {
        // Gọi API để lấy thông tin sinh viên, tiến độ tốt nghiệp và GPA
        Promise.all([
            fetch(`/api/student/${studentId}/graduation-progress-data`),  // Lấy thông tin tiến độ tốt nghiệp
            fetch(`/api/student/${studentId}/academicstatistic-data`)  // Lấy thông tin GPA
        ])
        .then(responses => Promise.all(responses.map(res => res.json())))
        .then(([progressData, academicData]) => {
            // Cập nhật checkbox "Đã nộp chứng chỉ anh văn"
            const englishProficiencyCheckbox = document.getElementById('englishProficiency');
            englishProficiencyCheckbox.checked = progressData.has_english_certificate;

            // Tính toán phần trăm tiến độ tốt nghiệp
            const progress = progressData.graduation_progress;

            // Cập nhật thanh tiến độ hình tròn
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');

            // Tính toán stroke-dashoffset và stroke-dasharray cho vòng tròn
            progressBar.style.strokeDasharray = `${progress}, 100`;

            // Cập nhật phần trăm tiến độ
            progressText.textContent = `${progress}%`;

            // Hiển thị các dữ liệu GPA lên trang web
            document.querySelector('.total-credits-attempted').textContent = academicData.total_credits_attempted;
            document.querySelector('.total-credits-earned').textContent = academicData.total_credits_earned;
            document.querySelector('.gpa').textContent = academicData.gpa;
            document.querySelector('.cumulative-gpa').textContent = academicData.cumulative_gpa;

            const ctx = document.getElementById('progressChart').getContext('2d');
            const progressDetails = progressData.progress_details;
            const requiredProgress = progressData.required_progress_details;

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
                            backgroundColor: '#4fd1c5',
                        },
                        {
                            label: 'Tín chỉ yêu cầu',
                            data: [
                                requiredProgress.required_general_education,
                                requiredProgress.required_major_foundation, 
                                requiredProgress.required_major_core, 
                                requiredProgress.required_elective_credits
                            ],
                            backgroundColor: '#fc8181',
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
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    } else {
        alert('Student ID không hợp lệ');
    }
});
