const Subject = require('../../../Database/SaveToMongo/models/Subject');
const Score = require('../../../Database/SaveToMongo/models/Score');
const Student = require('../../../Database/SaveToMongo/models/Student');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');
const XLSX = require('xlsx');

// Mapping from tiết học to time range (adjust based on your schedule)
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
};

const DAY_MAPPING = {
    '2': 'Mon',
    '3': 'Tue',
    '4': 'Wed',
    '5': 'Thu',
    '6': 'Fri',
    '7': 'Sat',
    // Add mappings for other day formats if needed
};

const calculateSubjectDifficulty = async (subjectId) => {
    try {
        const scores = await Score.find({
            subject_id: subjectId,
            status: 'Đậu'
        });

        if (scores.length === 0) return 0.5;

        const averageScoreCK = scores.reduce((sum, score) => sum + score.score_CK, 0) / scores.length;
        return 1 - (averageScoreCK / 10); // Điểm càng cao => độ khó càng thấp
    } catch (error) {
        console.error('Error calculating subject difficulty:', error);
        return 0.5;
    }
};

const getStudentScores = async (studentId) => {
    try {
        return await Score.find({ student_id: studentId })
            .populate({
                path: 'subject_id',
                model: 'Subject',
                localField: 'subject_id',  // field trong Score
                foreignField: 'subject_id', // field trong Subject
                justOne: true
            });
    } catch (error) {
        console.error('Error fetching student scores:', error);
        return [];
    }
};


const getAllSubjects = async () => {
    try {
        return await Subject.find().select('subject_id subject_name prerequisite_id theory_credits practice_credits');
    } catch (error) {
        console.error('Error fetching all subjects:', error);
        return [];
    }
};

async function getRequiredCoursesForStudent(student_id) {
    const student = await Student.findOne({ student_id });
    const trainingProgram = await TrainingProgram.findOne({ program_id: student.program_id });
    const major = trainingProgram.majors.find(m => m.major_id === student.major_id);
    return major.required_courses; // danh sách subject_id cần học
}

const isSubjectFailed = (studentScores, subjectId) => {
    return studentScores.some(
        score => score.subject_id === subjectId && score.status === 'Rớt' // So sánh String
    );
};

const isSubjectCompleted = (studentScores, subjectId) => {
    return studentScores.some(
        score => score.subject_id === subjectId && score.status === 'Đậu' // So sánh String
    );
};

