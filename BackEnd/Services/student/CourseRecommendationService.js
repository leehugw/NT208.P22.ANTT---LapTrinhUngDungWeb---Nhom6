// CourseRecommendationController.js
const Student = require("../../../Database/SaveToMongo/models/Student");
const Score = require('../../../Database/SaveToMongo/models/Score');
const Subject = require('../../../Database/SaveToMongo/models/Subject');
const TrainingProgram = require('../../../Database/SaveToMongo/models/TrainingProgram');
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

// Helper function to parse Excel date
function parseExcelDate(excelDate) {
    const parsed = XLSX.SSF.parse_date_code(excelDate);
    if (!parsed) return null;
    const yyyy = parsed.y;
    const mm = String(parsed.m).padStart(2, '0');
    const dd = String(parsed.d).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
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
const getRequiredCoursesForStudent = async (student_id) => {
    const student = await Student.findOne({ student_id });
    const trainingProgram = await TrainingProgram.findOne({ program_id: student.program_id });
    const major = trainingProgram.majors.find(m => m.major_id === student.major_id);
    return major.required_courses; // danh sách subject_id cần học
};
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
// Step 1: Get student academic information
async function getStudentAcademicInfo(studentId) {
    const student = await Student.findOne({ student_id: studentId });
    if (!student) throw new Error('Student not found');

    const scores = await Score.find({ student_id: studentId }).populate({
        path: 'subject_id',
        model: 'Subject',
        select: 'subject_id subject_name theory_credits practice_credits',
        options: { lean: true } // Sử dụng lean để tránh cast không cần thiết
      });
    // Lấy tất cả điểm đã đậu (kể cả học lại)
    const passedScores = await Score.find({ 
        student_id: studentId,
        status: "Đậu",
        isRetaken: { $ne: true } // Loại trừ các môn học lại
    });

    const failedScores = scores.filter(s => s.status === 'Rớt');

    // Check English completion status and which English courses have been taken
    const englishCourses = {
        ENG01: false,
        ENG02: false,
        ENG03: false
    };

    // Chỉ gán true nếu thực sự đã hoàn thành môn học
    passedScores.forEach(score => {
        const subjectId = typeof score.subject_id === 'string' 
            ? score.subject_id 
            : score.subject_id.subject_id;
    
        if (subjectId === 'ENG01') englishCourses.ENG01 = true;
        if (subjectId === 'ENG02') englishCourses.ENG02 = true;
        if (subjectId === 'ENG03') englishCourses.ENG03 = true;
    });
    

    const trainingProgram = await TrainingProgram.findOne({ program_id: student.program_id });
    if (!trainingProgram) throw new Error('Training program not found');

    const major = trainingProgram.majors.find(m => m.major_id === student.major_id);
    if (!major) throw new Error('Major not found');

    // Calculate current semester
    const currentSemester = await getCurrentSemesterNum(studentId);
    const remainingSemesters = (major.progress_details.required_semesters || 8) - currentSemester;
    const passedCourses = passedScores.map(s =>
        typeof s.subject_id === 'string' ? s.subject_id : s.subject_id.subject_id
    );
    console.log('✅ passedCourses:', passedCourses);
    console.log('🧠 englishCourses:', englishCourses);

    return {
        student,
        scores,
        passedScores,
        failedScores,
        passedCourses,
        failedCourses: failedScores.map(s => s.subject_id),
        trainingProgram,
        major,
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

// Enhanced course filtering with English course sequencing
function filterRequiredCourses(academicInfo) {
    const { passedCourses, failedCourses, major, currentSemester, englishCourses, hasEnglishCertificate } = academicInfo;
    
    // Get required courses from training program
    const requiredCourses = major.required_courses || [];
    
    // Filter out passed courses and keep failed courses
    let coursesToTake = requiredCourses.filter(
        courseId => !passedCourses.includes(courseId)
    );
    
    // Include failed courses even if they're not in required courses
    coursesToTake = [...new Set([...coursesToTake, ...failedCourses])];
    
    // Handle English courses based on semester and completion status
    if (!hasEnglishCertificate) {
        const requiredEnglishCourse = getRequiredEnglishCourse(currentSemester + 1, englishCourses);
        
        // Remove all English courses first
        coursesToTake = coursesToTake.filter(courseId => 
            !['ENG01', 'ENG02', 'ENG03'].includes(courseId)
        );
        
        // Only add the required English course if not already passed
        if (requiredEnglishCourse && !englishCourses[requiredEnglishCourse]) {
            coursesToTake.push(requiredEnglishCourse);
        }
    } else {
        // Remove all English courses if certificate exists
        coursesToTake = coursesToTake.filter(courseId => 
            !['ENG01', 'ENG02', 'ENG03'].includes(courseId)
        );
    }

    return coursesToTake;
}

// Determine which English course should be taken in a given semester
function getRequiredEnglishCourse(semesterNum, englishCourses) {
    // Nếu đã hoàn thành tất cả môn Anh văn
    if (englishCourses.ENG01 && englishCourses.ENG02 && englishCourses.ENG03) {
        return null;
    }

    // Chỉ đề xuất 1 môn Anh văn duy nhất theo trình tự
    if (!englishCourses.ENG01 && semesterNum >= 1) {
        return 'ENG01';
    }
    if (!englishCourses.ENG02 && semesterNum >= 2 && englishCourses.ENG01) {
        return 'ENG02';
    }
    if (!englishCourses.ENG03 && semesterNum >= 3 && englishCourses.ENG02) {
        return 'ENG03';
    }
    
    return null;
}

// Enhanced prerequisite checking with subject details
async function checkPrerequisites(courseIds, passedCourses) {
    const subjects = await Subject.find({ subject_id: { $in: courseIds } }).lean();
    
    const eligibleCourses = [];
    const ineligibleCourses = [];
    
    for (const subject of subjects) {
        // Sửa điều kiện kiểm tra: nếu prerequisite_id rỗng hoặc là mảng rỗng thì tự động eligible
        if (!subject.prerequisite_id || subject.prerequisite_id.length === 0 || 
            subject.prerequisite_id.every(pre => pre.trim() === "")) {
            eligibleCourses.push(subject.subject_id);
            continue;
        }
        
        const allPrereqsMet = subject.prerequisite_id.every(preId => 
            preId.trim() === "" || passedCourses.includes(preId)
        );
        
        if (allPrereqsMet) {
            eligibleCourses.push(subject.subject_id);
        } else {
            ineligibleCourses.push({
                courseId: subject.subject_id,
                missingPrerequisites: subject.prerequisite_id.filter(
                    preId => preId.trim() !== "" && !passedCourses.includes(preId)
                )
            });
        }
    }
    
    return { eligibleCourses, ineligibleCourses };
}

function isTimeOverlap(time1, time2) {
    const [start1, end1] = time1.split(' - ').map(t => t.replace(':', ''));
    const [start2, end2] = time2.split(' - ').map(t => t.replace(':', ''));
    return !(end1 <= start2 || end2 <= start1);
}
// Improved Excel parser that starts from row 8 (header) and data from row 9
function parseExcelSheetData(worksheet) {
    if (!worksheet || !worksheet['!ref']) return [];

    // Convert to JSON starting from row 8 (header) and data from row 9
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 7 });
    if (!jsonData || jsonData.length < 2) return []; // Need at least header and one data row

    const headerRow = jsonData[0] || [];
    const classList = [];

    // Process data starting from row 9 (index 1 in jsonData)
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        // Find column indexes based on header
        const maMHIndex = headerRow.indexOf('MÃ MH');
        const tenMHIndex = headerRow.indexOf('TÊN MÔN HỌC');
        const maLopIndex = headerRow.indexOf('MÃ LỚP');
        const thuIndex = headerRow.indexOf('THỨ');
        const tietIndex = headerRow.indexOf('TIẾT');
        const phongIndex = headerRow.indexOf('PHÒNG HỌC');
        const tenGvIndex = headerRow.findIndex(h => h === 'TÊN GIẢNG VIÊN' || h === 'TÊN TRỢ GIẢNG');

        // Skip if required columns are missing
        if (maMHIndex === -1 || tenMHIndex === -1 || maLopIndex === -1 || 
            thuIndex === -1 || tietIndex === -1) continue;

        const subjectCode = row[maMHIndex];
        const subjectName = row[tenMHIndex];
        const classId = row[maLopIndex];
        const dayOfWeek = row[thuIndex] ? DAY_MAPPING[row[thuIndex].toString()] : null;
        const tietString = row[tietIndex] ? row[tietIndex].toString() : '';

        // Process time slots
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
                day: dayOfWeek,
                slots,
                time: `${SLOT_TIME_MAPPING[slots[0]].start} - ${SLOT_TIME_MAPPING[slots[slots.length - 1]].end}`,
                room: phongIndex !== -1 ? row[phongIndex] : null
            });
        }
    }

    return classList;
}
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

