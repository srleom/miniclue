"use client";

import * as React from "react";
import {
  Worker,
  Viewer,
  SpecialZoomLevel,
  ScrollMode,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { ToolbarProps, ToolbarSlot } from "@react-pdf-viewer/toolbar";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import { getFilePlugin } from "@react-pdf-viewer/get-file";
import {
  DownloadIcon,
  MaximizeIcon,
  SearchIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { searchPlugin } from "@react-pdf-viewer/search";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import SearchSidebar from "./search-sidebar";
import { Button } from "@/components/ui/button";

import "./core-styles.css";
import "./default-layout-styles.css";
import "./search-styles.css";

export default function PdfViewer({
  fileUrl,
  pageNumber,
  onPageChange,
  onDocumentLoad,
  scrollSource,
}: {
  fileUrl: string;
  pageNumber: number;
  onPageChange: (page: number) => void;
  onDocumentLoad: (totalPages: number) => void;
  scrollSource: "pdf" | "carousel" | null;
}) {
  const zoomPluginInstance = zoomPlugin();
  const getFilePluginInstance = getFilePlugin();
  const searchPluginInstance = searchPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  React.useEffect(() => {
    // Only jump if the change came from the carousel
    if (scrollSource === "carousel") {
      jumpToPage(pageNumber - 1);
    }
  }, [pageNumber, jumpToPage, scrollSource]);

  const renderToolbar = (
    Toolbar: (props: ToolbarProps) => React.ReactElement,
  ) => (
    <Toolbar>
      {(slots: ToolbarSlot) => {
        const {
          CurrentPageInput,
          Download,
          EnterFullScreen,
          NumberOfPages,
          Zoom,
          ZoomIn,
          ZoomOut,
        } = slots;
        return (
          <div className="flex w-full items-center justify-between border-0 text-sm">
            <div>
              <div className="flex items-center gap-1">
                <CurrentPageInput /> / <NumberOfPages />
              </div>
            </div>
            <div className="flex items-center justify-center gap-1">
              <ZoomOut>
                {(props) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={props.onClick}
                    className="hover:bg-border hover:cursor-pointer"
                  >
                    <ZoomOutIcon strokeWidth={1.3} size={20} />
                  </Button>
                )}
              </ZoomOut>
              <Zoom></Zoom>
              <ZoomIn>
                {(props) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={props.onClick}
                    className="hover:bg-border hover:cursor-pointer"
                  >
                    <ZoomInIcon strokeWidth={1.3} size={20} />
                  </Button>
                )}
              </ZoomIn>
            </div>
            <div className="flex items-center gap-1">
              <Download>
                {(props) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={props.onClick}
                    className="hover:bg-border hover:cursor-pointer"
                  >
                    <DownloadIcon strokeWidth={1.3} size={20} />
                  </Button>
                )}
              </Download>
              <EnterFullScreen>
                {(props) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={props.onClick}
                    className="hover:bg-border hover:cursor-pointer"
                  >
                    <MaximizeIcon strokeWidth={1.3} size={20} />
                  </Button>
                )}
              </EnterFullScreen>
            </div>
          </div>
        );
      }}
    </Toolbar>
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0]!,
      {
        content: (
          <SearchSidebar
            searchPluginInstance={
              defaultLayoutPluginInstance.toolbarPluginInstance
                .searchPluginInstance
            }
          />
        ),
        icon: <SearchIcon size={16} strokeWidth={1.2} />,
        title: "Search",
      },
    ],
  });

  return (
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
      <Viewer
        fileUrl={fileUrl}
        onPageChange={(e) => {
          const newPage = e.currentPage + 1;
          if (newPage !== pageNumber) {
            onPageChange(newPage);
          }
        }}
        onDocumentLoad={(e) => onDocumentLoad(e.doc.numPages)}
        plugins={[
          defaultLayoutPluginInstance,
          zoomPluginInstance,
          getFilePluginInstance,
          searchPluginInstance,
          pageNavigationPluginInstance,
        ]}
        defaultScale={SpecialZoomLevel.PageWidth}
        scrollMode={ScrollMode.Vertical}
      />
    </Worker>
  );
}