const parseExcelDate = (excelDate) => {
    const parsed = XLSX.SSF.parse_date_code(excelDate);
    if (!parsed) return null;
    const yyyy = parsed.y;
    const mm = String(parsed.m).padStart(2, '0');
    const dd = String(parsed.d).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const parseExcelSheetData = (worksheet) => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const classList = [];

    // Clean all cells: chuyển mọi ô về dạng chuỗi an toàn
    const cleanedData = jsonData.map(row =>
        row.map(cell => (cell !== undefined && cell !== null) ? String(cell).trim() : '')
    );

    const headers = cleanedData[7] || [];

    const maMHIndex = headers.findIndex(h => h.includes('MÃ MH'));
    const tenMHIndex = headers.findIndex(h => h.includes('TÊN MÔN HỌC'));
    const maLopIndex = headers.findIndex(h => h.includes('MÃ LỚP'));
    const tenGvIndex = headers.findIndex(h => h.includes('TÊN GIẢNG VIÊN'));
    const siSoIndex = headers.findIndex(h => h.includes('SĨ SỐ'));
    const tcIndex = headers.findIndex(h => h.includes('SỐ TC'));
    const ngayBdIndex = headers.findIndex(h => h.includes('NBD'));
    const ngayKtIndex = headers.findIndex(h => h.includes('NKT'));
    const hocKyIndex = headers.findIndex(h => h.includes('HỌC KỲ'));
    const namHocIndex = headers.findIndex(h => h.includes('NĂM HỌC'));
    const khoaIndex = headers.findIndex(h => h.includes('KHOA'));
    const ngonNguIndex = headers.findIndex(h => h.includes('Ngôn ngữ'));
    const thuIndex = headers.findIndex(h => h.includes('THỨ'));
    const tietIndex = headers.findIndex(h => h.includes('TIẾT'));

    if (maMHIndex === -1 || tenMHIndex === -1 || maLopIndex === -1 || thuIndex === -1 || tietIndex === -1) {
        console.warn('Missing required columns in sheet.');
        return [];
    }

    for (let i = 8; i < cleanedData.length; i++) {
        const row = cleanedData[i];
        if (!row || row.length === 0 || !row[maMHIndex]) continue;

        const subjectCode = row[maMHIndex];
        const subjectName = row[tenMHIndex];
        const classId = row[maLopIndex];
        const lecturer = tenGvIndex !== -1 ? row[tenGvIndex] : null;
        const capacity = siSoIndex !== -1 && row[siSoIndex] ? parseInt(row[siSoIndex]) : null;
        const credits = tcIndex !== -1 && row[tcIndex] ? parseInt(row[tcIndex]) : null;
        const startDate = ngayBdIndex !== -1 && row[ngayBdIndex] ? parseExcelDate(row[ngayBdIndex]) : null;
        const endDate = ngayKtIndex !== -1 && row[ngayKtIndex] ? parseExcelDate(row[ngayKtIndex]) : null;
        const semester = hocKyIndex !== -1 ? row[hocKyIndex] : null;
        const academicYear = namHocIndex !== -1 ? row[namHocIndex] : null;
        const faculty = khoaIndex !== -1 ? row[khoaIndex] : null;
        const language = ngonNguIndex !== -1 ? row[ngonNguIndex] : null;
        const dayOfWeek = DAY_MAPPING[row[thuIndex]];
        const tietString = row[tietIndex];

        const slots = [];
        for (const char of tietString) {
            const slot = parseInt(char);
            if (!isNaN(slot) && SLOT_TIME_MAPPING[slot]) {
                slots.push(slot);
            }
        }

        if (slots.length > 0) {
            classList.push({
                subject_id: subjectCode,
                subject_name: subjectName,
                class_id: classId,
                lecturer,
                capacity,
                credits,
                start_date: startDate,
                end_date: endDate,
                semester,
                academic_year: academicYear,
                faculty,
                language,
                day: dayOfWeek,
                slots, // array of all slots like [1, 2, 3]
                time: `${SLOT_TIME_MAPPING[slots[0]].start} - ${SLOT_TIME_MAPPING[slots[slots.length - 1]].end}`,
            });
        }
    }

    return classList;
};


const findAvailableTimeSlots = (currentSchedule, proposedClass) => {
    const proposedSlots = Array.isArray(proposedClass.slot) ? proposedClass.slot : [proposedClass.slot];

    return !currentSchedule.some(scheduledClass => {
        const scheduledSlots = Array.isArray(scheduledClass.slot) ? scheduledClass.slot : [scheduledClass.slot];
        return scheduledClass.day === proposedClass.day &&
            proposedSlots.some(slot => scheduledSlots.includes(slot));
    });
};


const prioritizeClasses = async (studentId, availableClasses, studentScores) => {
    const allSubjects = await getRequiredCoursesForStudent(studentId); // Gọi 1 lần duy nhất

    // Gắn thêm thông tin bổ sung để sort
    const classesWithPriority = availableClasses.map(cls => {
        const failed = isSubjectFailed(studentScores, cls.subject_id);

        const subject = allSubjects.find(sub => sub.subject_id === cls.subject_id);
        const prerequisiteIds = subject?.prerequisite_id || [];

        const prerequisiteSatisfied = (
            prerequisiteIds.length === 0 || (prerequisiteIds.length === 1 && prerequisiteIds[0] === '') ||
            prerequisiteIds.every(pre =>
                studentScores.some(score => score.subject_id.toString() === pre && score.status === 'Đậu')
            )
        );

        return {
            ...cls,
            priority: {
                failed,
                prerequisiteSatisfied
            }
        };
    });

    // Sort theo thông tin priority
    return classesWithPriority.sort((a, b) => {
        if (a.priority.failed && !b.priority.failed) return -1;
        if (!a.priority.failed && b.priority.failed) return 1;
        if (a.priority.prerequisiteSatisfied && !b.priority.prerequisiteSatisfied) return -1;
        if (!a.priority.prerequisiteSatisfied && b.priority.prerequisiteSatisfied) return 1;
        return 0;
    });
};


