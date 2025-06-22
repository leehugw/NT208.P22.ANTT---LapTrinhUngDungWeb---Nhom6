function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toastTemplate = document.getElementById('toast-template');

    // Tạo một bản sao của toast template
    const toastClone = toastTemplate.cloneNode(true);
    toastClone.style.display = 'block'; // Hiển thị toast
    toastClone.querySelector('.toast-body').textContent = message; // Gắn thông điệp vào body

    // Thêm class tùy theo loại thông báo (cảnh báo, lỗi, thông báo thông thường)
    toastClone.classList.remove('text-bg-info');
    if (type === 'warning') {
        toastClone.classList.add('text-bg-warning'); // Màu vàng cho cảnh báo
    } else if (type === 'error') {
        toastClone.classList.add('text-bg-danger'); // Màu đỏ cho lỗi
    } else {
        toastClone.classList.add('text-bg-info'); // Màu xanh cho thông báo thông thường
    }

    // Thêm toast vào container
    toastContainer.appendChild(toastClone);

    // Sử dụng Bootstrap's Toast API để hiển thị và tự động đóng
    const toast = new bootstrap.Toast(toastClone);
    toast.show();

    // Tùy chọn: tự động xóa toast sau 5 giây
    setTimeout(() => {
        toastClone.remove();
    }, 5000);
}

// Chọn phần tử để xử lý
const importBtn = document.getElementById("importExcel");
const TableContainer = document.getElementById("TableContainer");
const timetableBody = document.getElementById("timetableBody");
let totalCredits = 0;

// Đọc dữ liệu Excel khi file được chọn
importBtn.addEventListener("change", handleFileSelect);

let classList = [];

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        classList.length = 0;
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' }); // Đọc theo kiểu array

            // Đọc dữ liệu từ tất cả các sheet trong workbook
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const parsedData = parseExcelSheetData(worksheet); // Chuyển worksheet vào parse luôn
                classList.push(...parsedData);
            });

            // Render các môn học sau khi xử lý dữ liệu từ tất cả các sheet
            renderSubjects(classList);
            addFilterListeners();
        };
        reader.readAsArrayBuffer(file); // Đọc bằng array buffer
    }
}

