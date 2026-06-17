# Full Deep Bug-Hunting Analysis Prompt

Perform a full deep bug-hunting analysis on this entire codebase

Your objective:
Identify every functional bug, broken connection, logical flaw, state inconsistency, API mismatch, race condition, performance bottleneck, memory leak, and silent failure.

Scope:
• Frontend to backend integration
• API routes, controllers, services
• Database queries and schema mismatches
• Authentication and authorization flows
• Async logic and promise handling
• Event listeners and state updates
• Environment variables usage
• Error handling gaps
• Edge cases
• Loading states and UI feedback
• Deployment-related misconfigurations
• Docker configuration issues
• Build pipeline risks

Execution rules:

1. Trace every button click to its backend endpoint and to its database interaction.
2. Verify request and response formats match exactly.
3. Detect undefined variables, unreachable code, unused imports.
4. Detect duplicated logic.
5. Identify potential crashes.
6. Identify silent failures where UI appears functional but backend fails.
7. Simulate invalid inputs, empty states, and extreme values.
8. Check for performance issues in loops, re-renders, queries.
9. Validate all async calls are awaited correctly.
10. Highlight security vulnerabilities like open endpoints, missing validation, injection risks.

Output format:
• List each issue clearly.
• Show file name and line number.
• Explain root cause.
• Explain impact.
• Provide exact corrected code snippet.
• Suggest structural improvements if patterns are flawed.

Do not summarize.
Do not generalize.
Be ruthless and exhaustive.
Assume production-level audit standards.
