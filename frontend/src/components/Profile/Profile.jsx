import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import Toast from "../common/UI/Toast";
import ProfileEdit from "./ProfileEdit";
import PasswordChange from "./PasswordChange";
import "./Profile.css";

const Profile = () => {
	const { token } = useContext(AuthContext);
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [editMode, setEditMode] = useState(false);
	const [passwordChangeMode, setPasswordChangeMode] = useState(false);
	const [toast, setToast] = useState({
		isVisible: false,
		message: "",
		type: "info",
	});

	const fetchUserProfile = useCallback(async () => {
		try {
			setLoading(true);
			const response = await api.get("/auth/me");

			if (response.data.success) {
				setUser(response.data.user);
			} else {
				showToast("사용자 정보를 가져올 수 없습니다.", "error");
			}
		} catch (error) {
			console.error("프로필 조회 에러:", error);
			showToast("서버 오류가 발생했습니다.", "error");
		} finally {
			setLoading(false);
		}
	}, []);

	// 토스트 메시지 표시
	const showToast = (message, type = "info") => {
		setToast({
			isVisible: true,
			message,
			type,
		});
	};

	// 토스트 메시지 닫기
	const closeToast = () => {
		setToast((prev) => ({
			...prev,
			isVisible: false,
		}));
	};

	// 대시보드로 돌아가기
	const handleBackToDashboard = () => {
		navigate("/dashboard");
	};

	// 프로필 업데이트 성공 핸들러
	const handleProfileUpdate = (updatedUser) => {
		setUser(updatedUser);
		setEditMode(false);
		showToast("프로필이 성공적으로 업데이트되었습니다!", "success");
	};

	// 편집 모드 취소
	const handleEditCancel = () => {
		setEditMode(false);
	};

	// 비밀번호 변경 모드 취소
	const handlePasswordChangeCancel = () => {
		setPasswordChangeMode(false);
	};

	// 컴포넌트 마운트 시 사용자 정보 가져오기
	useEffect(() => {
		if (token) {
			fetchUserProfile();
		}
	}, [token, fetchUserProfile]);

	if (loading) {
		return (
			<div className="profile-container">
				<LoadingSpinner />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="profile-container">
				<div className="profile-error">
					사용자 정보를 불러올 수 없습니다.
				</div>
			</div>
		);
	}

	return (
		<div className="profile-container">
			<div className="profile-card">
				<div className="profile-header">
					<button
						className="back-button"
						onClick={handleBackToDashboard}
						title="대시보드로 돌아가기"
					>
						←
					</button>
					<h1
						key={
							passwordChangeMode
								? "password-title"
								: editMode
								? "edit-title"
								: "profile-title"
						}
						className="profile-title"
					>
						{passwordChangeMode
							? "비밀번호 변경"
							: editMode
							? "정보 변경"
							: "프로필"}
					</h1>
				</div>

				{editMode ? (
					<div key="edit-mode" className="profile-content-transition">
						<ProfileEdit
							user={user}
							onUpdateSuccess={handleProfileUpdate}
							onCancel={handleEditCancel}
							showToast={showToast}
						/>
					</div>
				) : passwordChangeMode ? (
					<div
						key="password-mode"
						className="profile-content-transition"
					>
						<PasswordChange
							showToast={showToast}
							onCancel={handlePasswordChangeCancel}
						/>
					</div>
				) : (
					<div
						key="profile-mode"
						className="profile-content-transition"
					>
						<div className="profile-info">
							<div className="info-group">
								<label>이름</label>
								<div className="info-value">{user.name}</div>
							</div>

							<div className="info-group">
								<label>이메일</label>
								<div className="info-value">{user.email}</div>
							</div>

							<div className="info-group">
								<label>가입일</label>
								<div className="info-value">
									{new Date(
										user.createdAt
									).toLocaleDateString("ko-KR")}
								</div>
							</div>

							<div className="info-group">
								<label>최근 수정일</label>
								<div className="info-value">
									{new Date(
										user.updatedAt || user.createdAt
									).toLocaleDateString("ko-KR")}
								</div>
							</div>
						</div>

						<div className="profile-actions">
							<button
								className="edit-button"
								onClick={() => setEditMode(true)}
							>
								정보 변경
							</button>
							<button
								className="password-change-button"
								onClick={() => setPasswordChangeMode(true)}
							>
								비밀번호 변경
							</button>
						</div>
					</div>
				)}
			</div>

			{toast.isVisible && (
				<Toast
					message={toast.message}
					type={toast.type}
					isVisible={toast.isVisible}
					onClose={closeToast}
				/>
			)}
		</div>
	);
};

export default Profile;
