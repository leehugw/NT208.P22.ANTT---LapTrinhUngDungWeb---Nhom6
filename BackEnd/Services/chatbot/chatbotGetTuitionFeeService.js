const TuitionFee = require('../../../Database/SaveToMongo/models/TuitionFee');

class ChatbotGetTuitionFeeService {
    static async getTuitionFee({ academic_year, cohort }) {
        const query = {};
        if (academic_year) query.academic_year = String(academic_year);
        if (cohort !== undefined && cohort !== null && cohort !== '') {
            query.applicable_cohorts = String(cohort);
        }
    
        let fee = await TuitionFee.findOne(query);
        if (!fee && academic_year) {
            fee = await TuitionFee.findOne({ academic_year: String(academic_year) });
        }
        if (!fee) {
            return { message: "Chưa cập nhật" };
        }
        return fee;
    }
}

module.exports = ChatbotGetTuitionFeeService;