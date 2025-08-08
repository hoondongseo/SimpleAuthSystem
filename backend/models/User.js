const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, "사용자명이 필요합니다."],
			unique: true,
			trim: true,
			minlength: [2, "사용자명은 최소 2자 이상이어야 합니다"],
			maxlength: [20, "사용자명은 최대 20자까지 가능합니다"],
		},

		email: {
			type: String,
			required: [true, "이메일이 필요합니다."],
			unique: true,
			lowercase: true,
			trim: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				"올바른 이메일 형식을 입력해주세요",
			],
		},

		password: {
			type: String,
			required: [true, "비밀번호가 필요합니다."],
			minlength: [6, "비밀번호는 최소 6자 이상이어야 합니다."],
			select: false, // 기본적으로 조회 시 제외
		},

		refreshToken: {
			type: String,
			default: null,
		},

		// 이메일 인증 관련 필드
		isEmailVerified: {
			type: Boolean,
			default: false,
		},

		emailVerificationToken: {
			type: String,
			default: null,
		},

		emailVerificationExpires: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true, // createdAt, updatedAt 자동 생성
	}
);

// 비밀번호 해싱 미들웨어
userSchema.pre("save", async function (next) {
	// 비밀번호가 수정되지 않았으면 다음으로
	if (!this.isModified("password")) return next();

	try {
		// 비밀번호 해싱
		const salt = await bcrypt.genSalt(12);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
	try {
		return await bcrypt.compare(candidatePassword, this.password);
	} catch (error) {
		throw error;
	}
};

// 리프레시 토큰 저장 메서드
userSchema.methods.saveRefreshToken = async function (token) {
	this.refreshToken = token;
	return await this.save();
};

// 리프레시 토큰 제거 메서드
userSchema.methods.clearRefreshToken = async function () {
	this.refreshToken = null;
	return await this.save();
};

// 이메일 인증 토큰 생성 메서드
userSchema.methods.generateEmailVerificationToken = function () {
	const token = crypto.randomBytes(32).toString("hex");

	this.emailVerificationToken = token;
	this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24시간 유효

	return token;
};

// 이메일 인증 완료 메서드
userSchema.methods.verifyEmail = function () {
	this.isEmailVerified = true;
	this.emailVerificationToken = null;
	this.emailVerificationExpires = null;
};

// 이메일 인증 토큰 확인 메서드
userSchema.methods.isEmailVerificationTokenValid = function (token) {
	return (
		this.emailVerificationToken === token &&
		this.emailVerificationExpires > Date.now()
	);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
