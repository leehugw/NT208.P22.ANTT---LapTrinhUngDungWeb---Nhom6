const mongoose = require('mongoose');

const languageScoreSchema = new mongoose.Schema({
    "<500": Number,
    "500-600": Number,
    "601-700": Number,
    "701-800": Number,
    ">800": Number,
    "<42": Number,
    "42-71": Number,
    "72-94": Number,
    "95-110": Number,
    ">110": Number,
    "<4.5": Number,
    "4.5-5.5": Number,
    "5.6-6.5": Number,
    "6.6-7.5": Number,
    ">7.5": Number,
    "<120": Number,
    "120-150": Number,
    "151-180": Number,
    "181-210": Number,
    ">210": Number,
    "<A2": Number,
    "A2-B1": Number,
    "B1-B2": Number,
    "B2-C1": Number,
    "C1-C2": Number
}, { _id: false });

const inputOutputSchema = new mongoose.Schema({
    toeic: languageScoreSchema,
    toefl: languageScoreSchema,
    ielts: languageScoreSchema,
    vnu: languageScoreSchema,
    cambridge: languageScoreSchema
}, { _id: false });

const semesterStatSchema = new mongoose.Schema({
    semesterId: Number,
    gpa: Number,
    credits: Number,
    inputLanguage: inputOutputSchema,
    outputLanguage: inputOutputSchema
}, { _id: false });

const yearStatSchema = new mongoose.Schema({
    yearId: Number,
    gpa: Number,
    credits: Number,
    inputLanguage: inputOutputSchema,
    outputLanguage: inputOutputSchema
}, { _id: false });

const overallStatSchema = new mongoose.Schema({
    gpa: Number,
    credits: Number,
    inputLanguage: inputOutputSchema,
    outputLanguage: inputOutputSchema
}, { _id: false });

const classInfoSchema = new mongoose.Schema({
    class_id: String,
    totalStudents: Number,
    startYear: Number
}, { _id: false });

const classStatisticSchema = new mongoose.Schema({
    classInfo: classInfoSchema,
    statistics: {
        semester: [semesterStatSchema],
        year: [yearStatSchema],
        overall: overallStatSchema
    }
});

module.exports = mongoose.model('ClassStatistic', classStatisticSchema);
