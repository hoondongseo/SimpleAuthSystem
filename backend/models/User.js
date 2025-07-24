const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},

	email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
		minlength: 6,
	},

	password: {
		type: String,
		required: true,
		minlength: 6,
	},

	refreshToken: {
		type: String,
		default: null,
	},

	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// 비밀번호 암호화
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	const salt = await bcrypt.genSalt(12);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// 리프레시 토큰 저장
userSchema.methods.saveRefreshToken = async function (token) {
	this.refreshToken = token;
	return await this.save();
};

// 리프레시 토큰 삭제 (로그아웃 시)
userSchema.methods.clearRefreshToken = async function () {
	this.refreshToken = null;
	return await this.save();
};

module.exports = mongoose.model("User", userSchema);
