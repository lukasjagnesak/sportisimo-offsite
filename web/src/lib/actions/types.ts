/** Jednotný návratový tvar server actions napojených na useActionState. */
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const idle: ActionState = {};

/** Převede FormData na objekt; pole se stejným názvem sloučí do arraye. */
export function formToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.endsWith("[]")) {
      const name = key.slice(0, -2);
      out[name] = [...((out[name] as unknown[]) ?? []), value];
      continue;
    }
    if (key in out) {
      out[key] = [...(Array.isArray(out[key]) ? (out[key] as unknown[]) : [out[key]]), value];
      continue;
    }
    out[key] = value === "" ? undefined : value;
  }
  return out;
}
