const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const outputDir = path.join(__dirname, 'SaveToMongo', 'Json');

const semesterFile = path.join(outputDir, 'semester.json');
const scoreFile = path.join(outputDir, 'score.json');
const semesterGPAFile = path.join(outputDir, 'semester_gpa.json');
const studentGPAFile = path.join(outputDir, 'student_gpa.json');

const filePath = 'HTML\\Kết quả học tập.html'; 
const results = fs.readFileSync(filePath, 'utf8');
const $ = cheerio.load(results);

function safeParseScore(value) {
    const text = value.trim();
    if (text.toLowerCase() === "miễn") return "Miễn";
    const num = parseFloat(text);
    return isNaN(num) ? null : num;
}

function calculateGPA(score) {
    let totalCredits = 0;
    let totalWeightedScore = 0;

    score.forEach(score => {
        if (typeof score.score_HP === "number") {
            totalCredits += score.credits;
            totalWeightedScore += score.score_HP * score.credits;
        }
    });

    return totalCredits > 0 ? (totalWeightedScore / totalCredits).toFixed(2) : "0.00";
}

const studentId = $('td:contains("Mã SV:")').next('td').text().trim();
const semesterData = [];
const scoreData = [];
const semesterGPAData = [];
const studentGPAData = [];

let currentSemesterId = '';
let currentSemesterName = '';
let startYear = null, endYear = null;
let courseIndex = 1;
let semesterCourses = [];

let totalCreditsAttempted = 0;
let totalCreditsEarned = 0;
let totalWeightedScore = 0;
let totalWeightedScoreWithoutRetakes = 0;
let totalCreditsEarnedExcludingExemptions = 0;

$('table').eq(1).find('tr').each((index, row) => {
    const cols = $(row).find('td');

    if (cols.length === 1) {
        if (semesterCourses.length > 0) {
            semesterGPAData.push({
                semester_id: currentSemesterId,
                student_id: studentId,
                semester_gpa: calculateGPA(semesterCourses)
            });
            semesterCourses = [];
        }

        const semesterText = $(cols[0]).text().trim();
        const match = semesterText.match(/Học kỳ (\d+) - Năm học (\d+)-(\d+)/);

        if (match) {
            const semesterNumber = match[1];
            startYear = match[2];
            endYear = match[3];

            currentSemesterId = `HK${semesterNumber}${startYear}${endYear}`;
            currentSemesterName = semesterText;

            semesterData.push({
                semester_id: currentSemesterId,
                semester_name: currentSemesterName,
                start_year: parseInt(startYear),
                end_year: parseInt(endYear)
            });
        }
    } else if (cols.length >= 9 && $(cols[0]).text().trim() !== "") {
        const scoreId = `SC${String(courseIndex).padStart(2, '0')}`; 
        courseIndex++;
        const subjectId = $(cols[1]).text().trim();
        const scoreHP = safeParseScore($(cols[8]).text());
        const credits = parseInt($(cols[3]).text().trim()) || 0;
        const status = (typeof scoreHP === "number" && scoreHP < 5) ? "Rớt" : "Đậu";

        const isRetaken = $(row).attr('style')?.includes('background-color:#ffbfdf') ? true : false;
        
        const score = {
            student_id: studentId,
            subject_id: subjectId,
            semester_id: currentSemesterId,
            score_QT: parseFloat($(cols[4]).text().trim()) || null,
            score_GK: parseFloat($(cols[5]).text().trim()) || null,
            score_TH: parseFloat($(cols[6]).text().trim()) || null,
            score_CK: parseFloat($(cols[7]).text().trim()) || null,
            score_HP: scoreHP,
            status: status,
            isRetaken: isRetaken
        };


        scoreData.push(score);
        semesterCourses.push(score);
        if (typeof scoreHP === "number" && !isRetaken){
            totalCreditsAttempted += credits;
            totalWeightedScoreWithoutRetakes += scoreHP * credits;
        }
        if ((typeof scoreHP === "number" && scoreHP >= 5) || scoreHP === "Miễn") {
            totalCreditsEarned += credits;
            if(scoreHP !== "Miễn"){
                totalCreditsEarnedExcludingExemptions += credits;
                totalWeightedScore += scoreHP * credits;
            }
        }
    }
});

if (semesterCourses.length > 0) {
    semesterGPAData.push({
        semester_id: currentSemesterId,
        student_id: studentId,
        semester_gpa: calculateGPA(semesterCourses)
    });
}

studentGPAData.push({
    student_id: studentId,
    total_credits_attempted: totalCreditsAttempted,
    total_credits_earned: totalCreditsEarned,
    gpa: totalCreditsAttempted > 0 ? (totalWeightedScoreWithoutRetakes / totalCreditsAttempted).toFixed(2) : "0.00",
    cumulative_gpa: totalCreditsEarned > 0 ? (totalWeightedScore / totalCreditsEarnedExcludingExemptions).toFixed(2) : "0.00"
});

fs.writeFileSync(semesterFile, JSON.stringify(semesterData, null, 2));
fs.writeFileSync(scoreFile, JSON.stringify(scoreData, null, 2));
fs.writeFileSync(semesterGPAFile, JSON.stringify(semesterGPAData, null, 2));
fs.writeFileSync(studentGPAFile, JSON.stringify(studentGPAData, null, 2));

console.log('Dữ liệu đã được lưu vào các file JSON.');
