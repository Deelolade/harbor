import { prisma } from "../../lib/prisma.js";
import crypto from "node:crypto";
import type { WorkspaceRole } from "../../generated/prisma/client/index.js";

export interface CreateInvitationInput {
  email: string;
  role?: WorkspaceRole;
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Default invitation expiry: 7 days */
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const invitationService = {
  /** Create an invitation for a workspace */
  async create(workspaceId: string, inviterId: string, input: CreateInvitationInput) {
    const email = input.email.toLowerCase().trim();

    // Check if user is already a member
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: user.id } },
      });
      if (existingMember) {
        throw new AlreadyMemberError();
      }
    }

    // Cancel any pending invitation for the same email + workspace
    await prisma.invitation.deleteMany({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
      },
    });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    return prisma.invitation.create({
      data: {
        workspaceId,
        inviterId,
        email,
        role: input.role ?? "MEMBER",
        token,
        expiresAt,
      },
      include: {
        inviter: { select: { id: true, name: true, email: true, image: true } },
        workspace: { select: { id: true, name: true } },
      },
    });
  },

  /** List all invitations for a workspace */
  async listByWorkspace(workspaceId: string) {
    return prisma.invitation.findMany({
      where: { workspaceId },
      include: {
        inviter: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Get an invitation by token (for the public invite page) */
  async getByToken(token: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        inviter: { select: { id: true, name: true, email: true, image: true } },
        workspace: { select: { id: true, name: true } },
      },
    });

    if (!invitation) return null;

    // Check expiry
    if (invitation.expiresAt < new Date()) {
      return { ...invitation, expired: true as const };
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return { ...invitation, accepted: true as const };
    }

    return invitation;
  },

  /** Accept an invitation (existing user) */
  async accept(token: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new InvitationError("Invitation not found.");
    }

    if (invitation.acceptedAt) {
      throw new InvitationError("This invitation has already been accepted.");
    }

    if (invitation.expiresAt < new Date()) {
      throw new InvitationError("This invitation has expired.");
    }

    // Verify the accepting user matches the invited email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.email) {
      throw new InvitationError(
        "This invitation was sent to a different email address.",
      );
    }

    // Check if already a member (shouldn't happen, but safety check)
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });
    if (existing) {
      throw new InvitationError("You are already a member of this workspace.");
    }

    // Add user as member and mark invitation as accepted
    const [member] = await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          workspace: { select: { id: true, name: true } },
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return member;
  },

  /**
   * Process an invitation for a newly registered user.
   * Called after sign-up when the request carried an invite token.
   * Adds the user to the workspace directly (bypassing the "accept" flow
   * since the user just created their account).
   */
  async processForNewUser(token: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) return null;

    if (invitation.acceptedAt || invitation.expiresAt < new Date()) {
      return null;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    // Add user as member and mark invitation as accepted
    const [member] = await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return member;
  },

  /** Cancel (delete) an invitation */
  async cancel(invitationId: string) {
    return prisma.invitation.delete({
      where: { id: invitationId },
    });
  },
};

// ── Custom errors ──

export class AlreadyMemberError extends Error {
  constructor() {
    super("User is already a member of this workspace.");
    this.name = "AlreadyMemberError";
  }
}

export class InvitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationError";
  }
}
