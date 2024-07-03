import { AssistantId, TelegramChatAssignment, ThreadGptId } from "../types";

declare module 'knex/types/tables' {
    interface Assignment {
        id: TelegramChatAssignment;
        assistantId: AssistantId;
        threadId: ThreadGptId;
    }

    interface Assistant {
        id: AssistantId;
        created_at: number;
        name: string;
        instructions: string;
        model: string;
        author: number; // telegramId, who created it
    }

    interface AssistantThread {
        id: ThreadGptId;
        created_at: number;
    }
}