import { NextRequest, NextResponse } from "next/server";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";

const cloud_name = process.env.NEXT_CLOUDINARY_CLOUDNAME;
const api_key = process.env.NEXT_CLOUDINARY_API_KEY;
const api_secret = process.env.NEXT_CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true,
});

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const image = data.get("file") as File;
    const allowed = (data.get("allowed") as string).split("|");
    const max_size = Number(data.get("max_size") ?? "2000000");

    if (!image) {
      return NextResponse.json(
        { error: "NO_IMAGE", message: "UploadErrors.NO_IMAGE" },
        { status: 400 }
      );
    }

    const mymeType = image.type.split("/");
    if (mymeType[0] !== "image" || !allowed.includes(mymeType[1])) {
      return NextResponse.json(
        { error: "INVALID_TYPE", message: "UploadErrors.INVALID_TYPE" },
        { status: 400 }
      );
    }

    if (image.size > max_size) {
      return NextResponse.json(
        { error: "INVALID_SIZE", message: "UploadErrors.INVALID_SIZE" },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const response = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          format: "webp",
          transformation: {
            format: "webp",
            quality: "auto",
          },
        },
        (err, res) => {
          console.error("[uploader error] ", err);
          if (err) reject(err);

          resolve(res!);
        }
      );

      stream.write(buffer);
      stream.end();
    });

    return NextResponse.json({
      message: "File successfully uploaded",
      url: response.secure_url,
      id: response.public_id,
    });
  } catch (error) {
    console.error("[UPLOAD ERROR]", error);
    return NextResponse.json(
      {
        message: "Something went wrong",
        url: "",
        id: "",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const publicId = request.nextUrl.searchParams.get("id");

  if (!publicId) {
    return NextResponse.json(
      { error: "INVALID_ID", message: "UploadErrors.INVALID_ID" },
      { status: 400 }
    );
  }

  try {
    await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (err, res) => {
        if (err) reject(err);

        resolve(res!);
      });
    });

    return NextResponse.json({
      message: "File successfully deleted",
    });
  } catch (error) {
    return NextResponse.json('{ error: "DELETE_FAILED" }', { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const publicUrl = request.nextUrl.searchParams.get("url");

  if (!publicUrl) {
    return NextResponse.json(
      { error: "INVALID_ID", message: "UploadErrors.INVALID_ID" },
      { status: 400 }
    );
  }

  const publicId = publicUrl.split("/").at(-1)?.split(".")[0];
  if (!publicId) {
    return NextResponse.json(
      { error: "INVALID_ID", message: "UploadErrors.INVALID_ID" },
      { status: 400 }
    );
  }

  try {
    const response = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.api.resource(publicId, undefined, (err, res) => {
        if (err) reject(err);

        resolve(res);
      });
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json('{ error: "DELETE_FAILED" }', { status: 400 });
  }
}
