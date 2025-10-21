export declare class DedupKey {
    private readonly value;
    private constructor();
    static create(value: string): DedupKey;
    static fromParts(parts: string[]): DedupKey;
    getValue(): string;
    equals(other: DedupKey): boolean;
    toString(): string;
}
//# sourceMappingURL=DedupKey.d.ts.map