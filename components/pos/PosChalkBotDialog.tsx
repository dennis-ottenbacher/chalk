'use client'

import { useState } from 'react'
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Bot, X } from 'lucide-react'
import { AgentChat } from '@/components/staff/agent-chat'
import { getChalkMessages, sendChalkMessage } from '@/app/actions/chalk-agent'

export default function PosChalkBotDialog() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-border hover:bg-muted text-foreground gap-2 shadow-sm"
                >
                    <Bot className="h-4 w-4" />
                    Chalk Bot
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
                size="3xl"
                className="bg-card border-border text-foreground h-[80vh] flex flex-col p-0 gap-0 shadow-xl"
            >
                <AlertDialogHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-border">
                    <AlertDialogTitle className="text-xl flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        Chalk Bot
                    </AlertDialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </AlertDialogHeader>

                <div className="flex-1 overflow-hidden p-4">
                    <AgentChat
                        className="h-full border-0 shadow-none bg-transparent"
                        hideHeader={true}
                        getMessagesFn={getChalkMessages}
                        sendMessageFn={sendChalkMessage}
                    />
                </div>
            </AlertDialogContent>
        </AlertDialog>
    )
}
