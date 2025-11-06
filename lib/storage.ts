import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'memoire-dame';

/**
 * Initialize MinIO bucket if it doesn't exist
 */
export async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✓ Created bucket: ${BUCKET_NAME}`);

      // Set bucket policy to allow public read for certain paths
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/public/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
    throw error;
  }
}

/**
 * Upload a file to MinIO
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: 'audio' | 'media' | 'pdf' | 'public' = 'media'
): Promise<string> {
  const objectName = `${folder}/${Date.now()}-${fileName}`;

  await minioClient.putObject(BUCKET_NAME, objectName, file, {
    'Content-Type': contentType,
  });

  // Generate URL
  const url = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${objectName}`;
  return url;
}

/**
 * Get a presigned URL for temporary access to a private file
 */
export async function getPresignedUrl(
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  return await minioClient.presignedGetObject(
    BUCKET_NAME,
    objectName,
    expirySeconds
  );
}

/**
 * Delete a file from MinIO
 */
export async function deleteFile(objectName: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, objectName);
}

/**
 * Extract object name from full URL
 */
export function getObjectNameFromUrl(url: string): string {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  // Remove bucket name and return the rest
  return pathParts.slice(2).join('/');
}

export { minioClient, BUCKET_NAME };
