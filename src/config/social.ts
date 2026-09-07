/**
 * VELORA DIGITAL ARCHIVE - SOCIAL CONFIGURATION
 * 
 * Single configurable constant for the official Instagram profile.
 * Update this URL or username here whenever required.
 */

export const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/aman_ansari__09/";
export const INSTAGRAM_USERNAME = "@aman_ansari__09";

export const SOCIAL_CONFIG = {
  instagram: {
    username: INSTAGRAM_USERNAME,
    url: INSTAGRAM_PROFILE_URL,
    displayName: "Aman Ansari",
    title: "Follow Me on Instagram",
    buttonText: "VISIT INSTAGRAM →",
    tagline: "Direct updates, archival previews, and exclusive engineering dispatches.",
  },
} as const;
