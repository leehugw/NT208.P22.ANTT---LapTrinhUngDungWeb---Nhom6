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

    // Lấy thống kê GPA theo học kỳ
  fetchSemesterGPAStats();
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
        renderPieChart(subjects);
    } catch (error) {
        console.error('Error fetching popular subjects:', error);
        document.getElementById('popularSubjectsContainer').innerHTML = 
            '<p class="text-danger">Không thể tải dữ liệu môn học phổ biến</p>';
    }
}


function renderPieChart(subjects) {
    const topSubjects = subjects.slice(0, 13);

    // Rút gọn tên môn học nếu quá dài
    const labels = topSubjects.map(subject => {
        const maxLength = 25;
        return subject.subjectName.length > maxLength 
            ? subject.subjectName.substring(0, maxLength) + '...' 
            : subject.subjectName;
    });

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
                    left: 50, // Tăng padding trái để chứa legend
                    right: 50
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    align: 'start', // Căn lề trái cho legend
                    labels: {
                        padding: 10,
                        boxWidth: 15,
                        font: {
                            size: 10, // Giảm kích thước font
                            family: "'Roboto', sans-serif"
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map(function(label, i) {
                                    return {
                                        text: label,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
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

document.addEventListener('DOMContentLoaded', () => {
  // Lưu token từ URL vào localStorage nếu có
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");
  if (urlToken) {
      localStorage.setItem("token", urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Đăng xuất
  document.querySelectorAll('.logout-button').forEach(btn => {
      btn.addEventListener('click', () => {
          localStorage.removeItem('token');
          window.location.href = '/';
      });
  });

  // Theo dõi sinh viên
  document.querySelectorAll('.btn-admin-student').forEach(btn => {
      btn.addEventListener('click', function (e) {
          e.preventDefault();
          const token = localStorage.getItem("token");
          if (!token) {
              alert("Bạn chưa đăng nhập!");
              window.location.href = '/';
          } else {
              window.location.href = `/api/admin/students`;
          }
      });
  });

  // Theo dõi giảng viên
  document.querySelectorAll('.btn-admin-lecturer').forEach(btn => {
      btn.addEventListener('click', function (e) {
          e.preventDefault();
          const token = localStorage.getItem("token");
          if (!token) {
              alert("Bạn chưa đăng nhập!");
              window.location.href = '/';
          } else {
              window.location.href = `/api/admin/lecturers`;
          }
      });
  });

  // Tạo tài khoản giảng viên
  document.querySelectorAll('.btn-create-lecturer-account').forEach(btn => {
      btn.addEventListener('click', function (e) {
          e.preventDefault();
          const token = localStorage.getItem("token");
          if (!token) {
              alert("Bạn chưa đăng nhập!");
              window.location.href = '/';
          } else {
              window.location.href = `/api/admin/create-lecturer-account?token=${token}`;
          }
      });
  });

  // Thống kê
  document.querySelectorAll('.btn-admin-statistics').forEach(btn => {
      btn.addEventListener('click', function (e) {
          e.preventDefault();
          const token = localStorage.getItem("token");
          if (!token) {
              alert("Bạn chưa đăng nhập!");
              window.location.href = '/';
          } else {
              window.location.href = `/api/admin/statistics`;
          }
      });
  });

  // Danh sách phản hồi
  document.querySelectorAll('.btn-feedback').forEach(btn => {
      btn.addEventListener('click', function (e) {
          e.preventDefault();
          const token = localStorage.getItem("token");
          if (!token) {
              alert("Bạn chưa đăng nhập!");
              window.location.href = '/';
          } else {
              window.location.href = `/api/admin/feedbacks`;
          }
      });
  });

  document.querySelectorAll('.btn-home').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
          e.preventDefault();
  
          const token = localStorage.getItem('token');
          if (!token) {
              alert("Chưa đăng nhập");
              return window.location.href = "/";
          }
  
          // Gửi token kèm theo khi truy cập route được bảo vệ
          fetch('http://localhost:3000/api/admin/admin_menu', {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          }).then(res => {
              if (res.ok) {
                  // Nếu token hợp lệ, điều hướng
                  window.location.href = '/Admin_Menu/admin_menu.html';
              } else {
                  alert('Phiên đăng nhập không hợp lệ!');
                  window.location.href = '/';
              }
          });
      });
  });
});