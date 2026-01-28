"use client";

// react
import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

// third-party
import { toast } from "sonner";

// types
import { ActionResponse } from "@/lib/api/authenticated-api";
import { components } from "@/types/api";

// components
import { Button } from "@/components/ui/button";
import {
  Dropzone,
  DropzoneDescription,
  DropzoneGroup,
  DropzoneInput,
  DropzoneTitle,
  DropzoneUploadIcon,
  DropzoneZone,
} from "@/components/ui/dropzone";
import {
  FileList,
  FileListDescription,
  FileListHeader,
  FileListIcon,
  FileListInfo,
  FileListItem,
  FileListName,
  FileListSize,
} from "@/components/ui/file-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

// lib
import { logger } from "@/lib/logger";

// server actions
import {
  uploadLecturesFromClient,
  completeUploadFromClient,
} from "@/app/(dashboard)/(app)/_actions/lecture-actions";
import { getUser } from "@/app/(dashboard)/_actions/user-actions";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

// Client-side upload function
async function uploadLecturesClient(
  courseId: string,
  files: File[],
): Promise<
  ActionResponse<
    components["schemas"]["dto.LectureUploadCompleteResponseDTO"][]
  >
> {
  try {
    // Step 1: Get presigned URLs from server action
    const filenames = files.map((file) => file.name);
    const { data: uploadUrlsData, error: urlsError } =
      await uploadLecturesFromClient(courseId, filenames);

    if (urlsError || !uploadUrlsData?.uploads) {
      return { error: urlsError || "Failed to get upload URLs" };
    }

    const uploads = uploadUrlsData.uploads;
    const results: components["schemas"]["dto.LectureUploadCompleteResponseDTO"][] =
      [];

    // Step 2: Upload each file to S3 using presigned URLs
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const upload = uploads[i];

      if (!file || !upload?.upload_url || !upload?.lecture_id) {
        results.push({
          lecture_id: upload?.lecture_id,
          status: "error",
          message: "Invalid file or upload URL or lecture ID",
        });
        continue;
      }

      // Use Supabase SDK to upload via signed token (handles CORS)
      const supabase = createSupabaseClient();
      // Extract bucket and key from the presigned URL
      const url = new URL(upload.upload_url);
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.findIndex((p) => p === "s3") + 1;
      // Assert bucket and key are defined
      const bucketName: string = pathParts[bucketIndex]!;
      const key: string = pathParts.slice(bucketIndex + 1).join("/");
      // Generate signed upload token
      const { data: signedData, error: tokenError } = await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(key, { upsert: false });
      if (tokenError || !signedData?.token) {
        results.push({
          lecture_id: upload.lecture_id,
          status: "error",
          message: tokenError?.message || "Failed to get upload token",
        });
        continue;
      }
      // Upload using signed token
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .uploadToSignedUrl(key, signedData.token!, file);
      if (uploadError) {
        results.push({
          lecture_id: upload.lecture_id,
          status: "error",
          message: uploadError.message,
        });
        continue;
      }

      // Step 3: Complete the upload using server action
      const { data: completeData, error: completeError } =
        await completeUploadFromClient(upload.lecture_id);

      if (completeError) {
        results.push({
          lecture_id: upload.lecture_id,
          status: "error",
          message: completeError,
        });
      } else {
        results.push(completeData!);
      }
    }

    return { data: results, error: undefined };
  } catch (error) {
    logger.error("Upload lectures error:", error);
    return { error: "Failed to upload lectures" };
  }
}

