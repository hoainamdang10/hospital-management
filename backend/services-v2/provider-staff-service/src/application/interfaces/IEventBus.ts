/**
 * Event Bus Interface - Application Layer
 * Interface for publishing domain events
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export interface IEventBus {
  publish(event: any): Promise<void>;
  subscribe(eventName: string, handler: any): Promise<void>;
}
