import { NextResponse } from "next/server";
import crypto from "crypto";

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID ?? "";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

export async function GET(request: Request) {
  if (!CLIENT_ID) {
    return new Response(
      "Server not configured: GOOGLE_DRIVE_CLIENT_ID missing",
      { status: 500 }
    );
  }

  const url = new URL(request.url)
  const redirectUri = `${url.origin}/api/drive/callback`;
  const isSecure = url.protocol === 'https:'

  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    access_type: "offline",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );

  response.cookies.set("drive_verifier", codeVerifier, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  response.cookies.set("drive_state", state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  return response;
}
