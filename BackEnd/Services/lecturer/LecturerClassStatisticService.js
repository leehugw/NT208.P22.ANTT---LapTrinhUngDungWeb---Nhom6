const mongoose = require('mongoose');
const Class = require('../../../Database/SaveToMongo/models/Classes');
const StudentAcademic = require('../../../Database/SaveToMongo/models/StudentAcademic');
const EnglishCertificate = require('../../../Database/SaveToMongo/models/EnglishCertificate');
const ClassStatistic = require('../../../Database/SaveToMongo/models/ClassStatistic');

class LecturerClassStatisticService {
    getSemesterNumber(semesterId) {
        const match = semesterId.match(/^HK(\d{1,2})\d{4}$/);
        return match ? parseInt(match[1]) : null;
    }

    async getClassStatistics(classCode) {
        try {
            const classData = await Class.findOne({ class_id: classCode });
            if (!classData) throw new Error('Lớp không tồn tại. Vui lòng kiểm tra lại mã lớp.');

            const studentIds = classData.students;
            const studentAcademics = await StudentAcademic.find({ student_id: { $in: studentIds } });
            const certificates = await EnglishCertificate.find({ studentId: { $in: studentIds } }); // lấy tất cả, không lọc status

            const totalStudents = studentAcademics.length;

            const parseSemester = (semesterId) => {
                const match = semesterId.match(/^HK(\d)(\d{4})(\d{4})$/);
                if (!match) return null;
                return {
                    code: semesterId,
                    term: parseInt(match[1]),
                    yearStart: parseInt(match[2]),
                    yearEnd: parseInt(match[3])
                };
            };

            const isInSemester = (date, semesterObj) => {
                if (!date || !semesterObj) return false;
                const d = new Date(date);
                const month = d.getMonth() + 1;
                if (semesterObj.term === 1) return month >= 1 && month <= 6;
                if (semesterObj.term === 2) return month >= 7 && month <= 12;
                return false;
            };

            const initLangStats = () => ({ toeic: {}, toefl: {}, ielts: {}, vnu: {}, cambridge: {} });

            const getScoreBucket = (type, scoreStr) => {
                const score = scoreStr?.trim()?.toUpperCase();

                if (!score || typeof score !== 'string') return '<unknown>';

                if (type === 'toeic') {
                    const scoreNum = parseFloat(score);
                    if (isNaN(scoreNum)) return '<unknown>';
                    if (scoreNum < 500) return '<500';
                    if (scoreNum <= 600) return '500-600';
                    if (scoreNum <= 700) return '601-700';
                    if (scoreNum <= 800) return '701-800';
                    return '>800';
                }

                if (type === 'toefl') {
                    const scoreNum = parseFloat(score);
                    if (isNaN(scoreNum)) return '<unknown>';
                    if (scoreNum < 42) return '<42';
                    if (scoreNum <= 71) return '42-71';
                    if (scoreNum <= 94) return '72-94';
                    if (scoreNum <= 110) return '95-110';
                    return '>110';
                }

                if (type === 'ielts') {
                    const scoreNum = parseFloat(score);
                    if (isNaN(scoreNum)) return '<unknown>';
                    if (scoreNum < 4.5) return '<4.5';
                    if (scoreNum <= 5.5) return '4.5-5.5';
                    if (scoreNum <= 6.5) return '5.6-6.5';
                    if (scoreNum <= 7.5) return '6.6-7.5';
                    return '>7.5';
                }

                if (type === 'vnu') {
                    const scoreNum = parseFloat(score);
                    if (isNaN(scoreNum)) return '<unknown>';
                    if (scoreNum < 120) return '<120';
                    if (scoreNum <= 150) return '120-150';
                    if (scoreNum <= 180) return '151-180';
                    if (scoreNum <= 210) return '181-210';
                    return '>210';
                }

                if (type === 'cambridge') {
                    const bucketLabels = ['<A2', 'A2-B1', 'B1-B2', 'B2-C1', 'C1-C2'];
                    return bucketLabels.includes(score) ? score : '<unknown>';
                }

                return '<unknown>';
            };

            const updateLangStats = (langStats, cert) => {
                const type = cert.type?.toLowerCase();
                if (!type || !langStats[type]) return;
                const bucket = getScoreBucket(type, cert.score);
                langStats[type][bucket] = (langStats[type][bucket] || 0) + 1;
            };

            const semesterStats = [];
            const allSemesterIds = new Set();
            studentAcademics.forEach(s => {
                (s.semester_gpas || []).forEach(g => {
                    if (g.semester_id) allSemesterIds.add(g.semester_id);
                });
            });

            const parsedSemesterMap = {};
            for (const id of Array.from(allSemesterIds)) {
                const parsed = parseSemester(id);
                if (parsed) parsedSemesterMap[id] = parsed;
            }

            const sortedSemesterIds = Array.from(allSemesterIds).sort((a, b) => {
                const sa = parsedSemesterMap[a];
                const sb = parsedSemesterMap[b];
                if (!sa || !sb) return 0;
                return sa.yearStart !== sb.yearStart ? sa.yearStart - sb.yearStart : sa.term - sb.term;
            });

            for (const semesterId of sortedSemesterIds) {
                const semesterObj = parsedSemesterMap[semesterId];
                const gpas = studentAcademics.flatMap(s =>
                    (s.semester_gpas || []).filter(g => g.semester_id === semesterId)
                );
                const gpaAvg = gpas.length ? (gpas.reduce((sum, g) => sum + g.semester_gpa, 0) / gpas.length).toFixed(2) : 0;

                const active = studentAcademics.filter(s =>
                    (s.semester_gpas || []).some(g => g.semester_id === semesterId)
                );
                const creditSum = active.reduce((sum, s) => {
                    const semestersTaken = (s.semester_gpas || []).length || 1;
                    return sum + (s.total_credits_earned || 0) / semestersTaken;
                }, 0);
                const creditAvg = active.length ? (creditSum / active.length).toFixed(2) : 0;

                const langStats = initLangStats();
                certificates.forEach(cert => {
                    if (cert.submittedAt && isInSemester(cert.submittedAt, semesterObj)) {
                        updateLangStats(langStats, cert);
                    }
                });

                semesterStats.push({
                    semesterId,
                    gpa: parseFloat(gpaAvg),
                    credits: parseFloat(creditAvg),
                    inputLanguage: langStats,
                    outputLanguage: langStats
                });
            }

            const yearGroups = {};
            semesterStats.forEach(stat => {
                const year = parsedSemesterMap[stat.semesterId]?.yearStart;
                if (!year) return;
                if (!yearGroups[year]) yearGroups[year] = [];
                yearGroups[year].push(stat);
            });

            const yearStats = Object.entries(yearGroups).map(([year, stats]) => {
                const gpas = stats.map(s => s.gpa);
                const credits = stats.map(s => s.credits);
                const langStats = initLangStats();
                stats.forEach(s => {
                    ['toeic', 'toefl', 'ielts', 'vnu', 'cambridge'].forEach(type => {
                        Object.entries(s.inputLanguage[type] || {}).forEach(([bucket, count]) => {
                            langStats[type][bucket] = (langStats[type][bucket] || 0) + count;
                        });
                    });
                });
                return {
                    yearId: parseInt(year),
                    gpa: gpas.length ? parseFloat((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2)) : 0,
                    credits: credits.length ? parseFloat((credits.reduce((a, b) => a + b, 0)).toFixed(2)) : 0,
                    inputLanguage: langStats,
                    outputLanguage: langStats
                };
            });

            const totalGPA = studentAcademics.reduce((sum, s) => sum + (s.cumulative_gpa || 0), 0);
            const avgGPA = totalStudents ? (totalGPA / totalStudents).toFixed(2) : 0;
            const totalCredits = studentAcademics.reduce((sum, s) => sum + (s.total_credits_earned || 0), 0);
            const avgCredits = totalStudents ? (totalCredits / totalStudents).toFixed(2) : 0;

            const langStatsOverall = initLangStats();
            certificates.forEach(cert => updateLangStats(langStatsOverall, cert));

            const certificateDetails = certificates.map(cert => ({
                studentId: cert.studentId,
                type: cert.type,
                score: cert.score,
                submittedAt: cert.submittedAt
            }));

            const overall = {
                gpa: parseFloat(avgGPA),
                credits: parseFloat(avgCredits),
                inputLanguage: langStatsOverall,
                outputLanguage: langStatsOverall,
                certificates: certificateDetails
            };

            return {
                classInfo: {
                    class_id: classData.class_id,
                    totalStudents,
                    startYear: parseInt(classData.semester_id?.match(/(\d{4})$/)?.[1]) || 2023
                },
                statistics: {
                    semester: semesterStats,
                    year: yearStats,
                    overall
                }
            };

        } catch (err) {
            console.error("🔥 Lỗi trong getClassStatistics:", err);
            throw err;
        }
    }

