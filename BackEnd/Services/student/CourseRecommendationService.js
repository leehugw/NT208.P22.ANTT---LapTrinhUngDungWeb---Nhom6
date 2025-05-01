const XLSX = require('xlsx');
const fs = require('fs').promises;
const Student = require("../../../Database/SaveToMongo/models/Student");
const Score = require('../../../Database/SaveToMongo/models/Score');
const Subject = require('../../../Database/SaveToMongo/models/Subject');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');
const StudentAcademic = require('../../../Database/SaveToMongo/models/StudentAcademic');

//Kiểm tra hai khoảng thời gian xem có trùng nhau
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

//Kiểm tra tiết học có trùng nhau
function isSlotConflict(existingSlots, newSlots) {
    return existingSlots.some(slot => newSlots.includes(slot));
}

//Kiểm tra lớp mới có trùng lịch không
function isTimeConflict(schedule, day, newTime, newSlots) {
    return schedule.some(c =>
        c.classes.some(cls =>
            cls.day === day &&
            (isTimeOverlap(cls.time, newTime) || isSlotConflict(cls.slots, newSlots))
        )
    );
}

// Lấy thông tin sinh viên
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

//Xác định danh sách các môn cần học
function filterRequiredCourses(academicInfo) {
    const { passedCourses, failedCourses, major, currentSemester, englishCourses, hasEnglishCertificate } = academicInfo;
    const requiredCourses = major.required_courses || [];

    let coursesToTake = requiredCourses.filter(courseId => !passedCourses.includes(courseId));
    coursesToTake = [...new Set([...coursesToTake, ...failedCourses])];

    // Đánh dấu các môn đã rớt
    const failedCoursesSet = new Set(failedCourses);

    if (!hasEnglishCertificate) {
        const requiredEnglishCourse = getRequiredEnglishCourse(currentSemester + 1, englishCourses);
        coursesToTake = coursesToTake.filter(courseId => !['ENG01', 'ENG02', 'ENG03'].includes(courseId));
        if (requiredEnglishCourse && !englishCourses[requiredEnglishCourse]) {
            coursesToTake.push(requiredEnglishCourse);
        }
    } else {
        coursesToTake = coursesToTake.filter(courseId => !['ENG01', 'ENG02', 'ENG03'].includes(courseId));
    }

    return {
        courses: coursesToTake,
        failedCourses: failedCoursesSet
    };
}

//Xác định môn nào đủ điều kiện học/môn nào chưa rồi liệt kê môn tiên quyết còn thiếu
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

//Tính toán mức độ khó của môn học dựa trên điểm trung bình
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

//Đánh giá độ khó
function calculateDifficultyLevel(avgScore) {
    if (avgScore === null) return 0.5;
    if (avgScore >= 9.0) return 0.1;
    if (avgScore >= 8.0) return 0.3;
    if (avgScore >= 7.0) return 0.5;
    if (avgScore >= 5.5) return 0.7;
    return 0.9;
}

//Xác định sinh viên đang học kỳ số mấy
async function getCurrentSemesterNum(studentId) {
    const result = await Score.aggregate([
        { $match: { student_id: studentId } },
        { $group: { _id: "$semester_id" } }, // Lấy các học kỳ khác nhau
        { $count: "semesterCount" } // Đếm số học kỳ
    ]);

    return result.length === 0 ? 1 : result[0].semesterCount;
}


//Xác định môn tiếng anh cần học cho kỳ tiếp
function getRequiredEnglishCourse(semesterNum, englishCourses) {
    if (englishCourses.ENG01 && englishCourses.ENG02 && englishCourses.ENG03) return null;
    if (!englishCourses.ENG03 && englishCourses.ENG01 && englishCourses.ENG02) return 'ENG03';
    if (!englishCourses.ENG02 && englishCourses.ENG01) return 'ENG02';
    if (!englishCourses.ENG01 && semesterNum >= 1) return 'ENG01';
    return null;
}

//Tính toán chỉ tiêu tín chỉ cần đăng ký
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

