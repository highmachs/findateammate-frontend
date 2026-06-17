**FindATeammate.online**

Cross-Department Event Participation

Full Implementation Prompt & Technical Specification![ref1]

Prepared for: Development Team  |  Feature Version: 1.0

**Feature Overview:** This document provides a complete, step-by-step implementation guide for introducing Controlled Cross-Department Participation in events hosted on FindATeammate. When a department organizes an event, students from other departments with relevant skills and interests will be allowed to register — increasing meaningful collaboration while giving organizers full visibility and control over registrations.![](Aspose.Words.b9fd5d9d-c150-4cb0-b502-fa4f6547449e.002.png)

1. **DATABASE / SCHEMA CHANGES![](Aspose.Words.b9fd5d9d-c150-4cb0-b502-fa4f6547449e.003.png)**

**Events Table — New Fields**



|**Field**|**Type**|**Description**|
| - | - | - |
|**cross\_department\_enabled**|*Boolean, default: true*|Whether  the  event  allows  outside-department students|
|**required\_skills**|*Array / JSON*|Skill  tags  required  for  cross-dept  applicants  e.g. ['Python', 'UI Design']|
|**required\_interests**|*Array / JSON*|Interest tags relevant to the event|
|**max\_cross\_dept\_participant s**|*Integer, nullable*|Optional cap on cross-department registrants|
|**cross\_dept\_requires\_appro val**|*Boolean, default: true*|If  true,  cross-dept  registrations  need  organizer approval|

**Registrations / Enrollments Table — New Fields**



|**Field**|**Type**|**Description**|
| - | - | - |
|**registration\_type**|*Enum*|'department' | 'cross\_department'|



|**match\_score**|*Float*|Computed  skill/interest  match  score  at  time  of registration|
| - | - | :- |
|**status**|*Enum*|'pending' | 'approved' | 'rejected' | 'confirmed'|

**User / Student Profile Table — Ensure These Exist**

**department** (String)

**skills** (Array/JSON) — e.g. ['React', 'Machine Learning', 'Figma'] **interests** (Array/JSON) — e.g. ['Hackathons', 'AI', 'Product Design']

2. **MATCHING ALGORITHM![ref2]**

Create a utility function **computeMatchScore(student, event)** that returns a score from 0 to 100:

skillMatches = intersection(student.skills, event.required\_skills) interestMatches = intersection(student.interests, event.required\_interests)![](Aspose.Words.b9fd5d9d-c150-4cb0-b502-fa4f6547449e.005.png)

skillScore = (skillMatches.length / event.required\_skills.length) \* 60 interestScore = (interestMatches.length / event.required\_interests.length) \* 40

matchScore = skillScore + interestScore **Rules:**

`   `Skills are weighted at **60%**, interests at **40%**.

`   `If either list is empty, redistribute weight fully to the present list (or 50/50 if both are empty — meaning event is fully open).

`   `Define a **minimum threshold of 40**. Students scoring below this cannot register from outside the department.

Students whose **department === event.department** bypass this check entirely.

`   `Show message to rejected cross-dept students: *"You don't meet the skill/interest requirements for this event."*

3. **BACKEND / API CHANGES![](Aspose.Words.b9fd5d9d-c150-4cb0-b502-fa4f6547449e.006.png)**

**POST /api/events/:id/register**

Modify the registration logic as follows:

1. Fetch the event and the student's profile.
1. If **student.department === event.department** ® register normally (existing flow, no changes needed).
1. If departments differ: check **cross\_department\_enabled**. If false ® return 403: *"This event is open to [Department Name] students only."*
1. Compute **matchScore = computeMatchScore(student, event)**.
1. If  **matchScore  <  40**  ®  return  403:  *"Your  current  skills  and  interests  don't  match  this  event's requirements. Consider updating your profile."*
1. If **max\_cross\_dept\_participants** is set, check current approved count vs. cap.
7. If **cross\_dept\_requires\_approval === true**: create registration with status **"pending"**, notify organizer, return 202.
7. If **cross\_dept\_requires\_approval === false**: create registration with status **"confirmed"**, return 201.

**PATCH /api/events/:id/registrations/:regId/approve (Organizer only)**

Update **status** to **'approved'** / **'confirmed'**.

Send notification to student: *"Your registration for [Event Name] has been approved!"*

**PATCH /api/events/:id/registrations/:regId/reject (Organizer only)**

Update **status** to **'rejected'**.

Accept optional **reason** field in the request body and include it in the notification.

**GET /api/events/:id/registrations (Organizer only)**

