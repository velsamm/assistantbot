import { Router } from "@grammyjs/router";
import { MyContext } from "../../../types";
import { createDebug } from "../../../createDebug";

const nameRouteDebug = createDebug('bot:nameRoute')

export const nameRoute = (router: Router<MyContext>) => {
    const name = router.route('name')

    name.on('message:text', async (ctx) => {
        const telegramThreadId = ctx.message?.message_thread_id
        const text = ctx.msg.text;
        nameRouteDebug('%s', text, 'name router text')
        if (!text.trim()) {
            await ctx.reply('Укажите имя ассисстента. Любое понятное Вам', {
                message_thread_id: telegramThreadId
            });
            return
        }

        ctx.session.name = text;
        ctx.session.step = 'instructions'

        await ctx.reply('Теперь инструкции', {
            message_thread_id: telegramThreadId
        })
    })

    name.use(async (ctx) => {
        const telegramThreadId = ctx.message?.message_thread_id

        await ctx.reply('Укажите любое имя ассисстента', {
            message_thread_id: telegramThreadId,
        })
    })
}