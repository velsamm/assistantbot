import { Bot, GrammyError, HttpError, session } from 'grammy'
import { BOT_TOKEN, OPENAI_API_KEY } from '../constants'
import { createDebug } from '../createDebug'
import {
    buildTelegramChatAssignment,
    createAssistantGpt,
    createThreadGpt,
    getAssistantGpt,
    getThreadGpt
} from '../store'
import { AssistantExistsError, MissingAssistantError, MissingThreadError, ThreadExistsError } from '../store/errors'
import { MyContext, SessionData } from '../types'
import { createAssistantRoute } from "./routes/createAssistantRoute";
import { useAssistantRoute } from "./routes/useAssistantRoute";
import { db } from "../store/db/db";
import { verifyAndCreateTables } from "../store/db/createTables";

const botInfo = createDebug('bot:info')
const botError = createDebug('bot:error')

if (!BOT_TOKEN) {
    console.error('Missing BOT_TOKEN env var')
    process.exit(1)
}

if (!OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY env var')
    process.exit(1)
}

const bot = new Bot<MyContext>(BOT_TOKEN)

bot.use(async (ctx, next) => {
    const chatId = ctx.update.message?.chat.id
    const telegramThreadId = ctx.message?.message_thread_id
    const telegramId = ctx.from?.id || ctx.message?.from.id || ctx.callbackQuery?.from.id

    if (telegramThreadId && chatId && chatId < 0) {
        ctx.assistantContext = {
            chatId: chatId,
            telegramThreadId: telegramThreadId,
        }
        ctx.telegramId = telegramId;

        botInfo('%O', ctx.assistantContext)

        await next()
    }
})

bot.use(async (ctx, next) => {
    await verifyAndCreateTables()
    await next()
})

bot.use(async (ctx, next) => {
    const chatId = ctx.assistantContext.chatId
    const telegramThreadId = ctx.assistantContext.telegramThreadId
    const telegramChatAssignment = buildTelegramChatAssignment(telegramThreadId, chatId)

    if (getAssistantGpt(telegramChatAssignment)) {
        // запись об ассистенте существует. пропуск проверки в бд
        return await next();
    }

    const assignment = await db.selectAssignment(telegramChatAssignment)
    if (assignment && assignment[0]) {
        const _assignment = assignment[0];
        const assistantId = _assignment.assistant_id
        const threadId = _assignment.thread_id
        botInfo('%O', _assignment, `Assignment for ${telegramChatAssignment}, telegramId - ${ctx.telegramId}`)
        createAssistantGpt(telegramChatAssignment, { id: assistantId })
        createThreadGpt(assistantId, { id: threadId })
    } else {
        botInfo('%s', `No assignments for ${telegramChatAssignment}, telegramId - ${ctx.telegramId}`)
    }

    await next();
})

bot.use(
    session({
        initial: (): SessionData => ({ step: 'idle' }),
    })
)

bot.command('start', async (ctx) => {
    const telegramThreadId = ctx.assistantContext.telegramThreadId
    const chatId = ctx.assistantContext.chatId
    const telegramChatAssignment = buildTelegramChatAssignment(telegramThreadId, chatId)

    const assistant = getAssistantGpt(telegramChatAssignment)
    if (assistant) {
        const thread = getThreadGpt(assistant.id)
        if (thread) {
            throw new ThreadExistsError()
        } else {
            throw new AssistantExistsError()
        }
    }


    // enter router-based form
    ctx.session.step = 'name'

    await ctx.reply('Имя ассисстента', {
        message_thread_id: telegramThreadId,
    })
})

bot.use(useAssistantRoute)
bot.use(createAssistantRoute)

bot.catch((error) => {
    const ctx = error.ctx
    console.error(`Error while handling update ${ctx.update.update_id}:`)
    const e = error.error
    if (e instanceof GrammyError) {
        console.error('Error in request:', e.description)
    } else if (e instanceof HttpError) {
        console.error('Could not contact Telegram:', e)
    } else if (e instanceof MissingAssistantError) {
        botError('%s', 'MissingAssistantError')
    } else if (e instanceof MissingThreadError) {
        botError('%s', 'MissingThreadError')
    } else if (e instanceof ThreadExistsError) {
        botError('%s', 'ThreadExistsError')
    } else if (e instanceof AssistantExistsError) {
        botError('%s', 'AssistantExistsError')
    } else {
        console.error('Unknown error:', e)
    }
})

bot.start()