function renderSubjects(classList) {
    const tbody = document.getElementById('TableContainer');
    tbody.innerHTML = '';

    classList.forEach((subject, index) => {
        const tr = document.createElement("tr");

        // --- Cột CHECKBOX ---
        const tdCheckbox = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `chk${index}`;
        checkbox.addEventListener("change", (event) => updateTimetable(event, subject));
        checkbox.checked = false;
        tdCheckbox.appendChild(checkbox);
        tr.appendChild(tdCheckbox);

        // --- Các cột dữ liệu ---
        const fields = [
            `${subject.subject_id} - ${subject.subject_name}`, // Môn học
            subject.class_id,                                   // Mã lớp
            subject.lecturer || '',                             // Giảng viên
            subject.day || '',                                  // Thứ
            subject.slots.join(',') || '',                      // Tiết học
            subject.HTGD || '',                                 // HTGD
            subject.soTC || '',                                 // Tín chỉ
            subject.capacity || '',                             // Sĩ số
            subject.room || '',                                 // Phòng
            subject.cachtuan || '',                             // Cách tuần
            subject.khoahoc || '',                              // Khóa học
            subject.hocki || '',                                // Học kỳ
            subject.khoaQL || '',                               // Khoa QL
            subject.nam || '',                                  // Năm học
            subject.hedt || '',
            subject.startDate || '',                            // Ngày bắt đầu
            subject.endDate || '',                               // Ngày kết thúc
            subject.ghichu || '',                               // Ghi chú
            subject.ngonngu || '',                              // Ngôn ngữ
        ];

        fields.forEach(text => {
            const td = document.createElement("td");
            td.textContent = text;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function addFilterListeners() {
    const filters = {
        subject: document.getElementById("search_subject"),
        classid: document.getElementById("search_classid"),
        lecturer: document.getElementById("search_lecturer"),
        day: document.getElementById("search_day"),
        slot: document.getElementById("search_slot"),
        htgd: document.getElementById("search_htgd")
    };

    Object.values(filters).forEach(input => {
        input.addEventListener("input", () => {
            const filtered = classList.filter(subject => {
                return (!filters.subject.value || `${subject.subject_id} - ${subject.subject_name}`.toLowerCase().includes(filters.subject.value.toLowerCase()))
                    && (!filters.classid.value || subject.class_id.toLowerCase().includes(filters.classid.value.toLowerCase()))
                    && (!filters.lecturer.value || (subject.lecturer || '').toLowerCase().includes(filters.lecturer.value.toLowerCase()))
                    && (!filters.day.value || (subject.day || '').toLowerCase().includes(filters.day.value.toLowerCase()))
                    && (!filters.slot.value || subject.slots.join(',').toLowerCase().includes(filters.slot.value.toLowerCase()))
                    && (!filters.htgd.value || subject.htgd.toLowerCase().includes(filters.htgd.value.toLowerCase()));
            });
            renderSubjects(filtered); // Gọi lại render với danh sách đã lọc
        });
    });
}

let timetableSubjects = []; // Mảng lưu danh sách các môn học đã thêm vào thời khóa biểu

// Hàm kiểm tra nếu lịch học trùng với thời khóa biểu hiện tại
function isScheduleConflict(subject) {
    // Kiểm tra tất cả các tiết học của môn học mới có trùng với những môn đã có trong thời khóa biểu hay không
    for (const existingSubject of timetableSubjects) {
        if (subject.day !== '*' && existingSubject.day == subject.day) {
            const conflict = subject.slots.some(slot => existingSubject.slots.includes(slot));
            if (conflict) {
                return true; // Nếu có sự trùng lặp, trả về true
            }
        }
    }
    return false; // Không có sự trùng lặp
}

function updateTimetable(event, subject) {
    const isChecked = event.target.checked;

    if (isChecked) {
        // Kiểm tra trùng mã môn học và lớp học
        const hasDuplicateId = timetableSubjects.some(existingSubject =>
            existingSubject.subject_id === subject.subject_id &&
            isClassOverlap(existingSubject.class_id, subject.class_id)
        );

        // Kiểm tra trùng lịch học (slot bị trùng)
        if (isScheduleConflict(subject)) {
            showToast("Lịch học của môn này bị trùng với môn khác!", 'error');
            event.target.checked = false;
            return;
        }

        // Kiểm tra vượt quá số tín chỉ
        const MAX_CREDITS = 28;
        if (totalCredits + (subject.soTC || 0) > MAX_CREDITS) {
            showToast("Vượt quá số tín chỉ tối đa cho phép!", 'error');
            event.target.checked = false;
            return;
        }

        // Thêm môn học vào thời khóa biểu
        addSubjectToTimetable(subject, hasDuplicateId);
    } else {
        removeSubjectFromTimetable(subject);
    }
}


const occupied = Array.from({ length: 10 }, () => Array(6).fill(false));
// 10 dòng x 6 cột (Thứ 2 đến Thứ 7)

function updateCreditDisplay() {
    const display = document.getElementById("creditDisplay");
    if (display) {
        display.textContent = `Tổng số tín chỉ: ${totalCredits}`;
    }
}

function captureFullTimetable() {
    const original = document.getElementById('timetableSection');

    // Clone phần tử gốc
    const clone = original.cloneNode(true);

    // Tạo div ẩn để chứa clone
    const cloneContainer = document.createElement('div');
    cloneContainer.style.position = 'fixed';
    cloneContainer.style.top = '0';
    cloneContainer.style.left = '0';
    cloneContainer.style.zIndex = '-9999'; // ẩn
    cloneContainer.style.backgroundColor = 'white';
    cloneContainer.style.overflow = 'visible';

    // Thêm clone vào container
    cloneContainer.appendChild(clone);
    document.body.appendChild(cloneContainer);

    // Đợi DOM render xong
    setTimeout(() => {
        const fullWidth = clone.scrollWidth;
        const fullHeight = clone.scrollHeight;

        // Set kích thước đủ rộng để tránh bị cắt
        cloneContainer.style.width = fullWidth + 'px';
        cloneContainer.style.height = fullHeight + 'px';

        html2canvas(cloneContainer, {
            width: fullWidth,
            height: fullHeight,
            scrollX: 0,
            scrollY: 0,
            windowWidth: fullWidth,
            windowHeight: fullHeight,
            scale: window.devicePixelRatio * 2,
            useCORS: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');

            const link = document.createElement('a');
            link.href = imgData;
            link.download = 'lich-hoc-full.png';
            link.click();

            // Xóa phần clone
            document.body.removeChild(cloneContainer);
        });
    }, 200);
}

document.getElementById('saveTimetableBtn').addEventListener('click', captureFullTimetable);






const dayMapping = {
    "Thứ Hai": 0,
    "Thứ Ba": 1,
    "Thứ Tư": 2,
    "Thứ Năm": 3,
    "Thứ Sáu": 4,
    "Thứ Bảy": 5
};

function isClassOverlap(classId1, classId2) {
    const [subjectId1, classCode1] = classId1.split(".");
    const [subjectId2, classCode2] = classId2.split(".");

    // Kiểm tra mã môn học giống nhau
    if (subjectId1 === subjectId2) {
        // Kiểm tra xem có phải là lớp con không (so sánh phần sau dấu chấm)
        if (classCode1 === classCode2) {
            return false; // IT003.P21 và IT003.P21.1 không coi là trùng
        }
        return true; // IT003.P21 và IT003.P22 coi là trùng
    }
    return false; // Các môn khác nhau không coi là trùng
}

function addSubjectToTimetable(subject, hasDuplicateId){
    const timetableBody = document.getElementById('timetableBody');
    let dayIndex = subject.day;

    if (dayIndex !== '*') {
        dayIndex = dayMapping[subject.day];
        if (dayIndex === undefined) return;
    }

    const colorPairs = [
        { border: '#28a745', bg: '#e6f4ea' },
        { border: '#5dade2', bg: '#f0f8ff' },
        { border: '#f39c12', bg: '#fff7e6' },
        { border: '#d81b60', bg: '#fde6ef' },
        { border: '#8e44ad', bg: '#f3e6fa' },
    ];

    const randomColor = colorPairs[Math.floor(Math.random() * colorPairs.length)];

    const firstSlot = subject.slots[0];
    const warningIcon = hasDuplicateId ? `<i class="fas fa-exclamation-triangle text-warning"></i>` : '';
    const subjectStr = JSON.stringify(subject).replace(/"/g, '&quot;');
    const deleteIcon = `<i class="fas fa-trash text-danger position-absolute top-0 end-0 d-none btn-delete" style="cursor: pointer;" onclick="removeSubjectFromTimetable(${subjectStr})"></i>`;

    // Hiển thị cảnh báo ⚠ cho các môn bị trùng với môn đã có (chỉ để hiển thị, không thay đổi logic hasDuplicateId)
    if (hasDuplicateId) {
        timetableSubjects.forEach(existingSubject => {
            if (
                existingSubject.subject_id === subject.subject_id &&
                isClassOverlap(existingSubject.class_id, subject.class_id)
            ) {
                const rowIndex = (existingSubject.slots[0] === 0) ? 9 : existingSubject.slots[0] - 1;
                const cell = timetableBody.rows[rowIndex]?.cells[dayMapping[existingSubject.day] + 1];
                if (cell) {
                    let container = cell.querySelector('.position-relative');
                    if (!container) {
                        const content = cell.innerHTML;
                        cell.innerHTML = `<div class="position-relative">${content}</div>`;
                        container = cell.querySelector('.position-relative');
                    }

                    if (!container.querySelector('.text-warning')) {
                        const existingWarningIcon = `<i class="fas fa-exclamation-triangle text-warning"></i>`;
                        container.insertAdjacentHTML('afterbegin', existingWarningIcon);
                    }
                }
            }
        });
    }

    totalCredits += subject.soTC || 0;
    updateCreditDisplay();

    if (firstSlot !== "*") {
        let firstRowIndex = (firstSlot === 0) ? 9 : firstSlot - 1;
        const firstRow = timetableBody.rows[firstRowIndex];
        if (!firstRow) return;

        const cell = firstRow.cells[dayIndex + 1];
        if (!cell) return;

        cell.innerHTML = `       
            <div class="position-relative">
                <div>${warningIcon}</div>
                <div>${deleteIcon}</div>
                <div class="fw-bold">${subject.class_id} - VN</div>
                <div>${subject.subject_name}</div>
                <div class="small-text text-muted mt-1">${subject.room || 'Chưa có phòng'}</div>
                <div class="small-text text-muted">
                    BĐ: ${subject.startDate ? formatDate(subject.startDate) : 'Chưa có'}<br>
                    KT: ${subject.endDate ? formatDate(subject.endDate) : 'Chưa có'}<br>
                </div>
            </div>     
        `;

        cell.style.textAlign = "center";
        cell.style.verticalAlign = "middle";
        cell.style.borderLeft = `4px solid ${randomColor.border}`;
        cell.style.backgroundColor = randomColor.bg;

        if (subject.slots.length > 1) {
            cell.rowSpan = subject.slots.length;
        }

        subject.slots.forEach((slot, idx) => {
            const rowIndex = (slot === 0) ? 9 : slot - 1;
            if (occupied[rowIndex]) occupied[rowIndex][dayIndex] = true;
            if (idx !== 0) {
                const row = timetableBody.rows[rowIndex];
                const delCell = row.cells[dayIndex + 1];
                if (delCell) delCell.style.display = 'none';
            }
        });
    } else {
        const newRow = timetableBody.insertRow();
        newRow.setAttribute("data-subject-id", `${subject.subject_id}-${subject.class_id}-${subject.lecturer}-${subject.khoahoc}`);
        const newCell = newRow.insertCell(newRow.cells.length);
        newCell.colSpan = 7;

        newCell.innerHTML = `            
            <div class="position-relative">
                <div>${warningIcon}</div>
                <div>${deleteIcon}</div>
                <div class="fw-bold">${subject.class_id} - VN</div>
                <div>${subject.subject_name}</div>
                <div class="small-text text-muted mt-1">${subject.room || 'Chưa có phòng'}</div>
                <div class="small-text text-muted">
                    BĐ: ${subject.startDate ? formatDate(subject.startDate) : 'Chưa có'}<br>
                    KT: ${subject.endDate ? formatDate(subject.endDate) : 'Chưa có'}<br>
                </div>
            </div>   
        `;

        newCell.style.textAlign = "center";
        newCell.style.verticalAlign = "middle";
        newCell.style.borderLeft = `4px solid ${randomColor.border}`;
        newCell.style.backgroundColor = randomColor.bg;
    }

    timetableSubjects.push(subject);
    console.log(timetableSubjects);
}

// Hàm xóa môn học khỏi thời khóa biểu
function removeSubjectFromTimetable(subject) {
    const timetableBody = document.getElementById('timetableBody');
    let dayIndex = subject.day;

    if (dayIndex != '*') {
        dayIndex = dayMapping[subject.day];
        if (dayIndex === undefined) return;
    }

    const firstSlot = subject.slots[0];
    if (firstSlot != "*") {
        let firstRowIndex = (firstSlot === 0) ? 9 : firstSlot - 1;
        const firstRow = timetableBody.rows[firstRowIndex];
        if (!firstRow) return;

        const cell = firstRow.cells[dayIndex + 1];
        if (!cell) return;

        // Reset ô chính
        cell.innerHTML = '';
        cell.style = '';
        cell.removeAttribute("rowspan");

        // Bỏ ẩn các ô phụ
        subject.slots.forEach((slot, idx) => {
            const rowIndex = (slot === 0) ? 9 : slot - 1;
            if (occupied[rowIndex]) {
                occupied[rowIndex][dayIndex] = false;
            }
            if (idx !== 0) {
                const row = timetableBody.rows[rowIndex];
                const hiddenCell = row.cells[dayIndex + 1];
                if (hiddenCell) {
                    hiddenCell.style.display = '';
                }
            }
        });
    } else {
        const rows = timetableBody.rows;
        const subjectKey = `${subject.subject_id}-${subject.class_id}-${subject.lecturer}-${subject.khoahoc}`;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.getAttribute("data-subject-id") === subjectKey) {
                timetableBody.deleteRow(i);
                break;
            }
        }
    }

    const index = classList.findIndex(existingSubject =>
        existingSubject.subject_id === subject.subject_id
        && existingSubject.class_id === subject.class_id
        && existingSubject.lecturer === subject.lecturer
        && existingSubject.day === subject.day
        && existingSubject.slots.every((slot, idx) => slot === subject.slots[idx])
    );

    // Cập nhật lại checkbox của môn học
    const checkbox = document.getElementById(`chk${index}`);
    if (checkbox) {
        checkbox.checked = false;  // Bỏ chọn checkbox
    }

    totalCredits -= subject.soTC || 0;
    updateCreditDisplay();

    // Xóa môn học khỏi danh sách
    const timetableIndex = timetableSubjects.findIndex(existingSubject =>
        existingSubject.subject_id === subject.subject_id
        && existingSubject.class_id === subject.class_id
        && existingSubject.lecturer === subject.lecturer
        && existingSubject.day === subject.day
        && existingSubject.slots.every((slot, idx) => slot === subject.slots[idx])
    );

    if (timetableIndex !== -1) {
        timetableSubjects.splice(timetableIndex, 1);
    }

    console.log(timetableSubjects);

    // Kiểm tra và xóa cảnh báo màu vàng nếu không còn trùng lặp
    timetableSubjects.forEach(existingSubject => {
        const rowIndex = (existingSubject.slots[0] === 0) ? 9 : existingSubject.slots[0] - 1;
        const cell = timetableBody.rows[rowIndex]?.cells[dayMapping[existingSubject.day] + 1];
        if (cell) {
            const warningIcon = cell.querySelector('.text-warning');
            if (warningIcon) {
                const hasConflict = timetableSubjects.some(otherSubject =>
                    otherSubject.subject_id === existingSubject.subject_id &&
                    isClassOverlap(otherSubject.class_id, existingSubject.class_id)
                );

                if (!hasConflict) {
                    warningIcon.remove(); // Xóa biểu tượng cảnh báo nếu không còn trùng lặp
                }
            }
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Chưa có';
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function parseExcelDate(excelDate) {
    const parsed = XLSX.SSF.parse_date_code(excelDate);
    if (!parsed) return null;
    const yyyy = parsed.y;
    const mm = String(parsed.m).padStart(2, '0');
    const dd = String(parsed.d).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const DAY_MAPPING = {
    '2': 'Thứ Hai',
    '3': 'Thứ Ba',
    '4': 'Thứ Tư',
    '5': 'Thứ Năm',
    '6': 'Thứ Sáu',
    '7': 'Thứ Bảy',
};

const SLOT_TIME_MAPPING = {
    1: { start: '07:30', end: '08:15' },
    2: { start: '08:15', end: '09:00' },
    3: { start: '09:00', end: '09:45' },
    4: { start: '10:00', end: '10:45' },
    5: { start: '10:45', end: '11:30' },
    6: { start: '13:00', end: '13:45' },
    7: { start: '13:45', end: '14:30' },
    8: { start: '14:30', end: '15:15' },
    9: { start: '15:30', end: '16:15' },
    0: { start: '16:15', end: '17:00' },
    11: { start: '', end: '' },
    12: { start: '', end: '' },
    13: { start: '', end: '' },
    "*": { start: '', end: '' }
};

function convertDateToSlotFormat(dateString) {
    const date = new Date(dateString);

    // Kiểm tra nếu dateString là hợp lệ
    if (isNaN(date)) {
        console.log(`Invalid date: ${dateString}`);
        return null; // Trả về null nếu ngày không hợp lệ
    }

    // Lấy ngày, tháng, và năm (chỉ lấy 2 chữ số cuối của năm)
    const day = date.getDate().toString().padStart(2, '0');  // Đảm bảo 2 chữ số
    const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Tháng bắt đầu từ 0, phải +1
    const year = date.getFullYear().toString().slice(-2); // Chỉ lấy 2 chữ số cuối của năm

    // Nối ngày, tháng, năm thành một chuỗi
    return day + month + year;
}

// Hàm parse dữ liệu từ Excel sheet 
function parseExcelSheetData(worksheet) {
    if (!worksheet || !worksheet['!ref']) return [];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 7 });
    if (!jsonData || jsonData.length < 9) return [];

    const headerRow = jsonData[0] || [];

    const classList = [];
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];

        if (!row || row.length === 0) continue;

        const maMHIndex = headerRow.indexOf('MÃ MH');
        const tenMHIndex = headerRow.indexOf('TÊN MÔN HỌC');
        const maLopIndex = headerRow.indexOf('MÃ LỚP');
        const thuIndex = headerRow.indexOf('THỨ');
        const tietIndex = headerRow.indexOf('TIẾT');
        const phongIndex = headerRow.indexOf('PHÒNG HỌC');
        const htgdIndex = headerRow.indexOf('HTGD');
        const sotcIndex = headerRow.findIndex(h => h === 'TỐ TC' || h === 'SỐ TC');
        const tenGvIndex = headerRow.findIndex(h => h === 'TÊN GIẢNG VIÊN' || h === 'TÊN TRỢ GIẢNG');
        const ngayBdIndex = headerRow.findIndex(h => h.includes('NBD'));
        const ngayKtIndex = headerRow.findIndex(h => h.includes('NKT'));
        const siSoIndex = headerRow.findIndex(h => h.includes('SĨ SỐ'));
        const cachtuanIndex = headerRow.indexOf('CÁCH TUẦN');
        const khoahocIndex = headerRow.indexOf('KHÓA HỌC');
        const hockiIndex = headerRow.indexOf('HỌC KỲ');
        const khoaQLIndex = headerRow.indexOf('KHOA QL');
        const namIndex = headerRow.indexOf('NĂM HỌC');
        const ghichuIndex = headerRow.indexOf('GHICHU');
        const ngonnguIndex = headerRow.indexOf('Ngôn ngữ');
        const hedtIndex = headerRow.indexOf('HỆ ĐT')
        if (maMHIndex === -1 || tenMHIndex === -1 || maLopIndex === -1 || thuIndex === -1 || tietIndex === -1) continue;

        const subjectCode = row[maMHIndex];
        const subjectName = row[tenMHIndex];
        const classId = row[maLopIndex];
        let dayOfWeek = row[thuIndex] ? row[thuIndex].toString() : null;
        let tietString = row[tietIndex] ? row[tietIndex].toString() : '';
        if (!isNaN(tietString) && tietString == 41619) {
            const dateValue = new Date((tietString - 25569) * 86400 * 1000); // Excel sử dụng mốc thời gian 1/1/1900

            const dateString = `${dateValue.getDate()}/${dateValue.getMonth() + 1}/${dateValue.getFullYear()}`;

            // Lấy hai chữ số cuối của năm
            const year = dateValue.getFullYear().toString().slice(-2); // Chỉ lấy 2 chữ số cuối của năm

            // Cập nhật lại chuỗi ngày tháng theo định dạng "11,12,13"
            tietString = `${dateValue.getDate()},${dateValue.getMonth() + 1},${year}`;
        }
        const HTGD = row[htgdIndex];
        const soTC = row[sotcIndex];
        const cachtuan = row[cachtuanIndex];
        const khoahoc = row[khoahocIndex];
        const hocki = row[hockiIndex];
        const khoaQL = row[khoaQLIndex];
        const nam = row[namIndex];
        const ghichu = row[ghichuIndex];
        const ngonngu = row[ngonnguIndex];
        const hedt = row[hedtIndex];
        const startDate = ngayBdIndex !== -1 && row[ngayBdIndex] ? parseExcelDate(row[ngayBdIndex]) : null;
        const endDate = ngayKtIndex !== -1 && row[ngayKtIndex] ? parseExcelDate(row[ngayKtIndex]) : null;
        const capacity = siSoIndex !== -1 && row[siSoIndex] ? parseInt(row[siSoIndex]) : null;
        const slots = [];
        if (tietString == "*") {
            slots.push(tietString);
        }
        else if (tietString == "11,12,13") {
            const tietArray = tietString.split(',');
            for (const str of tietArray) {
                const slot = parseInt(str);
                if (!isNaN(slot)) {
                    slots.push(slot);
                }
            }

        }
        else {
            for (const char of tietString) {
                const slot = parseInt(char);
                slots.push(slot);  // Nếu là số hợp lệ, thêm vào mảng slots
            }
        }

        if (dayOfWeek != "*") {
            dayOfWeek = DAY_MAPPING[dayOfWeek];
        }

        if (slots.length > 0 && dayOfWeek) {
            classList.push({
                subject_id: subjectCode,
                subject_name: subjectName,
                class_id: classId,
                lecturer: tenGvIndex !== -1 ? row[tenGvIndex] : null,
                capacity,
                startDate,
                endDate,
                day: dayOfWeek,
                hedt,
                slots,
                time: `${SLOT_TIME_MAPPING[slots[0]].start} - ${SLOT_TIME_MAPPING[slots[slots.length - 1]].end}`,
                room: phongIndex !== -1 ? row[phongIndex] : null,
                HTGD,
                soTC,
                cachtuan,
                khoahoc,
                hocki,
                khoaQL,
                nam,
                ghichu,
                ngonngu
            });
        }
    }
    return classList;
}

document.getElementById('optimizeScheduleBtn').addEventListener('click', () => {

    if (!classList || classList.length === 0) {
        showToast('Vui lòng import file Excel trước!', 'warning');
        return;
    }

    sendToOptimizeSchedule(classList);
});

// Gọi modal khi nhấn nút "Xóa tất cả"
document.getElementById('clearTimetableBtn').addEventListener('click', () => {
    // Hiển thị modal xác nhận
    const myModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    myModal.show();
});

// Xử lý khi người dùng xác nhận xóa
document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    // Gọi hàm xóa tất cả môn học
    removeAllSubjects();

    // Đóng modal sau khi xóa
    const myModal = bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal'));
    myModal.hide();
});

// Hàm xóa tất cả môn học
function removeAllSubjects() {
    if (timetableSubjects && timetableSubjects.length > 0) {
        const subjectsCopy = [...timetableSubjects];  // Tạo bản sao mảng
        subjectsCopy.forEach(subject => {
            removeSubjectFromTimetable(subject);
        });

        timetableSubjects = [];
        totalCredits = 0;
        updateCreditDisplay();
        showToast('Đã xóa tất cả các môn học từ thời khóa biểu!', 'info');
    } else {
        showToast('Không có môn học nào để xóa!', 'warning');
    }
}


const token = localStorage.getItem('token'); 
// Sau khi đã parse xong dữ liệu Excel
async function sendToOptimizeSchedule(classList) {
    try {
        console.log("🔍 classList to be sent:", classList);
        const response = await fetch('/api/student/schedule-optimize-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // Gửi token xác thực
            },
            body: JSON.stringify({
                availableCourses: classList
            })
        });

        const result = await response.json();

        // Kiểm tra nếu có lỗi trong phản hồi từ backend
        if (!response.ok) {
            console.error('❌ Backend Error:', result.error || result.message);
            return;
        }

        const scheduleData = result.schedule;
        const nextSemester = Object.keys(scheduleData)[0];

        scheduleData[nextSemester].courses.forEach(course => {
            course.classes.forEach(courseClass => {
                const index = classList.findIndex(existingSubject =>
                    existingSubject.subject_id === courseClass.subject_id &&
                    existingSubject.class_id === courseClass.class_id &&
                    existingSubject.lecturer === courseClass.lecturer &&
                    existingSubject.day === courseClass.day &&
                    JSON.stringify(existingSubject.slots) === JSON.stringify(courseClass.slots)
                );

                if (index !== -1) {
                    const checkbox = document.getElementById(`chk${index}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                }
            });
        });

    } catch (error) {
        console.error('❌ Fetch Error:', error.message);
    }
}

function renderRecommendation(response) {
    if (!response) return;

    const headerInfo = `
      <div class="mb-4">
        <p><span class="info-label">Ngành:</span> <span class="info-value">${response.major_id}</span></p>
        <p><span class="info-label">Học kỳ hiện tại:</span> <span class="info-value">${response.currentSemester}</span></p>
        ${response.nextSemester ? `<p><span class="info-label">Học kỳ tiếp theo:</span> <span class="info-value">${response.nextSemester}</span></p>` : ""}
        <p><span class="info-label">Tổng tín chỉ gợi ý:</span> <span class="info-value">${response.totalCredits}</span></p>
      </div>
    `;

    const gridHtml = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title mb-3">${response.message}</h5>
          ${headerInfo}
          <div class="row">
            ${response.recommendedCourses.map(course => `
              <div class="col-12 col-sm-6 col-md-4">
                <div class="subject-card">
                  <div class="subject-name">${course.name}</div>
                  <div class="mt-2">
                    <span class="credits">${course.credits} tín chỉ</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById("recommendation-result").innerHTML = gridHtml;
  }


  async function fetchAndRenderRecommendation() {
    const token = localStorage.getItem('token');
    if (!token) return; // Nếu chưa đăng nhập thì không gọi

    try {
        const res = await fetch('/api/student/recommend-courses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();

        if (!res.ok) {
            document.getElementById("recommendation-result").innerHTML = `
                <div class="alert alert-warning">Không thể lấy dữ liệu gợi ý môn học: ${data.message || 'Lỗi hệ thống'}</div>
            `;
            return;
        }

        renderRecommendation(data);
    } catch (err) {
        document.getElementById("recommendation-result").innerHTML = `
            <div class="alert alert-danger">Lỗi kết nối đến máy chủ!</div>
        `;
    }
}

// Gọi hàm này khi trang timetable load xong
document.addEventListener('DOMContentLoaded', fetchAndRenderRecommendation);