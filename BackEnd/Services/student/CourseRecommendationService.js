// CourseRecommendationController.js
const Student = require("../../../Database/SaveToMongo/models/Student");
const Score = require('../../../Database/SaveToMongo/models/Score');
const Subject = require('../../../Database/SaveToMongo/models/Subject');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');
const StudentAcademic = require('../../../Database/SaveToMongo/models/StudentAcademic');
const XLSX = require('xlsx');
const fs = require('fs').promises;

// Mapping constants
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
};

// Helper functions
function parseExcelDate(excelDate) {
    const parsed = XLSX.SSF.parse_date_code(excelDate);
    if (!parsed) return null;
    const yyyy = parsed.y;
    const mm = String(parsed.m).padStart(2, '0');
    const dd = String(parsed.d).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function isTimeOverlap(time1, time2) {
    if (!time1 || !time2) return false;
    
    const parseTime = (timeStr) => {
        const [start, end] = timeStr.split(' - ').map(t => {
            const [hours, minutes] = t.split(':').map(Number);
            return hours * 60 + minutes;
        });
        return { start, end };
    };

    const t1 = parseTime(time1);
    const t2 = parseTime(time2);

    return !(t1.end <= t2.start || t2.end <= t1.start);
}

function isSlotConflict(existingSlots, newSlots) {
    return existingSlots.some(slot => newSlots.includes(slot));
}

function isTimeConflict(schedule, day, newTime, newSlots) {
    return schedule.some(c => 
        c.classes.some(cls => 
            cls.day === day && 
            (isTimeOverlap(cls.time, newTime) || isSlotConflict(cls.slots, newSlots))
        )
    );
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function isSlotOccupied(schedule, day, slots) {
    return schedule.some(existingClass => 
        existingClass.day === day && existingClass.slots.some(slot => slots.includes(slot))
    );
}

// Core functions
async function getStudentAcademicInfo(studentId) {
    const student = await Student.findOne({ student_id: studentId });
    if (!student) throw new Error('Student not found');

    const scores = await Score.find({ student_id: studentId });

    const subjectIds = scores.map(s => s.subject_id);
    const subjects = await Subject.find({ subject_id: { $in: subjectIds } });
    
    const subjectMap = {};
    subjects.forEach(sub => {
        subjectMap[sub.subject_id] = sub;
    });
    
    // Sau đó gán thủ công:
    scores.forEach(score => {
        score.subject = subjectMap[score.subject_id] || null;
    });
    
    const getSubjectCode = (subject) => typeof subject === 'string' ? subject : subject.subject_id;

    const passedScores = scores.filter(s => s.status === 'Đậu');
    const failedScores = scores.filter(s => s.status === 'Rớt');

    const englishCourses = { ENG01: false, ENG02: false, ENG03: false };
    passedScores.forEach(score => {
        const subjectId = getSubjectCode(score.subject_id);
        if (subjectId === 'ENG01') englishCourses.ENG01 = true;
        if (subjectId === 'ENG02') englishCourses.ENG02 = true;
        if (subjectId === 'ENG03') englishCourses.ENG03 = true;
    });

    const trainingProgram = await TrainingProgram.findOne({ program_id: student.program_id });
    if (!trainingProgram) throw new Error('Training program not found');

    const major = trainingProgram.majors.find(m => m.major_id === student.major_id);
    if (!major) throw new Error('Major not found');

    const Academic = await StudentAcademic.findOne({ student_id: studentId });
    if (!Academic) throw new Error('Student academic info not found');    

    const currentSemester = await getCurrentSemesterNum(studentId);
    const remainingSemesters = (major.progress_details.required_semesters || 8) - currentSemester;

    const passedCourses = passedScores.map(s => getSubjectCode(s.subject_id));
    const failedCourses = failedScores.map(s => getSubjectCode(s.subject_id));

    return {
        student,
        scores,
        passedScores,
        failedScores,
        passedCourses,
        failedCourses,
        trainingProgram,
        major,
        Academic,
        currentSemester,
        remainingSemesters,
        englishCourses: {
            ENG01: student.has_english_certificate || englishCourses.ENG01,
            ENG02: student.has_english_certificate || englishCourses.ENG02,
            ENG03: student.has_english_certificate || englishCourses.ENG03
        },
        hasEnglishCertificate: student.has_english_certificate
    };
}

async function getRequiredCoursesForStudent(student_id) {
    const student = await Student.findOne({ student_id });
    const trainingProgram = await TrainingProgram.findOne({ program_id: student.program_id });
    const major = trainingProgram.majors.find(m => m.major_id === student.major_id);
    return major.required_courses;
}

function filterRequiredCourses(academicInfo) {
    const { passedCourses, failedCourses, major, currentSemester, englishCourses, hasEnglishCertificate } = academicInfo;
    const requiredCourses = major.required_courses || [];

    let coursesToTake = requiredCourses.filter(courseId => !passedCourses.includes(courseId));
    coursesToTake = [...new Set([...coursesToTake, ...failedCourses])];

    if (!hasEnglishCertificate) {
        const requiredEnglishCourse = getRequiredEnglishCourse(currentSemester + 1, englishCourses);
        coursesToTake = coursesToTake.filter(courseId => !['ENG01', 'ENG02', 'ENG03'].includes(courseId));
        if (requiredEnglishCourse && !englishCourses[requiredEnglishCourse]) {
            coursesToTake.push(requiredEnglishCourse);
        }
    } else {
        coursesToTake = coursesToTake.filter(courseId => !['ENG01', 'ENG02', 'ENG03'].includes(courseId));
    }

    return coursesToTake;
}

async function checkPrerequisites(courseIds, passedCourses) {
    const subjects = await Subject.find({ subject_id: { $in: courseIds } }).lean();

    const eligibleCourses = [];
    const ineligibleCourses = [];

    for (const subject of subjects) {
        if (!subject.prerequisite_id || subject.prerequisite_id.length === 0 || subject.prerequisite_id.every(pre => pre.trim() === "")) {
            eligibleCourses.push(subject.subject_id);
            continue;
        }

        const allPrereqsMet = subject.prerequisite_id.every(preId => preId.trim() === "" || passedCourses.includes(preId));
        if (allPrereqsMet) {
            eligibleCourses.push(subject.subject_id);
        } else {
            ineligibleCourses.push({
                courseId: subject.subject_id,
                missingPrerequisites: subject.prerequisite_id.filter(preId => preId.trim() !== "" && !passedCourses.includes(preId))
            });
        }
    }

    return { eligibleCourses, ineligibleCourses };
}

async function calculateCourseDifficulty(courseIds) {
    const scoresData = await Score.aggregate([
        { $match: { subject_id: { $in: courseIds } } },
        {
            $group: {
                _id: "$subject_id",
                avgScore: {
                    $avg: {
                        $cond: [
                            { $eq: ["$score_HP", "Miễn"] },
                            10,
                            { $toDouble: "$score_HP" }
                        ]
                    }
                },
                count: { $sum: 1 }
            }
        }
    ]);

    const result = {};
    courseIds.forEach(courseId => {
        const data = scoresData.find(d => d._id === courseId);
        const avgScore = data?.avgScore || null;

        result[courseId] = {
            difficulty: calculateDifficultyLevel(avgScore),
            averageScore: avgScore,
            studentCount: data?.count || 0
        };
    });

    return result;
}

function calculateDifficultyLevel(avgScore) {
    if (avgScore === null) return 0.5;
    if (avgScore >= 9.0) return 0.1;
    if (avgScore >= 8.0) return 0.3;
    if (avgScore >= 7.0) return 0.5;
    if (avgScore >= 5.5) return 0.7;
    return 0.9;
}

async function getCurrentSemesterNum(studentId) {
    const result = await Score.aggregate([
        { $match: { student_id: studentId } },
        {
            $group: {
                _id: "$student_id",
                maxSemester: { $max: { $toInt: "$semester_num" } }
            }
        }
    ]);
    return result.length === 0 ? 1 : result[0].maxSemester;
}

function getRequiredEnglishCourse(semesterNum, englishCourses) {
    if (englishCourses.ENG01 && englishCourses.ENG02 && englishCourses.ENG03) return null;
    if (!englishCourses.ENG03 && englishCourses.ENG01 && englishCourses.ENG02) return 'ENG03';
    if (!englishCourses.ENG02 && englishCourses.ENG01) return 'ENG02';
    if (!englishCourses.ENG01 && semesterNum >= 1) return 'ENG01';
    return null;
}

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
        const tenGvIndex = headerRow.findIndex(h => h === 'TÊN GIẢNG VIÊN' || h === 'TÊN TRỢ GIẢNG');
        const ngayBdIndex = headerRow.findIndex(h => h.includes('NBD'));
        const ngayKtIndex = headerRow.findIndex(h => h.includes('NKT'));
        const siSoIndex = headerRow.findIndex(h => h.includes('SĨ SỐ'));

        if (maMHIndex === -1 || tenMHIndex === -1 || maLopIndex === -1 || thuIndex === -1 || tietIndex === -1) continue;

        const subjectCode = row[maMHIndex];
        const subjectName = row[tenMHIndex];
        const classId = row[maLopIndex];
        const dayOfWeek = row[thuIndex] ? DAY_MAPPING[row[thuIndex].toString()] : null;
        const tietString = row[tietIndex] ? row[tietIndex].toString() : '';
        const startDate = ngayBdIndex !== -1 && row[ngayBdIndex] ? parseExcelDate(row[ngayBdIndex]) : null;
        const endDate = ngayKtIndex !== -1 && row[ngayKtIndex] ? parseExcelDate(row[ngayKtIndex]) : null;
        const capacity = siSoIndex !== -1 && row[siSoIndex] ? parseInt(row[siSoIndex]) : null;

        const slots = [];
        for (const char of tietString) {
            const slot = parseInt(char);
            if (!isNaN(slot)) slots.push(slot);
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
                slots,
                time: `${SLOT_TIME_MAPPING[slots[0]].start} - ${SLOT_TIME_MAPPING[slots[slots.length - 1]].end}`,
                room: phongIndex !== -1 ? row[phongIndex] : null
            });
        }
    }

    return classList;
}

