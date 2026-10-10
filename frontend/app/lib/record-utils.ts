export type RecordValue = Record<string, unknown>;

export function asRecord(value: unknown): RecordValue {
  return typeof value === "object" && value !== null ? (value as RecordValue) : {};
}

export function text(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function dateText(value: unknown) {
  if (!value) return "Time not set";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Time not set" : date.toLocaleString();
}

export function personName(value: unknown, fallback = "—") {
  const person = asRecord(value);
  return text(
    person.name ??
      person.fullName ??
      [person.firstName, person.lastName].filter(Boolean).join(" "),
    fallback,
  );
}
