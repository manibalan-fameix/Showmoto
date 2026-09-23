"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const offers = [
  { src: "/offer-quality-checked-cars.png", alt: "Quality-checked cars" },
  { src: "/offer-easy-finance.png", alt: "Easy finance assistance" },
  {
    src: "/offer-transparent-documentation.png",
    alt: "Transparent documentation",
  },
]

export function OfferBannerCarousel() {
  return (
    <Carousel opts={{ loop: true }} className="w-full">
      <CarouselContent className="-ml-4">
        {offers.map((offer) => (
          <CarouselItem
            key={offer.src}
            className="basis-[88%] pl-4 sm:basis-1/2 xl:basis-1/3"
          >
            <div className="aspect-[3/1] overflow-hidden rounded-[16px] border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={offer.src}
                alt={offer.alt}
                className="size-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2 border-border bg-background/90 shadow-sm backdrop-blur hover:bg-background" />
      <CarouselNext className="right-2 border-border bg-background/90 shadow-sm backdrop-blur hover:bg-background" />
    </Carousel>
  )
}
