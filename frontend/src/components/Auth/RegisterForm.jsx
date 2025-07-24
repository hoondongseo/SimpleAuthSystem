import api from "../services/api";

const { useState } = require("react");

const RegisterForm = ({ onSwitchToLogin }) => {
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
		if (error) setError("");
		if (success) setSuccess("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");

		try {
			await api.post("/auth/register", formData);
			setSuccess("회원가입이 완료되었습니다! 로그인해주세요.");
			setTimeout(() => {
				onSwitchToLogin();
			}, 2000);
		} catch (err) {
			setError(err.response?.data?.message || "회원가입에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<h1 className="auth-title">회원가입</h1>
				<p className="auth-subtitle">새 계정을 만드세요</p>

				{error && <div className="error-message">{error}</div>}
				{success && <div className="success-message">{success}</div>}

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
						{loading ? "가입 중..." : "회원가입"}
					</button>
				</form>

				<p className="auth-switch">
					이미 계정이 있으신가요?{" "}
					<button
						type="button"
						className="switch-button"
						onClick={onSwitchToLogin}
					>
						로그인
					</button>
				</p>
			</div>
		</div>
	);
};

export default RegisterForm;
