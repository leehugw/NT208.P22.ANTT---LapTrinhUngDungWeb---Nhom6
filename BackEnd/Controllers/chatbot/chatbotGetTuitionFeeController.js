const ChatbotGetTuitionFeeService = require('../../Services/chatbot/chatbotGetTuitionFeeService');

const chatbotGetTuitionFee = async (req, res) => {
    try {
        const { academic_year, cohort } = req.params;
        if (!academic_year || !cohort) {
            return res.status(400).json({ 
                success: false,
                error: "Both academic_year and cohort are required"
            });
        }
        const fee = await ChatbotGetTuitionFeeService.getTuitionFee({
            academic_year,
            cohort
        });
        res.status(200).json({ success: true, data: fee });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { chatbotGetTuitionFee };