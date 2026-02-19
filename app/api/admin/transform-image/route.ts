import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { existsSync } from "fs";
import { GoogleGenAI } from "@google/genai";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

const DEFAULT_PROMPT =
  "Edita esta foto de producto para e-commerce. Mantén intacto el producto principal (misma forma, proporciones, textura, color base, logotipo y detalles de marca). Solo mejora elementos secundarios: iluminación, sombras suaves, fondo limpio/neutral, reflejos controlados y nitidez general. No cambies el diseño del producto, no agregues ni quites partes, no cambies el encuadre principal. Entrega una imagen realista y comercial lista para catálogo.";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY no está configurada en el servidor" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const prompt = (formData.get("prompt") as string) || DEFAULT_PROMPT;

    if (!image) {
      return NextResponse.json(
        { error: "No se proporcionó ninguna imagen" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Convert image to base64
    const imageBytes = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBytes).toString("base64");

    // Call Gemini API
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: image.type,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract the generated image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: "Gemini no generó una respuesta válida" },
        { status: 502 }
      );
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "Respuesta de Gemini sin contenido" },
        { status: 502 }
      );
    }

    // Find the image part in the response
    const imagePart = parts.find(
      (part) => part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData) {
      return NextResponse.json(
        { error: "Gemini no devolvió una imagen transformada" },
        { status: 502 }
      );
    }

    // Save the transformed image as PNG
    const transformedBuffer = Buffer.from(imagePart.inlineData.data!, "base64");
    const randomName = randomBytes(16).toString("hex");
    const filename = `${randomName}.png`;

    const productsDir = path.join(process.cwd(), "public", "products");
    if (!existsSync(productsDir)) {
      await mkdir(productsDir, { recursive: true });
    }

    const filepath = path.join(productsDir, filename);
    await writeFile(filepath, transformedBuffer);

    const publicPath = `/products/${filename}`;

    return NextResponse.json({
      success: true,
      path: publicPath,
      filename,
      appliedPrompt: prompt,
    });
  } catch (error) {
    console.error("Error transforming image:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al transformar la imagen con IA", details: errorMessage },
      { status: 500 }
    );
  }
}
