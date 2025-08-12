import React, { useState } from "react";
import api from "../services/api";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import "./PasswordChange.css";

const ProfileEdit = ({ user, onUpdateSuccess, onCancel, showToast }) => {
	const [formData, setFormData] = useState({
		name: user.name,
		email: user.email,
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({});

	// 입력값 변경 핸들러
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// 입력 시 해당 필드 에러 제거
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: "",
			}));
		}
	};

	// 폼 유효성 검사
	const validateForm = () => {
		const newErrors = {};

		if (!formData.name.trim()) {
			newErrors.name = "이름을 입력해주세요.";
		}

		if (!formData.email.trim()) {
			newErrors.email = "이메일을 입력해주세요.";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "올바른 이메일 형식을 입력해주세요.";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// 프로필 업데이트 제출
	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		// 변경사항이 없는 경우
		if (formData.name === user.name && formData.email === user.email) {
			showToast("변경된 내용이 없습니다.", "info");
			return;
		}

		try {
			setLoading(true);
			const response = await api.put("/auth/profile", formData);

			if (response.data.success) {
				onUpdateSuccess(response.data.user);
			} else {
				showToast(
					response.data.message || "프로필 업데이트에 실패했습니다.",
					"error"
				);
			}
		} catch (error) {
			console.error("프로필 업데이트 에러:", error);

			if (error.response?.data?.message) {
				showToast(error.response.data.message, "error");
			} else {
				showToast("서버 오류가 발생했습니다.", "error");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="profile-edit-form">
			<div className="form-group">
				<label htmlFor="name">이름</label>
				<input
					type="text"
					id="name"
					name="name"
					value={formData.name}
					onChange={handleChange}
					className={errors.name ? "error" : ""}
					placeholder="이름을 입력하세요"
				/>
				{errors.name && (
					<span className="error-text">{errors.name}</span>
				)}
			</div>

			<div className="form-group">
				<label htmlFor="email">이메일</label>
				<input
					type="email"
					id="email"
					name="email"
					value={formData.email}
					onChange={handleChange}
					className={errors.email ? "error" : ""}
					placeholder="이메일을 입력하세요"
				/>
				{errors.email && (
					<span className="error-text">{errors.email}</span>
				)}
			</div>

			<div className="button-group">
				<button
					type="button"
					onClick={onCancel}
					className="cancel-button"
					disabled={loading}
				>
					취소
				</button>
				<button
					type="submit"
					className="save-button"
					disabled={loading}
				>
					{loading ? <LoadingSpinner /> : "저장"}
				</button>
			</div>
		</form>
	);
};

export default ProfileEdit;
