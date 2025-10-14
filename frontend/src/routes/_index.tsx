import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Welcome from "@/components/homepage/welcome";
import Motivation from "@/components/homepage/motivation";
import GlassCard from "@/components/ui/glass-card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pages = [Welcome, Motivation];
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
  
  useEffect(() => {if (isAuthed) {
    navigate("/home");
  }}, []);
  return (
    
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassCard className="flex flex-col">
      {/* Carousel content - takes up available space */}
      <div className="flex-grow">
        <Carousel>
          <CarouselContent>
            {pages.map((PageComponent, index) => (
              <CarouselItem key={index}>
                <PageComponent />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Buttons at the bottom */}
      <div className="flex gap-4 justify-center mt-6 pt-4 border-t border-white/20">
        <Button 
          onClick={() => navigate('/auth/login')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {t('login.login')}
        </Button>
        <Button 
          onClick={() => navigate('/auth/register')}
          variant="outline" 
          className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700"
        >
          {t('login.signup')}
        </Button>
      </div>
      </GlassCard>
    </div>
  );
}