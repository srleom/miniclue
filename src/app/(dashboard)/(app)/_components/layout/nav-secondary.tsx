"use client";

// react
import * as React from "react";

// next
import Link from "next/link";

// icons
import { LifeBuoy, Send, type LucideIcon } from "lucide-react";

// components
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  LifeBuoy,
  Send,
};

interface DiscordDialogProps {
  trigger: React.ReactNode;
  type: "support" | "feedback";
}

function DiscordDialog({ trigger, type }: DiscordDialogProps) {
  const config = {
    support: {
      title: "Report a Bug",
      icon: LifeBuoy,
      description:
        "Found a bug or experiencing an issue? Join our Discord to report it and get help from our team. We'll investigate and fix it as soon as possible.",
      buttonText: "Report Bug on Discord",
      footerText:
        "Your bug reports help us identify and fix issues quickly for everyone.",
    },
    feedback: {
      title: "Request a Feature",
      icon: Send,
      description:
        "Have an idea for a new feature? Join our Discord to share your suggestions and help us prioritize what to build next.",
      buttonText: "Request Feature on Discord",
      footerText:
        "Your feature requests help us understand what matters most to our users.",
    },
  };

  const {
    title,
    icon: Icon,
    description,
    buttonText,
    footerText,
  } = config[type];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div onClick={(e) => e.stopPropagation()}>{trigger}</div>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-start text-base font-medium">
            <Icon className="size-5 flex-shrink-0" />
            <span className="break-words">{title}</span>
          </DialogTitle>
          <DialogDescription className="text-start text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4">
          <Button
            asChild
            className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
            size="lg"
          >
            <Link
              href={
                type === "support"
                  ? "https://discord.gg/XPdb5gqrJr"
                  : "https://discord.gg/qsgKfnU27y"
              }
              target="_blank"
              className="flex items-center gap-2"
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                className="flex-shrink-0 fill-white"
              >
                <title>Discord</title>
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
              {buttonText}
            </Link>
          </Button>
          <p className="text-muted-foreground text-start text-xs leading-relaxed">
            {footerText}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url?: string;
    icon: string;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderItem = (item: { title: string; url?: string; icon: string }) => {
    const IconComponent = iconMap[item.icon];

    if (item.title === "Support") {
      const trigger = (
        <SidebarMenuButton size="sm">
          {IconComponent && <IconComponent />}
          <span>{item.title}</span>
        </SidebarMenuButton>
      );
      return (
        <SidebarMenuItem key={item.title}>
          <DiscordDialog trigger={trigger} type="support" />
        </SidebarMenuItem>
      );
    }

    if (item.title === "Feedback") {
      const trigger = (
        <SidebarMenuButton size="sm">
          {IconComponent && <IconComponent />}
          <span>{item.title}</span>
        </SidebarMenuButton>
      );
      return (
        <SidebarMenuItem key={item.title}>
          <DiscordDialog trigger={trigger} type="feedback" />
        </SidebarMenuItem>
      );
    }

    // Fallback for other items
    const trigger = (
      <SidebarMenuButton asChild size="sm">
        <a href={item.url} onClick={handleNavigation}>
          {IconComponent && <IconComponent />}
          <span>{item.title}</span>
        </a>
      </SidebarMenuButton>
    );
    return <SidebarMenuItem key={item.title}>{trigger}</SidebarMenuItem>;
  };

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
