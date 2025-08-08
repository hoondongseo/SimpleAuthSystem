import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import Toast from "../common/UI/Toast";
import "./Auth.css";

const LoginForm = () => {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState({
		isVisible: false,
		message: "",
		type: "info",
	});

	const { login } = useContext(AuthContext);
	const navigate = useNavigate();

	const showToast = (message, type = "info") => {
		setToast({
			isVisible: true,
			message,
			type,
		});
	};

	const closeToast = () => {
		setToast((prev) => ({
			...prev,
			isVisible: false,
		}));
	};

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
		// 입력 시 Toast 메시지 닫기
		if (toast.isVisible) closeToast();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		closeToast();

		try {
			await login(formData.email, formData.password);
			// 성공 시에는 Toast 없이 즉시 대시보드로 이동
			navigate("/dashboard");
		} catch (err) {
			// 이메일 인증 필요한 경우 특별 처리
			if (err.response?.data?.emailVerificationRequired) {
				showToast(err.response.data.message, "warning");

				// 3초 후 이메일 인증 페이지로 이동
				setTimeout(() => {
					navigate("/email-verification", {
						state: { email: err.response.data.email },
					});
				}, 3000);
				return;
			}

			// 일반적인 로그인 실패
			showToast(
				err.response?.data?.message || "로그인에 실패했습니다.",
				"error"
			);
			// 실패 시에는 navigate 하지 않음
			// 폼 데이터는 그대로 유지 (명시적으로 보존)
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
						{loading ? (
							<>
								<LoadingSpinner size="small" color="white" />
								<span style={{ marginLeft: "8px" }}>
									로그인 중...
								</span>
							</>
						) : (
							"로그인"
						)}
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

			{/* Toast 메시지 */}
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

export default LoginForm;
