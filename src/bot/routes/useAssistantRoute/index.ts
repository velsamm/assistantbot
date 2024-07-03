import { Router } from "@grammyjs/router";
import type { MyContext } from "../../../types";
import { Assistant, RunCallbacks } from "../../../gpt";
import { buildTelegramChatAssignment } from "../../../store";
import { createDebug } from "../../../createDebug";

const useAssistantRouteDebug = createDebug('bot:useAssistantRoute')

const assistantInstance = new Assistant();

const useAssistantRoute = new Router<MyContext>(ctx => ctx.session.step)

useAssistantRoute.otherwise(async (ctx, next) => {
    if (ctx.session.step !== 'idle') {
        return await next()
    }

    const telegramId = ctx.telegramId
    const telegramThreadId = ctx.assistantContext.telegramThreadId
    const chatId = ctx.assistantContext.chatId
    const message = ctx.message?.text

    if (!message) {
        return
    }

    const telegramChatAssignment = buildTelegramChatAssignment(telegramThreadId, chatId);
    await assistantInstance.init(telegramChatAssignment);

    useAssistantRouteDebug('%s', `Begin assistant for chat ${telegramChatAssignment}, telegramId ${telegramId}`)

    await assistantInstance.addMessageToThread(message);

    const callbacks: RunCallbacks = {
        onComplete: async (text: string) => {
            await ctx.reply(text, {
                message_thread_id: telegramThreadId,
                parse_mode: 'Markdown'
            })
        },
        onFail: async (text) => {
            await ctx.reply(text, {
                message_thread_id: telegramThreadId,
            })
        },
    }

    await assistantInstance.run(callbacks)
})

export { useAssistantRoute }