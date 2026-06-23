import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import HeadmasterSection from "@/components/HeadmasterSection";
import AcademicsSection from "@/components/AcademicsSection";
import GallerySection from "@/components/GallerySection";
import NewsSection from "@/components/NewsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ScrollProgress from "@/components/ScrollProgress";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      navigate(`/${role}`, { replace: true });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="relative min-h-screen bg-frosted-mesh overflow-x-hidden">
      {/* Ambient floating orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="orb orb-gold w-[420px] h-[420px] -top-32 -left-24" />
        <div className="orb orb-navy w-[520px] h-[520px] top-1/3 -right-32 animate-float-slow" />
        <div className="orb orb-sky w-[380px] h-[380px] bottom-0 left-1/4" style={{ animationDelay: "-6s" }} />
      </div>

      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <HeadmasterSection />
      <AcademicsSection />
      <GallerySection />
      <NewsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
