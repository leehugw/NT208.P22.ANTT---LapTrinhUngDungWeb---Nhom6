const HomeStatisticsService = require('../../Services/admin/HomeStatisticsService');

const increaseHomeVisit = async (req, res, next) => {
    await HomeStatisticsService.increaseHomeVisit();
    next();
};

const getHomeVisitCount = async (req, res) => {
    const count = await HomeStatisticsService.getHomeVisitCount();
    res.json({ success: true, homeVisitCount: count });
};

module.exports = { increaseHomeVisit, getHomeVisitCount };