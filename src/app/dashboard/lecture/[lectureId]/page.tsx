import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LecturePageProps {
  params: {
    lectureId: string;
  };
}

export default function LecturePage({ params }: LecturePageProps) {
  return (
    <div className="mx-auto mt-2 flex w-full flex-col">
      <div className="h-[calc(100vh-7rem)] rounded-lg border">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel>PDF Viewer</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>
            <div className="p-4">
              <Tabs defaultValue="explanation">
                <TabsList className="w-full">
                  <TabsTrigger
                    value="explanation"
                    className="hover:cursor-pointer"
                  >
                    Explanation
                  </TabsTrigger>
                  <TabsTrigger value="summary" className="hover:cursor-pointer">
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="hover:cursor-pointer">
                    Notes
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="explanation">
                  Make changes to your explanation here.
                </TabsContent>
                <TabsContent value="summary">
                  Change your summary here.
                </TabsContent>
                <TabsContent value="notes">Change your notes here.</TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
