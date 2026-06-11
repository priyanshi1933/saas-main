import { Request, Response } from "express";
import {
  acceptInvitation,
  createInvitation,
  getOrganizationInvitations,
  getOrganizationMembers,
} from "../services/invitation.service";
import { acceptInvitationSchema, inviteSchema, validateBody } from "../validation";

export const inviteUser = async (req: Request, res: Response) => {
  try {
    const inviter = (req as any).user;
    const { email, role } = validateBody<{ email: string; role: string }>(inviteSchema, req.body);
    if (!inviter || !inviter.organizationId) {
      return res.status(403).json({ message: "Organization context is required" });
    }

    const invitation = await createInvitation(inviter.id, inviter.organizationId, email, role);
    const inviteLink = `${req.protocol}://${req.get("host")}/invite/accept?token=${invitation.token}`;

    res.status(201).json({
      success: true,
      message: "Invitation created successfully",
      data: {
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        inviteLink,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getInvitations = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester || !requester.organizationId) {
      return res.status(403).json({ message: "Organization context is required" });
    }

    const invitations = await getOrganizationInvitations(requester.id, requester.organizationId);

    res.json({
      success: true,
      data: invitations.map((invitation) => ({
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        status: invitation.status,
        createdAt: invitation.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester || !requester.organizationId) {
      return res.status(403).json({ message: "Organization context is required" });
    }

    const members = await getOrganizationMembers(requester.id, requester.organizationId);

    res.json({
      success: true,
      data: members.map((member) => ({
        id: member._id,
        email: member.email,
        role: member.role,
        organizationId: member.organizationId,
        createdAt: member.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const acceptInvitationUser = async (req: Request, res: Response) => {
  try {
    const { token, email, password } = validateBody<{ token: string; email: string; password: string }>(
      acceptInvitationSchema,
      req.body,
    );
    const user = await acceptInvitation(token, email, password);
    res.status(201).json({
      success: true,
      message: "Invitation accepted and user created",
      data: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
