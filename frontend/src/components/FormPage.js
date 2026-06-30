"use client";

import { useState, useEffect, useRef } from "react";
import styles from "@/styles/form.module.css";

const AUTO_RESET_SECONDS = 5;

export default function FormPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
  const nameRef = useRef(null);
  const resetTimerRef = useRef(null);

  // Auto-focus name field on mount and register PWA event listeners
  useEffect(() => {
    if (nameRef.current) nameRef.current.focus();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service Worker registration failed:", err);
      });
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  // Auto-reset form after successful submission
  useEffect(() => {
    if (submitted) {
      resetTimerRef.current = setTimeout(() => {
        resetForm();
      }, AUTO_RESET_SECONDS * 1000);
    }
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [submitted]);

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "" });
    setErrors({});
    setServerError("");
    setSubmitted(false);
    setTimeout(() => {
      if (nameRef.current) nameRef.current.focus();
    }, 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Please enter your full name";
    if (!form.phone.trim() || !/^[\d\s\-\+\(\)]{7,20}$/.test(form.phone.trim()))
      errs.phone = "Please enter a valid phone number";
    if (
      !form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    )
      errs.email = "Please enter a valid email address";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setServerError(data.message || "Something went wrong.");
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className={styles.main}>
        <div className={styles.confettiContainer} aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={styles.confetti}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                backgroundColor: [
                  "#b79e8c",
                  "#836957",
                  "#c9a96e",
                  "#c47a7a",
                  "#d4c4b8",
                  "#f0e8e2",
                ][Math.floor(Math.random() * 6)],
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
              }}
            />
          ))}
        </div>

        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <svg
              width="90"
              height="90"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="#b79e8c"
                strokeWidth="3"
                fill="none"
                className={styles.successCircle}
              />
              <path
                d="M24 40 L35 51 L56 30"
                stroke="#b79e8c"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className={styles.successCheck}
              />
            </svg>
          </div>
          <h1 className={styles.successTitle}>Thank You!</h1>
          <p className={styles.successText}>
            Your information has been saved successfully. Our team at{" "}
            <strong>Roop Sari Palace</strong> will be in touch with you shortly.
          </p>
          <button
            onClick={resetForm}
            className={`btn btn-primary ${styles.successBtn}`}
            id="new-customer-btn"
          >
            Next Customer
          </button>

          <div className={styles.countdownBar}>
            <div className={styles.countdownFill} />
          </div>
          <p className={styles.countdownText}>
            Resetting automatically in {AUTO_RESET_SECONDS} seconds...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.bgPattern} aria-hidden="true" />

      <section className={styles.imagePanel}>
        <div className={styles.imageOverlay} />
        <div className={styles.imageBrandTag}>
          <span className={styles.imageBrandName}>Roop Sari Palace</span>
          <span className={styles.imageBrandSub}>Indian Ethnic Wear</span>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.brandHeader}>
            {/* Real Logo from site */}
            <div className={styles.brandLogoContainer}>
              <img
                src="/logo.png"
                alt="Roop Sari Palace"
                className={styles.brandLogoImage}
              />
            </div>
            <h1 className={styles.formTitle}>
              Welcome to
              <br />
              <span className={styles.titleAccent}>Roop Sari Palace</span>
            </h1>
            <p className={styles.formSubtitle}>
              Please share your details so we can serve you better and keep you
              updated on our latest collections.
            </p>
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerIcon}>✦</span>
          </div>

          <form
            onSubmit={handleSubmit}
            className={styles.form}
            id="customer-form"
            noValidate
          >
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <input
                ref={nameRef}
                id="name"
                name="name"
                type="text"
                className={`form-input ${errors.name ? "error" : ""}`}
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
              {errors.name && (
                <span className="form-error">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`form-input ${errors.phone ? "error" : ""}`}
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
              {errors.phone && (
                <span className="form-error">{errors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? "error" : ""}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && (
                <span className="form-error">{errors.email}</span>
              )}
            </div>

            {serverError && (
              <div className={styles.serverError}>{serverError}</div>
            )}

            <button
              type="submit"
              className={`btn btn-dark btn-lg ${styles.submitBtn}`}
              disabled={loading}
              id="submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Saving...
                </>
              ) : (
                "Submit"
              )}
            </button>

            {installPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className={styles.installBtn}
                id="install-app-btn"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "8px" }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Install App on this Device
              </button>
            )}

            <p className={styles.disclaimer}>
              Your information is safe with us and will only be used to serve
              you better.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
