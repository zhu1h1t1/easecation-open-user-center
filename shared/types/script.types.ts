export type ScriptCenterItem = {
    id: number;
    title: string;
    description?: string | null;
    content: string;
    isPublic: boolean;
    ownerId: string;
    createdAt?: string;
};
