// services/video.service.ts

import fs from "fs";
import path from "path";
import Video from "../models/Video";
import {NotFoundError} from "../errors/NotFoundError";

export const deleteVideoService = async (
    videoId: string,
    userId: string
): Promise<void> => {
    const record = await Video.findOne({
        _id: videoId,
        userId,
    });

    if (!record) {
        throw new NotFoundError("Video not found");
    }

    if (record.videoPath) {
        const absPath = path.join(
            __dirname,
            "../..",
            record.videoPath
        );

        if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
        }
    }

    await Video.deleteOne({
        _id: record._id,
    });
};