export class MissingAssistantError extends Error {
    constructor() {
        super();
        this.name = 'MissingAssistantError'
    }
}

export class MissingThreadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MissingThreadError'
    }
}

export class AssistantExistsError extends Error {
    constructor() {
        super();
        this.name = 'AssistantExistsError'
    }
}

export class ThreadExistsError extends Error {
    constructor() {
        super();
        this.name = 'ThreadExistsError'
    }
}
