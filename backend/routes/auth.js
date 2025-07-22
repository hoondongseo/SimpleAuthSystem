const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

module.exports = router;
