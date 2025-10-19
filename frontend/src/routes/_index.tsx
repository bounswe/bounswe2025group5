import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext,
  type CarouselApi
} from "@/components/ui/carousel";
import Welcome from "@/components/homepage/welcome";
import Motivation from "@/components/homepage/motivation";
import GlassCard from "@/components/ui/glass-card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pages = [Welcome, Motivation];
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  const [api, setApi] = useState<CarouselApi>();

  // Auto-cycle functionality
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      const canScrollNext = api.canScrollNext();
      if (canScrollNext) {
        api.scrollNext();
      } else {
        // Loop back to the first slide
        api.scrollTo(0);
      }
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    if (isAuthed) {
      navigate("/mainpage");
    }
  }, [isAuthed, navigate]);
  return (
    
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="flex flex-col">
      {/* Carousel content - takes up available space */}
      <div className="flex-grow">
        <Carousel 
          className="w-full max-w-lg mx-auto"
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
        >
          <CarouselContent>
            {pages.map((PageComponent, index) => (
              <CarouselItem key={index}>
                <PageComponent />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-white/80 hover:bg-white text-emerald-800 border-white/20" />
          <CarouselNext className="bg-white/80 hover:bg-white text-emerald-800 border-white/20" />
        </Carousel>
      </div>

      {/* Buttons at the bottom */}
      <div className="flex gap-4 justify-center mt-6 pt-4 border-t border-white/20">
        <Button 
          onClick={() => navigate('/auth/login')}
          variant="default"
        >
          {t('login.login')}
        </Button>
        <Button 
          onClick={() => navigate('/auth/register')}
          variant="secondary" 
        >
          {t('login.signup')}
        </Button>
      </div>
      </GlassCard>
    </div>
  );
}