export type ParsedQuestion = {
    questionNumber: number;
    questionText: string;
    choices: {
        A?: string;
        B?: string;
        C?: string;
        D?: string;
    };
};