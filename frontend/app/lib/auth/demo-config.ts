export const DEMO_EMAIL = "demo@example.com";
export const DEMO_PASSWORD = "Demo@123";

export const DEMO_USER = {
  email: DEMO_EMAIL,
  name: "Jordan Davis",
  role: "admin" as const,
};

export function isDemoCredentials(email: string, password: string) {
  return (
    email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() &&
    password === DEMO_PASSWORD
  );
}