async function calculateCourseDifficulty(courseIds) {
    // 1. Lấy tất cả điểm của các môn cần tính
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

    // 2. Tạo kết quả
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
    if (avgScore === null) return 0.5; // Mặc định nếu không có dữ liệu
    
    if (avgScore >= 9.0) return 0.1;  // Rất dễ
    if (avgScore >= 8.0) return 0.3;
    if (avgScore >= 7.0) return 0.5;  // Trung bình
    if (avgScore >= 5.5) return 0.7;
    return 0.9;                       // Rất khó
}

// Hàm tính học kỳ hiện tại
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
// Enhanced main API endpoint
async function generateOptimizedSchedule(student, courseIds, courseDifficulty, availableCourses, academicInfo) {
    // 1. Lọc bỏ các môn đã đậu và không có trong availableCourses
    const filteredCourses = courseIds.filter(courseId => 
        !academicInfo.passedCourses.includes(courseId) &&
        availableCourses.some(c => c.subject_id === courseId)
    );

    // Xử lý đặc biệt cho học kỳ đầu
    if (academicInfo.currentSemester === 1) {
        const firstSemesterCourses = ["SS003", "MA003", "IT001", "PE231"]
            .filter(courseId => filteredCourses.includes(courseId))
            .slice(0, 4); // Chỉ lấy tối đa 4 môn

        const scheduleCourses = await Promise.all(
            firstSemesterCourses.map(async (courseId) => {
                const subject = await Subject.findOne({ subject_id: courseId });
                const classes = availableCourses.filter(c => c.subject_id === courseId);
                return {
                    courseId,
                    subjectName: subject?.subject_name || courseId,
                    credits: ((subject?.theory_credits || 0) + (subject?.practice_credits || 0)),
                    isElective: subject?.subject_type === 'CNTC',
                    classes
                };
            })
        );

        return {
            [2]: {
                courses: scheduleCourses,
                totalCredits: scheduleCourses.reduce((sum, c) => sum + c.credits, 0),
                warning: academicInfo.passedCourses.length > 0 ? 
                    `Đã bỏ qua ${academicInfo.passedCourses.length} môn đã hoàn thành` : null
            }
        };
    }

    const nextSemester = academicInfo.currentSemester + 1;
    const subjects = await Subject.find({ subject_id: { $in: filteredCourses } });
    
    // 1. Tính toán số tín chỉ đã hoàn thành theo loại môn học
    const passedSubjects = await Subject.find({ 
        subject_id: { $in: academicInfo.passedScores.map(s => s.subject_id) }
    });

    let completedMajorCredits = 0;
    let completedElectiveCredits = 0;

    passedSubjects.forEach(subject => {
        const credits = (subject.theory_credits || 0) + (subject.practice_credits || 0);
        if (subject.subject_type === 'CN') { // Môn chuyên ngành bắt buộc
            completedMajorCredits += credits;
        } else if (subject.subject_type === 'CNTC') { // Môn tự chọn
            completedElectiveCredits += credits;
        }
    });

    // 2. Tính số tín chỉ còn lại cần học
    const remainingMajorCredits = academicInfo.major.progress_details.required_major_core - completedMajorCredits;
    const remainingElectiveCredits = academicInfo.major.progress_details.required_elective_credits - completedElectiveCredits;

    // 3. Tính target credits cho học kỳ tới
    const targetMajorCredits = Math.min(
        Math.ceil(remainingMajorCredits / academicInfo.remainingSemesters),
        28
    );
    const targetElectiveCredits = Math.min(
        Math.ceil(remainingElectiveCredits / academicInfo.remainingSemesters),
        28 - targetMajorCredits
    );

    // 4. Phân loại môn học theo độ khó và loại môn
    // 1. Initialize the categorization structure
    const coursesByType = {
        major: { Hard: [], Medium: [], Easy: [] },
        elective: { Hard: [], Medium: [], Easy: [] }
    };
    
    // 3. Categorize each course
    courseIds.forEach(courseId => {
        const subject = subjects.find(s => s.subject_id === courseId);
        if (!subject) return;
        
        const difficultyData = courseDifficulty[courseId];
        if (!difficultyData) return;

        const difficultyLevel = difficultyData.difficulty <= 0.3 ? 'Hard' :
                               difficultyData.difficulty <= 0.7 ? 'Medium' : 'Easy';

        const credits = (subject.theory_credits || 0) + (subject.practice_credits || 0);
        const type = subject.subject_type === 'CNTC' ? 'elective' : 'major';

        if (coursesByType[type] && coursesByType[type][difficultyLevel]) {
            coursesByType[type][difficultyLevel].push({
                courseId,
                subject,
                credits,
                difficulty: difficultyLevel
            });
        }
    });

    const schedule = {
        [nextSemester]: {
            courses: [],
            totalCredits: 0,
            majorCredits: 0,
            electiveCredits: 0,
            targetMajorCredits, // Thêm thông tin target vào schedule
            targetElectiveCredits
        }
    };

    // Helper function to add course to schedule
    const addCourseToSchedule = (course) => {
        const classes = availableCourses.filter(c => 
            c.subject_id === course.courseId &&
            !academicInfo.passedCourses.includes(course.courseId)
        );

        if (classes.length === 0) return false;

        // Check credit limits (14-28 per semester)
        const newTotal = schedule[nextSemester].totalCredits + course.credits;
        if (newTotal > 28) return false;
        
        // Check if course already added
        if (schedule[nextSemester].courses.some(c => c.courseId === course.courseId)) {
            return false;
        }

        // Check for time conflicts
        const newClass = classes[0];
        const hasConflict = schedule[nextSemester].courses.some(addedCourse => {
            return addedCourse.classes.some(addedClass => {
                return addedClass.day === newClass.day && 
                       isTimeOverlap(addedClass.time, newClass.time);
            });
        });
        
        if (hasConflict) return false;

        // Add to schedule
        schedule[nextSemester].courses.push({
            courseId: course.courseId,
            subjectName: course.subject.subject_name,
            credits: course.credits,
            isElective: course.subject.subject_type === 'Elective',
            classes: classes.map(c => ({
                class_id: c.class_id,
                day: c.day,
                time: c.time,
                room: c.room,
                lecturer: c.lecturer
            }))
        });
        
        // Update credit counters
        schedule[nextSemester].totalCredits += course.credits;
        if (course.subject.subject_type === 'Elective') {
            schedule[nextSemester].electiveCredits += course.credits;
        } else {
            schedule[nextSemester].majorCredits += course.credits;
        }
        
        return true;
    };

    // 5. Ưu tiên xếp môn chuyên ngành trước
    for (const difficulty of ['Hard', 'Medium', 'Easy']) {
        while (coursesByType.major[difficulty].length > 0 && 
               schedule[nextSemester].majorCredits < targetMajorCredits) {
            const course = coursesByType.major[difficulty].shift();
            addCourseToSchedule(course);
        }
    }

    // 6. Xếp môn tự chọn nếu còn chỗ
    for (const difficulty of ['Hard', 'Medium', 'Easy']) {
        while (coursesByType.elective[difficulty].length > 0 && 
               schedule[nextSemester].electiveCredits < targetElectiveCredits &&
               schedule[nextSemester].totalCredits < 28) {
            const course = coursesByType.elective[difficulty].shift();
            addCourseToSchedule(course);
        }
    }

    // 7. Đảm bảo đủ tối thiểu 14 tín chỉ
    if (schedule[nextSemester].totalCredits < 14) {
        const allRemainingCourses = [
            ...coursesByType.major.Hard,
            ...coursesByType.major.Medium,
            ...coursesByType.major.Easy,
            ...coursesByType.elective.Hard,
            ...coursesByType.elective.Medium,
            ...coursesByType.elective.Easy
        ];
        
        for (const course of allRemainingCourses) {
            if (addCourseToSchedule(course) && 
                schedule[nextSemester].totalCredits >= 14) {
                break;
            }
        }
    }

    return schedule;
}
// Add this function to CourseRecommendationService.js before the getOptimizedSchedule function
function filterAvailableCourses(eligibleCourses, availableCourses, passedCourses) {
    const availableCourseIds = new Set(availableCourses.map(c => c.subject_id));
    
    return eligibleCourses.filter(courseId => 
        availableCourseIds.has(courseId) && 
        !passedCourses.includes(courseId)
    );
}
async function calculateCreditSummary(passedScores) {
    const passedSubjects = await Subject.find({
        subject_id: { $in: passedScores.map(s => s.subject_id) }
    });

    return passedSubjects.reduce((summary, subject) => {
        const credits = (subject.theory_credits || 0) + (subject.practice_credits || 0);
        return {
            majorCredits: summary.majorCredits + (subject.subject_type === 'CN' ? credits : 0),
            electiveCredits: summary.electiveCredits + (subject.subject_type === 'CNTC' ? credits : 0),
            totalCredits: summary.totalCredits + credits
        };
    }, { majorCredits: 0, electiveCredits: 0, totalCredits: 0 });
}

