import createDebug from "debug";

// const debugNamespaces = ['bot', 'gpt']
// debugNamespaces.forEach(nm => {
//     createDebug.enable(nm)
// })

createDebug.enable('gpt,bot:*,db:*')
// createDebug.enable('bot')
// const debug = createDebug('bot')

export { createDebug }