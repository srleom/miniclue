**Frontend URL Structure**

- **Dashboard Home**

  - `/dashboard` → Main dashboard view (overview cards, recent activity)

- **Profile**

  - `/dashboard/profile` → View & edit your user profile (name, avatar, preferences)

- **Courses & Lectures**

  - **(Sidebar)** Your courses live in a persistent sidebar under the dashboard layout.
  - `/dashboard/courses/[courseId]`

    - Course home:

      - Lecture list
      - “Upload PDF” form (creates new lecture in this course)
      - Course settings (edit title/description, delete course)

  - `/dashboard/courses/[courseId]/lectures/[lectureId]`

    - Lecture detail page:

      - Client-side tabs or sections for Summary, Slide Explainer, Chat, Notes

- **Fallback**

  - `/dashboard/error` → Custom 404 page (with link back to `/dashboard`)
