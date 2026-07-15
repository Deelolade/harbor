import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "@/lib/auth.js";
import { prisma } from "@/lib/prisma.js";
import {
  invitationService,
  AlreadyMemberError,
  InvitationError,
} from "@/modules/workspace/invitation.service.js";
import type { CreateInvitationInput } from "@/modules/workspace/invitation.service.js";
import { workspaceService } from "@/modules/workspace/workspace.service.js";

// ── Helpers ──

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  return session?.user ?? null;
}

function canManage(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

async function requireManageAccess(
  workspaceId: string,
  userId: string,
  reply: FastifyReply,
) {
  const member = await workspaceService.getMember(workspaceId, userId);
  if (!member) {
    reply
      .status(403)
      .send({ message: "You are not a member of this workspace." });
    return null;
  }
  if (!canManage(member.role)) {
    reply
      .status(403)
      .send({ message: "Only admins and owners can manage invitations." });
    return null;
  }
  return member;
}

// ── Route registration ──

export async function invitationRoutes(fastify: FastifyInstance) {
  // ── Create invitation ──
  fastify.post(
    "/api/workspaces/:id/invitations",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const access = await requireManageAccess(id, user.id, reply);
      if (!access) return;

      const { email, role } = request.body as CreateInvitationInput;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return reply
          .status(400)
          .send({ message: "A valid email is required." });
      }

      // Validate role if provided
      if (role && !["OWNER", "ADMIN", "MEMBER"].includes(role)) {
        return reply
          .status(400)
          .send({ message: "Role must be OWNER, ADMIN, or MEMBER." });
      }

      // Only owner can invite as ADMIN
      if (role === "ADMIN" && access.role !== "OWNER") {
        return reply
          .status(403)
          .send({ message: "Only the owner can invite someone as admin." });
      }

      // Nobody can invite as OWNER
      if (role === "OWNER") {
        return reply
          .status(400)
          .send({ message: "Cannot invite someone as owner." });
      }

      try {
        const invitation = await invitationService.create(id, user.id, {
          email: email.trim(),
          role,
        });
        return reply.status(201).send(invitation);
      } catch (err) {
        if (err instanceof AlreadyMemberError) {
          return reply.status(409).send({ message: err.message });
        }
        throw err;
      }
    },
  );

  // ── List invitations for a workspace ──
  fastify.get(
    "/api/workspaces/:id/invitations",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const access = await requireManageAccess(id, user.id, reply);
      if (!access) return;

      const invitations = await invitationService.listByWorkspace(id);
      return reply.send(invitations);
    },
  );

  // ── Cancel invitation ──
  fastify.delete(
    "/api/workspaces/:id/invitations/:invitationId",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id, invitationId } = request.params as {
        id: string;
        invitationId: string;
      };
      const access = await requireManageAccess(id, user.id, reply);
      if (!access) return;

      await invitationService.cancel(invitationId);
      return reply.status(204).send();
    },
  );

  // ── Get invitation by token (public — for the invite landing page) ──
  fastify.get(
    "/api/invitations/:token",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { token } = request.params as { token: string };
      const invitation = await invitationService.getByToken(token);

      if (!invitation) {
        return reply.status(404).send({ message: "Invitation not found." });
      }

      // Return safe public info (don't expose email to unauthenticated users)
      return reply.send({
        id: invitation.id,
        workspaceName: invitation.workspace.name,
        inviterName: invitation.inviter.name,
        role: "role" in invitation ? invitation.role : undefined,
        ...("expired" in invitation ? { expired: true } : {}),
        ...("accepted" in invitation ? { accepted: true } : {}),
      });
    },
  );

  // ── Accept invitation (authenticated) ──
  fastify.post(
    "/api/invitations/:token/accept",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { token } = request.params as { token: string };

      try {
        const member = await invitationService.accept(token, user.id);
        return reply.send(member);
      } catch (err) {
        if (err instanceof InvitationError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  );
}
