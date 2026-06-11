import { useEffect, useMemo, useState } from "react";
import { getInvitations } from "../Api/auth";

type Invitation = {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  createdAt: string;
};

type PendingInvitationsProps = {
  refreshKey: number;
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  member: "Member",
  read_only: "Read-Only",
};

const PendingInvitations = ({ refreshKey }: PendingInvitationsProps) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [message, setMessage] = useState("");
  const frontendBaseUrl = useMemo(() => window.location.origin, []);

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        const response = await getInvitations();
        setInvitations(response.data.data || []);
        setMessage("");
      } catch (error: any) {
        setMessage(error.response?.data?.message || "Could not load pending invitations");
      }
    };

    loadInvitations();
  }, [refreshKey]);

  const buildInviteLink = (token: string) => {
    return `${frontendBaseUrl}/invite/accept?token=${token}`;
  };

  const copyInviteLink = async (token: string) => {
    const inviteLink = buildInviteLink(token);
    try {
      await navigator.clipboard.writeText(inviteLink);
      setMessage("Invite link copied.");
    } catch {
      setMessage(inviteLink);
    }
  };

  return (
    <section className="panel wide-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Team access</p>
          <h2>Invitation links</h2>
        </div>
        <span className="status-pill">{invitations.length} total</span>
      </div>

      {message && <div className="alert alert-info py-2 mt-3 mb-0">{message}</div>}

      {invitations.length === 0 ? (
        <p className="muted empty-state">No invitations yet.</p>
      ) : (
        <div className="invite-list">
          {invitations.map((invitation) => {
            const inviteLink = buildInviteLink(invitation.token);
            return (
              <div className="invite-row" key={invitation.id}>
                <div>
                  <strong>{invitation.email}</strong>
                  <span>{roleLabels[invitation.role] || invitation.role}</span>
                  <span className={`status-pill ${invitation.status}`}>{invitation.status}</span>
                </div>
                <input className="form-control" value={inviteLink} readOnly />
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => copyInviteLink(invitation.token)}
                >
                  Copy
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PendingInvitations;
