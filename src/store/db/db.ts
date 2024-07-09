import Knex from "knex";
import { AssistantId, TelegramChatAssignment, ThreadGpt, ThreadGptId } from "../../types";
import { createDebug } from "../../createDebug";

const dbDebug = createDebug('db:knex')

interface Assignment {
    id: TelegramChatAssignment;
    assistant_id: AssistantId;
    thread_id: ThreadGptId;
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
    assistant_id: AssistantId;
    created_at: number;
}

const knex = Knex({
    client: "sqlite3",
    connection: {
        filename: 'db/mydb.sqlite'
    }
})

export const db = {
    selectAssignment: (telegramChatAssignment: TelegramChatAssignment) =>
        knex<Assignment>('assignment')
            .where({ id: telegramChatAssignment })
            .select('*')
            .catch(error => {
                dbDebug('%o', error);

                return null;
            }),

    insertAssignment: (
        telegramChatAssignment: TelegramChatAssignment,
        assistantId: AssistantId,
        threadId: ThreadGptId
    ) =>
        knex<Assignment>('assignment')
            .insert({
                id: telegramChatAssignment,
                assistant_id: assistantId,
                thread_id: threadId
            }).onConflict().ignore()

}