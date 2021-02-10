const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({ //We do not specify a username or password because of passport which is handling this for us. 
    email: {
	type: String,
	required: true,
	unique: true
	}
})
userSchema.plugin(passportLocalMongoose); //This is passport, Passport-Local Mongoose will add a username, hash and salt field to store the username, the hashed password and the salt value meaning in your user schema you don’t have to include those values just the extra ones you want 

module.exports = mongoose.model("User", userSchema);