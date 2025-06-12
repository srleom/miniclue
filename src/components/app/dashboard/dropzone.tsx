"use client";

import * as React from "react";

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
}: {
  isCoursePage?: boolean;
}) {
  const [files, setFiles] = React.useState<File[]>([]);

  return (
    <Dropzone
      accept={{
        "image/*": [".jpg", ".png"],
        "application/pdf": [".pdf"],
      }}
      onDropAccepted={setFiles}
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
                You can upload files up to 10MB in size. Supported formats: JPG,
                PNG, PDF.
              </DropzoneDescription>
            </DropzoneGroup>
          </DropzoneGroup>
        </DropzoneZone>
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
      </div>
    </Dropzone>
  );
}
