const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// 회원가입 API
router.post("/register", async (req, res) => {
	try {
		const { username, email, password } = req.body;

		// 1. 입력값 검증
		if (!username || !email || !password) {
			return res.status(400).json({
				success: false,
				message: "모든 필드를 입력해주세요.",
			});
		}

		// 2. 기존 사용자 확인
		const existingUser = await User.findOne({
			$or: [{ email }, { username }],
		});

		if (existingUser) {
			return res.status(409).json({
				success: false,
				message: "이미 존재하는 사용자입니다.",
			});
		}

		// 3. 새 사용자 생성
		const user = new User({ username, email, password });
		await user.save();

		// 4. 성공 응답
		res.status(201).json({
			success: true,
			message: "회원가입이 성공적으로 완료되었습니다!",
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
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

// 로그인 API
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		// 1. 입력값 검증
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "이메일과 비밀번호를 입력해주세요.",
			});
		}

		// 2. 사용자 찾기
		const user = await User.findOne({ email });
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

		// 4. JWT 토큰 생성
		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET || "your-secret-key",
			{ expiresIn: "7d" }
		);

		// 5. 성공 응답
		res.json({
			success: true,
			message: "로그인 성공!",
			data: {
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
				},
				token,
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
				username: req.user.username,
				email: req.user.email,
				createdAt: req.user.createdAt,
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

module.exports = router;