//Phân loại môn học dự trên độ khó
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

    return coursesByType;
}

// Xếp các môn đã rớt vào lịch theo mức độ khó
async function scheduleFailedCourses(semesterSchedule, categorized, availableCourses, failedCourses) {
    // Lấy tất cả các môn đã rớt từ tất cả các danh mục
    const allFailedCourses = [
        ...categorized.majorCore.Hard.filter(c => failedCourses.has(c.courseId)),
        ...categorized.majorCore.Medium.filter(c => failedCourses.has(c.courseId)),
        ...categorized.majorCore.Easy.filter(c => failedCourses.has(c.courseId)),
        ...categorized.majorFoundation.Hard.filter(c => failedCourses.has(c.courseId)),
        ...categorized.majorFoundation.Medium.filter(c => failedCourses.has(c.courseId)),
        ...categorized.majorFoundation.Easy.filter(c => failedCourses.has(c.courseId)),
        ...categorized.generalEducation.Hard.filter(c => failedCourses.has(c.courseId)),
        ...categorized.generalEducation.Medium.filter(c => failedCourses.has(c.courseId)),
        ...categorized.generalEducation.Easy.filter(c => failedCourses.has(c.courseId)),
        ...categorized.elective.Hard.filter(c => failedCourses.has(c.courseId)),
        ...categorized.elective.Medium.filter(c => failedCourses.has(c.courseId)),
        ...categorized.elective.Easy.filter(c => failedCourses.has(c.courseId))
    ];

    //Kiểm tra tổng tín chỉ
    for (const course of allFailedCourses) {
        if (semesterSchedule.totalCredits >= 28) break;
        await addCourseStrictly(semesterSchedule, course, availableCourses);
    }
}

//Xếp môn tiếng anh vào thời khóa biểu
async function scheduleEnglishCourses(semesterSchedule, categorized, availableCourses) {
    const englishCourses = [
        ...categorized.generalEducation.Hard.filter(c => ['ENG01', 'ENG02', 'ENG03'].includes(c.courseId)),
        ...categorized.generalEducation.Medium.filter(c => ['ENG01', 'ENG02', 'ENG03'].includes(c.courseId)),
        ...categorized.generalEducation.Easy.filter(c => ['ENG01', 'ENG02', 'ENG03'].includes(c.courseId))
    ];

    for (const course of englishCourses) {
        if (semesterSchedule.totalCredits >= 28) break;
        await addCourseStrictly(semesterSchedule, course, availableCourses, true);
    }
}

//Xếp cơ sở ngành
async function scheduleMajorFoundationCourses(semesterSchedule, categorized, availableCourses, academicInfo) {
    const majorCourses = [
        ...categorized.majorFoundation.Hard,
        ...categorized.majorFoundation.Medium,
        ...categorized.majorFoundation.Easy
    ];

    for (const course of majorCourses) {
        if (semesterSchedule.totalCredits >= 28) break;
        if (semesterSchedule.majorfoundationCredits >= semesterSchedule.targetMajorFoundation) break;

        await addCourseStrictly(semesterSchedule, course, availableCourses);
    }
}

//Xếp đại cương
async function scheduleGeneralEducationCourses(semesterSchedule, categorized, availableCourses, academicInfo) {
    const generalCourses = [
        ...categorized.generalEducation.Hard,
        ...categorized.generalEducation.Medium,
        ...categorized.generalEducation.Easy
    ];
    for (const course of generalCourses) {
        if (semesterSchedule.totalCredits >= 28) break;
        if (semesterSchedule.generalEducationCredits >= semesterSchedule.targetGeneralCredits) break;

        await addCourseStrictly(semesterSchedule, course, availableCourses);
    }
}

//Xếp chuyên ngành
async function scheduleMajorCourses(semesterSchedule, categorized, availableCourses) {
    const majorCourses = [
        ...categorized.majorCore.Hard,
        ...categorized.majorCore.Medium,
        ...categorized.majorCore.Easy
    ];

    for (const course of majorCourses) {
        if (semesterSchedule.totalCredits >= 28) break;
        if (semesterSchedule.majorCredits >= semesterSchedule.targetMajorCore) break;

        await addCourseStrictly(semesterSchedule, course, availableCourses);
    }
}