const suggestClasses = async (studentId, theoryClasses, practiceClasses) => {
    try {
        const studentScores = await getStudentScores(studentId);
        const failedSubjectIds = studentScores.filter(s => s.status === 'Rớt').map(s => s.subject_id);
        const completedSubjectIds = studentScores.filter(s => s.status === 'Đậu').map(s => s.subject_id);

        const suggestedSchedule = [];
        const enrolledSlots = [];

        const allSubjectIds = await getRequiredCoursesForStudent(studentId);
        const allSubjectsData = allSubjectIds.map(id => ({ subject_id: id }));
        // console.log(studentId);
        // console.log('📚 Danh sách tất cả môn:', allSubjectsData);

        const isSlotEnrolled = (day, slots) => {
            if (!slots || !Array.isArray(slots)) return false;
            return slots.some(slot => enrolledSlots.some(s => s.day === day && s.slot === slot));
        };
        

        const addClassToSchedule = (classInfo) => {
            // console.log('📌 Thêm vào lịch:', classInfo.subject_id, classInfo.class_id);
            suggestedSchedule.push(classInfo);
        
            const slots = Array.isArray(classInfo.slot) ? classInfo.slot : classInfo.slots;
            if (!Array.isArray(slots)) {
                console.warn('⚠️ slot/slots không hợp lệ cho class:', classInfo);
                return;
            }
        
            slots.forEach(slot => {
                enrolledSlots.push({ day: classInfo.day, slot });
            });
        };
        
                const hasPrerequisitesMet = (subject, completedSubjects) => {
            const prerequisites = subject?.prerequisite_id || [];
            return prerequisites.length === 0 || 
                (prerequisites.length === 1 && prerequisites[0] === '') || 
                prerequisites.every(preId =>
                    completedSubjects.some(completed =>
                        completed.subject_id.toString() === preId
                    )
                );
        };

        const tryAddTheoryAndPractice = async (subjectId, studentScores) => {
            const availableTheory = theoryClasses.filter(cls => cls.subject_id === subjectId && !isSlotEnrolled(cls.day, cls.slot));
            const availablePractice = practiceClasses.filter(cls => cls.subject_id.startsWith(subjectId + '.') && !isSlotEnrolled(cls.day, cls.slot));

            if (availablePractice.length > 0) {
                const sortedTheory = await prioritizeClasses(studentId, availableTheory, studentScores);
                for (const theoryClass of sortedTheory) {
                    const matchingPractices = await prioritizeClasses(
                        availablePractice.filter(pc => pc.subject_id.startsWith(theoryClass.subject_id + '.')),
                        studentScores
                    );

                    for (const practiceClass of matchingPractices) {
                        const isTheoryAvailable = findAvailableTimeSlots(suggestedSchedule, theoryClass);
                        const isPracticeAvailable = findAvailableTimeSlots(suggestedSchedule, practiceClass);
                        const isNotConflict = !(theoryClass.day === practiceClass.day && theoryClass.slot === practiceClass.slot);

                        if (isTheoryAvailable && isPracticeAvailable && isNotConflict) {
                            addClassToSchedule(theoryClass);
                            addClassToSchedule(practiceClass);
                            return true;
                        }
                    }
                }
            } else {
                const sortedTheory = await prioritizeClasses(studentId, availableTheory, studentScores);
                const theoryClass = sortedTheory[0];
                if (theoryClass && findAvailableTimeSlots(suggestedSchedule, theoryClass)) {
                    addClassToSchedule(theoryClass);
                    return true;
                }
            }

            return false;
        };

        for (const failedSubjectId of failedSubjectIds) {
            await tryAddTheoryAndPractice(failedSubjectId, studentScores);
        }

        const notCompletedSubjects = allSubjectsData.filter(sub =>
            sub && sub.subject_id &&
            !completedSubjectIds.includes(sub.subject_id) &&
            !failedSubjectIds.includes(sub.subject_id)
        );

        // console.log('📚 Danh sách môn chưa hoàn thành:', notCompletedSubjects);

        const prioritizedNotCompleted = await prioritizeClasses(studentId, notCompletedSubjects, studentScores);

        for (const subject of prioritizedNotCompleted) {
            const availableTheory = theoryClasses.filter(cls =>
                cls.subject_id === subject.subject_id &&
                hasPrerequisitesMet(subject, studentScores)
            );

            const availablePractice = practiceClasses.filter(cls =>
                cls.subject_id.startsWith(subject.subject_id + '.') &&
                hasPrerequisitesMet(subject, studentScores)
            );

            const sortedTheory = await prioritizeClasses(studentId, availableTheory, studentScores);

            for (const theoryClass of sortedTheory) {
                if (isSlotEnrolled(theoryClass.day, theoryClass.slot)) continue;

                const matchingPractice = availablePractice.find(pc =>
                    pc.subject_id.startsWith(subject.subject_id + '.') &&
                    !isSlotEnrolled(pc.day, pc.slot) &&
                    !(pc.day === theoryClass.day && pc.slot === theoryClass.slot) &&
                    findAvailableTimeSlots(suggestedSchedule, pc)
                );

                if (availablePractice.length > 0) {
                    if (matchingPractice && findAvailableTimeSlots(suggestedSchedule, theoryClass)) {
                        addClassToSchedule(theoryClass);
                        addClassToSchedule(matchingPractice);
                        break;
                    }
                } else {
                    if (findAvailableTimeSlots(suggestedSchedule, theoryClass)) {
                        addClassToSchedule(theoryClass);
                        break;
                    }
                }
            }
        }

        const groupedSchedule = suggestedSchedule.reduce((scheduleByDay, item) => {
            const dayKey = DAY_MAPPING[item.day] || `${item.day}`;
            const slots = Array.isArray(item.slots) ? item.slots : (item.slot ? [item.slot] : []);
        
            if (!scheduleByDay[dayKey]) {
                scheduleByDay[dayKey] = [];
            }
        
            slots.forEach(slot => {
                scheduleByDay[dayKey].push({
                    slot: `Tiết ${slot}`,
                    time: item.time || '',
                    subjectId: item.subject_id || '???',
                    className: `${item.class_id}${item.group ? '.' + item.group : ''} - ${item.language || 'VN'}`,
                    subjectName: item.subject_name || '',
                    room: item.room || 'P ???',
                    numberOfStudents: item.size || '???',
                    lecturer: item.lecturer || 'Chưa rõ',
                    startDate: item.start_date || '??/??/??',
                    endDate: item.end_date || '??/??/??'
                });
            });
        
            return scheduleByDay;
        }, {});
        
        // ✅ Thêm đoạn sort theo thứ và theo tiết tại đây
        const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const sortedGroupedSchedule = {};
        for (const day of orderedDays) {
            if (groupedSchedule[day]) {
                groupedSchedule[day].sort((a, b) => {
                    const slotA = parseInt(a.slot.replace('Tiết ', '')) || 0;
                    const slotB = parseInt(b.slot.replace('Tiết ', '')) || 0;
                    return slotA - slotB;
                });
                sortedGroupedSchedule[day] = groupedSchedule[day];
            }
        }
        
        return sortedGroupedSchedule;       


    } catch (error) {
        console.error('🚨 Error suggesting classes:', error);
        throw error;
    }
};

exports.generateOptimizedScheduleFromExcel = async (studentId, excelFilePath) => {
    try {
        const workbook = XLSX.readFile(excelFilePath);

        // Lấy sheet theo index (bắt đầu từ 0)
        const theorySheet = workbook.Sheets[workbook.SheetNames[0]]; // Sheet đầu tiên (index 0)
        const practiceSheet = workbook.Sheets[workbook.SheetNames[1]]; // Sheet thứ hai (index 1)

        if (!theorySheet || !practiceSheet) {
            throw new Error('Excel file must contain at least two sheets.');
        }

        const theoryClasses = parseExcelSheetData(theorySheet);
        const practiceClasses = parseExcelSheetData(practiceSheet);

        const optimizedSchedule = await suggestClasses(studentId, theoryClasses, practiceClasses);
        return optimizedSchedule;
    } catch (error) {
        console.error('Error generating optimized schedule from Excel:', error);
        throw error;
    }
};