async function prioritizeEnglishCourses(subjects, currentSemester) {
    // Phân loại môn học
    const englishCourses = subjects.filter(sub => ['ENG01', 'ENG02', 'ENG03'].includes(sub.subject_id));
    const otherCourses = subjects.filter(sub => !['ENG01', 'ENG02', 'ENG03'].includes(sub.subject_id));

    // Sắp xếp môn Anh văn theo trình tự và học kỳ phù hợp
    const sortedEnglishCourses = englishCourses.sort((a, b) => {
        // Ưu tiên ENG01 trước, sau đó đến ENG02, cuối cùng là ENG03
        const order = { 'ENG01': 1, 'ENG02': 2, 'ENG03': 3 };
        return order[a.subject_id] - order[b.subject_id];
    }).filter(course => {
        // Lọc theo học kỳ phù hợp
        if (course.subject_id === 'ENG01' && currentSemester >= 1) return true;
        if (course.subject_id === 'ENG02' && currentSemester >= 2) return true;
        if (course.subject_id === 'ENG03' && currentSemester >= 3) return true;
        return false;
    });
console.log("🧠 englishCourses:", englishCourses);

    // Sắp xếp các môn khác theo độ khó
    const sortedOtherCourses = await prioritizeByDifficulty(otherCourses);

    // Kết hợp lại, ưu tiên môn Anh văn lên đầu
    return [...sortedEnglishCourses, ...sortedOtherCourses];
}
function getAvailableClassPairs(theoryClasses, practiceClasses) {
    const pairs = [];
    
    theoryClasses.forEach(theoryClass => {
        const matchingPractices = practiceClasses.filter(p => 
            p.class_id.startsWith(`${theoryClass.class_id}.`)
        );
        
        if (matchingPractices.length > 0) {
            pairs.push({
                theory: theoryClass,
                practices: matchingPractices
            });
        }
    });
    
    return pairs;
}
async function suggestClasses(studentId, theoryClasses, practiceClasses, academicInfo) {
    const studentScores = await getStudentScores(studentId);
    const suggestedSchedule = [];
    const enrolledSlots = [];
    let englishCourseAdded = false;

    // Get all required subjects
    const allSubjectIds = await getRequiredCoursesForStudent(studentId);
    const allSubjects = await Subject.find({ subject_id: { $in: allSubjectIds } });

    // Get student's academic status
    const failedSubjectIds = studentScores.filter(s => s.status === 'Rớt').map(s => s.subject_id);
    const completedSubjectIds = studentScores
        .filter(s => s.status === 'Đậu')
        .map(s => typeof s.subject_id === 'string' ? s.subject_id : s.subject_id.subject_id);

    // Get all available class pairs
    const classPairs = getAvailableClassPairs(theoryClasses, practiceClasses);

    // Helper function to check slot availability
    const isSlotEnrolled = (day, slots) => {
        return slots.some(slot => 
            enrolledSlots.some(s => s.day === day && s.slots.includes(slot))
        );
    };

    // Helper function to add class to schedule (enforces theory-practice pairing)
    const addClassToSchedule = (classInfo) => {
        // For theory classes, ensure matching practice exists
        if (!classInfo.class_id.includes('.')) {
            const matchingPractices = practiceClasses.filter(p => 
                p.class_id.startsWith(`${classInfo.class_id}.`) && 
                !isSlotEnrolled(p.day, p.slots)
            );
            
            if (matchingPractices.length === 0) return false;
            
            // Add theory class
            suggestedSchedule.push(classInfo);
            enrolledSlots.push({
                day: classInfo.day,
                slots: classInfo.slots
            });
            
            // Add first available practice class
            const practiceClass = matchingPractices[0];
            suggestedSchedule.push(practiceClass);
            enrolledSlots.push({
                day: practiceClass.day,
                slots: practiceClass.slots
            });
            
            return true;
        }
        // For practice classes, ensure matching theory exists
        else {
            const theoryClassId = classInfo.class_id.split('.')[0];
            const hasTheory = suggestedSchedule.some(c => 
                c.class_id === theoryClassId
            );
            
            if (!hasTheory) return false;
            
            suggestedSchedule.push(classInfo);
            enrolledSlots.push({
                day: classInfo.day,
                slots: classInfo.slots
            });
            return true;
        }
    };

    // 1. Priority: Failed subjects
    failedSubjectIds.forEach(subjectId => {
        if (suggestedSchedule.length >= 6) return;
        
        const subjectPairs = classPairs.filter(p => 
            p.theory.subject_id === subjectId &&
            !isSlotEnrolled(p.theory.day, p.theory.slots)
        );
        
        if (subjectPairs.length > 0) {
            const bestPair = subjectPairs[0];
            if (addClassToSchedule(bestPair.theory)) {
                addClassToSchedule(bestPair.practices[0]);
            }
        }
    });

    // 2. Priority: English courses (if not already added)
    if (!englishCourseAdded && suggestedSchedule.length < 6) {
        const remainingSubjects = allSubjects.filter(sub =>
            !completedSubjectIds.includes(sub.subject_id) &&
            !failedSubjectIds.includes(sub.subject_id)
        );

        const sortedSubjects = await prioritizeEnglishCourses(remainingSubjects, academicInfo.currentSemester);

        for (const subject of sortedSubjects) {
            if (suggestedSchedule.length >= 6) break;

            const isEnglish = ['ENG01', 'ENG02', 'ENG03'].includes(subject.subject_id);
            if (!isEnglish) continue;

            const subjectPairs = classPairs.filter(p => 
                p.theory.subject_id === subject.subject_id &&
                !isSlotEnrolled(p.theory.day, p.theory.slots)
            );
            
            if (subjectPairs.length > 0) {
                const bestPair = subjectPairs[0];
                if (addClassToSchedule(bestPair.theory)) {
                    addClassToSchedule(bestPair.practices[0]);
                    englishCourseAdded = true;
                }
            }
        }
    }

    // 3. Priority: Remaining subjects
    if (suggestedSchedule.length < 6) {
        const remainingSubjects = allSubjects.filter(sub =>
            !completedSubjectIds.includes(sub.subject_id) &&
            !failedSubjectIds.includes(sub.subject_id) &&
            !['ENG01', 'ENG02', 'ENG03'].includes(sub.subject_id)
        );

        const sortedSubjects = await prioritizeByDifficulty(remainingSubjects);

        for (const subject of sortedSubjects) {
            if (suggestedSchedule.length >= 6) break;

            const subjectPairs = classPairs.filter(p => 
                p.theory.subject_id === subject.subject_id &&
                !isSlotEnrolled(p.theory.day, p.theory.slots)
            );
            
            if (subjectPairs.length > 0) {
                const bestPair = subjectPairs[0];
                if (addClassToSchedule(bestPair.theory)) {
                    addClassToSchedule(bestPair.practices[0]);
                }
            }
        }
    }

    // Format the final schedule
    const groupedSchedule = suggestedSchedule.reduce((result, item) => {
        const dayKey = DAY_MAPPING[item.day] || item.day;
        if (!result[dayKey]) result[dayKey] = [];
        result[dayKey].push({
            subjectId: item.subject_id,
            subjectName: item.subject_name,
            classId: item.class_id,
            time: item.time,
            room: item.room,
            lecturer: item.lecturer
        });
        return result;
    }, {});

    // Sort by day and time
    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sortedSchedule = {};
    orderedDays.forEach(day => {
        if (groupedSchedule[day]) {
            sortedSchedule[day] = groupedSchedule[day].sort((a, b) => 
                a.time.split(' - ')[0].localeCompare(b.time.split(' - ')[0])
            );
        }
    });

    return sortedSchedule;
}

