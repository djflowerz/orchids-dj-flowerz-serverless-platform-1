import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!
    }
});

export async function generateSignedDownload(key: string) {
    const command = new GetObjectCommand({
        Bucket: "music-packs",
        Key: key
    });

    return getSignedUrl(r2, command, { expiresIn: 300 }); // 5 minutes
}

export async function uploadToR2(file: Buffer, key: string, contentType: string) {
    const command = new PutObjectCommand({
        Bucket: "music-packs",
        Key: key,
        Body: file,
        ContentType: contentType
    });

    await r2.send(command);
    return key;
}
