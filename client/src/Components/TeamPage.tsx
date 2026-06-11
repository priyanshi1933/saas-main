import { useEffect, useMemo, useState } from "react";
import { getInvitations, getTeamMembers } from "../Api/auth";
import InviteTeammate from "./InviteTeammate";

type Member = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  createdAt: string;
};

type TeamPageProps = {
  canInvite: boolean;
  refreshKey: number;
  onInviteCreated: () => void;
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  read_only: "Read-Only",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  revoked: "Revoked",
};

const dateLabel = (value: string) => {
  return value ? new Date(value).toLocaleDateString() : "-";
};

const TeamPage = ({ canInvite, refreshKey, onInviteCreated }: TeamPageProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [message, setMessage] = useState("");
  const frontendBaseUrl = useMemo(() => window.location.origin, []);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const [membersResponse, invitationsResponse] = await Promise.all([
          getTeamMembers(),
          canInvite ? getInvitations() : Promise.resolve({ data: { data: [] } }),
        ]);

        setMembers(membersResponse.data.data || []);
        setInvitations(invitationsResponse.data.data || []);
        setMessage("");
      } catch (error: any) {
        setMessage(error.response?.data?.message || "Could not load team data");
      }
    };

    loadTeam();
  }, [canInvite, refreshKey]);

  const inviteStats = useMemo(() => {
    return invitations.reduce(
      (counts, invitation) => {
        counts.total += 1;
        if (invitation.status === "pending") {
          counts.pending += 1;
        }
        if (invitation.status === "accepted") {
          counts.accepted += 1;
        }
        if (invitation.status === "revoked") {
          counts.revoked += 1;
        }
        return counts;
      },
      { total: 0, pending: 0, accepted: 0, revoked: 0 },
    );
  }, [invitations]);

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
    <section className="team-page">
      <section className="metric-grid team-metrics">
        <div className="metric-card">
          <span>Members</span>
          <strong>{members.length}</strong>
          <small>Active users in this workspace</small>
        </div>
        <div className="metric-card">
          <span>Pending invites</span>
          <strong>{inviteStats.pending}</strong>
          <small>Waiting for signup</small>
        </div>
        <div className="metric-card">
          <span>Accepted invites</span>
          <strong>{inviteStats.accepted}</strong>
          <small>Joined through invitation</small>
        </div>
        <div className="metric-card">
          <span>Total invites</span>
          <strong>{inviteStats.total}</strong>
          <small>All invitation statuses</small>
        </div>
      </section>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <section className="team-layout">
        <section className="panel team-members-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Workspace users</p>
              <h2>Members</h2>
            </div>
            <span className="status-pill">{members.length} users</span>
          </div>

          {members.length === 0 ? (
            <p className="muted empty-state">No members found.</p>
          ) : (
            <div className="table-wrap">
              <table className="table team-table align-middle">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.email}</td>
                      <td>
                        <span className={`status-pill ${member.role}`}>{roleLabels[member.role] || member.role}</span>
                      </td>
                      <td>{dateLabel(member.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {canInvite ? (
          <InviteTeammate onInviteCreated={onInviteCreated} />
        ) : (
          <section className="panel invite-panel">
            <p className="eyebrow">Team access</p>
            <h2>Invites unavailable</h2>
            <p className="muted empty-state">Only owners and admins can invite teammates.</p>
          </section>
        )}
      </section>

      {canInvite && (
        <section className="panel invitations-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Invitation history</p>
              <h2>Invitations</h2>
            </div>
            <span className="status-pill">{invitations.length} records</span>
          </div>

          {invitations.length === 0 ? (
            <p className="muted empty-state">No invitations yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table team-table align-middle">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td>{invitation.email}</td>
                      <td>{roleLabels[invitation.role] || invitation.role}</td>
                      <td>
                        <span className={`status-pill ${invitation.status}`}>
                          {statusLabels[invitation.status] || invitation.status}
                        </span>
                      </td>
                      <td>{dateLabel(invitation.createdAt)}</td>
                      <td>
                        {invitation.status === "pending" ? (
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm"
                            onClick={() => copyInviteLink(invitation.token)}
                          >
                            Copy link
                          </button>
                        ) : (
                          <span className="muted">Used</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  );
};

export default TeamPage;
