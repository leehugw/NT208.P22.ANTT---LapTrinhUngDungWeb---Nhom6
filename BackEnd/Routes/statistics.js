const express = require('express');
const router = express.Router();
const { getHomeVisitCount } = require('../Controllers/statistics/HomeStatisticsController');

router.get('/home-visit-count', getHomeVisitCount);

module.exports = router;