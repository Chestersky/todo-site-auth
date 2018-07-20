const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
    username:String,
    password:String,
    registerDate: {type: Date, default: Date.now},
    todos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Todo"
    }]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",UserSchema);