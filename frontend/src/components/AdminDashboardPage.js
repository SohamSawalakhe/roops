"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/admin.module.css";

export default function AdminDashboardPage() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  // Edit / Delete states
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "" });
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Change password states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Handle password submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordError("New password must be at least 4 characters long");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password");
        return;
      }

      alert("Password updated successfully!");
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordError("An error occurred while updating password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const fetchCustomers = useCallback(
    async (page = 1, searchQuery = "") => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "25",
        });
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/customers?${params}`);

        if (res.status === 401) {
          router.push("/admin");
          return;
        }

        const data = await res.json();
        setCustomers(data.customers || []);
        setPagination(data.pagination || {});
        setAuthenticated(true);
      } catch {
        console.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers(1, search);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, fetchCustomers]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const handleExport = () => {
    window.location.href = "/api/admin/export";
  };

  // Delete customer entry
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;

    try {
      const res = await fetch(`/api/customers?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete customer entry");
        return;
      }

      fetchCustomers(pagination.page, search);
    } catch (error) {
      console.error("Delete customer error:", error);
      alert("An error occurred while deleting.");
    }
  };

  // Open edit modal
  const startEdit = (customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    });
    setEditErrors({});
  };

  // Submit edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditErrors({});

    // Validation
    const errs = {};
    if (!editForm.name.trim() || editForm.name.trim().length < 2)
      errs.name = "Please enter your name";
    if (!editForm.phone.trim() || !/^[\d\s\-\+\(\)]{7,20}$/.test(editForm.phone.trim()))
      errs.phone = "Please enter a valid phone number";
    if (!editForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim()))
      errs.email = "Please enter a valid email address";

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingCustomer.id, ...editForm }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setEditErrors(data.errors);
        } else {
          alert(data.error || "Failed to update customer");
        }
        return;
      }

      setEditingCustomer(null);
      fetchCustomers(pagination.page, search);
    } catch (error) {
      console.error("Update customer error:", error);
      alert("An error occurred while saving edits.");
    } finally {
      setSavingEdit(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const todayCount = customers.filter((c) => {
    const today = new Date().toDateString();
    return new Date(c.createdAt).toDateString() === today;
  }).length;

  if (!authenticated && loading) {
    return (
      <main className={styles.loadingMain}>
        <div className={styles.loadingSpinner} />
      </main>
    );
  }

  return (
    <main className={styles.dashboardMain}>
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          {/* Small logo for Navbar */}
          <div className={styles.navLogoContainer}>
            <img
              src="/logo.png"
              alt="Roop Sari Palace"
              className={styles.navLogoImage}
            />
          </div>
          <span className={styles.navTitle}>Admin Panel</span>
        </div>

        <div className={styles.navActions}>
          <button
            onClick={handleExport}
            className="btn btn-outline btn-sm"
            id="export-btn"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => setIsChangingPassword(true)}
            className="btn btn-outline btn-sm"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
            id="change-password-trigger"
          >
            🔑 Change Password
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-sm"
            style={{
              background: "transparent",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
            }}
            id="logout-btn"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Customers</div>
          <div className={styles.statValue}>{pagination.total || 0}</div>
          <div className={styles.statSub}>All time entries</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Today</div>
          <div className={styles.statValue}>{todayCount}</div>
          <div className={styles.statSub}>New entries today</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pages</div>
          <div className={styles.statValue}>{pagination.totalPages || 0}</div>
          <div className={styles.statSub}>
            {pagination.limit || 25} per page
          </div>
        </div>
      </div>

      <div className={styles.tableArea}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Customer Data</h2>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-input"
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.loadingSpinner} style={{ margin: "0 auto" }} />
            </div>
          ) : customers.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <div className={styles.emptyTitle}>
                {search ? "No results found" : "No customers yet"}
              </div>
              <div className={styles.emptyText}>
                {search
                  ? "Try a different search term"
                  : "Customers will appear here once they fill the form."}
              </div>
            </div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, idx) => (
                    <tr key={customer.id}>
                      <td style={{ color: "var(--color-text-muted)" }}>
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td>
                        <span className={styles.customerName}>
                          {customer.name}
                        </span>
                      </td>
                      <td>{customer.phone}</td>
                      <td>
                        <span className={styles.customerEmail}>
                          {customer.email}
                        </span>
                      </td>
                      <td>
                        <span className={styles.badge}>
                          <span className={styles.badgeDot} />
                          Active
                        </span>
                      </td>
                      <td>
                        <div className={styles.customerDate}>
                          {formatDate(customer.createdAt)}
                          <br />
                          {formatTime(customer.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => startEdit(customer)}
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            title="Edit customer details"
                            id={`edit-btn-${customer.id}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            title="Delete customer entry"
                            id={`delete-btn-${customer.id}`}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.pagination}>
                <span className={styles.pageInfo}>
                  Showing{" "}
                  {Math.min(
                    (pagination.page - 1) * pagination.limit + 1,
                    pagination.total
                  )}
                  –
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total}
                </span>
                <div className={styles.pageButtons}>
                  <button
                    className={styles.pageBtn}
                    disabled={pagination.page <= 1}
                    onClick={() => fetchCustomers(pagination.page - 1, search)}
                  >
                    ← Prev
                  </button>
                  <button
                    className={styles.pageBtn}
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchCustomers(pagination.page + 1, search)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Edit Customer Details</h3>
            <form onSubmit={handleEditSubmit} className="form" id="edit-customer-form">
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label className="form-label" htmlFor="edit-name">
                  Full Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  className={`form-input ${editErrors.name ? "error" : ""}`}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
                {editErrors.name && <span className="form-error">{editErrors.name}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label className="form-label" htmlFor="edit-phone">
                  Phone Number
                </label>
                <input
                  id="edit-phone"
                  type="text"
                  className={`form-input ${editErrors.phone ? "error" : ""}`}
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                  required
                />
                {editErrors.phone && <span className="form-error">{editErrors.phone}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label className="form-label" htmlFor="edit-email">
                  Email Address
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className={`form-input ${editErrors.email ? "error" : ""}`}
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
                {editErrors.email && <span className="form-error">{editErrors.email}</span>}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="btn btn-outline btn-sm"
                  disabled={savingEdit}
                  id="cancel-edit-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-dark btn-sm"
                  disabled={savingEdit}
                  id="save-edit-btn"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Change Admin Password</h3>
            <form onSubmit={handlePasswordSubmit} className="form" id="change-password-form">
              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label className="form-label" htmlFor="current-password">
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  className="form-input"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "15px" }}>
                <label className="form-label" htmlFor="new-password">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  className={`form-input ${passwordError ? "error" : ""}`}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="Enter new password (min 4 chars)"
                  required
                />
                {passwordError && <span className="form-error">{passwordError}</span>}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({ currentPassword: "", newPassword: "" });
                    setPasswordError("");
                  }}
                  className="btn btn-outline btn-sm"
                  disabled={savingPassword}
                  id="cancel-password-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-dark btn-sm"
                  disabled={savingPassword}
                  id="save-password-btn"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
