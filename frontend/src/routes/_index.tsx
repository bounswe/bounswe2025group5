import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Welcome from "@/components/homepage/welcome";
import Motivation from "@/components/homepage/motivation";

export default function Index() {
  const pages = [Welcome, Motivation];
  return (
    <Carousel >
      <CarouselContent>
        {pages.map((PageComponent, index) => (
          <CarouselItem key={index}>
            <PageComponent />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}