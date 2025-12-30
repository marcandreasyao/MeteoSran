# Contributing to MeteoSran

Thank you for your interest in improving MeteoSran! We’re committed to building a polished, accessible, and high-performance PWA. This guide explains how to contribute effectively.

---

## How You Can Contribute

1. **Report Issues**
   - Use the Issues page to report bugs or suggest enhancements.
   - Provide clear descriptions, reproduction steps, and screenshots where applicable.
2. **Submit Pull Requests**
   - Fork the repository and create a descriptive branch name (e.g., `feature/image-analysis`).
   - Make changes on your branch, and include tests or validations as needed.
   - Write clear, concise commit messages following the style below.
   - Open a PR against `main`, linking any relevant Issues.
3. **Improve Documentation**
   - Add or refine guides, API references, and examples.
   - Ensure content is well-structured and free of errors.

---

## Development Workflow

1. **Setup**
   ```bash
   git clone https://github.com/marcandreasyao/MeteoSran.git
   cd MeteoSran
   npm install
   ```
2. **Environment**
   - Copy `.env.example` to `.env.local`
   - Populate `AI_API_KEY`, `ACCUWEATHER_API_KEY`.
3. **Branching**
   - Base feature branches off `main`.
   - Prefix branches: `feature/`, `fix/`, `refactor/`.
4. **Validation**
   - Run `npm run lint` and `npm run test` before submitting.
   - Verify PWA install flow and offline support for frontend changes.
5. **PR Review**
   - Respond to code review comments promptly.
   - Squash or rebase commits to maintain a clean history.

---

## Code Style

- **Language:** TypeScript (ESLint + Prettier)
- **Formatting:** 2 spaces, single quotes.
- **Commit Messages:**
  - Format: `<type>(<scope>): <subject>`
  - Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`
  - Example: `feat(api): add location autocomplete endpoint`

---

## Testing & Quality

- **Unit Tests:** Use built-in Jest setup; aim for thorough coverage.
- **E2E Tests:** Verify key user journeys, including PWA install and offline mode.
- **Accessibility:** Run axe or Lighthouse checks to ensure WCAG 2.1 compliance.
- **Performance:** Keep bundle sizes minimal; use Lighthouse and bundle analyzer.

---

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org). Please be respectful, welcoming, and constructive.
