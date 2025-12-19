
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ModelType, AspectRatio, StoryGenerationResult, VeoModel, VeoAspectRatio, VeoResolution, TitleData, ImageResolution } from "../types";
import { getApiKey, isVaultActivated } from "../utils/keyStorage";

/**
 * AI Client Factory
 * Checks activation status first.
 * Prioritizes: 1. Manually stored key in localStorage 2. Environment API_KEY (selected via AI Studio)
 */
const getAIClient = () => {
  // 활성화 여부 체크
  if (!isVaultActivated()) {
    throw new Error("API_INACTIVE: API가 비활성화 상태입니다. 설정에서 키를 선택해주세요.");
  }

  const manualKey = getApiKey();
  const apiKey = manualKey || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: API 키를 설정하거나 프로젝트를 선택해주세요.");
  }
  return new GoogleGenAI({ apiKey });
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: "ping" }] },
    });
    return true;
  } catch (error) {
    console.error("API Key Validation Failed:", error);
    return false;
  }
};

export const generateStoryStructure = async (
  topic: string,
  referenceImageBase64: string | null,
  sceneCount: number = 10
): Promise<StoryGenerationResult> => {
  const ai = getAIClient();
  const modelId = "gemini-3-pro-preview";

  const sceneSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        description: `Exactly ${sceneCount} narrative scenes.`,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            description: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            i2vPrompt: { type: Type.STRING },
          },
          required: ["sceneNumber", "description", "imagePrompt", "i2vPrompt"],
        },
      },
      titles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
              english: { type: Type.STRING },
              korean: { type: Type.STRING }
          },
          required: ["english", "korean"]
        }
      },
      musicPrompt: { type: Type.STRING },
      lyrics: { type: Type.STRING }
    },
    required: ["scenes", "titles", "musicPrompt", "lyrics"],
  };

  const systemInstruction = `
    당신은 모든 음악을 분석하고 빌보드에 진입할만한 노래의 프롬을 만듭니다.
    당신은 세계적으로 명성이 자자한 음악 프로듀서 이며 현재 유행하며 가능성이 있는 음악과 가사 프롬포트를 생성하는데 최적화 되어 있습니다.

    You are an expert Storyboard AI and a legendary Music Producer.
    Create a compelling story in exactly ${sceneCount} scenes.

    Persona Guidelines:
    1. 'description': Scene summary in Korean.
    2. 'imagePrompt': Visual details in English. Preserve subjects from reference images exactly.
    3. 'i2vPrompt': Technical motion in English. ALWAYS end with: "There is no slow motion, and the scene unfolds quickly."
    4. 'musicPrompt': Generate a detailed billboard-style music prompt in English.
    5. 'lyrics': Full song lyrics with structure [Verse 1], [Chorus], etc.
  `;

  const parts: any[] = [];
  if (referenceImageBase64) {
    const cleanBase64 = referenceImageBase64.split(',')[1] || referenceImageBase64;
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64 } });
  }
  parts.push({ text: `Analyze this topic and create a story+music production: ${topic}` });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: sceneSchema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      const processedScenes = parsed.scenes.map((scene: any) => ({
          ...scene,
          imagePrompt: `Cinematic photo, high detail. ${scene.imagePrompt}`,
          i2vPrompt: scene.i2vPrompt.includes("scene unfolds quickly") 
            ? scene.i2vPrompt 
            : `${scene.i2vPrompt} There is no slow motion, and the scene unfolds quickly.`
      }));

      return {
          scenes: processedScenes,
          titles: parsed.titles || [],
          musicPrompt: parsed.musicPrompt || "",
          lyrics: parsed.lyrics || ""
      };
    }
    throw new Error("Response was empty.");
  } catch (error) {
    console.error("Story Generation Error:", error);
    throw error;
  }
};

export const generateTitles = async (topic: string): Promise<TitleData[]> => {
  const ai = getAIClient();
  const titlesSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      titles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { english: { type: Type.STRING }, korean: { type: Type.STRING } },
          required: ["english", "korean"]
        }
      }
    },
    required: ["titles"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [{ text: `Generate 10 viral YouTube titles for: "${topic}" as JSON.` }] },
      config: { responseMimeType: "application/json", responseSchema: titlesSchema },
    });
    return response.text ? JSON.parse(response.text).titles : [];
  } catch (error) {
    throw error;
  }
};

export const generateSceneImage = async (
  modelType: ModelType,
  prompt: string,
  aspectRatio: AspectRatio,
  resolution: ImageResolution = '1K',
  referenceImageBase64: string | null = null
): Promise<string> => {
  const ai = getAIClient();
  const modelId = modelType === ModelType.NanoBananaPro ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

  const imageConfig: any = { aspectRatio };
  if (modelType === ModelType.NanoBananaPro) imageConfig.imageSize = resolution;

  const parts: any[] = [];
  if (referenceImageBase64) {
      const cleanData = referenceImageBase64.split(',')[1] || referenceImageBase64;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanData } });
  }
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: { imageConfig }
    });

    const partsResponse = response.candidates?.[0]?.content?.parts;
    if (partsResponse) {
      for (const part of partsResponse) {
        if (part.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to produce image.");
  } catch (error) {
    throw error;
  }
};

export const generateVeoVideo = async (
    modelId: VeoModel,
    prompt: string,
    aspectRatio: VeoAspectRatio,
    resolution: VeoResolution,
    referenceImageBase64: string | null
): Promise<string> => {
    if (!isVaultActivated()) {
      throw new Error("API_INACTIVE: API가 비활성화 상태입니다. 설정에서 키를 선택해주세요.");
    }

    const manualKey = getApiKey();
    const apiKey = manualKey || process.env.API_KEY;
    
    if (!apiKey) throw new Error("API key missing. Open Settings to configure.");
    
    const ai = new GoogleGenAI({ apiKey });

    try {
        let operation = await ai.models.generateVideos({
            model: modelId,
            prompt,
            image: referenceImageBase64 ? {
                imageBytes: referenceImageBase64.split(',')[1] || referenceImageBase64,
                mimeType: 'image/jpeg'
            } : undefined,
            config: { numberOfVideos: 1, resolution, aspectRatio }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation });
            if (operation.error) break;
        }

        if (operation.error) throw new Error(operation.error.message || "Operation failed.");

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("No video returned.");

        const sep = videoUri.includes('?') ? '&' : '?';
        const response = await fetch(`${videoUri}${sep}key=${apiKey}`);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error: any) {
        throw error;
    }
};