function getAvailableClassPairs(theoryClasses, practiceClasses) {
    const pairs = [];
    theoryClasses.forEach(theoryClass => {
        const matchingPractices = practiceClasses.filter(p => p.class_id.startsWith(`${theoryClass.class_id}.`));
        if (matchingPractices.length > 0) {
            pairs.push({
                theory: theoryClass,
                practices: matchingPractices
            });
        }
    });
    return pairs;
}

function calculateCreditTargets(academicInfo) {
    const completedMajorCredits = academicInfo.Academic.progress_details.major_core;
    const completerMajorFoundation = academicInfo.Academic.progress_details.major_foundation;
    const completedElectiveCredits = academicInfo.Academic.progress_details.elective_credits;
    const completedGeneralCredits = academicInfo.Academic.progress_details.general_education;

    const remainingMajorCredits = academicInfo.major.progress_details.required_major_core - completedMajorCredits;
    const remainingMajorFoundation = academicInfo.major.progress_details.required_major_foundation - completerMajorFoundation;
    const remainingElectiveCredits = academicInfo.major.progress_details.required_elective_credits - completedElectiveCredits;
    const remainingGeneralCredits = academicInfo.major.progress_details.required_general_education - completedGeneralCredits;

    const maxCreditsPerSemester = 28;
    const minCreditsPerSemester = 14;
    const remainingSemesters = academicInfo.remainingSemesters;

    let targetMajorFoundation = Math.min(Math.ceil(remainingMajorFoundation / remainingSemesters), maxCreditsPerSemester);
    let creditsLeft = maxCreditsPerSemester - targetMajorFoundation;

    let targetMajorCore = Math.min(Math.ceil(remainingMajorCredits / remainingSemesters), creditsLeft);
    creditsLeft -= targetMajorCore;

    let targetGeneralCredits = Math.min(Math.ceil(remainingGeneralCredits / remainingSemesters), creditsLeft);
    creditsLeft -= targetGeneralCredits;

    let targetElectiveCredits = Math.min(Math.ceil(remainingElectiveCredits / remainingSemesters), creditsLeft);
    creditsLeft -= targetElectiveCredits;

    return {
        targetMajorFoundation,
        targetMajorCore,
        targetGeneralCredits,
        targetElectiveCredits
    };
}

