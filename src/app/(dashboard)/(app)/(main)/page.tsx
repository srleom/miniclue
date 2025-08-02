// components
import { DropzoneComponent } from "@/app/(dashboard)/(app)/_components/dropzone";
import { Badge } from "@/components/ui/badge";

// code
import { uploadLectures } from "@/app/(dashboard)/_actions/lecture-actions";
import {
  getUserCourses,
  getUserUsage,
  getUserSubscription,
} from "@/app/(dashboard)/_actions/user-actions";

// lib
import { logger } from "@/lib/logger";

export default async function Page() {
  const { data: courses, error } = await getUserCourses();
  const { data: userUsage, error: usageError } = await getUserUsage();
  const { data: subscription, error: subscriptionError } =
    await getUserSubscription();

  if (error) {
    // Handle error case, maybe show a message to the user
    logger.error("Failed to load courses:", error);
  }

  if (usageError) {
    logger.error("Failed to load user usage:", usageError);
  }

  if (subscriptionError) {
    logger.error("Failed to load subscription:", subscriptionError);
  }

  const defaultCourse = courses?.find((c) => c.isDefault);

  return (
    <div className="mx-auto mt-16 flex w-full flex-col items-center lg:w-3xl">
      <Badge variant="secondary" className="text-xs">
        BETA
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
          uploadLectures={uploadLectures}
          userUsage={userUsage}
          subscription={subscription}
        />
      </div>
    </div>
  );
}
