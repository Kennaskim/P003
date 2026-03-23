import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MpesaService } from './mpesa.service.js';

@Processor('mpesa-callbacks')
export class MpesaProcessor extends WorkerHost {
    private readonly logger = new Logger(MpesaProcessor.name);

    constructor(private readonly mpesaService: MpesaService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing M-Pesa Callback Job ${job.id}...`);

        if (job.name === 'process-stk-result') {
            try {
                await this.mpesaService.processCallback(job.data);
            } catch (error) {
                this.logger.error(`Failed to process M-Pesa callback for job ${job.id}`, error.stack);
                throw error; // Throw so BullMQ retries the job
            }
        }
    }
}
