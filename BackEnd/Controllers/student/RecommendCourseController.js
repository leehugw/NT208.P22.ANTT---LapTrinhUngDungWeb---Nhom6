const Score = require('../../../Database/SaveToMongo/models/Score');
const SemesterPlan = require('../../../Database/SaveToMongo/models/SemesterPlan');
const Subject = require('../../../Database/SaveToMongo/models/Subject');
const StudentInformationService = require('../../../BackEnd/Services/student/StudentInformationService');

exports.getRecommendedCourses = async (req, res) => {
    try {
        const student_id = req.user.student_id;

        // 1. Lấy thông tin sinh viên
        const studentProfile = await StudentInformationService.getStudentProfile(student_id);
        const major_id = studentProfile.major_id;

        // 2. Lấy chương trình đào tạo theo ngành
        const program = await SemesterPlan.findOne({ major_id });
        if (!program) {
            return res.status(404).json({ message: "Không tìm thấy chương trình đào tạo." });
        }

        const semesterPlan = program.semester_plan;
        const maxSemesterInPlan = Math.max(...semesterPlan.map(s => s.semester));

        // 3. Lấy điểm số sinh viên
        const scores = await Score.find({ student_id });
        //console.log("Scores:", scores); // Kiểm tra dữ liệu scores

        // 4. Tính currentSemester từ số học kỳ khác nhau
        const uniqueSemesterKeys = [...new Set(scores.map(s => s.semester_id))];
        const currentSemester = uniqueSemesterKeys.length;
        const nextSemester = currentSemester + 1;
        console.log("Current Semester:", currentSemester, "Next Semester:", nextSemester); // Debug

        // 5. Lọc môn đã đậu / rớt
        const passedSubjects = new Set(scores.filter(s => s.status === "Đậu").map(s => s.subject_id));
        const allSubjectScores = new Set(scores.map(s => s.subject_id)); // Các môn đã học (có điểm)
        const failedSubjects = new Set(
            scores
                .filter(s => s.status !== "Đậu" && s.status) // Chỉ lấy môn có trạng thái không đậu
                .map(s => s.subject_id)
        );
        //console.log("Passed Subjects:", Array.from(passedSubjects)); // Debug
        //console.log("Failed Subjects:", Array.from(failedSubjects)); // Debug
        //console.log("All Subject Scores:", Array.from(allSubjectScores)); // Debug

        // 6. Nếu hết kỳ → gợi ý môn rớt để học lại
        if (nextSemester > maxSemesterInPlan) {
            const subjectsToRetake = [];
            semesterPlan.forEach(semester => {
                semester.courses.forEach((subject_id, index) => {
                    if (failedSubjects.has(subject_id)) {
                        subjectsToRetake.push({
                            subject_id,
                            semester: semester.semester,
                            courseIndex: index
                        });
                    }
                });
            });

            subjectsToRetake.sort((a, b) => {
                if (a.semester !== b.semester) {
                    return a.semester - b.semester;
                }
                return a.courseIndex - b.courseIndex;
            });

            const subjectIdsToRetake = subjectsToRetake.map(s => s.subject_id);
            const subjectInfos = await Subject.find({ subject_id: { $in: subjectIdsToRetake } });

            const subjectInfoMap = new Map(subjectInfos.map(s => [s.subject_id, s]));
            const recommendedCourses = [];
            let totalCredits = 0;

            for (const { subject_id } of subjectsToRetake) {
                const subj = subjectInfoMap.get(subject_id);
                if (!subj) {
                    console.warn(`Subject ${subject_id} not found in database`); // Debug
                    continue;
                }

                const credits = subj.theory_credits + subj.practice_credits;
                if (totalCredits + credits <= 24) {
                    recommendedCourses.push({
                        subject_id: subj.subject_id,
                        name: subj.subject_name,
                        credits: credits
                    });
                    totalCredits += credits;
                }
            }

            return res.status(200).json({
                message: "Đã vượt quá số học kỳ kế hoạch. Gợi ý học lại các môn đã rớt.",
                major_id,
                currentSemester,
                recommendedCourses,
                totalCredits
            });
        }

        // 7. Gợi ý môn học kỳ tiếp theo
        const nextPlan = semesterPlan.find(sp => sp.semester === nextSemester);
        if (!nextPlan) {
            return res.status(200).json({
                message: "Không tìm thấy kế hoạch cho học kỳ tiếp theo.",
                currentSemester
            });
        }

        // Lấy tất cả môn từ học kỳ 1 đến nextSemester
        const allCoursesUpToNext = semesterPlan
            .filter(sp => sp.semester <= nextSemester)
            .flatMap(sp => sp.courses.map((course, index) => ({
                subject_id: course,
                semester: sp.semester,
                courseIndex: index
            })));

        // Lọc các môn chưa đậu
        const rawSubjects = allCoursesUpToNext
            .filter(course => !passedSubjects.has(course.subject_id))
            .sort((a, b) => {
                if (a.semester !== b.semester) {
                    return a.semester - b.semester; // Ưu tiên học kỳ nhỏ hơn
                }
                return a.courseIndex - b.courseIndex; // Giữ thứ tự trong courses
            })
            .map(course => course.subject_id);

        //console.log("All Courses Up To Next Semester:", allCoursesUpToNext.map(c => c.subject_id)); // Debug
        //console.log("Passed Subjects:", Array.from(passedSubjects)); // Debug
        //console.log("Raw Subjects:", rawSubjects); // Debug

        // Lấy thông tin môn học
        const subjectInfos = await Subject.find({ subject_id: { $in: rawSubjects } });
        //console.log("Subject Infos:", subjectInfos.map(s => s.subject_id)); // Debug

        const subjectInfoMap = new Map(subjectInfos.map(s => [s.subject_id, s]));
        const recommendedCourses = [];
        let totalCredits = 0;

        for (const subject_id of rawSubjects) {
            const subj = subjectInfoMap.get(subject_id);
            if (!subj) {
                console.warn(`Subject ${subject_id} not found in database`); // Debug
                continue;
            }

            const credits = subj.theory_credits + subj.practice_credits;
            if (totalCredits + credits <= 24) {
                recommendedCourses.push({
                    subject_id: subj.subject_id,
                    name: subj.subject_name,
                    credits: credits
                });
                totalCredits += credits;
                // Tạm bỏ để kiểm tra tất cả môn
                // if (totalCredits >= 14) break;
            }
        }
        console.log("Recommended Courses:", recommendedCourses); // Debug

        return res.status(200).json({
            message: "Gợi ý môn học kỳ tiếp theo.",
            major_id,
            currentSemester,
            nextSemester,
            recommendedCourses,
            totalCredits
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Lỗi server." });
    }
};