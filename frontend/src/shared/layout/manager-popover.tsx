import type { ReactNode } from "react";
const managerSrc = "/images/common/manager.png";
const callIconSrc = "/images/common/call-icon.svg";
const messageIconSrc = "/images/common/message-icon.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { MANAGER_CONTACT_URL } from "@/shared/config/contact";

export function ManagerPopover({ trigger }: { trigger: ReactNode }) {
    return (
        <Popover>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-80">
                <div className="flex flex-col items-center text-center gap-4">
                    <Avatar className="size-16">
                        <AvatarImage src={managerSrc} alt="Менеджер" />
                        <AvatarFallback className="text-lg">ЕГ</AvatarFallback>
                    </Avatar>

                    <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">
                            Менеджер
                        </p>
                        <p className="text-base font-semibold">Егор</p>
                    </div>

                    <div className="flex items-center gap-3 w-full">
                        <a
                            href={MANAGER_CONTACT_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-secondary/60 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary"
                        >
                            <img
                                src={callIconSrc}
                                alt=""
                                className="size-7 rounded-xl"
                            />{" "}
                            <span>Созвон</span>
                        </a>
                        <a
                            href={MANAGER_CONTACT_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2.5 rounded-xl bg-secondary/60 px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary"
                        >
                            <img
                                src={messageIconSrc}
                                alt=""
                                className="size-7 rounded-xl"
                            />{" "}
                            <span>Написать</span>
                        </a>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
