const SubjectStatistic = require("../../Services/admin/SubjectStatistic");

const getTopPopularSubjects = async (req, res) => {
    try {
        const data = await SubjectStatistic.getTopPopularSubjects();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getTopPopularSubjects:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getTopPopularSubjects
};