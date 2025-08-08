import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import Toast from "../common/UI/Toast";
import "./Auth.css";

const RegisterForm = () => {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState({
		isVisible: false,
		message: "",
		type: "info",
	});

	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
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
		setLoading(true);
		try {
			await api.post("/auth/register", formData);
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
						<label htmlFor="username">사용자명</label>
						<input
							type="text"
							id="username"
							name="username"
							value={formData.username}
							onChange={handleChange}
							required
							placeholder="사용자명을 입력하세요"
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
						/>
					</div>

					<button
						type="submit"
						className="auth-button"
						disabled={loading}
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
