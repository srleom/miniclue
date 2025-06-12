import { DropzoneComponent } from "@/components/app/dashboard/dropzone";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <div className="mx-auto mt-16 flex w-full flex-col items-center lg:w-3xl">
      <Button variant="outline" size="sm" className="w-fit text-xs">
        BETA
      </Button>
      <h1 className="mt-4 text-center text-4xl font-semibold">
        Ready when you are.
      </h1>
      <p className="text-muted-foreground mt-2 mb-10 text-center">
        Upload your PDF lecture slides and get started.
      </p>
      <div className="w-full">
        <DropzoneComponent />
      </div>
    </div>
  );
}
