import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config';

function getClient(): S3Client {
  if (!env.r2.enabled) {
    throw new Error('Image storage is not configured');
  }

  return new S3Client({
    region: env.r2.region,
    endpoint: env.r2.url,
    credentials: {
      accessKeyId: env.r2.accessKeyId!,
      secretAccessKey: env.r2.secretAccessKey!,
    },
  });
}

export function publicUrlForKey(key: string): string {
  const domain = env.r2.domain.replace(/\/$/, '');
  return `${domain}/${key}`;
}

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return publicUrlForKey(key);
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
    })
  );
}
