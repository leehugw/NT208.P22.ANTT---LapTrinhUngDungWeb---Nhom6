const CourseRecommendationService = require('../../Services/student/CourseRecommendationService');

exports.generateOptimizedSchedule = async (req, res) => {
    let tempFilePath = null;
    try {
        const result = await CourseRecommendationService.generateOptimizedSchedule(
            req.params.studentId, 
            req.file.path
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