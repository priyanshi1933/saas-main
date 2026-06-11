import React, { useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { acceptInvitation } from "../Api/auth";
import { acceptInvitationSchema, validateWithJoi, type ValidationErrors } from "../Validation/userSchema";
import { useSettings } from "../SettingsContext";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [form, setForm] = useState({
    token: tokenFromUrl,
    email: "",
    password: "",
  });
  const { theme, toggleTheme } = useSettings();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ValidationErrors<keyof typeof form>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: validationErrors, isValid } = validateWithJoi(acceptInvitationSchema, form);
    setErrors(validationErrors);
    if (!isValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      await acceptInvitation(form.token, form.email, form.password);
      navigate("/login");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Could not accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel compact">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-settings-row">
            <div>
              <p className="eyebrow">Team invitation</p>
              <h2>Join workspace</h2>
            </div>
            <div className="auth-settings">
              <button type="button" className="btn btn-primary btn-sm" onClick={toggleTheme}>
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </div>

          {message && <div className="alert alert-danger py-2">{message}</div>}

          <label className="form-label">
            Invite token
            <input
              type="text"
              name="token"
              value={form.token}
              onChange={handleChange}
              className={`form-control ${errors.token ? "is-invalid" : ""}`}
              placeholder="Paste invite token"
            />
            <span className="invalid-feedback">{errors.token}</span>
          </label>

          <label className="form-label">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="teammate@example.com"
            />
            <span className="invalid-feedback">{errors.email}</span>
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Minimum 6 characters"
            />
            <span className="invalid-feedback">{errors.password}</span>
          </label>

          <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Joining..." : "Accept invitation"}
          </button>

          <p className="auth-link">
            Already accepted? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default AcceptInvitation;
