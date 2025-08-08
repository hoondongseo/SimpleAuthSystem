import React, { useContext } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { AuthContext } from "./components/context/AuthContext";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Dashboard from "./components/Dashboard/Dashboard";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Profile from "./components/Profile/Profile";
import EmailVerification from "./components/Auth/EmailVerification";
import EmailVerified from "./components/Auth/EmailVerified";
import "./App.css";

function App() {
	const { user } = useContext(AuthContext); // 🔑 핵심! 로그인 상태 확인

	return (
		<Router>
			<div className="App">
				<Routes>
					{/* 공개 라우트 */}
					<Route
						path="/login"
						element={
							user ? (
								<Navigate to="/dashboard" replace />
							) : (
								<LoginForm />
							)
						}
					/>
					<Route
						path="/register"
						element={
							user ? (
								<Navigate to="/dashboard" replace />
							) : (
								<RegisterForm />
							)
						}
					/>

					{/* 보호된 라우트 */}
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>

					{/* 기본 라우트 */}
					<Route
						path="/"
						element={
							user ? (
								<Navigate to="/dashboard" replace />
							) : (
								<Navigate to="/login" replace />
							)
						}
					/>

					<Route
						path="/profile"
						element={
							<ProtectedRoute>
								<Profile />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/email-verification"
						element={
							user ? (
								<Navigate to="/dashboard" replace />
							) : (
								<EmailVerification />
							)
						}
					/>

					{/* 이메일 인증 완료 페이지 - 로그인 상태와 무관하게 접근 가능 */}
					<Route path="/verify-email" element={<EmailVerified />} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;
