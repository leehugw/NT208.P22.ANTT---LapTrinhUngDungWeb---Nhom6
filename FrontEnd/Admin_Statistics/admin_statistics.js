document.addEventListener('DOMContentLoaded', function() {
  // Lưu token từ URL vào localStorage nếu có
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");
  if (urlToken) {
      localStorage.setItem("token", urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Gộp tất cả code khởi tạo vào đây
  fetchHomeVisitCount();
  fetchPopularSubjects();
  fetchSemesterGPAStats();
  fetchBugStatistics();
  fetchTotalUsers();
  fetchConversationsStatistics();
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

async function fetchBugStatistics() {
  try {
    const response = await fetch('/api/admin/bug-statistic', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    
    // Hiển thị thống kê lỗi
    document.getElementById('bugCount').textContent = data.bugCount;
    
  } catch (error) {
    console.error('Error fetching bug statistics:', error);
    document.getElementById('bugCount').textContent = 'Lỗi khi tải dữ liệu';
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
        renderPieChart(subjects);
    } catch (error) {
        console.error('Error fetching popular subjects:', error);
        document.getElementById('popularSubjectsContainer').innerHTML = 
            '<p class="text-danger">Không thể tải dữ liệu môn học phổ biến</p>';
    }
}

async function fetchTotalUsers() {
    try {
        const response = await fetch('/api/admin/total-users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        document.getElementById('totalUsersCount').textContent = data.totalUsers;
    } catch (error) {
        console.error('Error fetching total users:', error);
        document.getElementById('totalUsersContainer').innerHTML =
            '<p class="text-danger">Không thể tải dữ liệu người dùng</p>';
    }
}

function renderPieChart(subjects) {
    const topSubjects = subjects.slice(0, 13);

    // Rút gọn tên môn học nếu quá dài
    const maxLength = 25;
    const labels = topSubjects.map(subject =>
        subject.subjectName.length > maxLength
            ? subject.subjectName.substring(0, maxLength) + '...'
            : subject.subjectName
    );

    const data = topSubjects.map(subject => subject.totalRegistrations);
    const backgroundColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(201, 203, 207, 0.7)',
        'rgba(124, 11, 36, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(210, 169, 67, 0.7)',
        'rgba(0, 34, 255, 0.7)',
        'rgba(63, 3, 182, 0.7)',
        'rgba(0, 229, 255, 0.7)',
    ];

    const ctx = document.getElementById('popularSubjectsChart').getContext('2d');

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels, // Dùng labels đã rút gọn cho cả chart và legend
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
                    left: 50,
                    right: 50
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    align: 'start',
                    labels: {
                        padding: 10,
                        boxWidth: 15,
                        font: {
                            size: 12,
                            family: "'Roboto', sans-serif"
                        }
                        // KHÔNG cần generateLabels tùy chỉnh ở đây!
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // Lấy đúng tên rút gọn từ labels
                            const label = context.label || '';
                            const value = context.raw || 0;
                            // Tính phần trăm
                            const total = data.reduce((a, b) => a + b, 0);
                            const percent = total > 0 ? (value / total) * 100 : 0;
                            return `${label}: ${value} (${percent.toFixed(2)}%)`;
                        }
                    }
                }
            }
        }
    });
}

async function fetchSemesterGPAStats() {
  try {
    const res = await fetch('/api/admin/semester-gpa-statistics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const json = await res.json();
    if (json.success) {
      renderGPAChart(json.data);
    }
  } catch (err) {
    console.error("Lỗi khi tải GPA:", err);
  }
}

async function fetchConversationsStatistics() {
    try {
        const response = await fetch('/api/admin/sessions/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            console.error('Response not OK:', response.status, await response.text());
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Session stats data:', data); // Add this to verify data
        
        document.getElementById('sessionCount').textContent = data.data.count; // Note the .data here
        
    } catch (error) {
        console.error('Error fetching session statistics:', error);
        // Set default values or error message
        document.getElementById('sessionCount').textContent = '0';
    }
}

function renderGPAChart(data) {
  // Format lại semester_id: "HK120222023" -> "HK1 2022-2023"
  const formatSemester = (id) => {
    const hk = id.slice(0, 3);              // HK1, HK2
    const yearStart = id.slice(3, 7);       // 2022
    const yearEnd = id.slice(7, 11);        // 2023
    return `${hk} ${yearStart}-${yearEnd}`;
  };

  // Sắp xếp đúng thứ tự thời gian: ưu tiên theo năm bắt đầu, sau đó HK1 trước HK2
  data.sort((a, b) => {
    const aYear = parseInt(a.semester_id.slice(3, 7));
    const bYear = parseInt(b.semester_id.slice(3, 7));
    if (aYear !== bYear) return aYear - bYear;

    const aTerm = a.semester_id.slice(2, 3); // "1" hoặc "2"
    const bTerm = b.semester_id.slice(2, 3);
    return parseInt(aTerm) - parseInt(bTerm);
  });

  const ctx = document.getElementById('gpaTrendChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => formatSemester(d.semester_id)),
      datasets: [{
        label: 'GPA Trung bình (thang 10)',
        data: data.map(d => d.averageGPA),
        backgroundColor: 'rgba(75, 192, 192, 0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.raw}`
          }
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          title: {
            display: true,
            text: 'GPA (thang 10)'
          }
        }
      }
    }
  });
}