// Hàm hỗ trợ sắp xếp theo độ khó
async function prioritizeByDifficulty(subjects) {
    const difficultyScores = await calculateCourseDifficulty(subjects.map(s => s.subject_id));
    
    return subjects.sort((a, b) => {
        const diffA = difficultyScores[a.subject_id]?.difficulty || 0.5;
        const diffB = difficultyScores[b.subject_id]?.difficulty || 0.5;
        return diffA - diffB; // Dễ trước, khó sau
    });
}

// Main API endpoint
async function generateOptimizedSchedule(student, courseIds, courseDifficulty, availableCourses, academicInfo) {
    // 1. Lọc bỏ các môn đã đậu và không có trong availableCourses
    const filteredCourses = courseIds.filter(courseId => 
        !academicInfo.passedCourses.includes(courseId) &&
        availableCourses.some(c => c.subject_id === courseId)
    );

    // Xử lý đặc biệt cho học kỳ đầu
    if (academicInfo.currentSemester === 1) {
        const firstSemesterCourses = ["SS003", "MA003", "IT001", "PE231"]
            .filter(courseId => filteredCourses.includes(courseId))
            .slice(0, 4); // Chỉ lấy tối đa 4 môn

        const scheduleCourses = await Promise.all(
            firstSemesterCourses.map(async (courseId) => {
                const subject = await Subject.findOne({ subject_id: courseId });
                const classes = availableCourses.filter(c => c.subject_id === courseId);
                return {
                    courseId,
                    subjectName: subject?.subject_name || courseId,
                    credits: ((subject?.theory_credits || 0) + (subject?.practice_credits || 0)),
                    isElective: subject?.subject_type === 'CNTC',
                    classes
                };
            })
        );

        return {
            [2]: {
                courses: scheduleCourses,
                totalCredits: scheduleCourses.reduce((sum, c) => sum + c.credits, 0),
                warning: academicInfo.passedCourses.length > 0 ? 
                    `Đã bỏ qua ${academicInfo.passedCourses.length} môn đã hoàn thành` : null
            }
        };
    }

    const nextSemester = academicInfo.currentSemester + 1;
    const subjects = await Subject.find({ subject_id: { $in: filteredCourses } });
    
    // 1. Tính toán số tín chỉ đã hoàn thành theo loại môn học
    const passedSubjects = await Subject.find({ 
        subject_id: { $in: academicInfo.passedScores.map(s => s.subject_id) }
    });

    let completedMajorCredits = 0;
    let completedElectiveCredits = 0;

    passedSubjects.forEach(subject => {
        const credits = (subject.theory_credits || 0) + (subject.practice_credits || 0);
        if (subject.subject_type === 'CN') { // Môn chuyên ngành bắt buộc
            completedMajorCredits += credits;
        } else if (subject.subject_type === 'CNTC') { // Môn tự chọn
            completedElectiveCredits += credits;
        }
    });

    // 2. Tính số tín chỉ còn lại cần học
    const remainingMajorCredits = academicInfo.major.progress_details.required_major_core - completedMajorCredits;
    const remainingElectiveCredits = academicInfo.major.progress_details.required_elective_credits - completedElectiveCredits;

    // 3. Tính target credits cho học kỳ tới
    const targetMajorCredits = Math.min(
        Math.ceil(remainingMajorCredits / academicInfo.remainingSemesters),
        28
    );
    const targetElectiveCredits = Math.min(
        Math.ceil(remainingElectiveCredits / academicInfo.remainingSemesters),
        28 - targetMajorCredits
    );

    // 4. Phân loại môn học theo độ khó và loại môn
    // 1. Initialize the categorization structure
    const coursesByType = {
        major: { Hard: [], Medium: [], Easy: [] },
        elective: { Hard: [], Medium: [], Easy: [] }
    };
    
    // 3. Categorize each course
    courseIds.forEach(courseId => {
        const subject = subjects.find(s => s.subject_id === courseId);
        if (!subject) return;
        
        const difficultyData = courseDifficulty[courseId];
        if (!difficultyData) return;

        const difficultyLevel = difficultyData.difficulty <= 0.3 ? 'Hard' :
                               difficultyData.difficulty <= 0.7 ? 'Medium' : 'Easy';

        const credits = (subject.theory_credits || 0) + (subject.practice_credits || 0);
        const type = subject.subject_type === 'CNTC' ? 'elective' : 'major';

        if (coursesByType[type] && coursesByType[type][difficultyLevel]) {
            coursesByType[type][difficultyLevel].push({
                courseId,
                subject,
                credits,
                difficulty: difficultyLevel
            });
        }
    });

    const schedule = {
        [nextSemester]: {
            courses: [],
            totalCredits: 0,
            majorCredits: 0,
            electiveCredits: 0,
            targetMajorCredits, // Thêm thông tin target vào schedule
            targetElectiveCredits
        }
    };

    // Helper function to add course to schedule
    const addCourseToSchedule = (course) => {
        const classes = availableCourses.filter(c => 
            c.subject_id === course.courseId &&
            !academicInfo.passedCourses.includes(course.courseId)
        );

        if (classes.length === 0) return false;

        // Check credit limits (14-28 per semester)
        const newTotal = schedule[nextSemester].totalCredits + course.credits;
        if (newTotal > 28) return false;
        
        // Check if course already added
        if (schedule[nextSemester].courses.some(c => c.courseId === course.courseId)) {
            return false;
        }

        // Check for time conflicts
        const newClass = classes[0];
        const hasConflict = schedule[nextSemester].courses.some(addedCourse => {
            return addedCourse.classes.some(addedClass => {
                return addedClass.day === newClass.day && 
                       isTimeOverlap(addedClass.time, newClass.time);
            });
        });
        
        if (hasConflict) return false;

        // Add to schedule
        schedule[nextSemester].courses.push({
            courseId: course.courseId,
            subjectName: course.subject.subject_name,
            credits: course.credits,
            isElective: course.subject.subject_type === 'Elective',
            classes: classes.map(c => ({
                class_id: c.class_id,
                day: c.day,
                time: c.time,
                room: c.room,
                lecturer: c.lecturer
            }))
        });
        
        // Update credit counters
        schedule[nextSemester].totalCredits += course.credits;
        if (course.subject.subject_type === 'Elective') {
            schedule[nextSemester].electiveCredits += course.credits;
        } else {
            schedule[nextSemester].majorCredits += course.credits;
        }
        
        return true;
    };

    // 5. Ưu tiên xếp môn chuyên ngành trước
    for (const difficulty of ['Hard', 'Medium', 'Easy']) {
        while (coursesByType.major[difficulty].length > 0 && 
               schedule[nextSemester].majorCredits < targetMajorCredits) {
            const course = coursesByType.major[difficulty].shift();
            addCourseToSchedule(course);
        }
    }

    // 6. Xếp môn tự chọn nếu còn chỗ
    for (const difficulty of ['Hard', 'Medium', 'Easy']) {
        while (coursesByType.elective[difficulty].length > 0 && 
               schedule[nextSemester].electiveCredits < targetElectiveCredits &&
               schedule[nextSemester].totalCredits < 28) {
            const course = coursesByType.elective[difficulty].shift();
            addCourseToSchedule(course);
        }
    }

    // 7. Đảm bảo đủ tối thiểu 14 tín chỉ
    if (schedule[nextSemester].totalCredits < 14) {
        const allRemainingCourses = [
            ...coursesByType.major.Hard,
            ...coursesByType.major.Medium,
            ...coursesByType.major.Easy,
            ...coursesByType.elective.Hard,
            ...coursesByType.elective.Medium,
            ...coursesByType.elective.Easy
        ];
        
        for (const course of allRemainingCourses) {
            if (addCourseToSchedule(course) && 
                schedule[nextSemester].totalCredits >= 14) {
                break;
            }
        }
    }

    return schedule;
}
// Add this function to CourseRecommendationService.js before the getOptimizedSchedule function
function filterAvailableCourses(eligibleCourses, availableCourses, passedCourses) {
    const availableCourseIds = new Set(availableCourses.map(c => c.subject_id));
    
    return eligibleCourses.filter(courseId => 
        availableCourseIds.has(courseId) && 
        !passedCourses.includes(courseId)
    );
}
async function calculateCreditSummary(passedScores) {
    const passedSubjects = await Subject.find({
        subject_id: { $in: passedScores.map(s => s.subject_id) }
    });

    return passedSubjects.reduce((summary, subject) => {
        const credits = (subject.theory_credits || 0) + (subject.practice_credits || 0);
        return {
            majorCredits: summary.majorCredits + (subject.subject_type === 'CN' ? credits : 0),
            electiveCredits: summary.electiveCredits + (subject.subject_type === 'CNTC' ? credits : 0),
            totalCredits: summary.totalCredits + credits
        };
    }, { majorCredits: 0, electiveCredits: 0, totalCredits: 0 });
}

