export async function uploadFileToStorage(bucket: any, filePath: string, destination: string) {
    await bucket.upload(filePath, {
      destination,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    console.log(`${filePath} uploaded to ${destination}`);
    return `gs://${bucket.name}/${destination}`;
  }
