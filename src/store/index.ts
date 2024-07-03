import type {
    AssistantGpt,
    AssistantId,
    TelegramChatAssignment,
    TelegramChatId,
    TelegramThreadId,
    ThreadGpt,
} from '../types'

const assistants = new Map<TelegramChatAssignment, AssistantGpt>()
const assistantThreadsMap = new Map<AssistantId, ThreadGpt>()

// chatId + telegramTheadId     - assistantId
// assistantId                  - threadId

export const buildTelegramChatAssignment = (
    telegramThreadId: TelegramThreadId,
    telegramChatId: TelegramChatId
): TelegramChatAssignment => `${telegramThreadId}:${telegramChatId}`

export const getAssistantGpt = (telegramChatAssignment: TelegramChatAssignment) => {
    return assistants.get(telegramChatAssignment)
}

export const getThreadGpt = (assistantId: AssistantId) => {
    return assistantThreadsMap.get(assistantId)
}

export const createAssistantGpt = (
    telegramChatAssignment: TelegramChatAssignment,
    assistant: AssistantGpt
) => {
    assistants.set(telegramChatAssignment, assistant)
}

export const createThreadGpt = (
    assistantId: AssistantId,
    thread: ThreadGpt
) => {
    assistantThreadsMap.set(assistantId, thread)
}

// const temporarySaveInitial = () => {
//     const assistant2 = {
//         id: 'asst_3CsTBI6ho8sjy99E3HVBJjjb',
//         object: 'assistant',
//         created_at: 1717506889,
//         name: 'Development Tutor',
//         description: null,
//         model: 'gpt-4o',
//         instructions: 'Ты наставник для начинающих разработчиков React. Пиши код и подробно объясняй что и зачем ты делаешь',
//         tools: [],
//         top_p: 1,
//         temperature: 1,
//         tool_resources: {},
//         metadata: {},
//         response_format: 'auto'
//     }
//
//     const thread2 = {
//         id: 'thread_vVmYQrSxqvfT0IBEHiVkap2o',
//         object: 'thread',
//         created_at: 1717506889,
//         metadata: {},
//         tool_resources: {},
//     }
//
//     createAssistantGpt(buildTelegramChatAssignment(4, -1002177891351), assistant2)
//     createThreadGpt(assistant2.id, thread2)
//
//     const assistant3 = {
//         id: 'asst_2VUjndYSBXrj6J3W67kx8NMG',
//         object: 'assistant',
//         created_at: 1717781439,
//         name: 'Дизайн',
//         description: null,
//         model: 'gpt-4o',
//         instructions: 'Ты дизайнер интерфейсов для веб-приложений',
//         tools: [],
//         top_p: 1,
//         temperature: 1,
//         tool_resources: {},
//         metadata: {},
//         response_format: 'auto'
//     }
//
//     const thread3 = {
//         id: 'thread_hmWp4m9e1Xi6fprMsfGdOREI',
//         object: 'thread',
//         created_at: 1717432944,
//         metadata: {},
//         tool_resources: {}
//     }
//
//     createAssistantGpt(buildTelegramChatAssignment(2, -1002167327446), assistant3)
//     createThreadGpt(assistant3.id, thread3)
// }

// temporarySaveInitial()


/*

{
  assistant: {
    id: 'asst_HF58X5brsHZFOLyr9KW5qCEL',
    object: 'assistant',
    created_at: 1718375966,
    name: 'Производитель скрепок',
    description: null,
    model: 'gpt-4o',
    instructions: 'ты маркетолого производителя скрепок для скрепления бумаги',
    tools: [],
    top_p: 1,
    temperature: 1,
    tool_resources: {},
    metadata: {},
    response_format: 'auto'
  }
}
{
  thread: {
    id: 'thread_IMMsyTUFLUFHGoZHfFADofBt',
    object: 'thread',
    created_at: 1718375966,
    metadata: {},
    tool_resources: {}
  }
}
  bot:info { chatId: -1002177891351, telegramThreadId: 4 } +15s
  bot:info No assignments for 4:-1002177891351, telegramId - 618392081 +2ms

 */