async function prioritizeEnglishCourses(subjects, currentSemester) {
    // Phân loại môn học
    const englishCourses = subjects.filter(sub => ['ENG01', 'ENG02', 'ENG03'].includes(sub.subject_id));
    const otherCourses = subjects.filter(sub => !['ENG01', 'ENG02', 'ENG03'].includes(sub.subject_id));

    // Sắp xếp môn Anh văn theo trình tự và học kỳ phù hợp
    const sortedEnglishCourses = englishCourses.sort((a, b) => {
        // Ưu tiên ENG01 trước, sau đó đến ENG02, cuối cùng là ENG03
        const order = { 'ENG01': 1, 'ENG02': 2, 'ENG03': 3 };
        return order[a.subject_id] - order[b.subject_id];
    }).filter(course => {
        // Lọc theo học kỳ phù hợp
        if (course.subject_id === 'ENG01' && currentSemester >= 1) return true;
        if (course.subject_id === 'ENG02' && currentSemester >= 2) return true;
        if (course.subject_id === 'ENG03' && currentSemester >= 3) return true;
        return false;
    });
console.log("🧠 englishCourses:", englishCourses);

    // Sắp xếp các môn khác theo độ khó
    const sortedOtherCourses = await prioritizeByDifficulty(otherCourses);

    // Kết hợp lại, ưu tiên môn Anh văn lên đầu
    return [...sortedEnglishCourses, ...sortedOtherCourses];
}
function getAvailableClassPairs(theoryClasses, practiceClasses) {
    const pairs = [];
    
    theoryClasses.forEach(theoryClass => {
        const matchingPractices = practiceClasses.filter(p => 
            p.class_id.startsWith(`${theoryClass.class_id}.`)
        );
        
        if (matchingPractices.length > 0) {
            pairs.push({
                theory: theoryClass,
                practices: matchingPractices
            });
        }
    });
    
    return pairs;
}
async function suggestClasses(studentId, theoryClasses, practiceClasses, academicInfo) {
    const studentScores = await getStudentScores(studentId);
    const suggestedSchedule = [];
    const enrolledSlots = [];
    let englishCourseAdded = false;

    // Get all required subjects
    const allSubjectIds = await getRequiredCoursesForStudent(studentId);
    const allSubjects = await Subject.find({ subject_id: { $in: allSubjectIds } });

    // Get student's academic status
    const failedSubjectIds = studentScores.filter(s => s.status === 'Rớt').map(s => s.subject_id);
    const completedSubjectIds = studentScores
        .filter(s => s.status === 'Đậu')
        .map(s => typeof s.subject_id === 'string' ? s.subject_id : s.subject_id.subject_id);

    // Get all available class pairs
    const classPairs = getAvailableClassPairs(theoryClasses, practiceClasses);

    // Helper function to check slot availability
    const isSlotEnrolled = (day, slots) => {
        return slots.some(slot => 
            enrolledSlots.some(s => s.day === day && s.slots.includes(slot))
        );
    };

    // Helper function to add class to schedule (enforces theory-practice pairing)
    const addClassToSchedule = (classInfo) => {
        // For theory classes, ensure matching practice exists
        if (!classInfo.class_id.includes('.')) {
            const matchingPractices = practiceClasses.filter(p => 
                p.class_id.startsWith(`${classInfo.class_id}.`) && 
                !isSlotEnrolled(p.day, p.slots)
            );
            
            if (matchingPractices.length === 0) return false;
            
            // Add theory class
            suggestedSchedule.push(classInfo);
            enrolledSlots.push({
                day: classInfo.day,
                slots: classInfo.slots
            });
            
            // Add first available practice class
            const practiceClass = matchingPractices[0];
            suggestedSchedule.push(practiceClass);
            enrolledSlots.push({
                day: practiceClass.day,
                slots: practiceClass.slots
            });
            
            return true;
        }
        // For practice classes, ensure matching theory exists
        else {
            const theoryClassId = classInfo.class_id.split('.')[0];
            const hasTheory = suggestedSchedule.some(c => 
                c.class_id === theoryClassId
            );
            
            if (!hasTheory) return false;
            
            suggestedSchedule.push(classInfo);
            enrolledSlots.push({
                day: classInfo.day,
                slots: classInfo.slots
            });
            return true;
        }
    };

    // 1. Priority: Failed subjects
    failedSubjectIds.forEach(subjectId => {
        if (suggestedSchedule.length >= 6) return;
        
        const subjectPairs = classPairs.filter(p => 
            p.theory.subject_id === subjectId &&
            !isSlotEnrolled(p.theory.day, p.theory.slots)
        );
        
        if (subjectPairs.length > 0) {
            const bestPair = subjectPairs[0];
            if (addClassToSchedule(bestPair.theory)) {
                addClassToSchedule(bestPair.practices[0]);
            }
        }
    });

    // 2. Priority: English courses (if not already added)
    if (!englishCourseAdded && suggestedSchedule.length < 6) {
        const remainingSubjects = allSubjects.filter(sub =>
            !completedSubjectIds.includes(sub.subject_id) &&
            !failedSubjectIds.includes(sub.subject_id)
        );

        const sortedSubjects = await prioritizeEnglishCourses(remainingSubjects, academicInfo.currentSemester);

        for (const subject of sortedSubjects) {
            if (suggestedSchedule.length >= 6) break;

            const isEnglish = ['ENG01', 'ENG02', 'ENG03'].includes(subject.subject_id);
            if (!isEnglish) continue;

            const subjectPairs = classPairs.filter(p => 
                p.theory.subject_id === subject.subject_id &&
                !isSlotEnrolled(p.theory.day, p.theory.slots)
            );
            
            if (subjectPairs.length > 0) {
                const bestPair = subjectPairs[0];
                if (addClassToSchedule(bestPair.theory)) {
                    addClassToSchedule(bestPair.practices[0]);
                    englishCourseAdded = true;
                }
            }
        }
    }

    // 3. Priority: Remaining subjects
    if (suggestedSchedule.length < 6) {
        const remainingSubjects = allSubjects.filter(sub =>
            !completedSubjectIds.includes(sub.subject_id) &&
            !failedSubjectIds.includes(sub.subject_id) &&
            !['ENG01', 'ENG02', 'ENG03'].includes(sub.subject_id)
        );

        const sortedSubjects = await prioritizeByDifficulty(remainingSubjects);

        for (const subject of sortedSubjects) {
            if (suggestedSchedule.length >= 6) break;

            const subjectPairs = classPairs.filter(p => 
                p.theory.subject_id === subject.subject_id &&
                !isSlotEnrolled(p.theory.day, p.theory.slots)
            );
            
            if (subjectPairs.length > 0) {
                const bestPair = subjectPairs[0];
                if (addClassToSchedule(bestPair.theory)) {
                    addClassToSchedule(bestPair.practices[0]);
                }
            }
        }
    }

    // Format the final schedule
    const groupedSchedule = suggestedSchedule.reduce((result, item) => {
        const dayKey = DAY_MAPPING[item.day] || item.day;
        if (!result[dayKey]) result[dayKey] = [];
        result[dayKey].push({
            subjectId: item.subject_id,
            subjectName: item.subject_name,
            classId: item.class_id,
            time: item.time,
            room: item.room,
            lecturer: item.lecturer
        });
        return result;
    }, {});

    // Sort by day and time
    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sortedSchedule = {};
    orderedDays.forEach(day => {
        if (groupedSchedule[day]) {
            sortedSchedule[day] = groupedSchedule[day].sort((a, b) => 
                a.time.split(' - ')[0].localeCompare(b.time.split(' - ')[0])
            );
        }
    });

    return sortedSchedule;
}

