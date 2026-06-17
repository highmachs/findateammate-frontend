Rule 2. One backend entry point per feature

No “helper endpoints”. No reused endpoints doing different things.

One button → one endpoint → one responsibility.

Rule 3. Frontend binds only to adapters

UI never calls raw endpoints.

UI → adapter → API
If the backend changes, only adapters break.

Rule 4. Kill shared mutable state

If two components can mutate the same state, you’ve already lost.

Single owner. Everyone else reads.