function initializeScheduleStructure(nextSemester, creditTargets) {
    return {
        [nextSemester]: {
            courses: [],
            totalCredits: 0,
            majorfoundationCredits: 0,
            majorCredits: 0,
            electiveCredits: 0,
            generalEducationCredits: 0,
            ...creditTargets
        }
    };
}

async function categorizeCourses(courseIds, courseDifficulty) {
    const subjects = await Subject.find({ subject_id: { $in: courseIds } });
    
    const coursesByType = {
        majorCore: { Hard: [], Medium: [], Easy: [] },
        majorFoundation: { Hard: [], Medium: [], Easy: [] },
        generalEducation: { Hard: [], Medium: [], Easy: [] },
        elective: { Hard: [], Medium: [], Easy: [] }
    };

    courseIds.forEach(courseId => {
        const subject = subjects.find(s => s.subject_id === courseId);
        if (!subject) return;

        const difficultyData = courseDifficulty[courseId];
        if (!difficultyData) return;

        const difficultyLevel = difficultyData.difficulty <= 0.3 ? 'Hard' :
                              difficultyData.difficulty <= 0.7 ? 'Medium' : 'Easy';

        const credits = (subject.theory_credits || 0) + (subject.practice_credits || 0);
        let type;
        switch (subject.subject_type) {
            case "ĐC": type = 'generalEducation'; break;
            case "CN": case "CNTC": case "ĐA": type = 'majorCore'; break;
            case "CSNN": case "CSN": type = 'majorFoundation'; break;
            case "TTTN": case "TN": case "KLTN": case "CĐTN": type = 'elective'; break;
            default: type = 'generalEducation';
        }

        if (coursesByType[type] && coursesByType[type][difficultyLevel]) {
            coursesByType[type][difficultyLevel].push({
                courseId,
                subject,
                credits,
                difficulty: difficultyLevel
            });
        }
    });

    // Shuffle courses within each category for randomness
    Object.values(coursesByType).forEach(type => {
        Object.values(type).forEach(difficulty => shuffleArray(difficulty));
    });

    return coursesByType;
}

