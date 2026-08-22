# Graph Report - .  (2026-05-06)

## Corpus Check
- 118 files · ~373,193 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 205 nodes · 133 edges · 80 communities (79 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Event Management|Event Management]]
- [[_COMMUNITY_Authentication & Profile|Authentication & Profile]]
- [[_COMMUNITY_Event Details UI|Event Details UI]]
- [[_COMMUNITY_Connection Testing|Connection Testing]]

## God Nodes (most connected - your core abstractions)
1. `generateToken()` - 4 edges
2. `getEventStatus()` - 4 edges
3. `runTests()` - 3 edges
4. `autoCompleteEvents()` - 3 edges
5. `testMongoDB()` - 2 edges
6. `testFirebase()` - 2 edges
7. `registerUser()` - 2 edges
8. `loginUser()` - 2 edges
9. `googleLogin()` - 2 edges
10. `getEvents()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `EventDetail()` --calls--> `getEventStatus()`  [INFERRED]
  social-impact-frontend/src/components/EventDetail.jsx → social-impact-frontend/src/utils/eventStatus.js

## Communities (80 total, 1 thin omitted)

### Community 1 - "Event Management"
Cohesion: 0.2
Nodes (3): autoCompleteEvents(), getEventById(), getEvents()

### Community 3 - "Authentication & Profile"
Cohesion: 0.27
Nodes (4): generateToken(), googleLogin(), loginUser(), registerUser()

### Community 10 - "Connection Testing"
Cohesion: 0.83
Nodes (3): runTests(), testFirebase(), testMongoDB()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `NGO Management` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._