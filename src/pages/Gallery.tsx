import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBg from "@/assets/hero-bg.jpg";
import aboutSchool from "@/assets/about-school.jpg";
import galleryLab from "@/assets/gallery-lab.jpg";
import gallerySports from "@/assets/gallery-sports.jpg";
import galleryScience from "@/assets/gallery-science.jpg";
import galleryAssembly from "@/assets/gallery-assembly.jpg";
import galleryLibrary from "@/assets/gallery-library.jpg";
import headmaster from "@/assets/headmaster.jpg";

type GalleryCategory = "all" | "campus" | "academics" | "sports" | "events";

const galleryItems = [
  { img: heroBg, title: "School Campus", desc: "Aerial view of our beautiful campus", category: "campus" as GalleryCategory },
  { img: aboutSchool, title: "Classroom Learning", desc: "Students engaged in interactive learning", category: "academics" as GalleryCategory },
  { img: galleryLab, title: "Computer Lab", desc: "Students in our modern IT laboratory", category: "academics" as GalleryCategory },
  { img: galleryScience, title: "Science Lab", desc: "Hands-on experiments in chemistry", category: "academics" as GalleryCategory },
  { img: gallerySports, title: "Sports Day", desc: "Students competing on the sports field", category: "sports" as GalleryCategory },
  { img: galleryAssembly, title: "School Assembly", desc: "Students during awards ceremony", category: "events" as GalleryCategory },
  { img: galleryLibrary, title: "School Library", desc: "Students studying in the library", category: "academics" as GalleryCategory },
  { img: headmaster, title: "Leadership", desc: "Our dedicated school leadership", category: "events" as GalleryCategory },
];

const categories: { label: string; value: GalleryCategory }[] = [
  { label: "All Photos", value: "all" },
  { label: "Campus", value: "campus" },
  { label: "Academics", value: "academics" },
  { label: "Sports", value: "sports" },
  { label: "Events", value: "events" },
];

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("all");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = activeCategory === "all"
    ? galleryItems
    : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative pt-20">
        <div className="h-64 md:h-80 relative overflow-hidden">
          <img src={heroBg} alt="Campus" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-2">School Gallery</h1>
              <p className="font-body text-primary-foreground/70 text-lg">Explore our school life through images</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-5 py-2.5 rounded-xl font-body font-semibold transition-all duration-300 ${
                  activeCategory === cat.value
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-foreground border border-border hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <div
                key={item.title + i}
                className="relative group rounded-xl overflow-hidden h-64 cursor-pointer"
                onClick={() => setLightbox(item.img)}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <h3 className="font-display text-lg font-bold text-primary-foreground translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    {item.title}
                  </h3>
                  <p className="font-body text-primary-foreground/80 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Gallery"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground text-2xl hover:bg-destructive transition-colors"
          >
            ×
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
