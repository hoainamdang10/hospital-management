/**
 * Payment Sync Job
 * Handles synchronization of payment data between systems
 */

export interface PaymentSyncJob {
  id: string
  type: 'full_sync' | 'incremental_sync' | 'single_payment'
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  progress: number
  totalItems: number
  processedItems: number
  failedItems: number
  errors: string[]
  metadata?: Record<string, any>
}

export interface SyncResult {
  success: boolean
  processed: number
  failed: number
  errors: string[]
  duration: number
}

export class PaymentSyncService {
  private static instance: PaymentSyncService
  private jobs: Map<string, PaymentSyncJob> = new Map()
  private isRunning = false

  static getInstance(): PaymentSyncService {
    if (!PaymentSyncService.instance) {
      PaymentSyncService.instance = new PaymentSyncService()
    }
    return PaymentSyncService.instance
  }

  async createSyncJob(
    type: PaymentSyncJob['type'],
    metadata?: Record<string, any>
  ): Promise<PaymentSyncJob> {
    const job: PaymentSyncJob = {
      id: `sync_${type}_${Date.now()}`,
      type,
      status: 'pending',
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      failedItems: 0,
      errors: [],
      metadata,
    }

    this.jobs.set(job.id, job)
    return job
  }

  async startSyncJob(jobId: string): Promise<SyncResult> {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Sync job ${jobId} not found`)
    }

    if (this.isRunning) {
      throw new Error('Another sync job is already running')
    }

    try {
      this.isRunning = true
      job.status = 'running'
      job.startTime = new Date()

      const result = await this.executeSyncJob(job)

      job.status = result.success ? 'completed' : 'failed'
      job.endTime = new Date()
      job.progress = 100

      return result
    } catch (error) {
      job.status = 'failed'
      job.endTime = new Date()
      job.errors.push(error instanceof Error ? error.message : 'Unknown error')

      return {
        success: false,
        processed: job.processedItems,
        failed: job.failedItems,
        errors: job.errors,
        duration: job.endTime.getTime() - (job.startTime?.getTime() || 0),
      }
    } finally {
      this.isRunning = false
    }
  }

  private async executeSyncJob(job: PaymentSyncJob): Promise<SyncResult> {
    const startTime = Date.now()

    switch (job.type) {
      case 'full_sync':
        return await this.performFullSync(job)
      case 'incremental_sync':
        return await this.performIncrementalSync(job)
      case 'single_payment':
        return await this.performSinglePaymentSync(job)
      default:
        throw new Error(`Unknown sync job type: ${job.type}`)
    }
  }

  private async performFullSync(job: PaymentSyncJob): Promise<SyncResult> {
    // Simulate full sync process
    job.totalItems = 1000 // Mock total items
    
    for (let i = 0; i < job.totalItems; i++) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Simulate 95% success rate
      if (Math.random() > 0.05) {
        job.processedItems++
      } else {
        job.failedItems++
        job.errors.push(`Failed to sync item ${i}`)
      }
      
      job.progress = Math.round((i + 1) / job.totalItems * 100)
    }

    return {
      success: job.failedItems < job.totalItems * 0.1, // Success if less than 10% failed
      processed: job.processedItems,
      failed: job.failedItems,
      errors: job.errors,
      duration: Date.now() - (job.startTime?.getTime() || 0),
    }
  }

  private async performIncrementalSync(job: PaymentSyncJob): Promise<SyncResult> {
    // Simulate incremental sync (only recent changes)
    job.totalItems = 50 // Mock recent items
    
    for (let i = 0; i < job.totalItems; i++) {
      await new Promise(resolve => setTimeout(resolve, 20))
      
      if (Math.random() > 0.02) { // 98% success rate for incremental
        job.processedItems++
      } else {
        job.failedItems++
        job.errors.push(`Failed to sync recent item ${i}`)
      }
      
      job.progress = Math.round((i + 1) / job.totalItems * 100)
    }

    return {
      success: job.failedItems === 0,
      processed: job.processedItems,
      failed: job.failedItems,
      errors: job.errors,
      duration: Date.now() - (job.startTime?.getTime() || 0),
    }
  }

  private async performSinglePaymentSync(job: PaymentSyncJob): Promise<SyncResult> {
    const paymentId = job.metadata?.paymentId
    if (!paymentId) {
      throw new Error('Payment ID required for single payment sync')
    }

    job.totalItems = 1
    
    // Simulate single payment sync
    await new Promise(resolve => setTimeout(resolve, 100))
    
    if (Math.random() > 0.1) { // 90% success rate
      job.processedItems = 1
      job.progress = 100
    } else {
      job.failedItems = 1
      job.errors.push(`Failed to sync payment ${paymentId}`)
      job.progress = 100
    }

    return {
      success: job.failedItems === 0,
      processed: job.processedItems,
      failed: job.failedItems,
      errors: job.errors,
      duration: Date.now() - (job.startTime?.getTime() || 0),
    }
  }

  async getJob(jobId: string): Promise<PaymentSyncJob | undefined> {
    return this.jobs.get(jobId)
  }

  async getAllJobs(): Promise<PaymentSyncJob[]> {
    return Array.from(this.jobs.values()).sort(
      (a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0)
    )
  }

  async getRunningJob(): Promise<PaymentSyncJob | undefined> {
    return Array.from(this.jobs.values()).find(job => job.status === 'running')
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) {
      return false
    }

    if (job.status === 'running') {
      // In real implementation, you would need to implement cancellation logic
      return false
    }

    if (job.status === 'pending') {
      job.status = 'failed'
      job.errors.push('Job cancelled by user')
      return true
    }

    return false
  }

  isJobRunning(): boolean {
    return this.isRunning
  }
}

// Export singleton instance
export const paymentSyncService = PaymentSyncService.getInstance()
export default paymentSyncService
