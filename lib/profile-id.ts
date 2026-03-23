type ResolveProfileIdParams = {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
};

const DEFAULT_PROFILES_TABLE = "profiles";
const DEFAULT_PROFILES_ID_COLUMN = "id";
const PROFILE_AUTH_USER_ID_CANDIDATES = ["user_id", "auth_user_id", "profile_id"] as const;

async function fetchAuthenticatedUserId(params: ResolveProfileIdParams) {
  const response = await fetch(new URL("/auth/v1/user", params.supabaseUrl), {
    headers: {
      apikey: params.anonKey,
      Authorization: `Bearer ${params.accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as { id?: string };
  return user.id ?? null;
}

async function tryResolveProfileIdByColumn(params: ResolveProfileIdParams & {
  authUserId: string;
  tableName: string;
  profileIdColumn: string;
  lookupColumn: string;
}) {
  const endpoint = new URL(`/rest/v1/${params.tableName}`, params.supabaseUrl);
  endpoint.searchParams.set("select", params.profileIdColumn);
  endpoint.searchParams.set(params.lookupColumn, `eq.${params.authUserId}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      apikey: params.anonKey,
      Authorization: `Bearer ${params.accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const rows = (await response.json()) as Array<Record<string, unknown>>;
  const profileId = rows[0]?.[params.profileIdColumn];
  return profileId ? String(profileId) : null;
}

export async function resolveCurrentProfileId(params: ResolveProfileIdParams) {
  const authUserId = await fetchAuthenticatedUserId(params);

  if (!authUserId) {
    return null;
  }

  const tableName = process.env.PROFILES_TABLE ?? DEFAULT_PROFILES_TABLE;
  const profileIdColumn = process.env.PROFILES_ID_COLUMN ?? DEFAULT_PROFILES_ID_COLUMN;
  const configuredAuthUserColumn = process.env.PROFILES_AUTH_USER_ID_COLUMN;
  const lookupColumns = [
    configuredAuthUserColumn,
    profileIdColumn,
    ...PROFILE_AUTH_USER_ID_CANDIDATES,
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

  for (const lookupColumn of lookupColumns) {
    const profileId = await tryResolveProfileIdByColumn({
      ...params,
      authUserId,
      tableName,
      profileIdColumn,
      lookupColumn,
    });

    if (profileId) {
      return profileId;
    }
  }

  return null;
}
