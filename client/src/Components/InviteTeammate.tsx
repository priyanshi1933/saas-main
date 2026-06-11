import React, { useState, type ChangeEvent } from "react";
import { createInvitation } from "../Api/auth";
import { inviteSchema, validateWithJoi, type ValidationErrors } from "../Validation/userSchema";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  member: "Member",
  read_only: "Read-Only",
};

type InviteTeammateProps = {
  onInviteCreated?: () => void;
};

const InviteTeammate = ({ onInviteCreated }: InviteTeammateProps) => {
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "member",
  });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ValidationErrors<keyof typeof inviteData>>({});
  const [inviteLink, setInviteLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage("");
    setInviteLink("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: validationErrors, isValid } = validateWithJoi(inviteSchema, inviteData);
    setErrors(validationErrors);
    if (!isValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createInvitation(inviteData.email, inviteData.role);
      setMessage(`Invitation created for ${response.data.data.email} as ${roleLabels[response.data.data.role]}.`);
      setInviteLink(`${window.location.origin}/invite/accept?token=${response.data.data.token}`);
      setInviteData({ email: "", role: "member" });
      onInviteCreated?.();
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Invitation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel invite-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Team access</p>
          <h2>Invite teammate</h2>
        </div>
        <span className="status-pill">Owner/Admin</span>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        <label className="form-label">
          Email
          <input
            type="email"
            name="email"
            value={inviteData.email}
            onChange={handleChange}
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            placeholder="teammate@example.com"
          />
          <span className="invalid-feedback">{errors.email}</span>
        </label>

        <label className="form-label">
          Role
          <select
            name="role"
            value={inviteData.role}
            onChange={handleChange}
            className={`form-select ${errors.role ? "is-invalid" : ""}`}
          >
            <option value="admin">Admin</option>
            <option value="member">Member</option>
            <option value="read_only">Read-Only</option>
          </select>
          <span className="invalid-feedback">{errors.role}</span>
        </label>

        <button type="submit" className="btn btn-dark" disabled={isSubmitting}>
          {isSubmitting ? "Creating invite..." : "Create invite"}
        </button>
      </form>

      {message && <div className="alert alert-info mt-3 mb-0">{message}</div>}
      {inviteLink && (
        <div className="invite-link">
          <span>Invite link</span>
          <input className="form-control" value={inviteLink} readOnly />
        </div>
      )}
    </section>
  );
};

export default InviteTeammate;
