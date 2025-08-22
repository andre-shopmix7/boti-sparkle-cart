import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useBanners } from "@/hooks/useBanners";
import { ArrowRight } from "lucide-react";

export const PromoBanner = () => {
  const { banners, loading } = useBanners();

  if (loading || banners.length === 0) {
    return null;
  }

  const activeBanner = banners[0]; // Get the first active banner

  return (
    <section 
      className="relative py-20 px-4 overflow-hidden"
      style={{ 
        backgroundColor: activeBanner.background_color,
        color: activeBanner.text_color 
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Background Image */}
      {activeBanner.image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${activeBanner.image_url})` }}
        />
      )}

      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 
            className="text-4xl md:text-6xl font-luxury font-bold mb-6 animate-luxury-fade"
            style={{ color: activeBanner.text_color }}
          >
            {activeBanner.title}
          </h1>
          
          {activeBanner.subtitle && (
            <p 
              className="text-lg md:text-2xl mb-8 font-elegant opacity-90"
              style={{ color: activeBanner.text_color }}
            >
              {activeBanner.subtitle}
            </p>
          )}

          {activeBanner.button_text && activeBanner.button_link && (
            <Link to={activeBanner.button_link}>
              <Button 
                size="lg" 
                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 text-lg px-8 py-4 font-medium shadow-luxury"
              >
                {activeBanner.button_text}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-sm"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/5 blur-md"></div>
      <div className="absolute top-1/2 left-20 w-16 h-16 rounded-full bg-white/10 blur-sm"></div>
    </section>
  );
};