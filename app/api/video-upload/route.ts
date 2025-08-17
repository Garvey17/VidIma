import { NextResponse, NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import {auth} from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

 // Configuration
 cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY , 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

interface CloudinaryUploadResult{
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any; 
}

export async function POST(request: NextRequest){
    const {userId} = await auth()
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

   

    try {

        if(!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json({error: "Cloudinary credentials not found"}, {status: 500})
        }

        const formData = await request.formData()
        const file = formData.get("file") as File | null
        const title = formData.get("title") as string
        const description = formData.get("description") as string
        const originalSize = formData.get("originalSize") as string

        if(!file){
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "video",
              folder: "video-uploads",
              eager: [
                {
                    quality: "auto:eco", // Maximum compression
                    fetch_format: "mp4",
                    bitrate: "500k",     // Lower bitrate = smaller file
                    audio_codec: "aac",  // Efficient audio compression
                    audio_bitrate: "64k" // Lower audio bitrate
                  }
              ],
              eager_async: false // Wait for transformation before resolving
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as CloudinaryUploadResult);
            }
          );
          uploadStream.end(buffer);
        });
        
        // Safely get compressed size from eager transformation, fallback to original if missing
        const compressedBytes = result.eager?.[0]?.bytes ?? result.bytes ?? 0;

        console.log("Bytes:", result.bytes, "Type:", typeof result.bytes);
       const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: Number(originalSize),
                compresedSize: compressedBytes,
                duration: result.duration || 0
            }
       })
       return NextResponse.json(video)
    } catch (error) {
        console.log('Error uploading video:', error);
        return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
        
    }finally{
        await prisma.$disconnect()
    }
}