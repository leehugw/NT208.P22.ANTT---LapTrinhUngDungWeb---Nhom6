const mongoose = require('mongoose');

const HomeVisitSchema = new mongoose.Schema({
    visitedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('HomeVisit', HomeVisitSchema);