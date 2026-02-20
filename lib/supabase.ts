export type SupabaseRow = Record<string, unknown>;

const DEFAULT_TABLE = "images";
const DEFAULT_SELECT = "*";
const DEFAULT_LIMIT = 20;

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function fetchSupabaseRows(): Promise<{
  rows: SupabaseRow[];
  tableName: string;
}> {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const tableName = process.env.SUPABASE_TABLE ?? DEFAULT_TABLE;
  const select = process.env.SUPABASE_SELECT ?? DEFAULT_SELECT;
  const limit = Number(process.env.SUPABASE_LIMIT ?? DEFAULT_LIMIT);

  const endpoint = new URL(`/rest/v1/${tableName}`, supabaseUrl);
  endpoint.searchParams.set("select", select);
  endpoint.searchParams.set(
    "limit",
    String(Number.isNaN(limit) ? DEFAULT_LIMIT : limit),
  );

  const response = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase query failed (${response.status}): ${details}. Set SUPABASE_TABLE to an existing table (for example: images or communities).`);
  }

  const rows = (await response.json()) as SupabaseRow[];

  return {
    rows,
    tableName,
  };
}
