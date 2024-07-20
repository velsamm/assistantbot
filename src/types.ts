import { Context, SessionFlavor } from "grammy";

export type AssistantId = string;
export type ThreadGptId = string;

export interface AssistantGpt {
    id: AssistantId;
}

export interface ThreadGpt {
    id: ThreadGptId;
}

export type TelegramThreadId = number;
export type TelegramChatAssignment = string;
export type TelegramChatId = number;

export interface SessionData {
    step: "idle" | "instructions" | "name" ;
    name?: string;
    instructions?: string;
    model?: string;
}

interface AssistantContext {
    chatId: number;
    telegramThreadId: number;
}

export type MyContext =
    Context &
    SessionFlavor<SessionData> &
    { assistantContext: AssistantContext } &
    { telegramId: number | undefined; }

export enum MessageType {
    TEXT = 'text',
    DOCUMENT = 'document',
    UNKNOWN = 'unknown'
}