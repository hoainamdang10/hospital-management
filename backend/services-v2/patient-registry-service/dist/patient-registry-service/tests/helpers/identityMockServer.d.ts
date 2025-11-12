export interface IdentityTokenPayload {
    userId: string;
    email: string;
    roles: string[];
    permissions: string[];
}
export declare function registerIdentityToken(token: string, payload: IdentityTokenPayload): void;
export declare function ensureIdentityMockServer(): Promise<{
    url: string;
    release: () => Promise<void>;
}>;
//# sourceMappingURL=identityMockServer.d.ts.map