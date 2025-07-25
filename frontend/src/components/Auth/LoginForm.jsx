import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Auth.css";

const LoginForm = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const { login } = useContext(AuthContext);
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
		if (error) setError(""); // 입력 시 에러 메시지 초기화
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			await login(formData.email, formData.password);
			// 로그인 성공 시 대시보드로 이동
			navigate("/dashboard");
		} catch (err) {
			setError(err.response?.data?.message || "로그인에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	const handleSwitchToRegister = () => {
		navigate("/register");
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1 className="auth-title">로그인</h1>
				<p className="auth-subtitle">계정에 로그인하세요</p>

				{error && <div className="error-message">{error}</div>}

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="input-group">
						<label htmlFor="email">이메일</label>
						<input
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							required
							placeholder="your@email.com"
						/>
					</div>

					<div className="input-group">
						<label htmlFor="password">비밀번호</label>
						<input
							type="password"
							id="password"
							name="password"
							value={formData.password}
							onChange={handleChange}
							required
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						className="auth-button"
						disabled={loading}
					>
						{loading ? "로그인 중..." : "로그인"}
					</button>
				</form>

				<p className="auth-switch">
					계정이 없으신가요{" "}
					<button
						type="button"
						className="switch-button"
						onClick={handleSwitchToRegister}
					>
						회원가입
					</button>
				</p>
			</div>
		</div>
	);
};

export default LoginForm;
