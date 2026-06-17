# Event Type Modal Implementation Summary

## Overview
Implementation of the EventTypeModal UI component with comprehensive cross-department event configuration for the FindATeammate application. This document summarizes all changes made to support the event type selection flow.

## Changes Made

### 1. Frontend Components

#### EventTypeModal Component (`CreatePost.tsx`)
- **File**: [findateammate-frontend/src/pages/CreatePost.tsx](CreatePost.tsx)
- **What**: New `EventTypeModal` component rendered as a Modal dialog
- **How it works**:
  - Displays when user switches to event tab without selecting event type
  - Shows two options: "Intra-College Event" and "Outside-College Event"
  - Each option has descriptive icons (Building2 for intra-college, Globe for outside-college)
  - Clicking either option closes modal and shows appropriate form sections

#### Integration with CreatePost
- **Modal State**: Added `isEventTypeModalOpen` state to track modal visibility
- **Handler Function**: `handleSelectEventType` sets the event type and closes modal
- **useEffect Hook**: Automatically opens modal when:
  - User is creating (not editing) a new post
  - Active tab is "event" 
  - Event type hasn't been selected yet
- **Tab Switching**: Updated `handleTabChange` to open modal when switching to event tab without selected type

### 2. Component Conditional Rendering

#### For Intra-College Events
When `eventType === "intra-college"`, displays:
- Department Access Toggle (All Departments vs Specific)
- Department Multi-Select (1-10 departments max)
- Required Skills Input (optional)
- Required Interests Input (optional)
- Max Cross-Department Participants Field
- Cross-Department Requires Approval Checkbox

#### For Outside-College Events
When `eventType === "outside-college"`, displays:
- Event Website URL Input (optional)
- No cross-department configuration (automatically cleared on backend)

### 3. Backend Validation

#### Post Creation Endpoint (`POST /api/posts/event`)
Files updated:
- [findateammate-backend/backend/routes.ts](routes.ts) (lines 660-750)

Validations added:
1. **Event Type Validation**: Ensures `eventType` is either "intra-college" or "outside-college"
2. **Department Constraints**:
   - Minimum 1 department if using specific mode
   - Maximum 10 departments (fixed from 6)
   - Each department must be in DEPARTMENTS constant
3. **Skills Validation**:
   - `requiredSkills` must be from SKILLS whitelist
   - `requiredInterests` must be from SKILLS whitelist
4. **Cross-Department Clearing**:
   - For outside-college events: `allowedDepartments` automatically set to null
   - For outside-college events: skip all cross-department field validation
5. **Event Date Validation**:
   - Must be a valid date
   - Must be in the future (not past)
6. **Rate Limiting**: Max 10 events per 24 hours (admins bypass)

#### Post Update Endpoint (`PATCH /api/posts/:id`)
Files updated:
- [findateammate-backend/backend/routes.ts](routes.ts) (lines 780-810)

Same validations as POST endpoint, with additional logic:
- Preserves existing `eventType` if not being changed
- Auto-rejects pending cross-dept registrations if cross-dept is disabled

### 4. Testing Recommendations

#### Recommended Test Coverage
The following test scenarios should be verified manually or via automated tests:

1. **EventTypeModal Visibility**: 
   - Modal shows when switching to event tab
   - Modal shows on initial load with `?mode=event`
   - Modal doesn't show for teammate mode
   - Modal closes when selecting type

2. **EventTypeModal Functionality**:
   - Closing with intra-college selection shows cross-dept fields
   - Closing with outside-college selection shows website field

3. **Cross-Department Settings Visibility**:
   - Shows for intra-college events
   - Hidden for outside-college events

4. **Department Selection**:
   - Allows specific department selection (1-10)
   - Shows min/max constraints

5. **Form Submission**:
   - Validates all required fields
   - Sends correct eventType to backend
   - Submits allowed departments only for intra-college

6. **Backend Validation**:
   - Rejects invalid event types
   - Enforces 1-10 department limit for intra-college
   - Validates event dates are in future
   - Clears cross-dept fields for outside-college events
   - Checks authorization (banned users, authentication)
   - Rate limits to 10 events per 24h for non-admins

7. **Tab Switching**:
   - Maintains event type selection when switching between tabs
   - Preserves form state

### 5. Bug Fixes

#### Fixed: Department Limit Inconsistency
- **Issue**: Frontend allowed 10 departments, backend only 6
- **Fix**: Updated both POST and PATCH endpoints to allow max 10 departments
- **Files**:
  - `findateammate-backend/backend/routes.ts` (lines 708, 797)
  - Updated error message to "Maximum 10 departments can be selected"

