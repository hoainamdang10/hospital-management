/**
 * Event Handlers Wrapper
 * Wraps AppointmentReadModelEventHandler to implement EventHandler interface
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { EventHandler } from '../../../../shared/infrastructure/event-bus/EventBus';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { AppointmentReadModelEventHandler } from './AppointmentReadModelEventHandler';
/**
 * Appointment Scheduled Event Handler
 */
export declare class AppointmentScheduledEventHandler implements EventHandler<DomainEvent> {
    private readModelHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler);
    handle(event: DomainEvent): Promise<void>;
}
/**
 * Patient Updated Event Handler
 */
export declare class PatientUpdatedEventHandler implements EventHandler<DomainEvent> {
    private readModelHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler);
    handle(event: DomainEvent): Promise<void>;
}
/**
 * Doctor Updated Event Handler
 */
export declare class DoctorUpdatedEventHandler implements EventHandler<DomainEvent> {
    private readModelHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler);
    handle(event: DomainEvent): Promise<void>;
}
/**
 * Appointment Status Changed Event Handler
 */
export declare class AppointmentStatusChangedEventHandler implements EventHandler<DomainEvent> {
    private readModelHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler);
    handle(event: DomainEvent): Promise<void>;
}
/**
 * Appointment Cancelled Event Handler
 */
export declare class AppointmentCancelledEventHandler implements EventHandler<DomainEvent> {
    private readModelHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler);
    handle(event: DomainEvent): Promise<void>;
}
/**
 * Appointment Confirmed Event Handler
 */
export declare class AppointmentConfirmedEventHandler implements EventHandler<DomainEvent> {
    private readModelHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler);
    handle(event: DomainEvent): Promise<void>;
}
/**
 * Appointment Completed Event Handler
 */
export declare class AppointmentCompletedEventHandler implements EventHandler<DomainEvent> {
    private readModelHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler);
    handle(event: DomainEvent): Promise<void>;
}
/**
 * Appointment No-Show Event Handler
 */
export declare class AppointmentNoShowEventHandler implements EventHandler<DomainEvent> {
    private readModelHandler;
    constructor(readModelHandler: AppointmentReadModelEventHandler);
    handle(event: DomainEvent): Promise<void>;
}
//# sourceMappingURL=EventHandlers.d.ts.map