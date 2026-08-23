import { NextRequest } from "next/server";

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? "";

export async function GET(request: NextRequest) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response(
      "Server not configured: GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET missing",
      { status: 500 }
    );
  }
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/drive/callback`;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const err = request.nextUrl.searchParams.get("error");

  const storedState = request.cookies.get("drive_state")?.value;
  const codeVerifier = request.cookies.get("drive_verifier")?.value;

  const msg = (type: string, payload: Record<string, string>) => {
    const data = JSON.stringify({ type, ...payload });
    return `<!DOCTYPE html><html><body><script>
      if(window.opener){window.opener.postMessage(${data},"${origin}");window.close()}
      else{document.body.textContent="Done. You may close this window."}
    <\/script></body></html>`;
  };

  if (err) {
    return new Response(msg("drive_error", { error: err }), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  }

  if (!state || state !== storedState) {
    return new Response("Invalid state", { status: 400 });
  }

  if (!code || !codeVerifier) {
    return new Response("Missing code or verifier", { status: 400 });
  }

  let tokenData: { access_token?: string; error?: string };
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        grant_type: "authorization_code",
      }),
    });
    tokenData = await res.json();
  } catch {
    return new Response("Token exchange failed", { status: 500 });
  }

  if (!tokenData.access_token) {
    return new Response(msg("drive_error", { error: tokenData.error ?? "unknown" }), {
      status: 200,
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  }

  return new Response(msg("drive_token", { token: tokenData.access_token }), {
    status: 200,
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}
