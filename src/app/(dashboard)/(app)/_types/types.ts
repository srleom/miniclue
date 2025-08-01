export type CourseWithLectures = {
  courseId: string;
  isDefault?: boolean;
  title?: string;
  url?: string;
  lectures: { lecture_id: string; title: string }[];
  isActive?: boolean;
};

export type NavRecentsItem = {
  name: string;
  url: string;
  lectureId: string;
  totalCount?: number;
};
