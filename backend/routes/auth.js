const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const { sendVerificationEmail } = require("../services/emailService");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// 회원가입 API (이메일 인증 추가)
router.post("/register", async (req, res) => {
	try {
		const { name, email, password } = req.body;

		// 1. 이메일 중복 검사 (이름은 중복 허용)
		const existingUser = await User.findOne({ email });

		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "이미 존재하는 이메일입니다.",
			});
		}

		// 2. 사용자 생성
		const user = new User({
			name,
			email,
			password,
		});

		// 3. 이메일 인증 토큰 생성
		const verificationToken = user.generateEmailVerificationToken();
		await user.save();

		// 4. 인증 이메일 발송
		try {
			await sendVerificationEmail(email, verificationToken);
		} catch (emailError) {
			console.error("이메일 발송 실패:", emailError);
			// 사용자는 생성했지만 이메일 발송 실패
			return res.status(500).json({
				success: false,
				message:
					"회원가입은 완료되었지만 인증 이메일 발송에 실패했습니다. 다시 시도해주세요.",
			});
		}

		res.status(201).json({
			success: true,
			message:
				"회원가입이 완료되었습니다. 이메일을 확인하여 인증을 완료해주세요.",
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
				},
			},
		});
	} catch (error) {
		console.error("회원가입 에러:", error);
		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
});

// 로그인 API (이메일 인증 확인 추가)
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		// 1. 입력 검증
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "이메일과 비밀번호를 모두 입력해주세요.",
			});
		}

		// 2. 사용자 찾기 (비밀번호 포함)
		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "이메일 또는 비밀번호가 올바르지 않습니다.",
			});
		}

		// 3. 비밀번호 검증
		const isPasswordValid = await user.comparePassword(password);

		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "이메일 또는 비밀번호가 올바르지 않습니다.",
			});
		}

		// 4. 이메일 인증 확인
		if (!user.isEmailVerified) {
			return res.status(403).json({
				success: false,
				message: "이메일 인증이 필요합니다. 이메일을 확인해주세요.",
				emailVerificationRequired: true,
				email: user.email,
			});
		}

		// 5. JWT 토큰 생성
		const accessToken = jwt.sign(
			{ userId: user._id, type: "access" },
			process.env.JWT_SECRET || "your-secret-key",
			{ expiresIn: "15m" }
		);

		const refreshToken = jwt.sign(
			{ userId: user._id, type: "refresh" },
			process.env.JWT_SECRET || "your-secret-key",
			{ expiresIn: "30d" }
		);

		// 6. 리프레시 토큰을 DB에 저장
		await user.saveRefreshToken(refreshToken);

		// 7. 성공 응답 (createdAt 포함)
		res.json({
			success: true,
			message: "로그인 성공!",
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					createdAt: user.createdAt,
				},
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		console.error("로그인 에러:", error);
		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
});

// GET /api/auth/me - 현재 사용자 정보 조회
router.get("/me", authenticateToken, (req, res) => {
	try {
		// authenticateToken 미들웨어가 req.user에 사용자 정보를 넣어줌!
		res.json({
			success: true,
			message: "사용자 정보 조회 성공",
			user: {
				id: req.user._id,
				name: req.user.name,
				email: req.user.email,
				isEmailVerified: req.user.isEmailVerified,
				createdAt: req.user.createdAt,
				updatedAt: req.user.updatedAt,
			},
		});
	} catch (error) {
		console.error("사용자 정보 조회 에러:", error);
		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
});

// POST /api/auth/refresh - 토큰 갱신
router.post("/refresh", async (req, res) => {
	try {
		const { refreshToken } = req.body;

		// 1. 리프레시 토큰 확인
		if (!refreshToken) {
			return res.status(401).json({
				success: false,
				message: "리프레시 토큰이 필요합니다.",
			});
		}

		// 2. 토큰 검증
		const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

		// 3. DB에서 사용자 및 저장된 토큰 확인
		const user = await User.findById(decoded.userId);
		const storedToken = user?.refreshTokens?.find(
			(t) => t.token === refreshToken
		);

		if (!user || !storedToken) {
			return res.status(401).json({
				success: false,
				message: "유효하지 않은 리프레시 토큰입니다.",
			});
		}

		// 4. 새로운 엑세스 토큰 발급
		const newAccessToken = jwt.sign(
			{ userId: user._id, type: "access" },
			process.env.JWT_SECRET,
			{ expiresIn: "15m" }
		);

		// 5. 성공 응답
		res.json({
			success: true,
			message: "토큰 갱신 성공",
			accessToken: newAccessToken,
		});
	} catch (error) {
		console.error("토큰 갱신 에러:", error);

		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				success: false,
				message: "리프레시 토큰이 만료되었습니다.",
			});
		}

		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({
				success: false,
				message: "유효하지 않은 리프레시 토큰입니다.",
			});
		}

		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
});