// Hàm hỗ trợ sắp xếp theo độ khó
async function prioritizeByDifficulty(subjects) {
    const difficultyScores = await calculateCourseDifficulty(subjects.map(s => s.subject_id));
    
    return subjects.sort((a, b) => {
        const diffA = difficultyScores[a.subject_id]?.difficulty || 0.5;
        const diffB = difficultyScores[b.subject_id]?.difficulty || 0.5;
        return diffA - diffB; // Dễ trước, khó sau
    });
}
exports.getFixedSchedule = async (req, res) => {
    let file;
    try {
        const { studentId } = req.params;
        file = req.file;

        // 1. Lấy thông tin học tập của sinh viên
        const academicInfo = await getStudentAcademicInfo(studentId);

        // 2. Lọc các môn học bắt buộc (đã bao gồm xử lý Anh văn)
        const requiredCourses = filterRequiredCourses(academicInfo);

        // 3. Kiểm tra điều kiện tiên quyết
        const { eligibleCourses } = await checkPrerequisites(
            requiredCourses, 
            academicInfo.passedCourses
        );

        // 4. Xử lý file Excel
        let availableCourses = [];
        if (file?.path) {
            const workbook = XLSX.readFile(file.path);
            const theorySheet = workbook.Sheets[workbook.SheetNames[0]];
            const practiceSheet = workbook.Sheets[workbook.SheetNames[1]] || theorySheet;
            
            availableCourses = [
                ...parseExcelSheetData(theorySheet),
                ...parseExcelSheetData(practiceSheet)
            ];
        } else {
            throw new Error('Excel file with course schedule is required');
        }

        // 5. Lọc các môn học khả dụng
        const availableCourseIds = filterAvailableCourses(
            eligibleCourses, 
            availableCourses, 
            academicInfo.passedCourses
        );

        // 6. Tạo lịch học cụ thể với xử lý Anh văn mới
        const fixedSchedule = await suggestClasses(studentId, 
            availableCourses.filter(c => c.subject_type !== 'TH'), // Lý thuyết
            availableCourses.filter(c => c.subject_type === 'TH'), // Thực hành
            academicInfo
        );

        // 7. Tính toán thông tin tín chỉ
        const creditSummary = await calculateCreditSummary(academicInfo.passedScores);

        // 8. Trả về kết quả
        res.json({
            success: true,
            studentInfo: {
                name: academicInfo.student.name,
                studentId: academicInfo.student.student_id,
                major: academicInfo.major.major_name,
                currentSemester: academicInfo.currentSemester + 1
            },
            creditSummary,
            schedule: fixedSchedule,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in getFixedSchedule:', error);
        if (file?.path) {
            try {
                await fs.unlink(file.path);
            } catch (e) {
                console.error('Failed to delete temp file:', e);
            }
        }
        res.status(500).json({ 
            success: false,
            message: error.message || 'Internal server error' 
        });
    }
};
// Main API endpoint
exports.generateOptimizedSchedule = async (req, res) => {
    let tempFilePath = null;
    try {
        // 1. Validate input
        const { studentId } = req.params;
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Excel file is required' });
        }

        tempFilePath = req.file.path;

        // 2. Get student academic info (Step 1)
        const academicInfo = await getStudentAcademicInfo(studentId);
        if (!academicInfo) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 3. Filter required courses (including English course handling)
        const requiredCourses = filterRequiredCourses(academicInfo);

        // 4. Check prerequisites (Step 1 continued)
        const { eligibleCourses, ineligibleCourses } = await checkPrerequisites(
            requiredCourses,
            academicInfo.passedCourses
        );

        // 5. Process Excel file (Step 2)
        const workbook = XLSX.readFile(tempFilePath);
        const theorySheet = workbook.Sheets[workbook.SheetNames[0]];
        const practiceSheet = workbook.Sheets[workbook.SheetNames[1]] || theorySheet;

        const theoryClasses = parseExcelSheetData(theorySheet);
        const practiceClasses = parseExcelSheetData(practiceSheet);
        const availableCourses = [...theoryClasses, ...practiceClasses];

        // 6. Filter courses available in Excel (Step 2 continued)
        const availableCourseIds = filterAvailableCourses(
            eligibleCourses,
            availableCourses,
            academicInfo.passedCourses
        );

        // 7. Calculate required credits (Step 3)
        const creditSummary = await calculateCreditSummary(academicInfo.passedScores);
        
        // Calculate remaining credits needed
        const remainingMajorCredits = academicInfo.major.progress_details.required_major_core - creditSummary.majorCredits;
        const remainingElectiveCredits = academicInfo.major.progress_details.required_elective_credits - creditSummary.electiveCredits;
        
        // Calculate target credits for next semester
        const targetMajorCredits = Math.min(
            Math.ceil(remainingMajorCredits / academicInfo.remainingSemesters),
            28
        );
        const targetElectiveCredits = Math.min(
            Math.ceil(remainingElectiveCredits / academicInfo.remainingSemesters),
            28 - targetMajorCredits
        );

        // 8. Calculate course difficulty (Step 4)
        const courseDifficulty = await calculateCourseDifficulty(availableCourseIds);

        // 9. Generate optimized schedule (Step 5 & 6)
        let optimizedSchedule;
        if (academicInfo.currentSemester === 1) {
            // Special handling for first semester students
            optimizedSchedule = await generateFirstSemesterSchedule(studentId, availableCourses, academicInfo);
        } else {
            // Normal schedule generation for other semesters
            optimizedSchedule = await generateNormalSchedule(
                studentId,
                availableCourseIds,
                courseDifficulty,
                availableCourses,
                academicInfo,
                targetMajorCredits,
                targetElectiveCredits
            );
        }

        // 10. Format response
        const response = {
            success: true,
            studentInfo: {
                name: academicInfo.student.name,
                studentId: academicInfo.student.student_id,
                major: academicInfo.major.major_name,
                program: academicInfo.trainingProgram.name,
                currentSemester: academicInfo.currentSemester,
                remainingSemesters: academicInfo.remainingSemesters,
                englishStatus: academicInfo.hasEnglishCertificate ? 
                    'Completed (Certificate)' : 
                    `ENG01: ${academicInfo.englishCourses.ENG01 ? 'Completed' : 'Pending'}, 
                     ENG02: ${academicInfo.englishCourses.ENG02 ? 'Completed' : 'Pending'}, 
                     ENG03: ${academicInfo.englishCourses.ENG03 ? 'Completed' : 'Pending'}`
            },
            creditSummary: {
                ...creditSummary,
                remainingMajorCredits,
                remainingElectiveCredits,
                targetMajorCredits,
                targetElectiveCredits
            },
            courseRecommendations: {
                allRequiredCourses: requiredCourses,
                eligibleAfterPrerequisites: eligibleCourses,
                ineligibleDueToPrerequisites: ineligibleCourses,
                availableAfterFilter: availableCourseIds,
                courseDifficulty
            },
            schedule: optimizedSchedule,
            generatedAt: new Date().toISOString()
        };

        res.json(response);

    } catch (error) {
        console.error('Error in generateOptimizedSchedule:', error);
        res.status(500).json({ 
            success: false,
            message: error.message || 'Internal server error' 
        });
    } finally {
        // Clean up temp file
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
            } catch (e) {
                console.error('Failed to delete temp file:', e);
            }
        }
    }
};

