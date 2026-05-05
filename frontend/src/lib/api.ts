import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  },
});

// Bearer トークンを自動付与
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("todotree-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 の場合はログイン画面へリダイレクト
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("todotree-token");
      localStorage.removeItem("todotree-user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
