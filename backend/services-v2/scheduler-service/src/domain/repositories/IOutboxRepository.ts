import { Outbox } from '../entities/Outbox.entity';

export interface IOutboxRepository {
  save(outbox: Outbox): Promise<void>;
  
  findUnpublished(limit?: number): Promise<Outbox[]>;
  
  update(outbox: Outbox): Promise<void>;
  
  deletePublished(olderThan: Date): Promise<number>;
}

