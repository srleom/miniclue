## Frontend URL Structure

- **Dashboard Home**

  - `/` → Main dashboard view (overview cards, recent activity)

- **Profile**

  - `/profile` → View & edit your user profile (name, avatar, preferences)

- **Courses & Lectures**

  - **(Sidebar)** Your courses live in a persistent sidebar under the dashboard layout.
  - `/course/[courseId]`

    - Course home:

      - Lecture list
      - "Upload PDF" form (creates new lecture in this course)
      - Course settings (edit title/description, delete course)

  - `/lecture/[lectureId]`

    - Lecture detail page:

      - Client-side tabs or sections for Summary, Slide Explainer, Chat, Notes

- **Fallback**

  - `/error` → Custom 404 page (with link back to `/`)

## Full Step-by-Step CI/CD Workflow

**Goal:** To safely and efficiently deliver code changes from local development to production.

---

### **Phase 1: Developer Local Work & Feature Branch (Git Operations)**

1.  **Task Identification:** Developer identifies a new feature or bug fix from the project backlog.
2.  **Ensure `main` is Latest:** Developer updates their local `main` branch to ensure it's in sync with the remote:
    - `git checkout main`
    - `git pull origin main`
3.  **Create New Feature Branch:** Developer creates a new, descriptive feature branch from `main`:
    - `git checkout -b feature/your-feature-name` (e.g., `feature/user-registration`)
4.  **Code & Local Testing:** Developer writes code, frequently runs local unit tests, and performs manual checks to ensure functionality.
5.  **Frequent Commits:** Developer makes small, atomic commits with clear, descriptive messages:
    - `git add .`
    - `git commit -m "feat: Add initial user registration form"`
6.  **Push to Remote Feature Branch:** Developer regularly pushes their work to the remote GitHub repository:
    - `git push origin feature/your-feature-name`

### **Phase 2: Preview & Staging via Vercel Integration**

1.  Install and configure Vercel's GitHub integration in your Staging Vercel project.
2.  On Pull Requests to `main`, Vercel automatically creates Preview Deployments for UAT.
3.  On merges into `main`, Vercel automatically builds and deploys the `main` branch to your **Staging** domain.

### **Phase 3: Manual Production Deployment**

Your **Production** Vercel project has GitHub integration disabled. To deploy to production:

1.  Ensure your local changes are merged into `main` and tested on Staging.
2.  In GitHub Actions, go to the **Deploy to Production** workflow.
3.  Click **Run workflow**, select `main` (default) and run.
4.  The job will:
    - Install the Vercel CLI (`vercel@latest`).
    - Pull your Production environment variables.
    - Build the project artifacts locally.
    - Deploy the same build artifacts to your **Production** Vercel project.

**Required GitHub Secrets:**

- `VERCEL_TOKEN` — Your Vercel API token.
- `VERCEL_ORG_ID` — Your Vercel organization (or team) ID.
- `VERCEL_PRODUCTION_PROJECT_ID` — Project ID for your Production Vercel project.

_See `.github/workflows/deploy-production.yml` for the full workflow configuration._