// Helper function for first semester schedule generation
async function generateFirstSemesterSchedule(studentId, availableCourses, academicInfo) {
    const firstSemesterCourses = ["SS003", "MA003", "IT001", "PE231"]
        .filter(courseId => 
            !academicInfo.passedCourses.includes(courseId) &&
            availableCourses.some(c => c.subject_id === courseId)
        )
        .slice(0, 4); // Max 4 courses

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
        2: { // Next semester is always semester 2 for first semester students
            courses: scheduleCourses,
            totalCredits: scheduleCourses.reduce((sum, c) => sum + c.credits, 0),
            majorCredits: scheduleCourses.filter(c => !c.isElective).reduce((sum, c) => sum + c.credits, 0),
            electiveCredits: scheduleCourses.filter(c => c.isElective).reduce((sum, c) => sum + c.credits, 0),
            warning: academicInfo.passedCourses.length > 0 ? 
                `Đã bỏ qua ${academicInfo.passedCourses.length} môn đã hoàn thành` : null
        }
    };
}

// Helper function for normal schedule generation
async function generateNormalSchedule(studentId, courseIds, courseDifficulty, availableCourses, academicInfo, targetMajorCredits, targetElectiveCredits) {
    const nextSemester = academicInfo.currentSemester + 1;
    const subjects = await Subject.find({ subject_id: { $in: courseIds } });
    
    // Categorize courses by type and difficulty
    const coursesByType = {
        major: { Hard: [], Medium: [], Easy: [] },
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
        const type = subject.subject_type === 'CNTC' ? 'elective' : 'major';

        if (coursesByType[type] && coursesByType[type][difficultyLevel]) {
            coursesByType[type][difficultyLevel].push({
                courseId,
                subject,
                credits,
                difficulty: difficultyLevel
            });
        }
    });

    const schedule = {
        [nextSemester]: {
            courses: [],
            totalCredits: 0,
            majorCredits: 0,
            electiveCredits: 0,
            targetMajorCredits,
            targetElectiveCredits
        }
    };

    // Helper function to add course to schedule
    const addCourseToSchedule = (course) => {
        const classes = availableCourses.filter(c => 
            c.subject_id === course.courseId &&
            !academicInfo.passedCourses.includes(course.courseId)
        );

        if (classes.length === 0) return false;

        // Check credit limits (14-28 per semester)
        const newTotal = schedule[nextSemester].totalCredits + course.credits;
        if (newTotal > 28) return false;
        
        // Check if course already added
        if (schedule[nextSemester].courses.some(c => c.courseId === course.courseId)) {
            return false;
        }

        // Check for time conflicts
        const newClass = classes[0];
        const hasConflict = schedule[nextSemester].courses.some(addedCourse => {
            return addedCourse.classes.some(addedClass => {
                return addedClass.day === newClass.day && 
                       isTimeOverlap(addedClass.time, newClass.time);
            });
        });
        
        if (hasConflict) return false;

        // Add to schedule
        schedule[nextSemester].courses.push({
            courseId: course.courseId,
            subjectName: course.subject.subject_name,
            credits: course.credits,
            isElective: course.subject.subject_type === 'CNTC',
            classes: classes.map(c => ({
                class_id: c.class_id,
                day: c.day,
                time: c.time,
                room: c.room,
                lecturer: c.lecturer
            }))
        });
        
        // Update credit counters
        schedule[nextSemester].totalCredits += course.credits;
        if (course.subject.subject_type === 'CNTC') {
            schedule[nextSemester].electiveCredits += course.credits;
        } else {
            schedule[nextSemester].majorCredits += course.credits;
        }
        
        return true;
    };

    // 1. Prioritize major courses first
    for (const difficulty of ['Hard', 'Medium', 'Easy']) {
        while (coursesByType.major[difficulty].length > 0 && 
               schedule[nextSemester].majorCredits < targetMajorCredits) {
            const course = coursesByType.major[difficulty].shift();
            addCourseToSchedule(course);
        }
    }

    // 2. Add elective courses if space available
    for (const difficulty of ['Hard', 'Medium', 'Easy']) {
        while (coursesByType.elective[difficulty].length > 0 && 
               schedule[nextSemester].electiveCredits < targetElectiveCredits &&
               schedule[nextSemester].totalCredits < 28) {
            const course = coursesByType.elective[difficulty].shift();
            addCourseToSchedule(course);
        }
    }

    // 3. Ensure minimum 14 credits
    if (schedule[nextSemester].totalCredits < 14) {
        const allRemainingCourses = [
            ...coursesByType.major.Hard,
            ...coursesByType.major.Medium,
            ...coursesByType.major.Easy,
            ...coursesByType.elective.Hard,
            ...coursesByType.elective.Medium,
            ...coursesByType.elective.Easy
        ];
        
        for (const course of allRemainingCourses) {
            if (addCourseToSchedule(course) && 
                schedule[nextSemester].totalCredits >= 14) {
                break;
            }
        }
    }

    return schedule;
}