Return all registrations including **registration\_type**, **status**, and **match\_score**. Support query filters: **?type=cross\_department&status=pending**

4. **EVENT CREATION / EDIT FORM (Frontend)![ref2]**

In the event creation and editing form, add a new collapsible section called **"Cross-Department Settings"**:

`   `**Toggle:** "Allow students from other departments?" — maps to **cross\_department\_enabled**

`   `**Multi-select tag input:** "Required Skills" — organizer picks from a predefined skill list or types custom tags — maps to **required\_skills**

**Multi-select tag input:** "Relevant Interests" — same pattern — maps to **required\_interests**

`   `**Number input (optional):** "Max cross-department participants" — maps to **max\_cross\_dept\_participants** (leave blank for unlimited)

`   `**Toggle:** "Require my approval for cross-department registrations?" — maps to **cross\_dept\_requires\_approval** (default ON)

**Helper tip to display:** *"Only students whose skills or interests match your event criteria will be able to register from outside your department."*

5. **EVENT DISCOVERY / LISTING PAGE (Frontend)![ref2]**

Add a **badge/tag** on event cards: **"Open to All Departments"** (green) vs **"Department Only"** (gray).

`   `When a student views an event from another department, show a **match indicator** — e.g. a progress bar: *"You match 75% of the required skills/interests for this event."*

Highlight which skills/interests the student matches and which are missing.

`   `If **matchScore < 40**, disable the Register button and show tooltip: *"Your profile doesn't meet the minimum match requirement. Update your skills and interests in your profile."*

6. **ORGANIZER DASHBOARD — REGISTRATIONS VIEW![ref2]**

Add a new tab/section to the event management dashboard: **"Cross-Department Requests"**. This section shows a table with:

Student name, department, profile link

Skills matched / Skills missing

Interests matched

Match Score (badge: green ³70%, yellow 40–69%)

Action buttons: Approve / Reject (with optional rejection reason input)

**Summary stats to show at the top:**

`   `Total registrations (own dept vs. cross-dept)    Pending approvals count

`   `Approved cross-dept count vs. cap (if set)

7. **STUDENT PROFILE — SKILLS & INTERESTS![ref2]**

Ensure every student profile has an editable **Skills** and **Interests** section:

`   `Multi-select or tag-input fields on the profile edit page.

`   `These values drive the matching algorithm — prompt students to keep them updated.

`   `Show tooltip: *"Keeping your skills and interests up to date helps you get discovered for cross-department events."*

8. **NOTIFICATIONS![ref2]**

Trigger the following in-app (and optionally email) notifications:



|**Trigger**|**Recipient**|**Message**|
| - | - | - |
|Cross-dept registration submitted|Organizer|[Student] from [Dept] has requested to join your event. Match score: X%|
|Registration approved|Student|Your request to join [Event Name] has been approved!|
|Registration rejected|Student|Your request to join [Event Name] was not approved. [Reason if provided]|
|Event nearing cross-dept cap|Organizer|Your event [Name] is almost at its cross-department participant limit.|

9. **VALIDATION & EDGE CASES![ref2]**

   `   `A student who updates their skills after being rejected should be able to re-apply, if the event is still open.    If an organizer disables **cross\_department\_enabled** after pending requests exist ® auto-reject all pending cross-dept requests and notify affected students.

   `   `If an organizer reduces **max\_cross\_dept\_participants** below the current confirmed count ® do **not** auto-remove already confirmed students; only block new approvals.

Prevent duplicate registrations: enforce uniqueness on **userId + eventId** combination.

`   `If both **required\_skills** and **required\_interests** are empty, treat all cross-dept students as eligible (matchScore = 100).

10. **PERMISSIONS SUMMARY![ref2]![ref1]**



|**Action**|**Who Can Perform**|
| - | - |
|Enable/disable cross-dept participation|Event organizer|
|Set required skills / interests / cap|Event organizer|
|Register for a cross-dept event|Any student with matchScore >= 40|
|Approve/reject cross-dept registrations|Event organizer only|
|View all registrations with match scores|Event organizer only|
|View own registration status|Registered student|

*This document covers the full feature end-to-end. Feed it to your developer or AI coding tool along with your actual tech stack details (e.g., Next.js + PostgreSQL + Prisma + Tailwind) to implement each layer accurately.*

[ref1]: Aspose.Words.b9fd5d9d-c150-4cb0-b502-fa4f6547449e.001.png
[ref2]: Aspose.Words.b9fd5d9d-c150-4cb0-b502-fa4f6547449e.004.png
