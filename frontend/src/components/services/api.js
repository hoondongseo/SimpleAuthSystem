import axios from "axios";

const api = axios.create({
	baseURL: "http://localhost:5000/api",
	headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터로 Authorization 헤더 자동 추가 (나중에 사용)
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("accessToken");
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

// 응답 인터셉터로 자동 토큰 갱신
api.interceptors.response.use(
	(response) => {
		// 성공 응답은 그대로 반환
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// 401 에러이고, 아직 재시도하지 않은 요청이면
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// Refresh Token으로 새 Access Token 발급
				const refreshToken = localStorage.getItem("refreshToken");

				if (!refreshToken) {
					// Refresh Token도 없으면 로그아웃
					localStorage.removeItem("accessToken");
					window.location.href = "/";
					return Promise.reject(error);
				}

				const refreshResponse = await axios.post(
					"http://localhost:5000/api/auth/refresh",
					{ refreshToken }
				);

				// 새 Access Token 저장
				const newAccessToken = refreshResponse.data.accessToken;
				localStorage.setItem("accessToken", newAccessToken);

				// 원래 요청에 새 토큰 추가하고 재시도
				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				// Refresh Token도 만료되었으면 로그아웃
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");
				window.location.href = "/";
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default api;
