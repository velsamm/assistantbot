import { Router } from "@grammyjs/router";
import { MyContext } from "../../../types";
import { createDebug } from "../../../createDebug";
import { Assistant, CreateAssistantParams } from "../../../gpt";
import { buildTelegramChatAssignment } from "../../../store";
import { db } from "../../../store/db/db";

const instructionsRouteDebug = createDebug('bot:instructionsRoute')

export const instructionsRoute = (router: Router<MyContext>) => {
    const instructions = router.route('instructions')

    instructions.on('message:text', async (ctx) => {
        const telegramThreadId = ctx.message!.message_thread_id!
        const chatId = ctx.assistantContext.chatId
        const text = ctx.msg.text;
        instructionsRouteDebug('%s', text, 'instructions router text')

        if (!text.trim()) {
            await ctx.reply('Укажите подробные инструкции ассистенту', {
                message_thread_id: telegramThreadId
            });
            return
        }

        ctx.session.instructions = text;

        const name = ctx.session.name
        const instructions = ctx.session.instructions
        const params: CreateAssistantParams = {
            name: name,
            instructions: instructions,
            tools: [{ type: "file_search" }],
            // model: "gpt-3.5-turbo"
            model: "gpt-4o"
        }
        const assistantInstance = new Assistant();
        const telegramChatAssignment = buildTelegramChatAssignment(telegramThreadId, chatId)
        const assistant = await assistantInstance.createAssistant(telegramChatAssignment, params)
        const thread = await assistantInstance.createThread(assistant.id)

        await db.insertAssignment(telegramChatAssignment, assistant.id, thread.id)

        ctx.session.step = 'idle'

        await ctx.reply('Done', {
            message_thread_id: telegramThreadId
        });
    })

    instructions.use(async (ctx) => {
        const telegramThreadId = ctx.message?.message_thread_id

        await ctx.reply('Укажите !!подробные!! инструкции ассистенту', {
            message_thread_id: telegramThreadId,
        })
    })
}