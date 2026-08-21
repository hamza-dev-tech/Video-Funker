import { AppError } from '../errors';
import CustomAvatar from '../models/CustomAvatar';


/**
 * Isolated image-based avatar creation flow.
 * Uploads the image to HeyGen, creates a photo avatar from it,
 * and persists a CustomAvatar record.
 *
 * This is intentionally kept separate from the prompt-based flow
 * (`createHeygenAvatar`) and must not be merged with it.
 */
interface CreateAvatarFromImageParams {
  name: string;
  fileBuffer: Buffer;
  mimeType: string;
}

export const createAvatarFromImageService = async ({
  name,
  fileBuffer,
  mimeType,
}: CreateAvatarFromImageParams) => {
  const apiKey = process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new AppError(
      'HEYGEN_API_KEY is not configured on the server',
      500
    );
  }

  const base64Image = fileBuffer.toString('base64');

  const response = await fetch(
    'https://api.heygen.com/v3/avatars',
    {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        type: 'photo',
        name,
        file: {
          type: 'base64',
          data: base64Image,
          media_type: mimeType,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new AppError(
      `HeyGen avatar creation failed [${response.status}]: ${errorText}`,
      502
    );
  }

  const result: any = await response.json();

  return result


};