async function applyCourseByPriority(schedule, categorizedCourses, availableCourses, academicInfo) {
    const nextSemester = Object.keys(schedule)[0];
    const semesterSchedule = schedule[nextSemester];
    
    // Thêm hàm helper để kiểm tra phân bổ ngày học
    function getBestDayForCourse(courseClasses, currentSchedule) {
        const dayCounts = {
            Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
        };
        
        // Đếm số môn hiện có mỗi ngày
        currentSchedule.courses.forEach(c => {
            c.classes.forEach(cls => {
                dayCounts[cls.day]++;
            });
        });
        
        // Tìm ngày có ít môn nhất mà không bị trùng lịch
        const availableDays = courseClasses
            .map(c => c.day)
            .filter(day => !isTimeConflict(currentSchedule.courses, day, courseClasses[0].time, courseClasses[0].slots));
            
        if (availableDays.length === 0) return null;
        
        return availableDays.reduce((a, b) => dayCounts[a] < dayCounts[b] ? a : b);
    }

    // Helper function to add course to schedule
    const addCourse = async (course) => {
        const classes = availableCourses.filter(c => c.subject_id === course.courseId);

        //Debug
        console.log(`\n📘 Đang xét môn: ${course.courseId} - ${course.subject.subject_name}`);
        console.log(`📊 Tìm được ${classes.length} lớp từ file Excel`);

        if (classes.length === 0) {
            console.log(`❌ Không tìm thấy lớp nào trong Excel cho môn ${course.courseId}`);
            return false;
        }

        // Separate theory and practice classes
        const theoryClasses = classes.filter(c => !/\.\d+$/.test(c.class_id));
        const practiceClasses = classes.filter(c => /\.\d+$/.test(c.class_id));        
        
        // Nếu KHÔNG có lớp lý thuyết mà có thực hành, ta xử lý toàn bộ là lý thuyết (vì môn có thể không tách)
        if (theoryClasses.length === 0 && practiceClasses.length > 0) {
            console.log(`⚠️ Không có lớp lý thuyết rõ ràng cho ${course.courseId}, gán toàn bộ lớp thành LT`);
            theoryClasses = practiceClasses;
            practiceClasses = [];
        }

        const classPairs = getAvailableClassPairs(theoryClasses, practiceClasses);
        if (classPairs.length === 0) {
            console.log(`⚠️ Không tìm được cặp lớp LT + TH hợp lệ cho môn ${course.courseId}`);
            return false;
          }
        console.log(`🔗 Số cặp LT + TH hợp lệ: ${classPairs.length}`);

        // Sắp xếp các cặp lớp theo ngày có ít môn nhất
        classPairs.sort((a, b) => {
            const dayA = getBestDayForCourse([a.theory, ...a.practices], semesterSchedule);
            const dayB = getBestDayForCourse([b.theory, ...b.practices], semesterSchedule);
            return dayA && dayB ? dayA.localeCompare(dayB) : 0;
        });

        for (const pair of classPairs) {
            const bestDay = getBestDayForCourse([pair.theory, ...pair.practices], semesterSchedule);
            if (!bestDay) continue;

            const theoryOccupied = isTimeConflict(semesterSchedule.courses, bestDay, pair.theory.time, pair.theory.slots);
            const practiceOccupied = pair.practices.some(p => 
                isTimeConflict(semesterSchedule.courses, bestDay, p.time, p.slots)
            );
            
            if (!theoryOccupied && !practiceOccupied) {
                // Thêm lớp vào schedule
                semesterSchedule.courses.push({
                    courseId: course.courseId,
                    subjectName: course.subject.subject_name,
                    credits: course.credits,
                    isElective: course.subject.subject_type === 'Elective',
                    classes: [pair.theory, ...pair.practices].map(c => ({
                        ...c,
                        day: bestDay // Sử dụng ngày được chọn tối ưu
                    }))
                });

                // Cập nhật số tín chỉ
                semesterSchedule.totalCredits += course.credits;
                // ... (phần còn lại giữ nguyên)
                return true;
            }
        }
        return false;
    };

    // 1. Add English courses first
    const englishCourses = [
        ...categorizedCourses.generalEducation.Hard.filter(c => ['ENG01', 'ENG02', 'ENG03'].includes(c.courseId)),
        ...categorizedCourses.generalEducation.Medium.filter(c => ['ENG01', 'ENG02', 'ENG03'].includes(c.courseId)),
        ...categorizedCourses.generalEducation.Easy.filter(c => ['ENG01', 'ENG02', 'ENG03'].includes(c.courseId))
    ];
    
    for (const course of englishCourses) {
        if (semesterSchedule.totalCredits >= 28) break;
        await addCourse(course);
    }

    // 2. Add failed courses
    const failedCourses = [
        ...categorizedCourses.majorCore.Hard.filter(c => academicInfo.failedCourses.includes(c.courseId)),
        ...categorizedCourses.majorCore.Medium.filter(c => academicInfo.failedCourses.includes(c.courseId)),
        ...categorizedCourses.majorCore.Easy.filter(c => academicInfo.failedCourses.includes(c.courseId)),
        ...categorizedCourses.majorFoundation.Hard.filter(c => academicInfo.failedCourses.includes(c.courseId)),
        ...categorizedCourses.majorFoundation.Medium.filter(c => academicInfo.failedCourses.includes(c.courseId)),
        ...categorizedCourses.majorFoundation.Easy.filter(c => academicInfo.failedCourses.includes(c.courseId))
    ];

    for (const course of failedCourses) {
        if (semesterSchedule.totalCredits >= 28) break;
        await addCourse(course);
    }

    // 3. Add foundation and general education courses (same priority)
    const foundationAndGeneral = [
        ...categorizedCourses.majorFoundation.Hard,
        ...categorizedCourses.majorFoundation.Medium,
        ...categorizedCourses.majorFoundation.Easy,
        ...categorizedCourses.generalEducation.Hard,
        ...categorizedCourses.generalEducation.Medium,
        ...categorizedCourses.generalEducation.Easy
    ];

    for (const course of foundationAndGeneral) {
        if (semesterSchedule.totalCredits >= 28 || 
            semesterSchedule.majorfoundationCredits >= semesterSchedule.targetMajorFoundation ||
            semesterSchedule.generalEducationCredits >= semesterSchedule.targetGeneralCredits) break;
        await addCourse(course);
    }

    // 4. Add major core courses
    const majorCoreCourses = [
        ...categorizedCourses.majorCore.Hard,
        ...categorizedCourses.majorCore.Medium,
        ...categorizedCourses.majorCore.Easy
    ];

    for (const course of majorCoreCourses) {
        if (semesterSchedule.totalCredits >= 28 || 
            semesterSchedule.majorCredits >= semesterSchedule.targetMajorCore) break;
        await addCourse(course);
    }

    // 5. Add elective courses
    const electiveCourses = [
        ...categorizedCourses.elective.Hard,
        ...categorizedCourses.elective.Medium,
        ...categorizedCourses.elective.Easy
    ];

    for (const course of electiveCourses) {
        if (semesterSchedule.totalCredits >= 28 || 
            semesterSchedule.electiveCredits >= semesterSchedule.targetElectiveCredits) break;
        await addCourse(course);
    }

    // Ensure minimum credits (14)
    if (semesterSchedule.totalCredits < 14) {
        const allRemainingCourses = [
            ...categorizedCourses.majorCore.Hard,
            ...categorizedCourses.majorCore.Medium,
            ...categorizedCourses.majorCore.Easy,
            ...categorizedCourses.majorFoundation.Hard,
            ...categorizedCourses.majorFoundation.Medium,
            ...categorizedCourses.majorFoundation.Easy,
            ...categorizedCourses.generalEducation.Hard,
            ...categorizedCourses.generalEducation.Medium,
            ...categorizedCourses.generalEducation.Easy,
            ...categorizedCourses.elective.Hard,
            ...categorizedCourses.elective.Medium,
            ...categorizedCourses.elective.Easy
        ];

        for (const course of allRemainingCourses) {
            if (semesterSchedule.totalCredits >= 14) break;
            await addCourse(course);
        }
    }
}

