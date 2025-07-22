require("dotenv").config();
const mongoose = require("mongoose");

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("MongoDB 연결 성공"))
	.catch((err) => console.error("DB 연결 실패:", err));
