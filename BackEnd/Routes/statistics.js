const express = require('express');
const router = express.Router();
const { getHomeVisitCount } = require('../Controllers/statistics/HomeStatisticsController');
const { getTotalUsers } = require('../Controllers/admin/UserStatisticController');

router.get('/total-users', authenticateToken, authorizeRoles('admin'), getTotalUsers);
router.get('/home-visit-count', getHomeVisitCount);

module.exports = router;