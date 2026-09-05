export interface SiteConfig {
  siteName: string;
  tagline: string;
  description: string;
  siteUrl: string;
  contactEmail: string;
  defaultCategory: string;
  maxFileSizeMB: number;
  allowedFileTypes: {
    extension: string;
    mime: string;
    category: string;
    label: string;
  }[];
  brand: {
    logoText: string;
    logoMark: string;
    accentColor: string;
    primaryDark: string;
    secondaryDark: string;
    copyrightYear: number;
    ownerName: string;
  };
}

export const siteConfig: SiteConfig = {
  siteName: "VELORA",
  tagline: "Premium Digital Resources. One Powerful Library.",
  description: "Your premium destination for curated digital resources, high-grade developer toolkits, design templates, and verified files.",
  siteUrl: process.env.APP_URL || "https://velora-digital-archive.netlify.app",
  contactEmail: "concierge@velora.digital",
  defaultCategory: "documents",
  maxFileSizeMB: 50,
  allowedFileTypes: [
    // Documents
    { extension: ".pdf", mime: "application/pdf", category: "documents", label: "PDF Document" },
    { extension: ".doc", mime: "application/msword", category: "documents", label: "Word Document" },
    { extension: ".docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", category: "documents", label: "Word Document (DOCX)" },
    { extension: ".xls", mime: "application/vnd.ms-excel", category: "documents", label: "Excel Spreadsheet" },
    { extension: ".xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", category: "documents", label: "Excel Spreadsheet (XLSX)" },
    { extension: ".ppt", mime: "application/vnd.ms-powerpoint", category: "documents", label: "PowerPoint Presentation" },
    { extension: ".pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", category: "documents", label: "PowerPoint Presentation (PPTX)" },
    { extension: ".txt", mime: "text/plain", category: "documents", label: "Plain Text" },
    { extension: ".csv", mime: "text/csv", category: "documents", label: "CSV Dataset" },
    // Images
    { extension: ".jpg", mime: "image/jpeg", category: "images", label: "JPEG Image" },
    { extension: ".jpeg", mime: "image/jpeg", category: "images", label: "JPEG Image" },
    { extension: ".png", mime: "image/png", category: "images", label: "PNG Graphic" },
    { extension: ".webp", mime: "image/webp", category: "images", label: "WebP Graphic" },
    { extension: ".gif", mime: "image/gif", category: "images", label: "GIF Animation" },
    { extension: ".svg", mime: "image/svg+xml", category: "images", label: "SVG Vector" },
    // Videos
    { extension: ".mp4", mime: "video/mp4", category: "videos", label: "MP4 Video" },
    { extension: ".webm", mime: "video/webm", category: "videos", label: "WebM Video" },
    // Audio
    { extension: ".mp3", mime: "audio/mpeg", category: "audio", label: "MP3 Audio" },
    { extension: ".wav", mime: "audio/wav", category: "audio", label: "WAV Audio" },
    // Archives
    { extension: ".zip", mime: "application/zip", category: "archives", label: "ZIP Archive" },
    { extension: ".rar", mime: "application/x-rar-compressed", category: "archives", label: "RAR Archive" },
    { extension: ".7z", mime: "application/x-7z-compressed", category: "archives", label: "7-Zip Archive" },
    // Templates & Code
    { extension: ".json", mime: "application/json", category: "templates", label: "JSON Schema/Preset" },
    { extension: ".md", mime: "text/markdown", category: "documents", label: "Markdown Guide" }
  ],
  brand: {
    logoText: "VELORA",
    logoMark: "V",
    accentColor: "#d4af37",
    primaryDark: "#08080a",
    secondaryDark: "#121216",
    copyrightYear: 2026,
    ownerName: "VELORA Core Administration"
  }
};
