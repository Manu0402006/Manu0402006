import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cynos-bg" data-testid="admin-login-page">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-cynos-card border border-white/10 p-8">
        <div className="font-anton text-4xl uppercase">CYNOS<span className="text-cynos-red">.</span></div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">Admin Console</p>

        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-cynos-surface border border-white/15 px-3 py-3 focus:border-white outline-none"
              data-testid="admin-email"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-cynos-surface border border-white/15 px-3 py-3 focus:border-white outline-none"
              data-testid="admin-password"
            />
          </label>
        </div>

        {error && <div className="mt-4 text-cynos-red font-mono text-xs uppercase tracking-[0.2em]" data-testid="admin-login-error">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-cynos-red text-white py-4 font-mono text-xs uppercase tracking-[0.2em] hover:bg-red-600 disabled:opacity-50"
          data-testid="admin-login-submit"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
