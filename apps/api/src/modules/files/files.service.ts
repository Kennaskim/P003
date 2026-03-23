import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RequestUploadUrlDto, ConfirmUploadDto } from './dto/file.dto.js';
import { tenantStorage } from '../../common/storage/tenant.storage.js';

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name); // ✅ Added NestJS Logger
    private s3Client: S3Client;
    private bucketName: string;

    constructor(
        private config: ConfigService,
        private prisma: PrismaService,
    ) {
        this.bucketName = this.config.getOrThrow<string>('S3_BUCKET_NAME');
        this.s3Client = new S3Client({
            region: this.config.getOrThrow<string>('S3_REGION'),
            endpoint: this.config.get<string>('S3_ENDPOINT'), // Critical for Cloudflare R2
            credentials: {
                accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY'),
                secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_KEY'),
            },
        });
    }

    async generateUploadUrl(dto: RequestUploadUrlDto) {
        const tenantId = tenantStorage.getStore()?.tenantId;
        if (!tenantId) throw new InternalServerErrorException('Missing tenant context');

        // Clean filename and isolate files in the bucket using a prefix: tenantId/uuid-filename
        const cleanFileName = dto.fileName.replace(/\s+/g, '_');
        const fileKey = `${tenantId}/${uuidv4()}-${cleanFileName}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            ContentType: dto.fileType,
        });

        try {
            // URL expires in 5 minutes
            const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
            return { presignedUrl, fileKey };
        } catch (error) {
            this.logger.error('Failed to generate upload URL', error);
            throw new InternalServerErrorException('Failed to generate upload URL');
        }
    }

    async confirmUpload(dto: ConfirmUploadDto) {
        const tenantId = tenantStorage.getStore()?.tenantId;
        if (!tenantId) throw new InternalServerErrorException('Missing tenant context');

        try {
            return await this.prisma.tenantClient.document.create({
                data: {
                    name: dto.fileName,
                    fileKey: dto.fileKey,
                    fileType: dto.fileType,
                    size: dto.fileSize,
                    entityType: dto.entityType,
                    entityId: dto.entityId,
                },
            });
        } catch (error) {
            this.logger.error('confirmUpload failed:', error);
            throw new InternalServerErrorException('Failed to save document record');
        }
    }

    async findAll() {
        return this.prisma.tenantClient.document.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getDownloadUrl(documentId: string) {
        // The tenantClient automatically ensures the user can only fetch their own documents
        const document = await this.prisma.tenantClient.document.findFirst({
            where: { id: documentId, deletedAt: null },
        });

        if (!document) throw new NotFoundException('DOCUMENT_NOT_FOUND');

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: document.fileKey,
        });

        try {
            // Temporary 5-minute read URL
            const url = await getSignedUrl(this.s3Client, command, { expiresIn: 300 });
            return { url, name: document.name };
        } catch (error) {
            this.logger.error('Failed to generate download URL', error);
            throw new InternalServerErrorException('Failed to generate download URL');
        }
    }

    /**
     * Upload a file directly via multipart form data.
     * Uploads the buffer to S3/R2, then saves the document record.
     */
    async uploadFile(file: Express.Multer.File, category?: string) {
        const tenantId = tenantStorage.getStore()?.tenantId;
        if (!tenantId) throw new InternalServerErrorException('Missing tenant context');

        const cleanFileName = file.originalname.replace(/\s+/g, '_');
        const fileKey = `${tenantId}/${uuidv4()}-${cleanFileName}`;

        // Upload to S3/R2
        const putCommand = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        try {
            await this.s3Client.send(putCommand);
        } catch (error) {
            this.logger.error('Failed to upload file to S3/R2', error);
            throw new InternalServerErrorException('Failed to upload file');
        }

        // Save document record
        try {
            return await this.prisma.tenantClient.document.create({
                data: {
                    name: file.originalname,
                    fileKey,
                    fileType: file.mimetype,
                    size: file.size,
                    entityType: category || 'OTHER',
                },
            });
        } catch (error) {
            this.logger.error('Failed to save document record after upload', error);
            throw new InternalServerErrorException('Failed to save document record');
        }
    }

    /**
     * Soft-delete a document by setting deletedAt.
     */
    async softDelete(documentId: string) {
        const document = await this.prisma.tenantClient.document.findFirst({
            where: { id: documentId, deletedAt: null },
        });

        if (!document) throw new NotFoundException('DOCUMENT_NOT_FOUND');

        return this.prisma.tenantClient.document.update({
            where: { id: documentId },
            data: { deletedAt: new Date() },
        });
    }
}
