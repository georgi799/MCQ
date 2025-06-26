import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.username || !form.password || (!isLogin && !form.confirm)) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (!isLogin && form.password !== form.confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {

        const response = await axios.post("/login", {
          username: form.username,
          password: form.password,
        });
        const { access_token, userId, username, role } = response.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify({ userId, username, role }));
        toast.success("Login successful!");
        window.location.href = "/dashboard";
      } else {

        await axios.post("/register", {
          username: form.username,
          password: form.password,
          role: "student",
        });
        toast.success("Registration successful! Please log in.");
        setIsLogin(true);
        setForm({ username: "", password: "", confirm: "" });
      }
    } catch (err) {
      setError(err.response?.data?.error || (isLogin ? "Login failed" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? "Log In" : "Register"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.password}
            onChange={handleChange}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          {!isLogin && (
            <input
              type="password"
              name="confirm"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.confirm}
              onChange={handleChange}
              autoComplete="new-password"
            />
          )}
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Log In" : "Register"}
          </button>
        </form>
        <button
          className="mt-4 w-full text-blue-500 hover:underline"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setForm({ username: "", password: "", confirm: "" });
          }}
        >
          {isLogin
            ? "Don't have an account? Register"
            : "Already have an account? Log In"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage; 