export function DropzoneComponent({
  isCoursePage = false,
  courseId,
}: {
  isCoursePage?: boolean;
  courseId?: string;
}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasGeminiKey, setHasGeminiKey] = React.useState<boolean | null>(null);
  const [isCheckingKey, setIsCheckingKey] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const checkGeminiKey = async () => {
      setIsCheckingKey(true);
      const { data: user, error } = await getUser();

      if (error || !user) {
        logger.error("Failed to fetch user profile for API key check", {
          error,
        });
        setHasGeminiKey(false);
        setIsCheckingKey(false);
        return;
      }

      const geminiKeyProvided = user.api_keys_provided?.gemini ?? false;
      setHasGeminiKey(geminiKeyProvided);
      setIsCheckingKey(false);
    };

    checkGeminiKey();
  }, []);

  const onDrop = (acceptedFiles: File[]) => {
    if (hasGeminiKey === false) {
      toast.error(
        "Google Gemini API key is required to upload lectures. Please add your API key in settings.",
      );
      return;
    }
    setFiles(acceptedFiles);
  };

  const handleUpload = async () => {
    if (!isCoursePage || !courseId) {
      logger.error("Upload failed: Course ID is missing", {
        isCoursePage,
        courseId,
      });
      toast.error("Course ID is missing. Cannot upload files.");
      return;
    }

    if (hasGeminiKey === false) {
      toast.error(
        "Google Gemini API key is required to upload lectures. Please add your API key in settings.",
      );
      router.push(`/settings/api-key?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }

    if (files.length === 0) {
      logger.info("Upload attempted with no files");
      toast.info("No files to upload.");
      return;
    }

    setIsLoading(true);

    const toastId = toast.loading(
      `Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`,
    );

    let result;
    try {
      logger.info("Starting file upload", {
        fileCount: files.length,
        courseId,
      });
      result = await uploadLecturesClient(courseId, files);
      setFiles([]);
    } catch (error) {
      logger.error("Upload failed with exception", { error, courseId });
      throw error;
    } finally {
      setIsLoading(false);
      toast.dismiss(toastId);
    }

    if (result?.error) {
      logger.error("Upload API returned error", { error: result.error });
      toast.error(result.error);
      return;
    }

    if (result?.data) {
      let firstLectureId: string | null = null;
      let hasSuccessfulUpload = false;
      let successCount = 0;
      let errorCount = 0;

      result.data.forEach((res, index) => {
        if (
          (res.status === "success" || res.status === "pending_processing") &&
          res.lecture_id
        ) {
          // If we have a lecture_id and status is success or pending_processing, the upload was successful
          if (!firstLectureId) {
            firstLectureId = res.lecture_id;
          }
          hasSuccessfulUpload = true;
          successCount++;
        } else if (res.status === "error") {
          errorCount++;
          logger.error("File upload failed", {
            fileName: files[index]?.name,
            error: res.message,
            status: res.status,
          });
          toast.error(
            `Failed to upload ${files[index]?.name || "file"}: ${res.message || "Unknown error"}`,
          );
        }
      });

      logger.info("Upload processing complete", {
        successCount,
        errorCount,
        firstLectureId,
        hasSuccessfulUpload,
      });

      // Show summary toast
      if (successCount > 0 && errorCount > 0) {
        toast.info(
          `Upload complete: ${successCount} successful, ${errorCount} failed`,
        );
      } else if (successCount > 0) {
        toast.success(
          `Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""}`,
        );
      }

      // Only redirect if we have at least one successful upload
      if (firstLectureId && hasSuccessfulUpload) {
        logger.info("Redirecting to lecture page", {
          lectureId: firstLectureId,
        });
        router.push(`/lecture/${firstLectureId}`);
      } else {
        logger.warn("No redirect - no successful uploads", {
          firstLectureId,
          hasSuccessfulUpload,
        });
      }
    }
  };

  return (
    <Dropzone
      accept={{
        "application/pdf": [".pdf"],
      }}
      onDropAccepted={onDrop}
      disabled={hasGeminiKey === false || isCheckingKey}
    >
      <div className="grid w-full gap-4">
        <DropzoneZone className="flex min-h-[14em] items-center justify-center md:min-h-[16em]">
          <DropzoneInput />
          <DropzoneGroup className="gap-4">
            <DropzoneUploadIcon />
            <DropzoneGroup>
              <DropzoneTitle>
                {isCheckingKey
                  ? "Checking API key..."
                  : hasGeminiKey === false
                    ? "Google Gemini API key required"
                    : isCoursePage
                      ? "Upload lectures here"
                      : "Drop files here or click to upload"}
              </DropzoneTitle>
              <DropzoneDescription className="text-center">
                {hasGeminiKey === false ? (
                  <>
                    Please add your Google Gemini API key in{" "}
                    <Link
                      href={`/settings/api-key?returnTo=${encodeURIComponent(pathname)}`}
                      className="text-primary underline"
                    >
                      settings
                    </Link>{" "}
                    to upload lectures.
                  </>
                ) : (
                  "You can upload PDF files."
                )}
              </DropzoneDescription>
            </DropzoneGroup>
          </DropzoneGroup>
        </DropzoneZone>
        {files.length > 0 && (
          <FileList>
            {files.map((file) => (
              <FileListItem key={file.name}>
                <FileListHeader>
                  <FileListIcon />
                  <FileListInfo>
                    <FileListName>{file.name}</FileListName>
                    <FileListDescription>
                      <FileListSize>{file.size}</FileListSize>
                    </FileListDescription>
                  </FileListInfo>
                </FileListHeader>
              </FileListItem>
            ))}
          </FileList>
        )}
        {files.length > 2 && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Rate Limit Warning</AlertTitle>
            <AlertDescription>
              If you&apos;re using the free tier of Gemini, uploading more than
              2 files at once might hit your API rate limits, causing lecture
              processing to fail. Proceed with caution.
            </AlertDescription>
          </Alert>
        )}
        {isCoursePage && files.length > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isLoading || hasGeminiKey === false || isCheckingKey}
              className="w-full hover:cursor-pointer sm:w-auto"
            >
              {isLoading
                ? "Uploading..."
                : `Upload ${files.length} file${files.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </div>
    </Dropzone>
  );
}
