import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import Toast from "../common/UI/Toast";
import "./Auth.css";

const RegisterForm = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [loading, setLoading] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState({
		level: "",
		color: "",
		requirements: [],
	});
	const [toast, setToast] = useState({
		isVisible: false,
		message: "",
		type: "info",
	});

	const navigate = useNavigate();

	// 비밀번호 강도 체크
	const checkPasswordStrength = (password) => {
		const requirements = [
			{
				test: password.length >= 8,
				text: "8자 이상",
			},
			{
				test: /[A-Z]/.test(password),
				text: "대문자 포함",
			},
			{
				test: /[a-z]/.test(password),
				text: "소문자 포함",
			},
			{
				test: /\d/.test(password),
				text: "숫자 포함",
			},
			{
				test: /[!@#$%^&*(),.?":{}|<>]/.test(password),
				text: "특수문자 포함",
			},
		];

		const passedCount = requirements.filter((req) => req.test).length;

		let level, color;
		if (passedCount < 3) {
			level = "약함";
			color = "#ff4757";
		} else if (passedCount < 4) {
			level = "보통";
			color = "#ffa502";
		} else {
			level = "강함";
			color = "#2ed573";
		}

		return { level, color, requirements };
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});

		// 비밀번호 강도 체크
		if (name === "password") {
			setPasswordStrength(checkPasswordStrength(value));
		}
	};

	const showToast = (message, type) => {
		setToast({
			isVisible: true,
			message,
			type,
		});
	};

	const closeToast = () => {
		setToast((prev) => ({ ...prev, isVisible: false }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// 유효성 검사
		if (
			!formData.name ||
			!formData.email ||
			!formData.password ||
			!formData.confirmPassword
		) {
			showToast("모든 필드를 입력해주세요.", "error");
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			return; // 실시간 에러 표시로 충분
		}

		// 비밀번호 강도 체크 - "강함"일 때만 허용
		if (passwordStrength.level !== "강함") {
			showToast(
				"비밀번호 강도가 '강함'이어야 회원가입 가능합니다.",
				"error"
			);
			return;
		}

		setLoading(true);
		try {
			await api.post("/auth/register", {
				name: formData.name,
				email: formData.email,
				password: formData.password,
			});
			showToast(
				"회원가입이 완료되었습니다! 이메일을 확인해주세요.",
				"success"
			);
			setTimeout(() => {
				navigate("/email-verification", {
					state: { email: formData.email },
				});
			}, 2000);
		} catch (err) {
			showToast(
				err.response?.data?.message || "회원가입에 실패했습니다.",
				"error"
			);
		} finally {
			setLoading(false);
		}
	};

	const handleSwitchToLogin = () => {
		navigate("/login");
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1 className="auth-title">회원가입</h1>
				<p className="auth-subtitle">새 계정을 만드세요</p>

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="input-group">
						<label htmlFor="name">이름</label>
						<input
							type="text"
							id="name"
							name="name"
							value={formData.name}
							onChange={handleChange}
							required
							placeholder="이름을 입력하세요"
							autoComplete="name"
						/>
					</div>

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
							autoComplete="email"
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
							minLength={6}
							autoComplete="new-password"
						/>

						{/* 비밀번호 강도 표시 */}
						{formData.password && (
							<div className="password-strength">
								<div className="strength-bar">
									<div
										className="strength-fill"
										style={{
											width: `${
												(passwordStrength.requirements.filter(
													(req) => req.test
												).length /
													5) *
												100
											}%`,
											backgroundColor:
												passwordStrength.color,
										}}
									></div>
								</div>
								<span
									className="strength-text"
									style={{ color: passwordStrength.color }}
								>
									{passwordStrength.level}
									{passwordStrength.level !== "강함" && (
										<span className="strength-requirement">
											(회원가입을 위해 '강함' 등급이
											필요합니다)
										</span>
									)}
								</span>
								<ul className="requirements-list">
									{passwordStrength.requirements.map(
										(req, index) => (
											<li
												key={index}
												className={
													req.test ? "fulfilled" : ""
												}
											>
												{req.test ? "✓" : "○"}{" "}
												{req.text}
											</li>
										)
									)}
								</ul>
							</div>
						)}
					</div>

					<div className="input-group">
						<label htmlFor="confirmPassword">비밀번호 확인</label>
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							value={formData.confirmPassword}
							onChange={handleChange}
							required
							placeholder="비밀번호를 다시 입력하세요"
							autoComplete="new-password"
						/>
						{formData.confirmPassword &&
							formData.password !== formData.confirmPassword && (
								<span className="error-text">
									비밀번호가 일치하지 않습니다.
								</span>
							)}
					</div>

					<button
						type="submit"
						className="auth-button"
						disabled={
							loading ||
							passwordStrength.level !== "강함" ||
							formData.password !== formData.confirmPassword ||
							!formData.name ||
							!formData.email ||
							!formData.password ||
							!formData.confirmPassword
						}
					>
						{loading ? (
							<>
								<LoadingSpinner size="small" color="white" />
								<span style={{ marginLeft: "8px" }}>
									가입 중...
								</span>
							</>
						) : (
							"회원가입"
						)}
					</button>
				</form>

				<p className="auth-switch">
					이미 계정이 있으신가요?{" "}
					<button
						type="button"
						className="switch-button"
						onClick={handleSwitchToLogin}
					>
						로그인
					</button>
				</p>
			</div>

			{/* Toast 컴포넌트 */}
			<Toast
				message={toast.message}
				type={toast.type}
				isVisible={toast.isVisible}
				onClose={closeToast}
				duration={3000}
			/>
		</div>
	);
};

export default RegisterForm;