## Data Flow

### Creating an Intra-College Event
```
User clicks "Post Event" tab
  ↓
EventTypeModal opens (if no eventType selected)
  ↓
User clicks "Intra-College Event"
  ↓
Modal closes, form shows with cross-department fields
  ↓
User fills:
  - Title, Description, Date
  - Department Access (All/Specific)
  - If Specific: Select 1-10 departments
  - Optional: Required Skills & Interests
  ↓
Submit → Backend validates → Create post with eventType="intra-college"
```

### Creating an Outside-College Event
```
User clicks "Post Event" tab
  ↓
EventTypeModal opens (if no eventType selected)
  ↓
User clicks "Outside-College Event"
  ↓
Modal closes, form shows with website field
  ↓
User fills:
  - Title, Description, Date
  - Optional: Event Website URL
  ↓
Submit → Backend validates → Create post with eventType="outside-college"
        → allowedDepartments automatically cleared
```

## Schema Updates

### Frontend (TypeScript/Zod)
```typescript
eventType: z.enum(["intra-college", "outside-college"]).optional(),
allowedDepartments: z.array(z.string()).optional(),
requiredSkills: z.array(z.string()).optional().default([]),
requiredInterests: z.array(z.string()).optional().default([]),
maxCrossDeptParticipants: z.number().optional(),
crossDeptRequiresApproval: z.boolean().optional().default(true),
```

### Backend (Zod Validation)
Same schema + server-side validation of:
- Department values against DEPARTMENTS constant
- Skills/Interests against SKILLS constant
- Event dates in future
- Array length constraints

## User Experience

### Before
- Users had to guess what fields were relevant for different event types
- No clear indication of requirements for cross-department access
- Confusing form with many optional fields

### After
- Clear modal at start of event creation process
- User explicitly chooses event type
- Form adapts to show only relevant fields
- Clear constraints and validation messages
- Better organization of complex cross-department settings

## Performance Considerations

- Modal uses Framer Motion for smooth animations
- Lazy loading of cross-department section with AnimatePresence
- No breaking changes to existing data structure
- Backward compatible with existing events

## Future Enhancements

1. Add event templates based on type
2. Save event type preferences for user's next event
3. Add event type statistics/analytics
4. Implement advanced filtering by event type
5. Add department-specific notifications for intra-college events
6. Support event type changes with migration logic (if needed)

## Files Changed

### Frontend
- `src/pages/CreatePost.tsx` - Main component with EventTypeModal

### Backend
- `backend/routes.ts` - API endpoints and validation (MODIFIED)

### Shared
- `shared/schema.ts` - Already had eventType field
- `shared/constants.ts` - Already had DEPARTMENTS and SKILLS

## Testing Checklist

- [ ] Manual test: Switch to event tab and verify modal appears
- [ ] Manual test: Select intra-college and verify cross-dept fields appear
- [ ] Manual test: Select outside-college and verify website field appears
- [ ] Manual test: Select 1-10 departments for intra-college event
- [ ] Manual test: Try selecting >10 departments (should not allow)
- [ ] Manual test: Add event in past (should fail with validation error)
- [ ] Manual test: Add event in future (should succeed)
- [ ] Manual test: Switch between tabs (event type should persist)
- [ ] API test: POST /api/posts/event with intra-college type
- [ ] API test: POST /api/posts/event with outside-college type
- [ ] API test: PATCH /api/posts/:id to update cross-dept settings
- [ ] API test: Verify allowedDepartments cleared for outside-college
- [ ] API test: Verify rate limiting works (max 10 per 24h)
- [ ] API test: Verify banned users cannot create events
- [ ] API test: Verify event date validation (must be future)

## Deployment Notes

1. No database migrations needed (schema supports new fields)
2. No breaking changes to existing API
3. All new features are opt-in via event type selection
4. Backward compatible with existing posts
5. Manual testing recommended before deploying to production

## Troubleshooting

### Modal doesn't appear
- Check browser console for JavaScript errors
- Verify `isEventTypeModalOpen` state is being set
- Ensure Dialog component from shadcn/ui is properly installed

### Department validation failing
- Verify DEPARTMENTS constant is imported correctly
- Check that department names match exactly (case-sensitive)
- Ensure backend and frontend use same DEPARTMENTS list

### Event date validation errors
- Date must be in future (not past)
- Check browser timezone handling
- Verify datetime-local input format is correct

## Contact & Support
For questions about this implementation, see the related issues/PRs or contact the development team.
