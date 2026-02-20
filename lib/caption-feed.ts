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
const DEFAULT_IMAGES_ID_COLUMN = "uuid";
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
  const captionImageUrlColumn =
    process.env.CAPTIONS_IMAGE_URL_COLUMN ?? DEFAULT_CAPTION_IMAGE_URL_COLUMN;
  const imagesTable = process.env.IMAGES_TABLE ?? DEFAULT_IMAGES_TABLE;
  const imagesIdColumn = process.env.IMAGES_ID_COLUMN ?? DEFAULT_IMAGES_ID_COLUMN;
  const imageUrlColumn = process.env.IMAGES_URL_COLUMN ?? DEFAULT_IMAGE_URL_COLUMN;
  const limit = Number(process.env.CAPTIONS_LIMIT ?? DEFAULT_LIMIT);

  const captionsEndpoint = new URL(`/rest/v1/${captionsTable}`, supabaseUrl);
  captionsEndpoint.searchParams.set(
    "select",
    `${captionIdColumn},${captionTextColumn},${captionImageIdColumn}`,
  );
  captionsEndpoint.searchParams.set(
    "limit",
    String(Number.isNaN(limit) ? DEFAULT_LIMIT : limit),
  );
  captionsEndpoint.searchParams.set(captionPublicColumn, "eq.true");

  const imagesEndpoint = new URL(`/rest/v1/${imagesTable}`, supabaseUrl);
  imagesEndpoint.searchParams.set("select", `${imagesIdColumn},${imageUrlColumn}`);
  imagesEndpoint.searchParams.set(
    "limit",
    String(Number.isNaN(limit) ? DEFAULT_LIMIT : limit),
  );

  const [captions, images] = await Promise.all([
    fetchJson(captionsEndpoint, anonKey),
    fetchJson(imagesEndpoint, anonKey).catch(() => []),
  ]);

  const imageById = new Map<string, string>();
  for (const row of images) {
    const id = row[imagesIdColumn];
    const imageUrl = row[imageUrlColumn];

    if (id !== undefined && imageUrl !== undefined && imageUrl !== null) {
      imageById.set(String(id), String(imageUrl));
    }
  }

  return captions
    .map((row) => {
      const idRaw = row[captionIdColumn];
      const textRaw = row[captionTextColumn];

      if (idRaw === undefined || textRaw === undefined || textRaw === null) {
        return null;
      }

      const directImageUrl = row[captionImageUrlColumn];
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