//Xếp tự chọn
async function scheduleElectiveCourses(semesterSchedule, categorized, availableCourses) {
    const electiveCourses = [
        ...categorized.elective.Hard,
        ...categorized.elective.Medium,
        ...categorized.elective.Easy
    ];

    for (const course of electiveCourses) {
        if (semesterSchedule.totalCredits >= 28) break;
        if (semesterSchedule.electiveCredits >= semesterSchedule.targetElectiveCredits) break;

        await addCourseStrictly(semesterSchedule, course, availableCourses);
    }
}

//Kiểm tra lớp có thực hành không => Thêm vào lịch
async function addCourseStrictly(semesterSchedule, course, availableCourses) {
    const classes = availableCourses.filter(c => c.subject_id === course.courseId);
    if (classes.length === 0) return false;

    let theoryClasses = classes.filter(c => !/\.\d+$/.test(c.class_id));
    let practiceClasses = classes.filter(c => /\.\d+$/.test(c.class_id));

    if (theoryClasses.length === 0 && practiceClasses.length > 0) {
        theoryClasses = practiceClasses;
        practiceClasses = [];
    }

    for (const theoryClass of theoryClasses) {
        // Kiểm tra xem lớp lý thuyết có trùng không
        if (isTimeConflict(semesterSchedule.courses, theoryClass.day, theoryClass.time, theoryClass.slots)) continue;

        // Tìm 1 lớp thực hành phù hợp (không trùng)
        let selectedPractice = null;
        for (const p of practiceClasses) {
            const isSameGroup = p.class_id.startsWith(`${theoryClass.class_id}.`);
            if (!isSameGroup) continue;
            if (isTimeConflict(semesterSchedule.courses, p.day, p.time, p.slots)) continue;
            selectedPractice = p;
            break;
        }

        // Gom lớp lý thuyết + thực hành (nếu có)
        const classesToAdd = selectedPractice ? [theoryClass, selectedPractice] : [theoryClass];

        semesterSchedule.courses.push({
            classes: classesToAdd
        });

        updateCreditCounts(semesterSchedule, course);
        return true;
    }

    return false;
}

//Kiểm tra lịch trùng nếu có với lớp anh văn
function hasConflictWithEnglish(semesterSchedule, course, availableCourses) {
    const englishClasses = semesterSchedule.courses
        .filter(c => ['ENG01', 'ENG02', 'ENG03'].includes(c.courseId))
        .flatMap(c => c.classes);

    const courseClasses = availableCourses.filter(c => c.subject_id === course.courseId);

    return courseClasses.some(cls =>
        englishClasses.some(engClass =>
            isTimeOverlap(engClass.time, cls.time)
        )
    );
}

//Cập nhật tổng tín chỉ
function updateCreditCounts(semesterSchedule, course) {
    semesterSchedule.totalCredits += course.credits;

    switch (course.subject.subject_type) {
        case "CN": case "CNTC": case "ĐA":
            semesterSchedule.majorCredits += course.credits;
            break;
        case "CSNN": case "CSN":
            semesterSchedule.majorfoundationCredits += course.credits;
            break;
        case "ĐC":
            semesterSchedule.generalEducationCredits += course.credits;
            break;
        case "TTTN": case "TN": case "KLTN": case "CĐTN":
            semesterSchedule.electiveCredits += course.credits;
            break;
    }
}

