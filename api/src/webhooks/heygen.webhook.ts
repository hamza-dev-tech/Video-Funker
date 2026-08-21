import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import Video from '../models/Video';
import { sendSuccess } from '../utils/response';
import { getHeygenVideoByIdService } from '../controllers/heygen.controller';
import { verifyHeygenSignature } from '../utils/heygenSignature';
import { refundVideoUsage } from '../services/usage.service';

/** Pull a human-readable reason out of whatever shape HeyGen sent. */
const readFailureReason = (eventData: any): string => {
    const candidates = [
        eventData?.msg,
        eventData?.message,
        eventData?.error,
        eventData?.error?.message,
        eventData?.reason,
        eventData?.detail,
    ];
    for (const c of candidates) {
        if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return 'HeyGen did not say why this render failed.';
};

const router = Router();





router.get('/', (_req: Request, res: Response) => {
    res.json({
        ok: true,
        endpoint: 'heygen-webhook',
    });
});

router.post('/', async (req: Request, res: Response) => {
    /*
      Prove the sender before touching anything. This endpoint writes to video
      records that customers have paid for, and it used to accept any request
      from anyone.

      401 rather than 400: a rejected callback is an authentication failure, and
      HeyGen retries on it, so a secret rotated mid-flight recovers by itself.
    */
    const signature = verifyHeygenSignature(req);
    if (!signature.ok) {
        console.error('heygen webhook rejected:', signature.reason);
        res.status(401).json({ ok: false, error: 'Invalid signature' });
        return;
    }

    try {
        const payload = req.body;

        const { event_type, event_data } = payload;

        switch (event_type) {
            case 'video_agent.success': {
                const videoDocId = event_data?.callback_id;

                if (
                    !videoDocId ||
                    !mongoose.Types.ObjectId.isValid(videoDocId)
                ) {
                    console.error(
                        'video_agent.success: invalid callback_id',
                        videoDocId
                    );
                    break;
                }

                try {
                    const heygenVideo = await getHeygenVideoByIdService(
                        event_data.video_id
                    );

                    const resolvedUrl =
                        heygenVideo?.video_url || event_data?.url || '';

                    /*
                      Never write "completed" without a link.

                      If the follow-up fetch came back without a URL the record
                      was still marked completed, which produced a dead card:
                      a green "Ready" badge, a grey "Preview unavailable" panel,
                      no View, no Download — and no Sync either, because Sync is
                      hidden once a video is completed. The credit was spent,
                      HeyGen had genuinely finished, and the only action left was
                      Delete. Staying in 'generating' keeps Sync available so the
                      customer can recover the video they paid for.
                    */
                    const updatePayload: any = {
                        status: resolvedUrl ? 'completed' : 'generating',

                        videoId:
                            heygenVideo?.id ||
                            event_data?.video_id,

                        videoUrl: resolvedUrl || null,

                        thumbnailUrl:
                            heygenVideo?.thumbnail_url || '',
                        duration:
                            heygenVideo?.duration || null,

                        title: heygenVideo?.title || '',
                        heygenRaw: {
                            webhook: payload,
                            sync: heygenVideo,
                        },
                    };

                    const updatedVideo =
                        await Video.findByIdAndUpdate(
                            videoDocId,
                            updatePayload,
                            { new: true }
                        );

                    if (!updatedVideo) {
                        console.error(
                            `video_agent.success: video not found ${videoDocId}`
                        );
                    } else if (!resolvedUrl) {
                        console.error(
                            `video_agent.success: HeyGen reported success for ${videoDocId} but returned no video URL — left generating so Sync can recover it`
                        );
                    }
                } catch (error) {
                    console.error(
                        'Failed to sync completed HeyGen video',
                        error
                    );

                    /*
                      Same rule on the fallback path. A failed lookup with no
                      URL in the callback either must not be recorded as a
                      finished video the customer can never open.
                    */
                    await Video.findByIdAndUpdate(
                        videoDocId,
                        {
                            status: event_data?.url ? 'completed' : 'generating',
                            videoId: event_data?.video_id,
                            videoUrl: event_data?.url || null,
                            heygenRaw: payload,
                        }
                    );
                }

                break;
            }

            case 'video_agent.fail': {
                const videoDocId = event_data?.callback_id;

                if (
                    !videoDocId ||
                    !mongoose.Types.ObjectId.isValid(videoDocId)
                ) {
                    console.error(
                        'video_agent.fail: invalid callback_id',
                        videoDocId
                    );
                    break;
                }

                const updatedVideo =
                    await Video.findByIdAndUpdate(
                        videoDocId,
                        {
                            status: 'failed',
                            // Both of these now exist on the schema. They did
                            // not, so every diagnostic was silently discarded.
                            failureReason: readFailureReason(event_data),
                            heygenRaw: payload,
                        },
                        {
                            new: true,
                        }
                    );

                if (!updatedVideo) {
                    console.error(
                        `video_agent.fail: video not found ${videoDocId}`
                    );
                    break;
                }

                /*
                  Give the credit back. It was taken when HeyGen ACCEPTED the
                  job, not when it delivered one, and counters were never
                  reduced — so on the free plan two upstream failures could
                  swallow a customer's whole allowance with nothing to show.
                */
                await refundVideoUsage(
                    String(updatedVideo.userId),
                    String(updatedVideo.campaignId)
                );

                break;
            }

            default:
                console.log(
                    `Unhandled HeyGen webhook event: ${event_type}`
                );
        }

        sendSuccess(res, {
            received: true,
        });
    } catch (error) {
        console.error('HeyGen webhook error:', error);

        res.status(500).json({
            success: false,
            message: 'Webhook processing failed',
        });
    }
});

export default router;



