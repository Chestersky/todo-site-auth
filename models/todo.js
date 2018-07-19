const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
    title: String,
    body: String,
    created: {type: Date, default: Date.now}
})

module.exports = mongoose.model("Todo",todoSchema);