// PUT /api/auth/profile - 사용자 프로필 업데이트
router.put("/profile", authenticateToken, async (req, res) => {
	try {
		const { name, email } = req.body;
		const userId = req.user._id;

		// 1. 입력값 검증
		if (!name || !email) {
			return res.status(400).json({
				success: false,
				message: "이름과 이메일을 모두 입력해주세요.",
			});
		}

		// 2. 다른 사용자가 이미 사용 중인 email인지 확인 (이름은 중복 허용)
		const existingUser = await User.findOne({
			$and: [
				{ _id: { $ne: userId } }, // 현재 사용자 제외
				{ email },
			],
		});

		if (existingUser) {
			return res.status(409).json({
				success: false,
				message: "이미 사용 중인 이메일입니다.",
			});
		}

		// 3. 사용자 정보 업데이트
		const updatedUser = await User.findByIdAndUpdate(
			req.user._id,
			{ name, email, updatedAt: new Date() },
			{ new: true, select: "-password" }
		);

		if (!updatedUser) {
			return res.status(404).json({
				success: false,
				message: "사용자를 찾을 수 없습니다.",
			});
		}

		// 4. 성공 응답
		res.json({
			success: true,
			message: "프로필이 성공적으로 업데이트되었습니다.",
			user: {
				id: updatedUser._id,
				name: updatedUser.name,
				email: updatedUser.email,
				createdAt: updatedUser.createdAt,
				updatedAt: updatedUser.updatedAt,
			},
		});
	} catch (error) {
		console.error("프로필 업데이트 에러:", error);
		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
});

// POST /api/auth/logout - 로그아웃
router.post("/logout", authenticateToken, async (req, res) => {
	try {
		// req.user는 authenticateToken 미들웨어가 제공
		await req.user.clearRefreshToken();

		res.json({
			success: true,
			message: "로그아웃이 완료되었습니다.",
		});
	} catch (error) {
		console.error("로그아웃 에러:", error);
		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
});

// 인증 이메일 재발송 API
router.post("/resend-verification", async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: "이메일이 필요합니다.",
			});
		}

		// 사용자 찾기
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "해당 이메일로 등록된 사용자가 없습니다.",
			});
		}

		// 이미 인증된 경우
		if (user.isEmailVerified) {
			return res.status(400).json({
				success: false,
				message: "이미 이메일 인증이 완료된 계정입니다.",
			});
		}

		// 새로운 인증 토큰 생성
		const verificationToken = user.generateEmailVerificationToken();
		await user.save();

		// 인증 이메일 발송
		await sendVerificationEmail(email, verificationToken);

		res.json({
			success: true,
			message: "인증 이메일이 재발송되었습니다.",
		});
	} catch (error) {
		console.error("이메일 재발송 에러:", error);
		res.status(500).json({
			success: false,
			message: "이메일 발송에 실패했습니다.",
		});
	}
});

// 이메일 인증 처리 API
router.get("/verify-email", async (req, res) => {
	try {
		const { token } = req.query;

		if (!token) {
			return res.status(400).json({
				success: false,
				message: "인증 토큰이 필요합니다.",
			});
		}

		// 토큰 해싱
		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		// 사용자 찾기
		const user = await User.findOne({
			emailVerificationToken: hashedToken,
		}).select("+emailVerificationExpires");

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "유효하지 않은 인증 토큰입니다.",
			});
		}

		// 토큰 만료 확인
		if (!user.isEmailVerificationTokenValid()) {
			return res.status(400).json({
				success: false,
				message:
					"인증 토큰이 만료되었습니다. 새로운 인증 이메일을 요청해주세요.",
			});
		}

		// 이메일 인증 완료
		user.verifyEmail();
		await user.save();

		res.json({
			success: true,
			message: "이메일 인증이 완료되었습니다! 이제 로그인할 수 있습니다.",
		});
	} catch (error) {
		console.error("이메일 인증 에러:", error);
		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
});

// 비밀번호 변경 API
router.put("/change-password", authenticateToken, async (req, res) => {
	try {
		console.log("비밀번호 변경 요청 데이터:", req.body);
		const { currentPassword, newPassword, confirmPassword } = req.body;

		// 1. 입력값 검증
		if (!currentPassword || !newPassword || !confirmPassword) {
			console.log("입력값 검증 실패");
			return res.status(400).json({
				success: false,
				message: "모든 필드를 입력해주세요.",
			});
		}

		// 2. 새 비밀번호와 확인 비밀번호 일치 검사
		if (newPassword !== confirmPassword) {
			console.log("비밀번호 확인 불일치");
			return res.status(400).json({
				success: false,
				message: "새 비밀번호가 일치하지 않습니다.",
			});
		}

		// 3. 새 비밀번호 강도 검증
		if (newPassword.length < 6) {
			return res.status(400).json({
				success: false,
				message: "새 비밀번호는 최소 6자 이상이어야 합니다.",
			});
		}

		// 4. 현재 사용자 조회 (비밀번호 포함)
		const user = await User.findById(req.user._id).select("+password");
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "사용자를 찾을 수 없습니다.",
			});
		}

		// 5. 현재 비밀번호 검증
		const isCurrentPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password
		);

		if (!isCurrentPasswordValid) {
			console.log("현재 비밀번호 불일치");
			return res.status(400).json({
				success: false,
				message: "현재 비밀번호가 올바르지 않습니다.",
			});
		}

		// 6. 새 비밀번호가 현재 비밀번호와 같은지 확인
		const isSamePassword = await bcrypt.compare(newPassword, user.password);
		if (isSamePassword) {
			return res.status(400).json({
				success: false,
				message: "새 비밀번호는 현재 비밀번호와 달라야 합니다.",
			});
		}

		// 7. 새 비밀번호 해싱
		const saltRounds = 10;
		const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

		// 8. 비밀번호 업데이트
		await User.findByIdAndUpdate(req.user._id, {
			password: hashedNewPassword,
			updatedAt: new Date(),
		});

		// 9. 성공 응답
		res.json({
			success: true,
			message: "비밀번호가 성공적으로 변경되었습니다.",
		});
	} catch (error) {
		console.error("비밀번호 변경 에러:", error);
		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
});

module.exports = router;
