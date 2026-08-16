import ImageKit from "imagekit";

let imageKit = null;

function getImageKit() {
    if (imageKit) return imageKit;
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
        throw new Error(
            "ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in your .env file."
        );
    }
    imageKit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
    return imageKit;
}

export async function uploadFile(fileBuffer, filename) {
    const client = getImageKit();
    const response = await client.upload({
        file: fileBuffer,
        fileName: filename,
        folder: "mridacraft-products",
    });
    return response;
}

export async function uploadMultiple(files) {
    const uploads = files.map((file) => uploadFile(file.buffer, `${Date.now()}-${file.originalname}`));
    const results = await Promise.all(uploads);
    return results.map((r) => r.url);
}
