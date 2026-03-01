export type CaptionCard = {
  id: string;
  text: string;
  imageUrl: string | null;
};

const DEFAULT_CAPTIONS_TABLE = "captions";
const DEFAULT_CAPTION_ID_COLUMN = "id";
const DEFAULT_CAPTION_TEXT_COLUMN = "content";
const DEFAULT_CAPTION_PUBLIC_COLUMN = "is_public";
const DEFAULT_CAPTION_IMAGE_ID_COLUMN = "image_id";
const DEFAULT_CAPTION_IMAGE_URL_COLUMN = "image_url";
const DEFAULT_IMAGES_TABLE = "images";
const DEFAULT_IMAGES_ID_COLUMN = "id";
const DEFAULT_IMAGE_URL_COLUMN = "url";
const DEFAULT_LIMIT = 25;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function fetchJson(endpoint: URL, anonKey: string) {
  const response = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase read failed (${response.status}): ${details}`);
  }

  return (await response.json()) as Array<Record<string, unknown>>;
}

export async function fetchCaptionCards(): Promise<CaptionCard[]> {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const captionsTable = process.env.CAPTIONS_TABLE ?? DEFAULT_CAPTIONS_TABLE;
  const captionIdColumn = process.env.CAPTIONS_ID_COLUMN ?? DEFAULT_CAPTION_ID_COLUMN;
  const captionTextColumn = process.env.CAPTIONS_TEXT_COLUMN ?? DEFAULT_CAPTION_TEXT_COLUMN;
  const captionPublicColumn =
    process.env.CAPTIONS_PUBLIC_COLUMN ?? DEFAULT_CAPTION_PUBLIC_COLUMN;
  const captionImageIdColumn =
    process.env.CAPTIONS_IMAGE_ID_COLUMN ?? DEFAULT_CAPTION_IMAGE_ID_COLUMN;
  
  // 1. Safe Image URL Column setup
  const captionImageUrlColumn = process.env.CAPTIONS_IMAGE_URL_COLUMN;

  const imagesTable = process.env.IMAGES_TABLE ?? DEFAULT_IMAGES_TABLE;
  const imagesIdColumn = process.env.IMAGES_ID_COLUMN ?? DEFAULT_IMAGES_ID_COLUMN;
  const imageUrlColumn = process.env.IMAGES_URL_COLUMN ?? DEFAULT_IMAGE_URL_COLUMN;
  const limit = Number(process.env.CAPTIONS_LIMIT ?? DEFAULT_LIMIT);

  // 2. We only declare the endpoint ONCE
  const captionsEndpoint = new URL(`/rest/v1/${captionsTable}`, supabaseUrl);
  
  // 3. We safely build the select statement
  const selectColumns = [captionIdColumn, captionTextColumn, captionImageIdColumn];
  if (captionImageUrlColumn) {
    selectColumns.push(captionImageUrlColumn);
  }

  captionsEndpoint.searchParams.set("select", selectColumns.join(","));
  captionsEndpoint.searchParams.set(
    "limit",
    String(Number.isNaN(limit) ? DEFAULT_LIMIT : limit),
  );
  captionsEndpoint.searchParams.set(captionPublicColumn, "eq.true");

  const captions = await fetchJson(captionsEndpoint, anonKey);

  const imageIds = Array.from(
    new Set(
      captions
        .map((row) => row[captionImageIdColumn])
        .filter((value): value is string | number => value !== undefined && value !== null)
        .map((value) => String(value)),
    ),
  );

  const imageById = new Map<string, string>();

  if (imageIds.length > 0) {
    const imagesEndpoint = new URL(`/rest/v1/${imagesTable}`, supabaseUrl);
    imagesEndpoint.searchParams.set("select", `${imagesIdColumn},${imageUrlColumn}`);
    imagesEndpoint.searchParams.set(imagesIdColumn, `in.(${imageIds.map(encodeURIComponent).join(",")})`);

    const images = await fetchJson(imagesEndpoint, anonKey).catch(() => []);

    for (const row of images) {
      const id = row[imagesIdColumn] ?? row.id ?? row.uuid;
      const imageUrl = row[imageUrlColumn] ?? row.url ?? row.image_url;

      if (id !== undefined && imageUrl !== undefined && imageUrl !== null) {
        imageById.set(String(id), String(imageUrl));
      }
    }
  }

  return captions
    .map((row) => {
      const idRaw = row[captionIdColumn];
      const textRaw = row[captionTextColumn];

      if (idRaw === undefined || textRaw === undefined || textRaw === null) {
        return null;
      }

      // Safely check for direct image URL if the column exists
      const directImageUrl = captionImageUrlColumn ? row[captionImageUrlColumn] : undefined;
      const imageId = row[captionImageIdColumn];

      const imageUrl =
        directImageUrl !== undefined && directImageUrl !== null
          ? String(directImageUrl)
          : imageId !== undefined && imageId !== null
            ? imageById.get(String(imageId)) ?? null
            : null;

      return {
        id: String(idRaw),
        text: String(textRaw),
        imageUrl,
      } satisfies CaptionCard;
    })
    .filter((row): row is CaptionCard => row !== null);
}
