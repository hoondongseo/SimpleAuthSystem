import React, { useState } from "react";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import "./App.css";

function App() {
	const [currentView, setCurrentView] = useState("login");

	return (
		<div className="App">
			{currentView === "login" ? (
				<LoginForm
					onSwitchToRegister={() => setCurrentView("register")}
				/>
			) : (
				<RegisterForm onSwitchToLogin={() => setCurrentView("login")} />
			)}
		</div>
	);
}

export default App;
