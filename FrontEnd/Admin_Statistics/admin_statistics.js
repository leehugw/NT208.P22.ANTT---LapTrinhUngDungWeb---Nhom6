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

document.addEventListener('DOMContentLoaded', function() {
  // Lấy số lượt truy cập từ backend
  fetchHomeVisitCount();
  
  // Lấy danh sách môn học phổ biến
  fetchPopularSubjects();
});

// Hàm lấy số lượt truy cập từ backend
async function fetchHomeVisitCount() {
  try {
    const response = await fetch('/api/admin/home-visit-count');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    // Hiển thị số lượt truy cập
    if (data.success) {
      document.getElementById('homeVisitCount').textContent = data.homeVisitCount;
    }
  } catch (error) {
    console.error('Error fetching home visit count:', error);
    // Có thể hiển thị thông báo lỗi cho người dùng nếu cần
  }
}

async function fetchPopularSubjects() {
    try {
        const response = await fetch('/api/admin/top-popular-subjects', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const subjects = await response.json();
        console.log("Subjects from API:", subjects);  // <--- thêm dòng này để debug
        renderPieChart(subjects);
    } catch (error) {
        console.error('Error fetching popular subjects:', error);
        document.getElementById('popularSubjectsContainer').innerHTML = 
            '<p class="text-danger">Không thể tải dữ liệu môn học phổ biến</p>';
    }
}


function renderPieChart(subjects) {
    const topSubjects = subjects.slice(0, 6);

    const labels = topSubjects.map(subject => subject.subjectName);
    const data = topSubjects.map(subject => subject.totalRegistrations);
    const backgroundColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)'
    ];

    const ctx = document.getElementById('popularSubjectsChart').getContext('2d');

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                    left: 20,
                    right: 20
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        boxWidth: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const percent = topSubjects.find(s => s.subjectName === label)?.percent || 0;
                            return `${label}: ${value} (${parseFloat(percent).toFixed(2)}%)`;
                        }
                    }
                }
            }
        }
    });
}