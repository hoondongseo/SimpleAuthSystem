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

		// 5. 리프레시 토큰을 DB에 저장
		await user.saveRefreshToken(refreshToken);

		// 6. 성공 응답 (두 토큰 모두 반환)
		res.json({
			success: true,
			message: "로그인 성공!",
			data: {
				user: {
					id: user._id,
					username: user.username,
					email: user.email,
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
		if (!user || user.refreshToken !== refreshToken) {
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

module.exports = router;
