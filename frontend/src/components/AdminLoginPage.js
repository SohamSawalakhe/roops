"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin.module.css";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Forgot password flow state: "login" | "forgot-request" | "forgot-verify"
  const [step, setStep] = useState("login");
  const [otpValue, setOtpValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");

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

  const handleForgotRequest = async () => {
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Failed to send OTP.");
        return;
      }
      // Move to OTP entry step
      setStep("forgot-verify");
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    setForgotError("");

    if (!otpValue.trim() || otpValue.trim().length !== 6) {
      setForgotError("Please enter the 6-digit OTP from your email.");
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setForgotError("New password must be at least 4 characters.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/admin/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpValue.trim(), newPassword: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Verification failed.");
        return;
      }
      // Success — return to login with success message
      setForgotSuccess("Password reset successfully! You can now log in with your new password.");
      setStep("login");
      setOtpValue("");
      setNewPassword("");
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setStep("login");
    setOtpValue("");
    setNewPassword("");
    setForgotError("");
    setForgotSuccess("");
  };

  // ── Forgot: Request OTP step ──────────────────────────────────────────────
  if (step === "forgot-request") {
    return (
      <main className={styles.loginMain}>
        <div className={styles.loginBg} aria-hidden="true" />
        <div className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <div className={styles.brandLogoContainer}>
              <img src="/logo.png" alt="Roop Sari Palace" className={styles.brandLogoImage} />
            </div>
            <h1 className={styles.loginTitle}>Forgot Password</h1>
            <p className={`${styles.loginSubtitle} ${styles.forgotSubtitle}`}>We will send a one-time code to the registered admin email.</p>
          </div>

          <div className={styles.forgotInfo}>
            <span className={styles.forgotIcon}>📧</span>
            <p>An OTP will be sent to the admin email address. Enter the code on the next screen to reset your password.</p>
          </div>

          {forgotError && <p className={styles.forgotError}>{forgotError}</p>}

          <button
            className={`btn btn-primary btn-lg ${styles.loginBtn}`}
            onClick={handleForgotRequest}
            disabled={forgotLoading}
            id="forgot-send-otp-btn"
          >
            {forgotLoading ? <><span className="spinner" /> Sending...</> : "Send OTP to Email"}
          </button>

          <button
            className={styles.backLink}
            onClick={resetForgotFlow}
            id="forgot-back-login-btn"
          >
            ← Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  // ── Forgot: Enter OTP + New Password step ────────────────────────────────
  if (step === "forgot-verify") {
    return (
      <main className={styles.loginMain}>
        <div className={styles.loginBg} aria-hidden="true" />
        <div className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <div className={styles.brandLogoContainer}>
              <img src="/logo.png" alt="Roop Sari Palace" className={styles.brandLogoImage} />
            </div>
            <h1 className={styles.loginTitle}>Enter OTP</h1>
            <p className={`${styles.loginSubtitle} ${styles.forgotSubtitle}`}>Check your admin email for the 6-digit code. It expires in 15 minutes.</p>
          </div>

          <form onSubmit={handleForgotVerify} className={styles.loginForm} id="forgot-verify-form">
            <div className="form-group">
              <label className="form-label" htmlFor="otp-input">One-Time Code</label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className={`form-input ${styles.otpInput} ${forgotError ? "error" : ""}`}
                placeholder="000000"
                value={otpValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtpValue(val);
                  setForgotError("");
                }}
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password-input">New Password</label>
              <input
                id="new-password-input"
                type="password"
                className={`form-input ${forgotError ? "error" : ""}`}
                placeholder="Choose a new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setForgotError("");
                }}
                autoComplete="new-password"
              />
            </div>

            {forgotError && <p className={styles.forgotError}>{forgotError}</p>}

            <button
              type="submit"
              className={`btn btn-primary btn-lg ${styles.loginBtn}`}
              disabled={forgotLoading}
              id="forgot-verify-btn"
            >
              {forgotLoading ? <><span className="spinner" /> Verifying...</> : "Reset Password"}
            </button>
          </form>

          <button
            className={styles.backLink}
            onClick={() => { setStep("forgot-request"); setForgotError(""); }}
            id="forgot-resend-otp-btn"
          >
            ← Request a new OTP
          </button>
        </div>
      </main>
    );
  }

  // ── Login step ────────────────────────────────────────────────────────────
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

        {forgotSuccess && (
          <div className={styles.forgotSuccessBanner}>
            ✅ {forgotSuccess}
          </div>
        )}

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

        <button
          className={styles.forgotLink}
          onClick={() => { setStep("forgot-request"); setForgotError(""); setForgotSuccess(""); }}
          id="forgot-password-link"
        >
          Forgot password?
        </button>

        <a href="/" className={styles.backLink}>
          ← Back to form
        </a>
      </div>
    </main>
  );
}
