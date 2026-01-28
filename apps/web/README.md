# MiniClue Frontend (`miniclue-fe`)

The main web application for the MiniClue platform, providing a modern dashboard for students to manage their courses and interact with their lecture materials through an AI-powered RAG interface.

**Role in Stack:**

- **UI/UX:** Dashboard, course management, and rich lecture interaction (Next.js 16).
- **AI Chat:** Real-time, context-aware chat interface using Vercel AI SDK and TipTap.
- **Integration:** Centralized API client interacting with the Go Backend and Supabase Auth.

## 🛠 Prerequisites

- **Node.js 20+**
- **pnpm 10+**
- **Supabase CLI** (For local database and auth management)

## 🚀 Quick Start

> See [CONTRIBUTING.md](https://github.com/miniclue/miniclue-info/blob/main/CONTRIBUTING.md) for full details on how to setup and contribute to the project.

1. **Fork & Clone**

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/your-username/miniclue-fe.git
cd miniclue-fe
git remote add upstream https://github.com/srleom/miniclue-fe.git
pnpm install
```

2. **Environment Setup**
   Copy the example config:

```bash
cp .env.example .env
```

_Ensure you populate all fields as stated in the `.env.example` file._

3. **Sync API Types**
   Ensure the Backend (`miniclue-be`) is running, then:

```bash
pnpm openapi:all
```

4. **Run Locally**

```bash
pnpm dev
# App will run at http://localhost:3000
```

## 📍 URL Structure

- **Dashboard:** `/` → Overview and recent activity.
- **Profile:** `/profile` → User settings and preferences.
- **Courses:** `/course/[courseId]` → Lecture list and course settings.
- **Lectures:** `/lecture/[lectureId]` → Main RAG chat and document interaction.

## 📝 Pull Request Process

1. Create a new branch for your feature or bugfix: `git checkout -b feature/my-cool-improvement`.
2. Ensure your code follows the coding standards and project architecture.
3. Push to your fork: `git push origin feature/my-cool-improvement`.
4. Submit a Pull Request from your fork to the original repository's `main` branch.
5. Provide a clear description of the changes in your PR.
6. Once your PR is approved and merged into `main`, the CI/CD pipeline will automatically deploy it to the [staging environment](https://stg.app.miniclue.com) for verification.
7. Once a new release is created, the CI/CD pipeline will automatically deploy it to the [production environment](https://app.miniclue.com).

> Note: Merging of PR and creation of release will be done by repo maintainers.
