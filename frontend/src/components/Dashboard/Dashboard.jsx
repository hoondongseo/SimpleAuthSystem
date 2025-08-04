import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import Toast from "../common/UI/Toast";
import "./Dashboard.css";

const Dashboard = () => {
	const { user, logout } = useContext(AuthContext);
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState({
		isVisible: false,
		message: "",
		type: "info",
	});

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

	const handleLogout = async () => {
		setLoading(true);
		closeToast();

		try {
			await logout();
			showToast("로그아웃되었습니다.", "success");
		} catch (error) {
			console.error("로그아웃 에러:", error);
			showToast("로그아웃 중 오류가 발생했습니다.", "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="dashboard-container">
			<div className="dashboard-card">
				<div className="dashboard-header">
					<h1 className="dashboard-title">환영합니다!</h1>
					<p className="dashboard-subtitle">
						로그인이 성공적으로 완료되었습니다
					</p>
				</div>

				<div className="user-info">
					<div className="user-avatar">
						<span className="avatar-icon">👤</span>
					</div>
					<div className="user-details">
						<h2 className="user-name">{user?.username}</h2>
						<p className="user-email">{user?.email}</p>
						<p className="user-joined">
							가입일:{" "}
							{new Date(user?.createdAt).toLocaleDateString(
								"ko-KR"
							)}
						</p>
					</div>
				</div>

				<div className="dashboard-actions">
					<button
						onClick={handleLogout}
						className="logout-button"
						disabled={loading}
					>
						{loading ? (
							<>
								<LoadingSpinner size="small" color="white" />
								<span style={{ marginLeft: "8px" }}>
									로그아웃 중...
								</span>
							</>
						) : (
							"로그아웃"
						)}
					</button>
				</div>
			</div>

			{/* Toast 메시지 */}
			<Toast
				message={toast.message}
				type={toast.type}
				isVisible={toast.isVisible}
				onClose={closeToast}
				duration={2000}
			/>
		</div>
	);
};

export default Dashboard;
