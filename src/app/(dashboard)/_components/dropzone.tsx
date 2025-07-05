"use client";

// react
import * as React from "react";

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

export function DropzoneComponent({
  isCoursePage = false,
  courseId,
  uploadLectures,
}: {
  isCoursePage?: boolean;
  courseId?: string;
  uploadLectures: (
    courseId: string,
    formData: FormData,
  ) => Promise<
    ActionResponse<
      components["schemas"]["app_internal_api_v1_dto.LectureUploadResponseDTO"][]
    >
  >;
}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  };

  const handleUpload = async () => {
    if (!isCoursePage || !courseId) {
      toast.error("Course ID is missing. Cannot upload files.");
      return;
    }

    if (files.length === 0) {
      toast.info("No files to upload.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const toastId = toast.loading(
      `Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`,
    );

    let result;
    try {
      result = await uploadLectures(courseId, formData);
      setFiles([]);
    } finally {
      setIsLoading(false);
      toast.dismiss(toastId);
    }
    if (result?.error) {
      toast.error(result.error);
    }
  };

  return (
    <Dropzone
      accept={{
        "application/pdf": [".pdf"],
      }}
      onDropAccepted={onDrop}
    >
      <div className="grid w-full gap-4">
        <DropzoneZone className="flex min-h-[14em] items-center justify-center md:min-h-[16em]">
          <DropzoneInput />
          <DropzoneGroup className="gap-4">
            <DropzoneUploadIcon />
            <DropzoneGroup>
              <DropzoneTitle>
                {isCoursePage
                  ? "Upload lectures here"
                  : "Drop files here or click to upload"}
              </DropzoneTitle>
              <DropzoneDescription className="text-center">
                You can upload PDF files up to 10MB in size.
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
        {isCoursePage && files.length > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isLoading}
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
