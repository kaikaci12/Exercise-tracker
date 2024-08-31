const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.String,
    required: true,
    unique: true,
  },
});
const User = mongoose.model("User", UserSchema);
module.exports = User;
