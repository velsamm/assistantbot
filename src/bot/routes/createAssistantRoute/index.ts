import { Router } from "@grammyjs/router";
import type { MyContext } from "../../../types";
import { nameRoute } from "./nameRoute";
import { instructionsRoute } from "./instructionsRoute";

const createAssistantRoute = new Router<MyContext>((ctx) => ctx.session.step);

nameRoute(createAssistantRoute)
instructionsRoute(createAssistantRoute)

createAssistantRoute.otherwise(async (ctx) => {
    const telegramThreadId = ctx.assistantContext.telegramThreadId

    const name = ctx.session.name
    if (!name) {
        await ctx.reply('Введите любое понятное Вам имя ассистента', {
            message_thread_id: telegramThreadId,
        })
        ctx.session.step = 'name'
        return
    }

    const instructions = ctx.session.instructions
    if (!instructions && name) {
        await ctx.reply('Введите инструкции для ассистента', {
            message_thread_id: telegramThreadId,
        })
        ctx.session.step = 'idle'
        return
    }
})

export { createAssistantRoute }