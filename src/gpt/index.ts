import OpenAI from 'openai'
import type { AssistantCreateParams } from "openai/src/resources/beta/assistants";
import type { MessageCreateParams } from "openai/src/resources/beta/threads/messages";
import { AssistantId, TelegramChatAssignment, TelegramThreadId } from "../types";
import { createAssistantGpt, createThreadGpt, getAssistantGpt, getThreadGpt } from "../store";
import { OPENAI_API_KEY } from "../constants";
import { RunCreateParamsNonStreaming } from "openai/src/resources/beta/threads/runs/runs";
import { createDebug } from "../createDebug";
import { MissingAssistantError, MissingThreadError } from "../store/errors";
import { Uploadable } from "openai/uploads";

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
})
const debug = createDebug('gpt')

export type CreateAssistantParams = AssistantCreateParams
export type RunCallbacks = {
    onComplete: (text: string) => void;
    onFail: (reason: string) => void;
}

export class Assistant {
    private assistant: OpenAI.Beta.Assistants.Assistant | undefined;
    private thread: OpenAI.Beta.Threads.Thread | undefined;
    private telegramChatAssignment: TelegramChatAssignment | undefined;

    constructor() {
    }

    private checkAssistant() {
        if (!this.assistant || !this.thread) {
            throw new Error('Method .init(telegramThreadId) should be called first!')
        }
    }

    uploadFile(file: Uploadable) {
        return openai.files.create({ file, purpose: 'assistants' })
    }

    async addMessageToThread(message: string, attachments?: Array<MessageCreateParams.Attachment> | null) {
        this.checkAssistant()

        const body: MessageCreateParams = {
            role: 'user',
            content: message,
            attachments
        }

        await openai.beta.threads.messages.create(this.thread!.id, body)
    }

    async init(telegramChatAssignment: TelegramChatAssignment) {
        const assistant = getAssistantGpt(telegramChatAssignment)
        if (!assistant) {
            throw new MissingAssistantError()
        }

        const thread = getThreadGpt(assistant.id)

        if (!thread) {
            throw new MissingThreadError(`Missing thread in db for assistant ${assistant.id}`)
        }

        this.telegramChatAssignment = telegramChatAssignment
        this.assistant = await openai.beta.assistants.retrieve(assistant.id)
        this.thread = await openai.beta.threads.retrieve(thread.id)
    }

    async run(callbacks: RunCallbacks) {
        this.checkAssistant()
        const { onComplete, onFail } = callbacks

        const body: RunCreateParamsNonStreaming = {
            assistant_id: this.assistant!.id,
        }

        debug('%', `Run create for assignment ${this.telegramChatAssignment} ...`)

        const run = await openai.beta.threads.runs.createAndPoll(this.thread!.id, body)
        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(run.thread_id, { limit: 1, order: 'desc' })
            for (const message of messages.data) {
                // debug('%O',  message, 'Incoming message')
                if (message.content[0].type === 'text') {
                    const text = message.content[0].text.value
                    debug('%s', `Got message for assignment ${this.telegramChatAssignment}`)
                    onComplete(text)
                    return
                }

                debug('%O', message.content[0], `Unknown content`)
                onFail('Unknown content')
            }
        } else {
            if (run.last_error) {
                debug('%o', run.last_error, `Run failed`)
                onFail(run.last_error.message)
                return
            }

            if (run.incomplete_details) {
                debug('%o',  run.incomplete_details, `Run incomplete`)
                onFail(run.incomplete_details.reason ?? 'incomplete details unknown');
                return
            }

            debug('%s', 'Run failed. Reason - Unknown!')
            onFail('Unknown reason!')
        }
    }

    async createAssistant(telegramChatAssignment: TelegramChatAssignment, params: CreateAssistantParams) {
        const assistant = await openai.beta.assistants.create(params)
        createAssistantGpt(telegramChatAssignment, { id: assistant.id })
        console.log({ assistant })

        return assistant
    }

    async createThread(assistantId: AssistantId) {
        const thread = await openai.beta.threads.create()
        createThreadGpt(assistantId, thread)
        console.log({ thread })

        return thread;
    }
}