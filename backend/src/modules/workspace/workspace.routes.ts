import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { workspaceService } from "./workspace.service.js";
import { sendInviteEmail } from "../../utils/email.js";
import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddMemberInput,
  UpdateMemberInput,
} from "./workspace.service.js";

// ── Helpers ──

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  return session?.user ?? null;
}

/** Check that the requester belongs to the workspace */
async function requireMembership(workspaceId: string, userId: string) {
  const member = await workspaceService.getMember(workspaceId, userId);
  if (!member) {
    return null;
  }
  return member;
}

/** Check that the requester has at least ADMIN role */
function canManage(member: { role: string }) {
  return member.role === "OWNER" || member.role === "ADMIN";
}

function isOwner(member: { role: string }) {
  return member.role === "OWNER";
}

// ── Route registration ──

export async function workspaceRoutes(fastify: FastifyInstance) {
  // ── Create workspace ──
  fastify.post(
    "/api/workspaces",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { name } = request.body as CreateWorkspaceInput;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return reply
          .status(400)
          .send({ message: "Workspace name is required." });
      }

      const workspace = await workspaceService.create(user.id, {
        name: name.trim(),
      });

      return reply.status(201).send(workspace);
    },
  );

  // ── List user's workspaces ──
  fastify.get(
    "/api/workspaces",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      // Safety net: auto-create personal workspace if user has none
      // (covers OAuth sign-ups; invite-only users skip this implicitly)
      await workspaceService.ensurePersonalWorkspace(user.id, user.name);

      const workspaces = await workspaceService.listByUser(user.id);
      return reply.send(workspaces);
    },
  );

  // ── Get workspace by ID ──
  fastify.get(
    "/api/workspaces/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const member = await requireMembership(id, user.id);
      if (!member) {
        return reply
          .status(403)
          .send({ message: "You are not a member of this workspace." });
      }

      const workspace = await workspaceService.getById(id);
      if (!workspace) {
        return reply.status(404).send({ message: "Workspace not found." });
      }

      return reply.send(workspace);
    },
  );

  // ── Update workspace ──
  fastify.put(
    "/api/workspaces/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const member = await requireMembership(id, user.id);
      if (!member) {
        return reply
          .status(403)
          .send({ message: "You are not a member of this workspace." });
      }
      if (!isOwner(member)) {
        return reply.status(403).send({
          message: "Only admins and owners can update the workspace.",
        });
      }

      const { name } = request.body as UpdateWorkspaceInput;
      if (
        name !== undefined &&
        (typeof name !== "string" || name.trim().length === 0)
      ) {
        return reply
          .status(400)
          .send({ message: "Workspace name cannot be empty." });
      }

      const updated = await workspaceService.update(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
      });

      return reply.send(updated);
    },
  );

  // ── Delete workspace ──
  fastify.delete(
    "/api/workspaces/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const member = await requireMembership(id, user.id);
      if (!member) {
        return reply
          .status(403)
          .send({ message: "You are not a member of this workspace." });
      }
      if (!isOwner(member)) {
        return reply
          .status(403)
          .send({ message: "Only the owner can delete this workspace." });
      }

      await workspaceService.delete(id);
      return reply.status(204).send();
    },
  );

  // ── List workspace members ──
  fastify.get(
    "/api/workspaces/:id/members",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const member = await requireMembership(id, user.id);
      if (!member) {
        return reply
          .status(403)
          .send({ message: "You are not a member of this workspace." });
      }

      const members = await workspaceService.listMembers(id);
      return reply.send(members);
    },
  );

  // ── Add member to workspace ──
  fastify.post(
    "/api/workspaces/:id/members",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const member = await requireMembership(id, user.id);
      if (!member) {
        return reply
          .status(403)
          .send({ message: "You are not a member of this workspace." });
      }
      if (!isOwner(member)) {
        return reply
          .status(403)
          .send({ message: "Only the owner can add members." });
      }

      const { userId, role } = request.body as AddMemberInput;
      if (!userId || typeof userId !== "string") {
        return reply.status(400).send({ message: "userId is required." });
      }

      // Check if user is already a member
      const existing = await workspaceService.getMember(id, userId);
      if (existing) {
        return reply
          .status(409)
          .send({ message: "User is already a member of this workspace." });
      }

      const newMember = await workspaceService.addMember(id, { userId, role });
      return reply.status(201).send(newMember);
    },
  );

  // ── Update member role ──
  fastify.put(
    "/api/workspaces/:id/members/:userId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id, userId: targetUserId } = request.params as {
        id: string;
        userId: string;
      };
      const currentMember = await requireMembership(id, user.id);
      if (!currentMember) {
        return reply
          .status(403)
          .send({ message: "You are not a member of this workspace." });
      }
      if (!canManage(currentMember)) {
        return reply
          .status(403)
          .send({ message: "Only admins and owners can change member roles." });
      }

      const { role } = request.body as UpdateMemberInput;
      if (!role || !["OWNER", "ADMIN", "MEMBER"].includes(role)) {
        return reply.status(400).send({
          message: "Valid role is required: OWNER, ADMIN, or MEMBER.",
        });
      }

      const targetMember = await workspaceService.getMember(id, targetUserId);
      if (!targetMember) {
        return reply
          .status(404)
          .send({ message: "Member not found in this workspace." });
      }

      if (
        (role === "ADMIN" || targetMember.role === "ADMIN") &&
        !isOwner(currentMember)
      ) {
        return reply
          .status(403)
          .send({ message: "Only the owner can manage admin roles." });
      }

      if (role === "OWNER" && !isOwner(currentMember)) {
        return reply
          .status(403)
          .send({ message: "Only the owner can transfer ownership." });
      }

      const updated = await workspaceService.updateMember(targetMember.id, {
        role,
      });
      return reply.send(updated);
    },
  );

  // ── Remove member ──
  fastify.delete(
    "/api/workspaces/:id/members/:userId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id, userId: targetUserId } = request.params as {
        id: string;
        userId: string;
      };
      const currentMember = await requireMembership(id, user.id);
      if (!currentMember) {
        return reply
          .status(403)
          .send({ message: "You are not a member of this workspace." });
      }

      const targetMember = await workspaceService.getMember(id, targetUserId);
      if (!targetMember) {
        return reply
          .status(404)
          .send({ message: "Member not found in this workspace." });
      }

      // Only admins/owners can remove members, or a user can remove themselves
      const isSelfRemoval = targetMember.userId === user.id;
      if (!isSelfRemoval && !canManage(currentMember)) {
        return reply
          .status(403)
          .send({ message: "Only admins and owners can remove members." });
      }

      // Cannot remove the owner
      if (targetMember.role === "OWNER") {
        return reply
          .status(403)
          .send({ message: "Cannot remove the workspace owner." });
      }

      // Only owner can remove an admin
      if (targetMember.role === "ADMIN" && !isOwner(currentMember)) {
        return reply
          .status(403)
          .send({ message: "Only the owner can remove an admin." });
      }

      await workspaceService.removeMember(targetMember.id);
      return reply.status(204).send();
    },
  );

  // ── Invite a user by email ──
  fastify.post(
    "/api/workspaces/:id/invites",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const member = await requireMembership(id, user.id);
      if (!member) return reply.status(403).send({ message: "Not a member" });
      if (!isOwner(member))
        return reply
          .status(403)
          .send({ message: "Only admins and owners can invite." });

      const { email } = request.body as { email: string };
      if (!email)
        return reply.status(400).send({ message: "Email is required." });

      const workspace = await workspaceService.getById(id);
      const alreadyMember = workspace?.members.find(
        (m) => m.user.email.toLowerCase() === email.toLowerCase(),
      );
      if (alreadyMember)
        return reply.status(409).send({ message: "User is already a member." });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.verification.create({
        data: {
          id: crypto.randomUUID(),
          identifier: `${id}:${email.toLowerCase()}`,
          value: token,
          expiresAt,
        },
      });

      const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
      const inviteUrl = `${FRONTEND}/invite?token=${token}&workspaceId=${id}`;
      sendInviteEmail(
        email,
        user.name || user.email,
        workspace?.name || "Untitled",
        inviteUrl,
      ).catch((err) => request.log.error(err, "Failed to send invite email"));

      return reply.status(200).send({ message: "Invitation sent." });
    },
  );

  // ── Get invite details (public, no auth needed) ──
  fastify.get(
    "/api/workspaces/invites/:token",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { token } = request.params as { token: string };
      if (!token)
        return reply.status(400).send({ message: "Token is required." });

      const record = await prisma.verification.findFirst({
        where: {
          value: token,
          identifier: { startsWith: "" },
        },
      });

      if (!record) {
        return reply.status(404).send({ message: "Invalid invite link." });
      }

      if (record.expiresAt < new Date()) {
        return reply.status(410).send({ message: "This invite has expired." });
      }

      const [workspaceId, inviteEmail] = record.identifier.split(":");
      const workspace = await workspaceService.getById(workspaceId);

      if (!workspace) {
        return reply.status(404).send({ message: "Workspace not found." });
      }

      const inviter = workspace.members.find((m) => m.role === "OWNER")?.user;

      return reply.send({
        workspaceName: workspace.name,
        inviterName: inviter?.name || workspace.owner.name,
        email: inviteEmail,
        expiresAt: record.expiresAt,
      });
    },
  );

  // ── Accept invite ──
  fastify.post(
    "/api/workspaces/invites/accept",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const acceptUser = await getSessionUser(request);
      if (!acceptUser)
        return reply.status(401).send({ message: "Unauthorized" });

      const { token } = request.body as { token: string };
      if (!token)
        return reply.status(400).send({ message: "Token is required." });

      const record = await prisma.verification.findFirst({
        where: { value: token, expiresAt: { gt: new Date() } },
      });

      if (!record)
        return reply
          .status(400)
          .send({ message: "Invalid or expired invite." });

      const [workspaceId, inviteEmail] = record.identifier.split(":");

      if (acceptUser.email.toLowerCase() !== inviteEmail?.toLowerCase()) {
        return reply
          .status(403)
          .send({ message: "This invite is for a different email." });
      }

      await workspaceService.addMember(workspaceId, {
        userId: acceptUser.id,
        role: "MEMBER",
      });
      await prisma.verification.delete({ where: { id: record.id } });

      return reply.status(200).send({ workspaceId });
    },
  );
}
