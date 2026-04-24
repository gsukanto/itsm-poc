import { Injectable, Logger } from '@nestjs/common';
import { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } from '@azure/storage-blob';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AttachmentsService {
  private readonly log = new Logger(AttachmentsService.name);
  private blobClient?: BlobServiceClient;
  private container = process.env.AZURE_STORAGE_CONTAINER ?? 'attachments';

  constructor(private prisma: PrismaService) {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (conn) {
      this.blobClient = BlobServiceClient.fromConnectionString(conn);
      this.ensureContainer().catch((e) => this.log.warn(`container init failed: ${e.message}`));
    }
  }

  private async ensureContainer() {
    if (!this.blobClient) return;
    const c = this.blobClient.getContainerClient(this.container);
    await c.createIfNotExists();
  }

  async createUploadUrl(entityType: string, entityId: string, fileName: string, contentType: string, sizeBytes: number, uploadedById?: string) {
    const blobPath = `${entityType}/${entityId}/${uuid()}-${fileName}`;
    const att = await this.prisma.attachment.create({
      data: { entityType, entityId, fileName, contentType, sizeBytes, blobPath, uploadedById },
    });
    let uploadUrl: string | null = null;
    if (this.blobClient) {
      const c = this.blobClient.getContainerClient(this.container);
      const b = c.getBlockBlobClient(blobPath);
      uploadUrl = await this.signedUrl(b.url, blobPath, 'cw', 30);
    }
    return { attachment: att, uploadUrl };
  }

  async createDownloadUrl(id: string) {
    const att = await this.prisma.attachment.findUniqueOrThrow({ where: { id } });
    if (!this.blobClient) return { attachment: att, downloadUrl: null };
    const c = this.blobClient.getContainerClient(this.container);
    const b = c.getBlockBlobClient(att.blobPath);
    const url = await this.signedUrl(b.url, att.blobPath, 'r', 15);
    return { attachment: att, downloadUrl: url };
  }

  private async signedUrl(baseUrl: string, blobPath: string, permissions: string, minutes: number): Promise<string> {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const accountName = /AccountName=([^;]+)/.exec(conn)?.[1];
    const accountKey = /AccountKey=([^;]+)/.exec(conn)?.[1];
    if (!accountName || !accountKey) return baseUrl;
    const cred = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(Date.now() + minutes * 60_000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.container,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse(permissions),
        expiresOn,
      },
      cred,
    ).toString();
    return `${baseUrl}?${sas}`;
  }

  list(entityType: string, entityId: string) {
    return this.prisma.attachment.findMany({ where: { entityType, entityId } });
  }

  async delete(id: string) {
    const att = await this.prisma.attachment.findUniqueOrThrow({ where: { id } });
    if (this.blobClient) {
      try {
        await this.blobClient.getContainerClient(this.container).deleteBlob(att.blobPath);
      } catch (e: any) {
        this.log.warn(`blob delete failed: ${e.message}`);
      }
    }
    await this.prisma.attachment.delete({ where: { id } });
  }
}
