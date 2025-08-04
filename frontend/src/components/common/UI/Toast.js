import React, { useEffect, useState, useCallback } from "react";
import "./Toast.css";

const Toast = ({
	message,
	type = "info",
	isVisible,
	onClose,
	duration = 3000,
}) => {
	const [isHiding, setIsHiding] = useState(false);

	const handleClose = useCallback(() => {
		setIsHiding(true);
		setTimeout(() => {
			setIsHiding(false);
			onClose();
		}, 300); // CSS 트랜지션과 동일한 시간
	}, [onClose]);

	useEffect(() => {
		if (isVisible && duration > 0) {
			const timer = setTimeout(() => {
				handleClose();
			}, duration);

			return () => clearTimeout(timer);
		}
	}, [isVisible, duration, handleClose]);

	if (!isVisible && !isHiding) return null;

	return (
		<div
			className={`toast toast--${type} ${
				isVisible && !isHiding ? "toast--visible" : ""
			} ${isHiding ? "toast--hiding" : ""}`}
		>
			<div className="toast-content">
				<span className="toast-icon">
					{type === "success" && "✅"}
					{type === "error" && "❌"}
					{type === "info" && "ℹ️"}
					{type === "warning" && "⚠️"}
				</span>
				<span className="toast-message">{message}</span>
			</div>
			<button className="toast-close" onClick={handleClose}>
				×
			</button>
		</div>
	);
};

export default Toast;
