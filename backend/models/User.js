const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, "사용자명은 필수입니다"],
			unique: true,
			trim: true,
		},
		email: {
			type: String,
			required: [true, "이메일은 필수입니다"],
			unique: true,
			lowercase: true,
		},

		password: {
			type: String,
			required: [true, "비밀번호는 필수입니다"],
			minlength: 6,
			select: false, // 기본적으로 조회 시 제외
		},

		// 이메일 인증 관련 필드
		isEmailVerified: {
			type: Boolean,
			default: false,
		},

		emailVerificationToken: {
			type: String,
			select: false,
		},

		emailVerificationExpires: {
			type: Date,
			select: false,
		},

		refreshTokens: [
			{
				token: String,
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{
		timestamps: true, // createdAt, updatedAt 자동 생성
	}
);

// 비밀번호 해싱 미들웨어
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	this.password = await bcrypt.hash(this.password, 12);
	next();
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// 리프레시 토큰 저장 메서드
userSchema.methods.saveRefreshToken = async function (token) {
	this.refreshTokens.push({
		token: token,
		createdAt: new Date(),
	});
	return await this.save();
};

// 리프레시 토큰 제거 메서드
userSchema.methods.clearRefreshToken = async function () {
	this.refreshTokens = [];
	return await this.save();
};

// 이메일 인증 토큰 생성
userSchema.methods.generateEmailVerificationToken = function () {
	const token = crypto.randomBytes(32).toString("hex");

	this.emailVerificationToken = crypto
		.createHash("sha256")
		.update(token)
		.digest("hex");

	// 24시간 후 만료
	this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

	return token; // 해싱되지 않은 토큰 반환 (이메일 링크용)
};

// 이메일 인증 처리
userSchema.methods.verifyEmail = function () {
	this.isEmailVerified = true;
	this.emailVerificationToken = undefined;
	this.emailVerificationExpires = undefined;
};

// 이메일 인증 토큰 유효성 검사
userSchema.methods.isEmailVerificationTokenValid = function () {
	return this.emailVerificationExpires > Date.now();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
