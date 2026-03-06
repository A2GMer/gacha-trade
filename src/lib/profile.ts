export interface DisplayNameProfile {
    display_name?: string | null;
    x_username?: string | null;
    display_name_source?: "manual" | "twitter" | string | null;
}

export function getProfileDisplayName(profile?: DisplayNameProfile | null, fallback = "ユーザー"): string {
    if (!profile) return fallback;
    if (profile.display_name_source === "twitter" && profile.x_username) {
        return `@${profile.x_username}`;
    }
    return profile.display_name || fallback;
}
