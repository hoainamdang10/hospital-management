export declare enum ScheduleType {
    ONCE = "ONCE",
    CRON = "CRON",
    RRULE = "RRULE"
}
export declare class ScheduleTypeVO {
    private readonly value;
    private constructor();
    static create(value: string): ScheduleTypeVO;
    static once(): ScheduleTypeVO;
    static cron(): ScheduleTypeVO;
    static rrule(): ScheduleTypeVO;
    getValue(): ScheduleType;
    isOnce(): boolean;
    isCron(): boolean;
    isRRule(): boolean;
    equals(other: ScheduleTypeVO): boolean;
    toString(): string;
}
//# sourceMappingURL=ScheduleType.d.ts.map