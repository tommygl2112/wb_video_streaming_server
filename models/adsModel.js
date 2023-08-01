const mongoose = require("mongoose");

const adsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    blank: {
        type: String,
        required: false
    },
    thumbnail: {
        type: String,
        required: false
    },
    website: {
        type: String,
        required: false
    },
    views: {
        type: Number,
        required: true
    },
    viewDates: [{
        date: {
            type: Date,
            default: Date.now,
        },
        count: {
            type: Number,
            default: 0,
        },
    }],
})

adsSchema.methods.addView = function () {
    const today = new Date().setHours(0, 0, 0, 0);
    const viewDate = this.viewDates.find((vd) => {
        return vd.date.getTime() === today;
    });

    if (viewDate) {
        viewDate.count += 1;
    } else {
        this.viewDates.push({ date: today, count: 1 });
    }

    this.views += 1;
};

module.exports = mongoose.model("Ads", adsSchema);