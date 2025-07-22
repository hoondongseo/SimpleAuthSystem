require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Express 앱 생성
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// MongoDB 연결
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB 연결 성공"))
	.catch((err) => console.error("DB 연결 실패:", err));

// 라우트 연결
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// 기본 라우트
app.get("/", (req, res) => {
	res.json({ message: "🚀 서버가 실행 중입니다!" });
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`서버가 포트 ${PORT}에서 실행 중입니다!`);
});
