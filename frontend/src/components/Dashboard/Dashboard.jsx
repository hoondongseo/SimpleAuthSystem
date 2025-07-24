import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css";

const Dashboard = () => {
	const { user, logout } = useContext(AuthContext);

	const handleLogout = async () => {
		try {
			await logout();
		} catch (error) {
			console.error("로그아웃 에러:", error);
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
					<button onClick={handleLogout} className="logout-button">
						로그아웃
					</button>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
