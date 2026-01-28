// components
import { DropzoneComponent } from "@/app/(dashboard)/(app)/_components/dropzone";
import { Badge } from "@/components/ui/badge";

// code
import { getUserCourses } from "@/app/(dashboard)/_actions/user-actions";

// lib
import { logger } from "@/lib/logger";

export default async function Page() {
  const { data: courses, error } = await getUserCourses();

  if (error) {
    // Handle error case, maybe show a message to the user
    logger.error("Failed to load courses:", error);
  }

  const defaultCourse = courses?.find((c) => c.isDefault);

  return (
    <div className="mx-auto mt-16 flex w-full flex-col items-center lg:w-3xl">
      <Badge
        variant="secondary"
        className="flex items-center gap-2 font-mono text-xs font-medium"
      >
        <span className="relative flex size-2">
          <span className="bg-chart-2 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
          <span className="bg-chart-2 relative inline-flex size-2 rounded-full"></span>
        </span>
        ONLINE
      </Badge>

      <h1 className="mt-4 text-center text-4xl font-semibold">
        Ready when you are.
      </h1>
      <p className="text-muted-foreground mt-4 mb-10 max-w-md text-center">
        Upload your PDF lecture slides to get started. <br />
      </p>
      <div className="w-full">
        <DropzoneComponent
          isCoursePage={true}
          courseId={defaultCourse?.courseId}
        />
      </div>
    </div>
  );
}