    initLanguageStats() {
        return {
            toeic: { "<500": 0, "500-600": 0, "601-700": 0, "701-800": 0, ">800": 0 },
            toefl: { "<42": 0, "42-71": 0, "72-94": 0, "95-110": 0, ">110": 0 },
            ielts: { "<4.5": 0, "4.5-5.5": 0, "5.6-6.5": 0, "6.6-7.5": 0, ">7.5": 0 },
            vnu: { "<120": 0, "120-150": 0, "151-180": 0, "181-210": 0, ">210": 0 },
            cambridge: { "<A2": 0, "A2-B1": 0, "B1-B2": 0, "B2-C1": 0, "C1-C2": 0 }
        };
    }

    updateLanguageStats(stats, cert) {
        const score = parseFloat(cert.score);
        if (isNaN(score)) return;
        if (cert.type === 'toeic') {
            if (score < 500) stats.toeic["<500"]++;
            else if (score <= 600) stats.toeic["500-600"]++;
            else if (score <= 700) stats.toeic["601-700"]++;
            else if (score <= 800) stats.toeic["701-800"]++;
            else stats.toeic[">800"]++;
        } else if (cert.type === 'toefl') {
            if (score < 42) stats.toefl["<42"]++;
            else if (score <= 71) stats.toefl["42-71"]++;
            else if (score <= 94) stats.toefl["72-94"]++;
            else if (score <= 110) stats.toefl["95-110"]++;
            else stats.toefl[">110"]++;
        } else if (cert.type === 'ielts') {
            if (score < 4.5) stats.ielts["<4.5"]++;
            else if (score <= 5.5) stats.ielts["4.5-5.5"]++;
            else if (score <= 6.5) stats.ielts["5.6-6.5"]++;
            else if (score <= 7.5) stats.ielts["6.6-7.5"]++;
            else stats.ielts[">7.5"]++;
        } else if (cert.type === 'vnu') {
            if (score < 120) stats.vnu["<120"]++;
            else if (score <= 150) stats.vnu["120-150"]++;
            else if (score <= 180) stats.vnu["151-180"]++;
            else if (score <= 210) stats.vnu["181-210"]++;
            else stats.vnu[">210"]++;
        } else if (cert.type === 'cambridge') {
            if (score < 120) stats.cambridge["<A2"]++;
            else if (score <= 150) stats.cambridge["A2-B1"]++;
            else if (score <= 180) stats.cambridge["B1-B2"]++;
            else if (score <= 210) stats.cambridge["B2-C1"]++;
            else stats.cambridge["C1-C2"]++;
        }
    }

    isInSemester(date, semesterId) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const semesterStartYear = Math.floor((semesterId - 1) / 2) + 2023;
        const isFirstSemester = semesterId % 2 === 1;
        return year === semesterStartYear && ((isFirstSemester && month < 6) || (!isFirstSemester && month >= 6));
    }

    isInYear(date, yearId) {
        const year = date.getFullYear();
        return year === 2023 + yearId - 1;
    }

    async updateClassStats(classCode, statistics) {
        try {
            const existing = await ClassStatistic.findOne({ 'classInfo.class_id': classCode });
            const statData = {
                classInfo: {
                    class_id: classCode,
                    totalStudents: statistics.overall?.totalStudents || 0,
                    startYear: new Date().getFullYear()
                },
                statistics
            };

            if (existing) {
                existing.statistics = statistics;
                await existing.save();
                return { success: true, message: 'Đã cập nhật thống kê' };
            } else {
                const newStat = new ClassStatistic(statData);
                await newStat.save();
                return { success: true, message: 'Đã tạo thống kê mới' };
            }
        } catch (err) {
            throw new Error(`Lỗi cập nhật thống kê: ${err.message}`);
        }
    }
}

module.exports = new LecturerClassStatisticService();