import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import Toast from "../common/UI/Toast";
import "./Auth.css";

const EmailVerification = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const email = location.state?.email || ""; // RegisterForm에서 전달받은 이메일

	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState({
		isVisible: false,
		message: "",
		type: "info",
	});

	// Toast 메시지 표시
	const showToast = (message, type = "info") => {
		setToast({
			isVisible: true,
			message,
			type,
		});
	};

	// Toast 메시지 닫기
	const closeToast = () => {
		setToast((prev) => ({
			...prev,
			isVisible: false,
		}));
	};

	// 이메일 재발송
	const handleResendEmail = async () => {
		if (!email) {
			showToast("이메일 정보가 없습니다.", "error");
			return;
		}

		setLoading(true);
		closeToast();

		try {
			await api.post("/auth/resend-verification", { email });
			showToast("인증 이메일이 재발송되었습니다!", "success");
		} catch (error) {
			showToast(
				error.response?.data?.message ||
					"이메일 재발송에 실패했습니다.",
				"error"
			);
		} finally {
			setLoading(false);
		}
	};

	// 로그인 페이지로 이동
	const handleBackToLogin = () => {
		navigate("/login");
	};

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="verification-icon">📧</div>

				<h1 className="auth-title">이메일 인증 확인</h1>
				<p className="auth-subtitle">
					회원가입이 완료되었습니다!
					<br />
					아래 이메일로 인증 링크를 보내드렸습니다.
				</p>

				<div className="email-display">
					<strong>{email}</strong>
				</div>

				<div className="verification-content">
					<p className="verification-text">
						📱 이메일을 확인하고 인증 링크를 클릭해주세요.
						<br />
						🕐 이메일이 도착하지 않았다면 스팸함도 확인해보세요.
					</p>
				</div>

				<div className="auth-actions">
					<button
						onClick={handleResendEmail}
						disabled={loading || !email}
						className="auth-button secondary"
						type="button"
					>
						{loading ? (
							<LoadingSpinner size="small" />
						) : (
							"이메일 재발송"
						)}
					</button>

					<button
						onClick={handleBackToLogin}
						className="auth-button"
						type="button"
					>
						로그인 페이지로
					</button>
				</div>

				<div className="auth-note">
					<p>
						💡 인증이 완료되면 로그인할 수 있습니다.
						<br />
						문제가 지속되면 고객센터로 문의해주세요.
					</p>
				</div>
			</div>
			{toast.isVisible && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={closeToast}
				/>
			)}
		</div>
	);
};

export default EmailVerification;
