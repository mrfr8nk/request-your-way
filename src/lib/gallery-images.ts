import heroBg from "@/assets/hero-bg.jpg";
import aboutSchool from "@/assets/about-school.jpg";
import galleryLab from "@/assets/gallery-lab.jpg";
import gallerySports from "@/assets/gallery-sports.jpg";
import galleryScience from "@/assets/gallery-science.jpg";
import galleryAssembly from "@/assets/gallery-assembly.jpg";
import galleryLibrary from "@/assets/gallery-library.jpg";
import headmaster from "@/assets/headmaster.jpg";

const builtins: Record<string, string> = {
  hero: heroBg, about: aboutSchool, lab: galleryLab, sports: gallerySports,
  science: galleryScience, assembly: galleryAssembly, library: galleryLibrary, headmaster,
};

export const resolveGalleryImage = (url: string) =>
  url?.startsWith("builtin:") ? builtins[url.slice(8)] || "" : url;

export const GALLERY_CATEGORIES = ["campus", "academics", "sports", "events"] as const;
