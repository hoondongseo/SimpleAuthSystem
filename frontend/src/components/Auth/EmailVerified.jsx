import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import Toast from "../common/UI/Toast";
import "./Auth.css";

const EmailVerified = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [verificationStatus, setVerificationStatus] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false); // 중복 실행 방지
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

	// 컴포넌트 마운트 시 이메일 인증 처리
	useEffect(() => {
		let isCancelled = false; // cleanup flag

		const verifyEmail = async () => {
			if (isProcessing) {
				return;
			}

			const token = searchParams.get("token");

			if (!token) {
				if (!isCancelled) {
					setVerificationStatus("error");
					setLoading(false);
					showToast("인증 토큰이 없습니다.", "error");
				}
				return;
			}

			setIsProcessing(true); // 처리 시작

			try {
				const response = await api.get(
					`/auth/verify-email?token=${token}`
				);

				if (!isCancelled) {
					if (response.data.success) {
						setVerificationStatus("success");
						showToast(response.data.message, "success");
					} else {
						setVerificationStatus("error");
						showToast(response.data.message, "error");
					}
				}
			} catch (error) {
				if (!isCancelled) {
					// 400 에러이고 토큰 관련 에러인 경우, 이미 인증된 것으로 간주
					if (error.response?.status === 400) {
						const errorMessage =
							error.response?.data?.message || "";
						if (
							errorMessage.includes("찾을 수 없습니다") ||
							errorMessage.includes("토큰") ||
							errorMessage.includes("이미")
						) {
							setVerificationStatus("success");
							showToast(
								"이메일 인증이 완료되었습니다!",
								"success"
							);
						} else {
							setVerificationStatus("error");
							showToast(errorMessage, "error");
						}
					} else {
						setVerificationStatus("error");
						showToast(
							error.response?.data?.message ||
								"인증에 실패했습니다.",
							"error"
						);
					}
				}
			} finally {
				if (!isCancelled) {
					setLoading(false);
					setIsProcessing(false); // 처리 완료
				}
			}
		};

		verifyEmail();

		// cleanup function
		return () => {
			isCancelled = true;
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 로그인 페이지로 이동
	const handleGoToLogin = () => {
		navigate("/login");
	};

	if (loading) {
		return (
			<div className="auth-container">
				<div className="auth-card">
					<LoadingSpinner />
					<p
						style={{
							textAlign: "center",
							marginTop: "1rem",
							color: "#94a3b8",
						}}
					>
						이메일 인증을 처리하고 있습니다...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="auth-container">
			<div className="auth-card">
				<div className="verification-icon">
					{verificationStatus === "success" ? "✅" : "❌"}
				</div>

				<h1 className="auth-title">
					{verificationStatus === "success"
						? "인증 완료!"
						: "인증 실패"}
				</h1>

				{verificationStatus === "success" ? (
					<>
						<p className="auth-subtitle">
							🎉 이메일 인증이 성공적으로 완료되었습니다!
							<br />
							이제 모든 기능을 사용할 수 있습니다.
						</p>

						<div className="verification-content">
							<p className="verification-text">
								✨ 축하합니다! 계정이 활성화되었습니다.
								<br />
								🚀 지금 바로 로그인해서 서비스를 이용해보세요!
							</p>
						</div>
					</>
				) : (
					<>
						<p className="auth-subtitle">
							⚠️ 이메일 인증에 문제가 발생했습니다.
							<br />
							링크가 만료되었거나 유효하지 않을 수 있습니다.
						</p>

						<div className="verification-content">
							<p className="verification-text">
								🔄 다시 시도하려면 새로운 인증 이메일을
								요청하세요.
								<br />
								💬 문제가 지속되면 고객센터로 문의해주세요.
							</p>
						</div>
					</>
				)}

				<div className="auth-actions">
					<button
						onClick={handleGoToLogin}
						className="auth-button"
						type="button"
					>
						{verificationStatus === "success"
							? "로그인하기"
							: "로그인 페이지로"}
					</button>
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

export default EmailVerified;
