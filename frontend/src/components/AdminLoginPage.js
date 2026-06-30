"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin.module.css";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Please enter the admin password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.loginMain}>
      <div className={styles.loginBg} aria-hidden="true" />

      <div className={styles.loginCard}>
        <div className={styles.loginBrand}>
          {/* Real logo image */}
          <div className={styles.brandLogoContainer}>
            <img
              src="/logo.png"
              alt="Roop Sari Palace"
              className={styles.brandLogoImage}
            />
          </div>
          <h1 className={styles.loginTitle}>Admin Panel</h1>
          <p className={styles.loginSubtitle}>Roop Sari Palace</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm} id="admin-login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className={`form-input ${error ? "error" : ""}`}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoFocus
            />
            {error && <span className="form-error">{error}</span>}
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${styles.loginBtn}`}
            disabled={loading}
            id="admin-login-btn"
          >
            {loading ? (
              <>
                <span className="spinner" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <a href="/" className={styles.backLink}>
          ← Back to form
        </a>
      </div>
    </main>
  );
}
