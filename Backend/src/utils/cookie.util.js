/**
 * Returns standardised cookie options for the accessToken cookie.
 * Adjusts secure/sameSite flags automatically for dev vs production.
 */
export function getAccessCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,                       // JS cannot read the cookie (XSS protection)
    secure: isProd,                       // HTTPS only in production
    sameSite: isProd ? "none" : "lax",    // cross-site in prod, strict in dev
    path: "/",                            // cookie valid for all routes
    maxAge: 7 * 24 * 60 * 60 * 1000,     // 7 days in ms
  };
}

/**
 * Returns cookie clear options that match getAccessCookieOptions so the
 * browser actually removes the cookie on logout.
 */
export function getClearCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
}
