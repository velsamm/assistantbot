import { Router } from '@grammyjs/router'
import { MessageType, MyContext } from '../../../types'
import { Assistant, RunCallbacks } from '../../../gpt'
import { buildTelegramChatAssignment } from '../../../store'
import { createDebug } from '../../../createDebug'
import { downloadFile } from '../../../utils/downloadFile'
import { BASE_BOT_API_URL, BOT_TOKEN, TELEGRAM_MAX_MESSAGE_SIZE } from '../../../constants'
import { InputFile } from "grammy";

const useAssistantRouteDebug = createDebug('bot:useAssistantRoute')

const assistantInstance = new Assistant()

const useAssistantRoute = new Router<MyContext>((ctx) => ctx.session.step)

useAssistantRoute.otherwise(async (ctx, next) => {
    if (ctx.session.step !== 'idle') {
        return await next()
    }

    const telegramId = ctx.telegramId
    const telegramThreadId = ctx.assistantContext.telegramThreadId
    const chatId = ctx.assistantContext.chatId

    let messageType: MessageType
    switch (true) {
        case !!ctx.msg?.text:
            {
                messageType = MessageType.TEXT
            }
            break
        case !!ctx.msg?.document:
            {
                messageType = MessageType.DOCUMENT
            }
            break

        default: {
            messageType = MessageType.UNKNOWN
        }
    }

    if (messageType === MessageType.UNKNOWN) {
        return
    }

    const telegramChatAssignment = buildTelegramChatAssignment(
        telegramThreadId,
        chatId
    )
    await assistantInstance.init(telegramChatAssignment)

    useAssistantRouteDebug(
        '%s',
        `Begin assistant for chat ${telegramChatAssignment}, telegramId ${telegramId}`
    )

    let shouldStop = false

    switch (messageType) {
        case MessageType.DOCUMENT:
            {
                // TODO check - ctx.msg.caption should exist
                const message = ctx.msg?.caption!
                const fileInfo = await ctx.getFile()
                const filePath = fileInfo.file_path
                if (filePath) {
                    const [_, fileName] = filePath.split('/')
                    useAssistantRouteDebug(
                        '%s',
                        `Downloading file ${fileName} from telegram for chat ${telegramChatAssignment}, telegramId ${telegramId}`
                    )
                    const file = await downloadFile(
                        `${BASE_BOT_API_URL}/file/bot${BOT_TOKEN}/${filePath}`
                    )
                    useAssistantRouteDebug(
                        '%s',
                        `Uploading file ${fileName} for chat ${telegramChatAssignment}, telegramId ${telegramId}`
                    )

                    const uploadedFile = await assistantInstance
                        .uploadFile(file)
                        .catch(null)
                    if (uploadedFile) {
                        useAssistantRouteDebug(
                            '%s',
                            `Uploaded file ${fileName} for chat ${telegramChatAssignment}, telegramId ${telegramId}`
                        )
                        await assistantInstance.addMessageToThread(message, [
                            {
                                file_id: uploadedFile.id,
                                tools: [{ type: "file_search" }]
                            },
                        ])
                    } else {
                        useAssistantRouteDebug(
                            '%s',
                            `Failed to upload file ${fileName} for chat ${telegramChatAssignment}, telegramId ${telegramId}`
                        )
                    }
                } else {
                    useAssistantRouteDebug(
                        '%O',
                        ctx.msg,
                        `Failed to get file info from telegram for chat ${telegramChatAssignment}, telegramId ${telegramId}`
                    )

                    shouldStop = true
                } break;
            }
        case MessageType.TEXT:
            {
                const message = ctx.msg?.text!
                await assistantInstance.addMessageToThread(message)
            }
            break
    }

    if (shouldStop) {
        useAssistantRouteDebug(
            '%s',
            `Stop assistant for chat ${telegramChatAssignment}, telegramId ${telegramId}`
        )
        return
    }

    const callbacks: RunCallbacks = {
        onComplete: async (text: string) => {
            if (text.length > TELEGRAM_MAX_MESSAGE_SIZE) {
                const uint8Array = new TextEncoder().encode(text)
                await ctx.replyWithDocument(new InputFile(uint8Array, 'gpt_response.md'), {
                    message_thread_id: telegramThreadId
                })
            } else {
                await ctx.reply(text, {
                    message_thread_id: telegramThreadId,
                    parse_mode: 'Markdown',
                })
            }
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