async function generateFirstSemesterSchedule(studentId, availableCourses, academicInfo) {
    const firstSemesterCourses = ["SS003", "MA003", "IT001", "PE231"]
        .filter(courseId => !academicInfo.passedCourses.includes(courseId) && availableCourses.some(c => c.subject_id === courseId))
        .slice(0, 4);

    const scheduleCourses = await Promise.all(
        firstSemesterCourses.map(async (courseId) => {
            const subject = await Subject.findOne({ subject_id: courseId });
            const classes = availableCourses.filter(c => c.subject_id === courseId);
            return {
                courseId,
                subjectName: subject?.subject_name || courseId,
                credits: ((subject?.theory_credits || 0) + (subject?.practice_credits || 0)),
                isElective: subject?.subject_type === 'CNTC',
                classes: classes.map(c => ({
                    class_id: c.class_id,
                    day: c.day,
                    time: c.time,
                    room: c.room,
                    lecturer: c.lecturer
                }))
            };
        })
    );

    return {
        2: {
            courses: scheduleCourses,
            totalCredits: scheduleCourses.reduce((sum, c) => sum + c.credits, 0),
            majorCredits: scheduleCourses.filter(c => !c.isElective).reduce((sum, c) => sum + c.credits, 0),
            electiveCredits: scheduleCourses.filter(c => c.isElective).reduce((sum, c) => sum + c.credits, 0),
            warning: academicInfo.passedCourses.length > 0 ? `Đã bỏ qua ${academicInfo.passedCourses.length} môn đã hoàn thành` : null
        }
    };
}



