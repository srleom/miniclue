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
          <DialogTitle className="flex items-center gap-2 text-left text-base font-medium">
            <Icon className="size-5 flex-shrink-0" />
            <span className="break-words">{title}</span>
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4">
          <Button
            asChild
            className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
            size="lg"
          >
            <Link href="https://discord.gg/JAjy692Gfz" target="_blank">
              <svg
                viewBox="0 0 24 24"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                className="size-4 fill-white"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              {buttonText}
            </Link>
          </Button>
          <p className="text-muted-foreground text-left text-xs leading-relaxed">
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
