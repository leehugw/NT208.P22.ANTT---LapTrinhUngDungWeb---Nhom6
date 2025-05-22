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

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get("class_id");
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Bạn cần đăng nhập lại.");
        window.location.href = "/";
        return;
    }

    fetch(`/api/lecturer/classes/${classId}/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(result => {
            if (!result.success) throw new Error("Dữ liệu không hợp lệ");
            const stat = result.statistics;

            // Chuẩn bị dữ liệu cho biểu đồ
            window.data = {
                semester: {
                    gpa: stat.semester.map(s => s.gpa),
                    credits: stat.semester.map(s => s.credits),
                    inputLang: stat.semester[0].inputLanguage,
                    outputLang: stat.semester[0].outputLanguage
                },
                year: {
                    gpa: stat.year.map(y => y.gpa),
                    credits: stat.year.map(y => y.credits),
                    inputLang: stat.year[0].inputLanguage,
                    outputLang: stat.year[0].outputLanguage
                },
                all: {
                    gpa: [stat.overall.gpa],
                    credits: [stat.overall.credits],
                    inputLang: stat.overall.inputLanguage,
                    outputLang: stat.overall.outputLanguage
                }
            };

            // Tạo mảng xu hướng GPA từ tất cả các học kỳ
            window.data.gpaTrend = window.data.semester.gpa.filter(g => typeof g === 'number' && !isNaN(g));

            // Gán dữ liệu thô vào phần tử HTML (tổng SV, GPA, tín chỉ)
            document.querySelectorAll('.card p.text-3xl')[0].innerText = result.classInfo.totalStudents;
            document.querySelectorAll('.card p.text-3xl')[1].innerText = stat.overall.credits;
            document.querySelectorAll('.card p.text-3xl')[2].innerText = stat.overall.gpa;
            document.querySelectorAll('.card p.text-3xl')[3].innerText = "Tạm ẩn";

            renderInitialCharts();
        })
        .catch(err => {
            console.error("Lỗi:", err);
            alert("Không thể tải dữ liệu lớp học.");
        });

    document.getElementById('logout-button').addEventListener('click', function () {
        localStorage.removeItem("token");
        window.location.href = "/";
    });
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

let gpaChart, creditsChart, inputLangChart, outputLangChart, gpaTrendChart;

function renderInitialCharts() {
    const labelsSemester = ['Học kỳ 1', 'Học kỳ 2', 'Học kỳ 3', 'Học kỳ 4', 'Học kỳ 5', 'Học kỳ 6', 'Học kỳ 7', 'Học kỳ 8'];
    const labelsYear = ['Năm 1', 'Năm 2', 'Năm 3', 'Năm 4'];
    const labelsAll = ['Toàn bộ'];

    const gpaCtx = document.getElementById('gpaChart').getContext('2d');
    const creditsCtx = document.getElementById('creditsChart').getContext('2d');
    const inputCtx = document.getElementById('inputLangChart').getContext('2d');
    const outputCtx = document.getElementById('outputLangChart').getContext('2d');
    const trendCtx = document.getElementById('gpaTrendChart').getContext('2d');

    gpaChart = new Chart(gpaCtx, {
        type: 'bar',
        data: {
            labels: labelsSemester,
            datasets: [{
                label: 'GPA',
                data: window.data.semester.gpa,
                backgroundColor: '#60A5FA',
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 10 } },
            plugins: { legend: { display: false } }
        }
    });

    creditsChart = new Chart(creditsCtx, {
        type: 'bar',
        data: {
            labels: labelsSemester,
            datasets: [{
                label: 'Tín chỉ',
                data: window.data.semester.credits,
                backgroundColor: '#FBBF24',
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });

    inputLangChart = new Chart(inputCtx, {
        type: 'bar',
        data: {
            labels: ['<500', '500-600', '601-700', '701-800', '>800'],
            datasets: [{
                label: 'Số lượng sinh viên',
                data: window.data.semester.inputLang.toeic || [0, 0, 0, 0, 0],
                backgroundColor: ['#F87171', '#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
                barThickness: 15,
                maxBarThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 5, callback: value => value }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });

    outputLangChart = new Chart(outputCtx, {
        type: 'bar',
        data: {
            labels: ['<500', '500-600', '601-700', '701-800', '>800'],
            datasets: [{
                label: 'Số lượng sinh viên',
                data: window.data.semester.outputLang.toeic || [0, 0, 0, 0, 0],
                backgroundColor: ['#34D399', '#10B981', '#059669', '#047857', '#065F46'],
                barThickness: 15,
                maxBarThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 5, callback: value => value }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });

    // Biểu đồ xu hướng GPA chỉ dựa trên tất cả học kỳ
    const trendLabels = window.data.semester.gpa.length
        ? labelsSemester.slice(0, window.data.semester.gpa.length)
        : labelsSemester;
    gpaTrendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'Xu hướng GPA trung bình',
                data: window.data.gpaTrend,
                borderColor: '#2563EB',
                fill: false,
                tension: 0.1,
                pointRadius: 5,
                pointBackgroundColor: '#2563EB'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 10 } },
            plugins: { legend: { display: true, position: 'top' } }
        }
    });
}

function updateCharts() {
    const filter = document.getElementById('timeFilter').value;
    const labels = {
        semester: ['Học kỳ 1', 'Học kỳ 2', 'Học kỳ 3', 'Học kỳ 4', 'Học kỳ 5', 'Học kỳ 6', 'Học kỳ 7', 'Học kỳ 8'],
        year: ['Năm 1', 'Năm 2', 'Năm 3', 'Năm 4'],
        all: ['Toàn bộ']
    };

    gpaChart.data.labels = labels[filter];
    gpaChart.data.datasets[0].data = window.data[filter].gpa;
    gpaChart.update();

    creditsChart.data.labels = labels[filter];
    creditsChart.data.datasets[0].data = window.data[filter].credits;
    creditsChart.update();

    // Không cần cập nhật gpaTrendChart vì nó chỉ dựa trên semester
    updateLangCharts();
}

function updateLangCharts() {
    const timeFilter = document.getElementById("timeFilter").value;
    const inputFilter = document.getElementById("inputLangFilter").value;
    const outputFilter = document.getElementById("outputLangFilter").value;

    const labelsMap = {
        toeic: ['<500', '500-600', '601-700', '701-800', '>800'],
        toefl: ['<42', '42-71', '72-94', '95-110', '>110'],
        ielts: ['<4.5', '4.5-5.5', '5.6-6.5', '6.6-7.5', '>7.5'],
        vnu: ['<120', '120-150', '151-180', '181-210', '>210'],
        cambridge: ['<A2', 'A2-B1', 'B1-B2', 'B2-C1', 'C1-C2']
    };

    // Lấy dữ liệu và kiểm tra giá trị hợp lệ
    const inputData = window.data[timeFilter].inputLang[inputFilter] || [0, 0, 0, 0, 0];
    const outputData = window.data[timeFilter].outputLang[outputFilter] || [0, 0, 0, 0, 0];
    const inputValues = Object.values(inputData).map(val => Number(val) || 0);
    const outputValues = Object.values(outputData).map(val => Number(val) || 0);

    // Tính giá trị tối đa và giới hạn trục Y động
    const maxInput = Math.max(...inputValues, 10); // Đảm bảo tối thiểu là 10
    const maxOutput = Math.max(...outputValues, 10);
    const inputMax = Math.ceil(maxInput / 5) * 5 + 5; // Làm tròn lên số chia hết cho 5 và cộng thêm 5
    const outputMax = Math.ceil(maxOutput / 5) * 5 + 5;

    // Cập nhật biểu đồ đầu vào
    inputLangChart.data.labels = labelsMap[inputFilter];
    inputLangChart.data.datasets[0].data = inputValues;
    inputLangChart.options.scales.y.max = inputMax;
    inputLangChart.options.scales.y.ticks.stepSize = Math.ceil(inputMax / 5); // Điều chỉnh khoảng cách nhãn
    inputLangChart.update();

    // Cập nhật biểu đồ đầu ra
    outputLangChart.data.labels = labelsMap[outputFilter];
    outputLangChart.data.datasets[0].data = outputValues;
    outputLangChart.options.scales.y.max = outputMax;
    outputLangChart.options.scales.y.ticks.stepSize = Math.ceil(outputMax / 5);
    outputLangChart.update();
}