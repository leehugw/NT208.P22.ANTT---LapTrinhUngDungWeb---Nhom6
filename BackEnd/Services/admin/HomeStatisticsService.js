const HomeVisit = require('../../../Database/SaveToMongo/models/HomeVisit');

class HomeStatisticsService {
    static async getHomeVisitCount() {
        return await HomeVisit.countDocuments();
    }

    static async increaseHomeVisit() {
        await HomeVisit.create({});
    }
}

module.exports = HomeStatisticsService;