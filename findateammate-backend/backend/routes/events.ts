/**
 * Event Registration Route Handlers
 * 
 * Handles intra-college event registration with cross-department participation
 * and matching algorithm integration
 */

import { db } from "../db";
import { storage } from "../storage";
import { eventRegistrations, notifications } from "@shared/schema";
import { computeMatchScore } from "../lib/matching";
import { eq, and, or, sql, inArray, asc } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export interface EventRegistrationRequest extends Request {
  user?: any; // From auth middleware
}

/**
 * Register user for an event
 * POST /api/events/:eventId/register
 */
export async function registerForEvent(
  req: EventRegistrationRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;
    const userId = req.user!.id;

    // Get event
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Only allow registrations for intra-college events
    if (event.eventType !== "intra-college") {
      return res.status(400).json({
        message: "Only intra-college events support cross-department registration",
      });
    }

    // Check if already registered
    const existing = await storage.getExistingRegistration(eventId, userId);
    if (existing) {
      return res.status(409).json({ message: "Already registered for this event" });
    }

    // Get student user
    const student = await storage.getUser(userId);
    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }

    // Get event organizer to check department
    const eventOrganizer = await storage.getUser(event.userId);
    if (!eventOrganizer) {
      return res.status(400).json({ message: "Event organizer not found" });
    }

    // Determine registration type and requirements
    const isCrossDept = student.department !== eventOrganizer.department;
    const registrationType = isCrossDept ? "cross_department" : "department";

    // Check if student's department is allowed (for intra-college events with specific departments)
    if (event.eventType === "intra-college" && event.allowedDepartments && Array.isArray(event.allowedDepartments)) {
      const isAllowed = event.allowedDepartments.includes(student.department);
      if (!isAllowed) {
        return res.status(403).json({ 
          message: "This event is only open to specific departments. Your department is not eligible.",
          allowedDepartments: event.allowedDepartments
        });
      }
    }

    const approvalRequired = Boolean(event.isEventOrganiser && event.crossDeptRequiresApproval);
    let matchScore: number | null = null;
    let status: "pending" | "approved" | "rejected" | "confirmed" = approvalRequired ? "pending" : "confirmed";

    // BUG #3 FIX: Validate same-dept registrations against required skills/interests
    if (!isCrossDept) {
      if (event.requiredSkills?.length || event.requiredInterests?.length) {
        const matchResult = computeMatchScore(
          student.skills || [],
          student.interests || [],
          event.requiredSkills || [],
          event.requiredInterests || []
        );
        if (!matchResult.isEligible) {
          return res.status(400).json({
            message: "You don't meet the minimum requirements for this event",
            matchScoreResult: {
              score: matchResult.score,
              skillMatch: matchResult.skillMatchPercentage,
              interestMatch: matchResult.interestMatchPercentage,
              missingSkills: matchResult.missingSkills,
              missingInterests: matchResult.missingInterests,
            },
          });
        }
      }
    }

    // Cross-department registration requires matching algorithm (for intra-college events with specific departments)
    if (isCrossDept && event.eventType === "intra-college" && event.allowedDepartments && Array.isArray(event.allowedDepartments)) {
      const matchResult = computeMatchScore(
        student.skills || [],
        student.interests || [],
        event.requiredSkills || [],
        event.requiredInterests || []
      );

      matchScore = matchResult.score;

      // Check eligibility
      if (!matchResult.isEligible) {
        return res.status(400).json({
          message: "You don't meet the minimum requirements for this event",
          matchScoreResult: {
            score: matchResult.score,
            skillMatch: matchResult.skillMatchPercentage,
            interestMatch: matchResult.interestMatchPercentage,
            missingSkills: matchResult.missingSkills,
            missingInterests: matchResult.missingInterests,
          },
        });
      }

      // Cross-department registrations still respect the organiser approval setting.
      status = approvalRequired ? "pending" : "confirmed";
    }

    // Create registration with transaction to prevent race condition on cap
    let registration;
    try {
      registration = await db.transaction(async (tx) => {
        // Serialize capacity checks per event to avoid concurrent overbooking.
        await tx.execute(sql`SELECT id FROM posts WHERE id = ${eventId} FOR UPDATE`);

        // Check participant cap WITHIN transaction to prevent race conditions
        if (event.maxCrossDeptParticipants) {
          const crossDeptCount = await tx
            .select({ count: sql<number>`count(*)` })
            .from(eventRegistrations)
            .where(
              and(
                eq(eventRegistrations.postId, eventId),
                eq(eventRegistrations.registrationType, "cross_department"),
                or(
                  eq(eventRegistrations.status, "confirmed"),
                  eq(eventRegistrations.status, "approved")
                )
              )
            );

          if (Number(crossDeptCount[0]?.count || 0) >= event.maxCrossDeptParticipants) {
            throw new Error("CAPACITY_EXCEEDED");
          }
        }

        // Create registration within transaction
        const [newReg] = await tx.insert(eventRegistrations).values({
          postId: eventId,
          userId,
          registrationType: registrationType as "department" | "cross_department",
          matchScore: matchScore,
          status: status as "pending" | "approved" | "rejected" | "confirmed",
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        
        return newReg;
      });
    } catch (txErr: any) {
      if (txErr.message === "CAPACITY_EXCEEDED") {
        return res.status(400).json({
          message: "This event has reached the maximum number of cross-department participants"
        });
      }
      throw txErr;
    }

    // Log registration
    await storage.logAudit({
      action: "EVENT_REGISTRATION",
      resource: "EVENT",
      userId,
      userName: student.name,
      details: {
        eventId,
        registrationType,
        matchScore,
        status,
      },
    });

    // Create notification for event organizer (if pending approval or confirmed cross-dept)
    if (status === "pending" || (isCrossDept && status === "confirmed")) {
      await db.insert(notifications).values({
        userId: event.userId, // Send to organizer
        type: "event_registration",
        title: `New ${isCrossDept ? "cross-department" : ""} registration`,
        message: `${student.name} from ${student.department} ${status === "pending" ? "requested to join" : "registered for"} ${event.eventName}${matchScore ? ` (${matchScore}% match)` : ""}`,
        metadata: {
          eventId,
          registrationId: registration.id,
          studentId: userId,
          studentName: student.name,
          matchScore,
          status,
        },
        isRead: false,
      });
    }

    // Check if nearing cross-department capacity (80% threshold)
    if (isCrossDept && status === "confirmed" && event.maxCrossDeptParticipants) {
      const confirmedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.postId, eventId),
            eq(eventRegistrations.registrationType, "cross_department"),
            or(
              eq(eventRegistrations.status, "confirmed"),
              eq(eventRegistrations.status, "approved")
            )
          )
        );
      
      const currentCount = Number(confirmedCount[0]?.count || 0);
      const threshold = Math.floor(event.maxCrossDeptParticipants * 0.8);
      
      if (currentCount >= threshold && currentCount <= event.maxCrossDeptParticipants) {
        await db.insert(notifications).values({
          userId: event.userId,
          type: "event_cap_warning",
          title: "Event Nearing Capacity",
          message: `Your event "${event.eventName}" has ${currentCount} of ${event.maxCrossDeptParticipants} cross-department spots filled.`,
          metadata: {
            eventId,
            currentCount,
            maxCount: event.maxCrossDeptParticipants,
          },
          isRead: false,
        });
      }
    }

    res.status(201).json({
      message: status === "pending"
        ? "Registration submitted for approval"
        : "Successfully registered for event",
      registration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get registrations for an event (organizer only)
 * GET /api/events/:eventId/registrations
 */
export async function getEventRegistrations(
  req: EventRegistrationRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;

    // Get event
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Authorization: only organizer can view
    if (event.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Get all registrations
    const registrations = await storage.getEventRegistrations(eventId);

    // Enrich with user details
    const enriched = await Promise.all(
      registrations.map(async (reg) => {
        const user = await storage.getUser(reg.userId);
        return {
          ...reg,
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                department: user.department,
                skills: user.skills,
                interests: user.interests,
                avatar: user.avatar,
              }
            : null,
        };
      })
    );

    res.json({
      total: enriched.length,
      registrations: enriched,
      stats: {
        pending: enriched.filter((r) => r.status === "pending").length,
        approved: enriched.filter((r) => r.status === "approved").length,
        rejected: enriched.filter((r) => r.status === "rejected").length,
        confirmed: enriched.filter((r) => r.status === "confirmed").length,
        crossDept: enriched.filter(
          (r) => r.registrationType === "cross_department"
        ).length,
        department: enriched.filter(
          (r) => r.registrationType === "department"
        ).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve pending event registration
 * PATCH /api/events/:eventId/registrations/:regId/approve
 */
export async function approveRegistration(
  req: EventRegistrationRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;
    const regId = Array.isArray(req.params.regId)
      ? req.params.regId[0]
      : req.params.regId;

    // Get event
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Authorization
    if (event.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Get registration
    const registration = await storage.getEventRegistration(regId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.postId !== eventId) {
      return res.status(400).json({ message: "Registration does not belong to this event" });
    }

    if (registration.status !== "pending") {
      return res.status(400).json({ message: "Only pending registrations can be approved" });
    }

    let approvalTxError: string | null = null;
    const updated = await db.transaction(async (tx) => {
      // Serialize approvals per event so capacity checks remain accurate.
      await tx.execute(sql`SELECT id FROM posts WHERE id = ${eventId} FOR UPDATE`);

      const [pendingRegistration] = await tx
        .select()
        .from(eventRegistrations)
        .where(eq(eventRegistrations.id, regId))
        .limit(1);

      if (!pendingRegistration) {
        throw new Error("REGISTRATION_NOT_FOUND");
      }

      if (pendingRegistration.postId !== eventId) {
        throw new Error("REGISTRATION_EVENT_MISMATCH");
      }

      if (pendingRegistration.status !== "pending") {
        throw new Error("REGISTRATION_NOT_PENDING");
      }

      if (pendingRegistration.registrationType === "cross_department" && event.maxCrossDeptParticipants) {
        const currentCrossDeptCount = await tx
          .select({ count: sql<number>`count(*)` })
          .from(eventRegistrations)
          .where(
            and(
              eq(eventRegistrations.postId, eventId),
              eq(eventRegistrations.registrationType, "cross_department"),
              or(
                eq(eventRegistrations.status, "confirmed"),
                eq(eventRegistrations.status, "approved")
              )
            )
          );

        if (Number(currentCrossDeptCount[0]?.count || 0) >= event.maxCrossDeptParticipants) {
          throw new Error("CAPACITY_EXCEEDED");
        }
      }

      const [approvedRegistration] = await tx
        .update(eventRegistrations)
        .set({
          status: "approved",
          updatedAt: new Date(),
          rejectionReason: null,
        })
        .where(eq(eventRegistrations.id, regId))
        .returning();

      return approvedRegistration;
    }).catch((txErr: any) => {
      approvalTxError = txErr?.message || "UNKNOWN";
      return null;
    });

    if (!updated) {
      if (approvalTxError === "CAPACITY_EXCEEDED") {
        return res.status(400).json({
          message: "This event has reached the maximum number of cross-department participants",
        });
      }
      if (approvalTxError === "REGISTRATION_NOT_PENDING") {
        return res.status(400).json({ message: "Only pending registrations can be approved" });
      }
      if (approvalTxError === "REGISTRATION_EVENT_MISMATCH") {
        return res.status(400).json({ message: "Registration does not belong to this event" });
      }
      if (approvalTxError === "REGISTRATION_NOT_FOUND") {
        return res.status(404).json({ message: "Registration not found" });
      }
      return res.status(400).json({
        message: "Unable to approve registration",
      });
    }

    // Log action
    await storage.logAudit({
      action: "APPROVE_EVENT_REGISTRATION",
      resource: "EVENT",
      userId: req.user!.id,
      userName: (req.user as any).username || req.user!.name,
      details: {
        eventId,
        registrationId: regId,
        approvedUserId: registration.userId,
      },
    });

    // Send notification to student
    const studentUserApprove = await storage.getUser(registration.userId);
    if (studentUserApprove) {
      await db.insert(notifications).values({
        userId: registration.userId,
        type: "event_approval",
        title: "Registration Approved!",
        message: `Your registration for ${event.eventName} has been approved. See you there!`,
        metadata: {
          eventId,
          registrationId: regId,
          eventName: event.eventName,
        },
        isRead: false,
      });
    }

    if (event.maxCrossDeptParticipants) {
      const approvedOrConfirmedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.postId, eventId),
            eq(eventRegistrations.registrationType, "cross_department"),
            or(
              eq(eventRegistrations.status, "confirmed"),
              eq(eventRegistrations.status, "approved")
            )
          )
        );

      const currentCount = Number(approvedOrConfirmedCount[0]?.count || 0);
      const threshold = Math.floor(event.maxCrossDeptParticipants * 0.8);

      if (currentCount >= threshold && currentCount <= event.maxCrossDeptParticipants) {
        await db.insert(notifications).values({
          userId: event.userId,
          type: "event_cap_warning",
          title: "Event Nearing Capacity",
          message: `Your event "${event.eventName}" has ${currentCount} of ${event.maxCrossDeptParticipants} cross-department spots filled.`,
          metadata: {
            eventId,
            currentCount,
            maxCount: event.maxCrossDeptParticipants,
          },
          isRead: false,
        });
      }
    }

    res.json({
      message: "Registration approved",
      registration: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject cross-department registration with reason
 * PATCH /api/events/:eventId/registrations/:regId/reject
 */
export async function rejectRegistration(
  req: EventRegistrationRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;
    const regId = Array.isArray(req.params.regId)
      ? req.params.regId[0]
      : req.params.regId;
    const { reason } = req.body;

    // Get event
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Authorization
    if (event.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Get registration
    const registration = await storage.getEventRegistration(regId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.postId !== eventId) {
      return res.status(400).json({ message: "Registration does not belong to this event" });
    }

    if (registration.status !== "pending") {
      return res.status(400).json({ message: "Only pending registrations can be rejected" });
    }

    // Update status
    const updated = await storage.updateEventRegistrationStatus(
      regId,
      "rejected",
      reason
    );

    // Log action
    await storage.logAudit({
      action: "REJECT_EVENT_REGISTRATION",
      resource: "EVENT",
      userId: req.user!.id,
      userName: (req.user as any).username || req.user!.name,
      details: {
        eventId,
        registrationId: regId,
        rejectedUserId: registration.userId,
        reason,
      },
    });

    // Send notification to student with rejection reason
    const studentUserReject = await storage.getUser(registration.userId);
    if (studentUserReject) {
      await db.insert(notifications).values({
        userId: registration.userId,
        type: "event_rejection",
        title: "Registration Not Approved",
        message: `Unfortunately, your registration for ${event.eventName} was not approved.${reason ? ` Reason: ${reason}` : ""}`,
        metadata: {
          eventId,
          registrationId: regId,
          eventName: event.eventName,
          reason,
        },
        isRead: false,
      });
    }

    res.json({
      message: "Registration rejected",
      registration: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a registration (organizer/admin only)
 * DELETE /api/events/:eventId/registrations/:regId
 */
export async function deleteRegistration(
  req: EventRegistrationRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;
    const regId = Array.isArray(req.params.regId)
      ? req.params.regId[0]
      : req.params.regId;

    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const registration = await storage.getEventRegistration(regId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (registration.postId !== eventId) {
      return res.status(400).json({ message: "Registration does not belong to this event" });
    }

    if (!(registration.status === "approved" || registration.status === "confirmed")) {
      return res.status(400).json({ message: "Only approved or confirmed registrations can be removed" });
    }

    await storage.deleteEventRegistration(regId);

    await storage.logAudit({
      action: "DELETE_EVENT_REGISTRATION",
      resource: "EVENT",
      userId: req.user!.id,
      userName: (req.user as any).username || req.user!.name,
      details: {
        eventId,
        registrationId: regId,
        removedUserId: registration.userId,
      },
    });

    const removedUser = await storage.getUser(registration.userId);
    if (removedUser) {
      await db.insert(notifications).values({
        userId: registration.userId,
        type: "event_registration_removed",
        title: "Registration Removed",
        message: `Your registration for ${event.eventName} has been removed by the organiser.`,
        metadata: {
          eventId,
          registrationId: regId,
          eventName: event.eventName,
        },
        isRead: false,
      });
    }

    res.json({
      message: "Registration removed",
      registrationId: regId,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve all pending registrations (respects cross-dept capacity)
 * PATCH /api/events/:eventId/registrations/approve-all
 */
export async function approveAllRegistrations(
  req: EventRegistrationRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;

    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM posts WHERE id = ${eventId} FOR UPDATE`);

      const pending = await tx
        .select()
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.postId, eventId), eq(eventRegistrations.status, "pending")))
        .orderBy(asc(eventRegistrations.createdAt));

      if (pending.length === 0) {
        return { approvedIds: [] as string[], skippedIds: [] as string[] };
      }

      let availableCrossDeptSlots = Number.MAX_SAFE_INTEGER;
      if (event.maxCrossDeptParticipants) {
        const currentCrossDeptCount = await tx
          .select({ count: sql<number>`count(*)` })
          .from(eventRegistrations)
          .where(
            and(
              eq(eventRegistrations.postId, eventId),
              eq(eventRegistrations.registrationType, "cross_department"),
              or(
                eq(eventRegistrations.status, "confirmed"),
                eq(eventRegistrations.status, "approved")
              )
            )
          );
        availableCrossDeptSlots = Math.max(
          0,
          event.maxCrossDeptParticipants - Number(currentCrossDeptCount[0]?.count || 0)
        );
      }

      const approvedIds: string[] = [];
      const skippedIds: string[] = [];

      for (const pendingRegistration of pending) {
        if (pendingRegistration.registrationType === "cross_department") {
          if (availableCrossDeptSlots <= 0) {
            skippedIds.push(pendingRegistration.id);
            continue;
          }
          availableCrossDeptSlots -= 1;
        }
        approvedIds.push(pendingRegistration.id);
      }

      if (approvedIds.length > 0) {
        await tx
          .update(eventRegistrations)
          .set({
            status: "approved",
            updatedAt: new Date(),
            rejectionReason: null,
          })
          .where(inArray(eventRegistrations.id, approvedIds));
      }

      return { approvedIds, skippedIds };
    });

    if (result.approvedIds.length > 0) {
      const approvedRegistrations = await Promise.all(result.approvedIds.map((id) => storage.getEventRegistration(id)));
      for (const registration of approvedRegistrations) {
        if (!registration) continue;
        await db.insert(notifications).values({
          userId: registration.userId,
          type: "event_approval",
          title: "Registration Approved!",
          message: `Your registration for ${event.eventName} has been approved. See you there!`,
          metadata: {
            eventId,
            registrationId: registration.id,
            eventName: event.eventName,
          },
          isRead: false,
        });
      }
    }

    await storage.logAudit({
      action: "APPROVE_ALL_EVENT_REGISTRATIONS",
      resource: "EVENT",
      userId: req.user!.id,
      userName: (req.user as any).username || req.user!.name,
      details: {
        eventId,
        approvedCount: result.approvedIds.length,
        skippedCount: result.skippedIds.length,
      },
    });

    res.json({
      message: "Bulk approval complete",
      approvedCount: result.approvedIds.length,
      skippedCount: result.skippedIds.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reject all pending registrations with reason
 * PATCH /api/events/:eventId/registrations/reject-all
 */
export async function rejectAllRegistrations(
  req: EventRegistrationRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.userId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const rejectedRegistrations = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM posts WHERE id = ${eventId} FOR UPDATE`);

      const pendingRegistrations = await tx
        .select()
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.postId, eventId), eq(eventRegistrations.status, "pending")));

      if (pendingRegistrations.length === 0) {
        return [] as typeof pendingRegistrations;
      }

      const pendingIds = pendingRegistrations.map((registration) => registration.id);

      const updated = await tx
        .update(eventRegistrations)
        .set({
          status: "rejected",
          updatedAt: new Date(),
          rejectionReason: reason || "Rejected by organiser",
        })
        .where(inArray(eventRegistrations.id, pendingIds))
        .returning();

      return updated;
    });

    if (rejectedRegistrations.length === 0) {
      return res.json({
        message: "No pending registrations to reject",
        rejectedCount: 0,
      });
    }

    for (const registration of rejectedRegistrations) {
      await db.insert(notifications).values({
        userId: registration.userId,
        type: "event_rejection",
        title: "Registration Not Approved",
        message: `Unfortunately, your registration for ${event.eventName} was not approved.${reason ? ` Reason: ${reason}` : ""}`,
        metadata: {
          eventId,
          registrationId: registration.id,
          eventName: event.eventName,
          reason: reason || "Rejected by organiser",
        },
        isRead: false,
      });
    }

    await storage.logAudit({
      action: "REJECT_ALL_EVENT_REGISTRATIONS",
      resource: "EVENT",
      userId: req.user!.id,
      userName: (req.user as any).username || req.user!.name,
      details: {
        eventId,
        rejectedCount: rejectedRegistrations.length,
        reason: reason || "Rejected by organiser",
      },
    });

    res.json({
      message: "Bulk rejection complete",
      rejectedCount: rejectedRegistrations.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get match score for an event before registration
 * GET /api/events/:eventId/match-score
 */
export async function getEventMatchScore(
  req: EventRegistrationRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const eventId = Array.isArray(req.params.eventId)
      ? req.params.eventId[0]
      : req.params.eventId;
    const userId = req.user!.id;

    // Get event
    const event = await storage.getPost(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.eventType !== "intra-college") {
      return res.status(400).json({
        message: "Match score only available for intra-college events",
      });
    }

    // Get student
    const student = await storage.getUser(userId);
    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }

    // Compute match
    const matchResult = computeMatchScore(
      student.skills || [],
      student.interests || [],
      event.requiredSkills || [],
      event.requiredInterests || []
    );

    res.json({
      score: matchResult.score,
      isEligible: matchResult.isEligible,
      skillMatch: matchResult.skillMatchPercentage,
      interestMatch: matchResult.interestMatchPercentage,
      matchedSkills: matchResult.matchedSkills,
      matchedInterests: matchResult.matchedInterests,
      missingSkills: matchResult.missingSkills,
      missingInterests: matchResult.missingInterests,
    });
  } catch (error) {
    next(error);
  }
}