// Dựng thời khóa biểu từ dữ liệu đã xếp
function buildWeeklySchedule(scheduleData) {
    const weeklySchedule = {
        Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [],
        summary: {
            totalCourses: 0,
            daysWithClasses: 0,
            creditsPerDay: {}
        }
    };

    // Đếm số môn và tín chỉ mỗi ngày
    for (const course of scheduleData) {
        for (const cls of course.classes) {
            if (weeklySchedule[cls.day]) {
                weeklySchedule[cls.day].push({
                    time: cls.time,
                    subject: course.subjectName,
                    classId: cls.class_id,
                    room: cls.room,
                    lecturer: cls.lecturer,
                    credits: course.credits
                });
                
                // Cập nhật summary
                if (!weeklySchedule.summary.creditsPerDay[cls.day]) {
                    weeklySchedule.summary.creditsPerDay[cls.day] = 0;
                }
                weeklySchedule.summary.creditsPerDay[cls.day] += course.credits;
            }
        }
        weeklySchedule.summary.totalCourses++;
    }

    // Tính số ngày có lớp
    weeklySchedule.summary.daysWithClasses = Object.keys(weeklySchedule.summary.creditsPerDay).length;

    // Sắp xếp từng ngày theo thời gian bắt đầu
    for (const day in weeklySchedule) {
        if (Array.isArray(weeklySchedule[day])) {
            weeklySchedule[day].sort((a, b) => {
                const [aHour, aMin] = a.time.split(' - ')[0].split(':').map(Number);
                const [bHour, bMin] = b.time.split(' - ')[0].split(':').map(Number);
                return (aHour * 60 + aMin) - (bHour * 60 + bMin);
            });
        }
    }

    return weeklySchedule;
}
// Main API function
exports.generateOptimizedSchedule = async (studentId, excelFilePath) => {
    try {
        const workbook = XLSX.readFile(excelFilePath);
        const worksheetLT = workbook.Sheets[workbook.SheetNames[0]];
        const worksheetTH = workbook.Sheets[workbook.SheetNames[1]];

        const ltCourses = parseExcelSheetData(worksheetLT);
        const thCourses = parseExcelSheetData(worksheetTH);

        const availableCourses = [...ltCourses, ...thCourses];

        const academicInfo = await getStudentAcademicInfo(studentId);
        const currentSemester = academicInfo.currentSemester;

        let schedule;
        if (currentSemester === 1) {
    const firstSchedule = await generateFirstSemesterSchedule(studentId, availableCourses, academicInfo);
    if (!firstSchedule || typeof firstSchedule !== 'object') {
        throw new Error("❌ generateFirstSemesterSchedule không trả ra kết quả hợp lệ");
    }
    schedule = firstSchedule;
} else {
            const requiredCourses = await getRequiredCoursesForStudent(studentId);
            const validCourses = availableCourses.filter(course => requiredCourses.includes(course.subject_id));
            const coursesToTake = filterRequiredCourses(academicInfo);
            const { eligibleCourses } = await checkPrerequisites(coursesToTake, academicInfo.passedCourses);

            const availableSubjectIds = [...new Set(availableCourses.map(c => c.subject_id))];
            const filteredEligibleCourses = eligibleCourses.filter(courseId => availableSubjectIds.includes(courseId));

            const courseDifficulty = await calculateCourseDifficulty(filteredEligibleCourses);
            const categorized = await categorizeCourses(filteredEligibleCourses, courseDifficulty);
            const creditTargets = calculateCreditTargets(academicInfo);

            schedule = initializeScheduleStructure(currentSemester + 1, creditTargets);
            await applyCourseByPriority(schedule, categorized, validCourses, academicInfo);
        }

        if (!schedule || typeof schedule !== 'object') {
            throw new Error("❌ Không tạo được thời khóa biểu – schedule null hoặc không hợp lệ");
        }

        const semesterKeys = Object.keys(schedule);
        if (!Array.isArray(semesterKeys) || semesterKeys.length === 0) {
            throw new Error("❌ Không có học kỳ nào trong schedule");
        }

        const semesterKey = semesterKeys[0];
        const semesterData = schedule[semesterKey];

        if (!semesterData?.courses || !Array.isArray(semesterData.courses)) {
            throw new Error("❌ Không có dữ liệu lớp học nào trong schedule");
        }

        const scheduleData = semesterData.courses;
        const weekly = buildWeeklySchedule(scheduleData);

        return { schedule, weeklyTimetable: weekly };
    } catch (error) {
        console.error('Error generating schedule:', error);
        throw error;
    } finally {
        try { await fs.unlink(excelFilePath); } catch (err) {}
    }
};  