/api/v1/courses
├── POST / → create course
├── GET /:courseId → fetch course
├── PUT /:courseId → update course
└── DELETE /:courseId → delete course

/api/v1/lectures
├── POST / → create lecture
├── GET / → list lectures (query by course_id) (`?limit=&offset=`)
├── GET /:lectureId → fetch lecture
├── PUT /:lectureId → update lecture metadata
└── DELETE /:lectureId → delete lecture

/api/v1/lectures/:lectureId
├── GET /summary → get lecture summary
├── POST /summary → create lecture summary
├── GET /explanations → list lecture explanations (`?limit=&offset=`)
├── POST /explanations → create lecture explanation
├── GET /notes → get lecture notes
├── POST /notes → create lecture note
└── PUT /notes → update lecture note

/api/v1/users/me
├── GET / → fetch user profile
├── POST / → create or update profile
├── GET /courses → list user's courses
└── GET /recents → list recent lectures (`?limit=&offset=`)
