import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import LinkedInToken from '../models/LinkedInToken';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../errors';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:8080/linkedin/auth/callback';

const SCOPES = ['openid', 'profile', 'email'];

// ─── Auth ────────────────────────────────────────────────────

export const getAuthUrl = (req: AuthRequest, res: Response): void => {
  const state = req.user?._id?.toString() || '';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    state,
    scope: SCOPES.join(' '),
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  res.json({ success: true, data: { authUrl } });
};

export const authCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    res.send(`
      <html><body>
        <h1>LinkedIn Connection Failed</h1>
        <p>${oauthError}</p>
        <script>window.close();</script>
      </body></html>
    `);
    return;
  }

  if (!code) throw new BadRequestError('Missing "code" query parameter');

  const userId = state as string;
  if (!userId) throw new BadRequestError('Missing user context in OAuth state');

  // Exchange code for access token
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code as string,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
      redirect_uri: LINKEDIN_REDIRECT_URI,
    }),
  });

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text();
    console.error('LinkedIn token exchange failed:', errBody);
    res.send(`
      <html><body>
        <h1>LinkedIn Connection Failed</h1>
        <p>Could not exchange authorization code.</p>
        <script>window.close();</script>
      </body></html>
    `);
    return;
  }

  const tokenData: any = await tokenResponse.json();

  // Fetch user profile using userinfo endpoint (OpenID Connect)
  let profileData: any = {};
  try {
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }
  } catch (err) {
    console.error('Failed to fetch LinkedIn profile:', err);
  }

  // Upsert token in DB
  await LinkedInToken.findOneAndUpdate(
    { userId },
    {
      userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_in: tokenData.expires_in,
      expiry_date: tokenData.expires_in
        ? Date.now() + tokenData.expires_in * 1000
        : null,
      linkedinId: profileData.sub || null,
      displayName: profileData.name || null,
      avatarUrl: profileData.picture || null,
    },
    { upsert: true, new: true }
  );

  res.send(`
    <html>
      <head><title>LinkedIn Connected</title></head>
      <body>
        <h1>LinkedIn Connected!</h1>
        <p>You can close this window and return to the application.</p>
        <script>window.close();</script>
      </body>
    </html>
  `);
};

export const getAuthStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  const token = await LinkedInToken.findOne({ userId: req.user!._id });

  if (!token) {
    res.json({ success: true, data: { authenticated: false } });
    return;
  }

  // Check if token is expired
  const isExpired = token.expiry_date ? Date.now() > token.expiry_date : false;

  res.json({
    success: true,
    data: {
      authenticated: !isExpired,
      expired: isExpired,
      displayName: token.displayName,
      avatarUrl: token.avatarUrl,
      expiresAt: token.expiry_date,
    },
  });
};

export const disconnect = async (req: AuthRequest, res: Response): Promise<void> => {
  await LinkedInToken.deleteOne({ userId: req.user!._id });
  sendSuccess(res, { message: 'LinkedIn account disconnected' });
};
