export function getSeedAdminCredentials() {
  return {
    email: (process.env.SEED_ADMIN_EMAIL ?? 'lee@york-construction.ca').trim().toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD ?? 'York2026!',
  };
}
