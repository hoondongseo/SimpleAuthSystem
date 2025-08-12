import React, { useState } from "react";
import { changePassword } from "../services/api";
import LoadingSpinner from "../common/UI/LoadingSpinner";
import "./PasswordChange.css";

const PasswordChange = ({ showToast, onCancel }) => {
	const [formData, setFormData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [loading, setLoading] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState({
		level: "",
		color: "",
		requirements: [],
	});

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

	// 입력값 변경 핸들러
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));

		// 새 비밀번호 강도 체크
		if (name === "newPassword") {
			setPasswordStrength(checkPasswordStrength(value));
		}
	};

	// 폼 제출 핸들러
	const handleSubmit = async (e) => {
		e.preventDefault();

		// 유효성 검사
		if (
			!formData.currentPassword ||
			!formData.newPassword ||
			!formData.confirmPassword
		) {
			showToast("모든 필드를 입력해주세요.", "error");
			return;
		}

		if (formData.newPassword !== formData.confirmPassword) {
			return; // Toast 없이 그냥 리턴 (폼에서 이미 에러 표시 중)
		}

		try {
			setLoading(true);
			const passwordData = {
				currentPassword: formData.currentPassword,
				newPassword: formData.newPassword,
				confirmPassword: formData.confirmPassword,
			};
			await changePassword(passwordData);
			showToast("비밀번호가 성공적으로 변경되었습니다!", "success");
			onCancel(); // 폼 닫기
		} catch (error) {
			console.error("비밀번호 변경 에러:", error);
			console.error("에러 응답:", error.response);

			let errorMessage = "비밀번호 변경에 실패했습니다.";

			if (error.response) {
				// 서버에서 응답을 받은 경우
				if (error.response.data && error.response.data.message) {
					errorMessage = error.response.data.message;
				} else if (error.response.status === 400) {
					errorMessage = "입력 정보를 확인해주세요.";
				} else if (error.response.status === 401) {
					errorMessage = "로그인이 필요합니다.";
				} else if (error.response.status === 500) {
					errorMessage = "서버 오류가 발생했습니다.";
				}
			} else if (error.request) {
				// 네트워크 오류
				errorMessage = "네트워크 연결을 확인해주세요.";
			}

			console.log("표시할 에러 메시지:", errorMessage);
			showToast(errorMessage, "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<form onSubmit={handleSubmit} className="password-change-form">
				{/* 현재 비밀번호 */}
				<div className="form-group">
					<label htmlFor="currentPassword">현재 비밀번호</label>
					<input
						type="password"
						id="currentPassword"
						name="currentPassword"
						value={formData.currentPassword}
						onChange={handleChange}
						placeholder="현재 비밀번호를 입력하세요"
						autoComplete="current-password"
						required
					/>
				</div>

				{/* 새 비밀번호 */}
				<div className="form-group">
					<label htmlFor="newPassword">새 비밀번호</label>
					<input
						type="password"
						id="newPassword"
						name="newPassword"
						value={formData.newPassword}
						onChange={handleChange}
						placeholder="새 비밀번호를 입력하세요"
						autoComplete="new-password"
						required
					/>

					{/* 비밀번호 강도 표시 */}
					{formData.newPassword && (
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
										backgroundColor: passwordStrength.color,
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
										(비밀번호 변경을 위해 '강함' 등급이
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
											{req.test ? "✓" : "○"} {req.text}
										</li>
									)
								)}
							</ul>
						</div>
					)}
				</div>

				{/* 새 비밀번호 확인 */}
				<div className="form-group">
					<label htmlFor="confirmPassword">새 비밀번호 확인</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						value={formData.confirmPassword}
						onChange={handleChange}
						placeholder="새 비밀번호를 다시 입력하세요"
						autoComplete="new-password"
						required
					/>
					{formData.confirmPassword &&
						formData.newPassword !== formData.confirmPassword && (
							<span className="error-text">
								비밀번호가 일치하지 않습니다.
							</span>
						)}
				</div>

				{/* 버튼 */}
				<div className="form-actions">
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
						className="submit-button"
						disabled={
							loading ||
							passwordStrength.level !== "강함" ||
							formData.newPassword !== formData.confirmPassword ||
							!formData.currentPassword ||
							!formData.newPassword ||
							!formData.confirmPassword
						}
					>
						{loading ? (
							<LoadingSpinner size="small" />
						) : (
							"비밀번호 변경"
						)}
					</button>
				</div>
			</form>
		</>
	);
};

export default PasswordChange;
