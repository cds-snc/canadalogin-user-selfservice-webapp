# GC Sign in Code Review Guidance

# ✅ Pull Request Checklist

## 📦 Size Guidelines

- [ ] PR changes are **under 300 lines** (additions + deletions)
- [ ] No more than **10 files changed**
- [ ] PR represents a **single logical change** or concern
- [ ] Larger changes are broken into **separate PRs** if possible

## 🧾 Description

- [ ] Clear summary of **what** is being changed
- [ ] Explanation of **why** the change is necessary (if applicable)
- [ ] Include links to **relevant tickets**, issues, or specs
- [ ] Highlight any **tricky logic**, side effects, or known issues
- [ ] For front-end changes, provide a video for easier review (some folks have used Kap)
- [ ] Use con

## 🧪 Testing

- [ ] New code is covered by **unit/integration tests**
- [ ] All existing tests **pass locally or in CI**
- [ ] Includes **manual test steps** (if applicable)
- [ ] Covers **edge cases** and failure scenarios

## 📂 Code Quality

- [ ] Follows **project coding standards and style guides**
- [ ] No commented-out code or unnecessary debug statements
- [ ] Variables and functions are clearly named and scoped
- [ ] Code is **self-documenting** where possible
- [ ] Complex logic is explained with **comments**

## 🔍 Review Readiness

- [ ] I’ve reviewed my own changes before requesting review
- [ ] I’ve tested the feature or fix manually (if applicable)
- [ ] This PR is **ready for review**, not a work-in-progress

---

> ℹ️ **Note:** If the PR exceeds size guidelines, add a clear justification in the description and suggest how to best review it (e.g. by commits or by file).
