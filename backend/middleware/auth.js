const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT 토큰 검증 미들웨어
const authenticateToken = async (req, res, next) => {
	try {
		// 1. Authorization 헤더에서 토큰 추출
		const authHeader = req.headers.authorization;
		const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "엑세스 토큰이 필요합니다.",
			});
		}

		// 2. 토큰 검증
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// 3. 사용자 정보 조회
		const user = await User.findById(decoded.userId).select("-password");
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "유효하지 않은 토큰입니다.",
			});
		}

		// 4. req 객체에 사용자 정보 추가
		req.user = user;
		next();
	} catch (error) {
		console.error("토큰 검증 에러:", error);

		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				success: false,
				message: "토큰이 만료되었습니다.",
			});
		}

		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({
				success: false,
				message: "유효하지 않은 토큰입니다.",
			});
		}

		res.status(500).json({
			success: false,
			message: "서버 오류가 발생했습니다.",
		});
	}
};

module.exports = { authenticateToken };
