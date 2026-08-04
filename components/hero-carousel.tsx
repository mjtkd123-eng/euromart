"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Slide {
  image: string
  alt: string
  eyebrow: string
  title: string
  subtitle: string
}

const SLIDES: Slide[] = [
  {
    image: "/hero-kimchi.png",
    alt: "포기김치 상품 이미지",
    eyebrow: "신선하게 배달",
    title: "한 포기 안에 담긴 정성",
    subtitle: "비비고 포기김치",
  },
  {
    image: "/hero-ramen.png",
    alt: "한국 라면 상품 이미지",
    eyebrow: "베스트셀러",
    title: "얼큰한 국물 한 그릇",
    subtitle: "인기 라면 모음전",
  },
  {
    image: "/hero-banchan.png",
    alt: "한국 반찬 상품 이미지",
    eyebrow: "매일 준비하는",
    title: "집밥이 그리울 때",
    subtitle: "정성 가득 밑반찬",
  },
]

export function HeroCarousel() {
  const [index, setIndex] = useState(0)

  const go = useCallback((next: number) => {
    setIndex((prev) => (next + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section
      aria-roledescription="carousel"
      aria-label="추천 상품 배너"
      className="relative overflow-hidden rounded-3xl bg-accent"
    >
      <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={slide.image || "/placeholder.svg"}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 1152px"
              className="object-cover"
            />
            {/* 텍스트 가독성용 그라디언트 */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center gap-2 px-6 sm:px-12">
              <span className="inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                {slide.eyebrow}
              </span>
              <h2 className="text-balance text-2xl font-black leading-tight text-foreground sm:text-4xl">
                {slide.title}
              </h2>
              <p className="text-lg font-bold text-primary sm:text-2xl">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 좌우 화살표 */}
      <button
        onClick={() => go(index - 1)}
        aria-label="이전 배너"
        className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <button
        onClick={() => go(index + 1)}
        aria-label="다음 배너"
        className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>

      {/* 페이지네이션 도트 */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}번째 배너로 이동`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-primary" : "w-2 bg-foreground/30 hover:bg-foreground/50"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
