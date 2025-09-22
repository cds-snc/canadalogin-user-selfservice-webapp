# GC Sign in Pull Request and Code Review Guidance

## ✅ Pull Request Checklist

### 📦 Size Guidelines

- [ ] PR changes are **under 300 lines** (additions + deletions)  
      **NOTE**: In some exceptional cases, a larger PR is required for a complex change, updates to static content or refactoring but should be avoided whenever possible.
- [ ] No more than **10 files changed**.  
      **NOTE**: This is a suggestion and may not apply if a feature requires small changes in various files, utility files, etc.
- [ ] PR represents a **single logical change** or concern
- [ ] Larger changes have been split into **multiple smaller PRs** where possible

### 🧾 Description

- [ ] Clear summary of **what** is being changed
- [ ] Explanation of **why** the change is necessary (if applicable)
- [ ] Links to **relevant tickets**, issues, or design docs
- [ ] For UI changes, provide a screen capture for easier review (folks on the team have used Kap)

### 🧪 Testing

- [ ] New code is covered by **unit, integration, or end-to-end tests**
- [ ] Includes **manual testing steps** if applicable
- [ ] Considers **edge cases** and failure modes

### 📂 Code Quality

- [ ] No commented-out code, debug logs, or unused files remain
- [ ] Code is **clear and self-documenting**, or includes comments where needed
- [ ] Complex logic has **appropriate comments or abstractions**

### 📐 System Design Considerations (for more complex changes)

Does this change require system or component-level design?

If so, ensure the following:

- [ ] A design doc or technical plan was created, reviewed, and approved
- [ ] Trade-offs and alternatives were considered and documented
- [ ] Impacts to performance, scalability, security, or maintainability were reviewed
- [ ] The design has been communicated to relevant team members

> ℹ️ **Note:** If the PR exceeds size guidelines or introduces architectural changes, please explain why and suggest how reviewers can approach it efficiently.  
> ℹ️ **Note:** Architectural or significant changes should go through the [RFC process](https://docs.google.com/document/d/1kRDswJZ9wCiI7D2K3GYWnGEDp2yPUGLQ9_yuNoYQCf0/edit?tab=t.0#heading=h.gwtmzfdyqc3h) and be logged in the [Product Decision Log](https://docs.google.com/document/d/1JN4a3ulfl3_NKD_eA2h4J17QdR3nN3JV680U087PeYE/edit?tab=t.0#heading=h.q8c85u2i9t5z) before beginning work on code and a PR.  
> ℹ️ **Note:** Architectural changes that impact external clients or other CDS teams should go through the [ADR process](https://github.com/cds-snc/ADR).  
<br />

## 🔍 Code Review Checklist for Reviewers

### ⏱️ Review Timing & Scope

- [ ] Review and respond to pull requests within 1–2 business days. If you're unavailable, communicate promptly so the PR can be reassigned to avoid delays.
- [ ] **Block off dedicated time to do a review and avoid distractions**. Plan to spend \~30–60 minutes per review for PRs under 300 LOC or more.  
- [ ] For large PRs (>400 LOC), request it be split or set expectations for longer review time
- [ ] If you're not the right reviewer (e.g. domain unfamiliar), **reassign or tag someone else**

### ✅ General Review Flow

- [ ] Read the **PR description** to understand the goal and context
- [ ] Check for **design documentation** if the change is architectural or complex
- [ ] Scan the **commit history** (if meaningful) for logical grouping and clarity
- [ ] Review the **diffs by file**, starting with higher-level files (e.g. config, interfaces) before low-level details
- [ ] Use **GitHub co-pilot** to assist with suggestions

### 📐 System Design & Architecture

- [ ] Does the implementation align with the **agreed design or architecture**?
- [ ] Is the code **extensible** and easy to evolve if requirements change?
- [ ] Any risk of **tight coupling** or unnecessary complexity?

### 🧠 Code Logic & Correctness

- [ ] Is the logic correct, easy to follow, and bug-free?
- [ ] Are **edge cases** handled properly?
- [ ] Are **failure modes** accounted for (timeouts, nulls, bad input)?
- [ ] Is there any **dead code, duplication**, or unused paths?

### 🔐 Security, Performance, and Other Concerns

- [ ] Are there any potential **security risks** (e.g., injection, exposure, auth issues)?
- [ ] Are **dependencies or APIs** used correctly and safely?
- [ ] Are new dependencies actively maintained and trustworthy?

### 🧭 UX, Accessibility, and Frontend (if applicable)

- [ ] UI is functional and matches design expectations
- [ ] UI states (loading, error, empty, etc.) are handled
- [ ] Keyboard navigation and screen reader accessibility are preserved
- [ ] No obvious layout or styling bugs
- [ ] UI flows properly in both mobile and desktop viewport sizes

### 🗣️ Feedback Style

- [ ] Be **respectful, constructive, and clear** in comments
- [ ] Use **questions or suggestions** instead of commands:
      _"Could we simplify this by..."_ instead of _"Don't do this"_
- [ ] Use **inline comments** for specific code and summary comments for broader concerns
- [ ] Approve, comment, or request changes with a clear explanation

### 🧾 Before Approving

- [ ] I've reviewed all files thoroughly
- [ ] I understand the change and its purpose
- [ ] I trust that the code works as expected based on logic and tests
- [ ] I would be confident owning this code in production

> ⏳ **Tip:** If you're short on time, do a **first-pass review** and leave a comment saying when you’ll follow up. This helps manage expectations.