//Đảm bảo số tín chỉ đạt tối thiểu
function ensureMinimumCredits(semesterSchedule, categorized, availableCourses) {
    if (semesterSchedule.totalCredits >= 14) return;

    const allCourses = [
        ...categorized.majorCore.Hard,
        ...categorized.majorCore.Medium,
        ...categorized.majorCore.Easy,
        ...categorized.majorFoundation.Hard,
        ...categorized.majorFoundation.Medium,
        ...categorized.majorFoundation.Easy,
        ...categorized.generalEducation.Hard,
        ...categorized.generalEducation.Medium,
        ...categorized.generalEducation.Easy,
        ...categorized.elective.Hard,
        ...categorized.elective.Medium,
        ...categorized.elective.Easy
    ];

    const scheduledCourses = new Set(semesterSchedule.courses.map(c => c.courseId));
    const remainingCourses = allCourses.filter(c => !scheduledCourses.has(c.courseId));

    for (const course of remainingCourses) {
        if (semesterSchedule.totalCredits >= 14) break;
        addCourseStrictly(semesterSchedule, course, availableCourses);
    }
}

//Tạo lịch cho học kì đầu tiên
async function generateFirstSemesterSchedule(availableCourses, academicInfo) {
    const { passedCourses, currentSemester } = academicInfo;
    const nextSemester = currentSemester + 1;

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
                classes: classes
            };
        })
    );

    return {
        [nextSemester]: {
            courses: scheduleCourses,
            totalCredits: scheduleCourses.reduce((sum, c) => sum + c.credits, 0),
            majorCredits: scheduleCourses.filter(c => !c.isElective).reduce((sum, c) => sum + c.credits, 0),
            electiveCredits: scheduleCourses.filter(c => c.isElective).reduce((sum, c) => sum + c.credits, 0),
            warning: academicInfo.passedCourses.length > 0 ? `Đã bỏ qua ${academicInfo.passedCourses.length} môn đã hoàn thành` : null
        }
    };
}

//Tạo lịch học cho sinh viên
async function generateStrictSchedule(studentId, availableCourses, academicInfo) {
    const { passedCourses, currentSemester } = academicInfo;
    const nextSemester = currentSemester + 1;

    const { courses: coursesToTake, failedCourses } = filterRequiredCourses(academicInfo);
    const { eligibleCourses } = await checkPrerequisites(coursesToTake, passedCourses);

    //lọc để lấy môn đủ điều kiện và có sẵn trong danh sách mở lớp
    const availableSubjectIds = [...new Set(availableCourses.map(c => c.subject_id))];
    const filteredEligibleCourses = eligibleCourses.filter(courseId => availableSubjectIds.includes(courseId));

    const courseDifficulty = await calculateCourseDifficulty(filteredEligibleCourses);
    const categorized = await categorizeCourses(filteredEligibleCourses, courseDifficulty);

    const creditTargets = calculateCreditTargets(academicInfo);
    const schedule = initializeScheduleStructure(nextSemester, creditTargets);
    const semesterSchedule = schedule[nextSemester];

    // 1. Ưu tiên xếp Anh văn trước
    await scheduleEnglishCourses(semesterSchedule, categorized, availableCourses);

    // 2. Ưu tiên xếp các môn đã rớt
    await scheduleFailedCourses(semesterSchedule, categorized, availableCourses, failedCourses);

    // 3. Xếp các môn còn lại theo thứ tự ưu tiên
    await scheduleMajorFoundationCourses(semesterSchedule, categorized, availableCourses);
    await scheduleGeneralEducationCourses(semesterSchedule, categorized, availableCourses);
    await scheduleMajorCourses(semesterSchedule, categorized, availableCourses, academicInfo);
    await scheduleElectiveCourses(semesterSchedule, categorized, availableCourses, academicInfo);

    ensureMinimumCredits(semesterSchedule, categorized, availableCourses);

    return schedule;
}

// Main API function
exports.generateOptimizedSchedule = async (studentId, availableCourses) => {
    try {
        // Dùng luôn availableCourses thay vì đọc từ file
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
            schedule = await generateStrictSchedule(studentId, availableCourses, academicInfo);
        }

        if (!schedule || typeof schedule !== 'object') {
            throw new Error("❌ Không tạo được thời khóa biểu – schedule null hoặc không hợp lệ");
        }

        return { schedule };
    } catch (error) {
        console.error('Error generating schedule:', error);
        throw error;
    }
};