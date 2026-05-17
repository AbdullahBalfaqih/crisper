'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Instagram, Phone, Music, ArrowUp, Twitter, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { AddToCartDialog } from '@/components/add-to-cart-dialog';
import type { Product, Category } from '@/lib/types';
import hero from "./1.png";
import a1 from "./2.jpg";
import a2 from "./3.jpg";
import a3 from "./4.jpg";
import a4 from "./5.jpg";
import a6 from "./6.png";
import a7 from "./7.png";
import a8 from "./8.jpg";
const FADE_IN_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// --- Sub-components for Landing Page ---

const HeroSection = ({ isMenuPage = false }: { isMenuPage?: boolean }) => (
  <section className="relative flex min-h-[100vh] w-full flex-col items-center justify-center gap-4 bg-cover bg-center bg-no-repeat sm:min-h-screen sm:gap-6 md:gap-8">
    <Image
            src={hero}  // 👈 استخدام المتغير بدل المسار النصي
      alt="مطعم كرسبر"
      className="absolute inset-0 h-full w-full object-cover"
      fill
      priority
      data-ai-hint="delicious food"
    />
    <div className="absolute inset-0 h-full w-full bg-black/60 sm:bg-black/50"></div>
    <div className="container relative z-[2] mx-auto px-4 py-12 sm:py-16 md:py-20">
      <div className="mx-auto flex flex-col items-center gap-16 text-center max-sm:px-12">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white max-sm:mt-20">
          مطعم كرسبر
          <br/>
          <span className="text-primary">مفتاح الجوع</span>
        </h1>
        <div className="w-[75%] max-sm:mt-16 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
          <a className="w-full sm:w-auto" href="/cart">
            <Button size="lg" className="w-full h-16 rounded-full text-xl md:h-20 md:px-12 md:text-2xl">
              اطلب الآن
            </Button>
          </a>
          <a href="/menu" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full h-16 rounded-full text-xl md:h-20 md:px-12 md:text-2xl border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-white">
              اصناف الطعام
            </Button>
          </a>
        </div>
      </div>
    </div>
    <div className="dark:bg-primary-950 absolute -bottom-16 start-0 h-[6rem] w-full bg-white sm:h-[8rem] sm:rounded-t-[6rem] md:h-[9rem] md:rounded-t-[8rem] lg:h-[10rem]"></div>
  </section>
);


export const carouselImages = [
  
    { src: a1, alt: 'بطاطس مقلية مقرمشة', hint: 'تشكن فرايز' },
    { src: a3, alt: 'شورما شهية', hint: 'شاورما' },
    { src: a2, alt: 'برقر كرسبي دجاج مقرمش', hint: 'برقر كرسبي' },
 
    { src: a4, alt: 'مكسيكانو الحار', hint: 'مكسيكانو' },
];
const CarouselSection = () => (
    <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={FADE_IN_VARIANTS}
        className="w-full py-12 md:py-20"
    >
        <div className="container mx-auto">
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={10}
                slidesPerView={1}
                loop={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                }}
                navigation
                pagination={{ clickable: true }}
                breakpoints={{
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 3,
                        spaceBetween: 40,
                    },
                    1024: {
                        slidesPerView: 4,
                        spaceBetween: 50,
                    },
                }}
                className="w-full"
            >
                {carouselImages.map((image, index) => (
                    <SwiperSlide key={index}>
                        <div className="p-1">
                            <Card className="overflow-hidden rounded-3xl bg-transparent">
                                <CardContent className="flex aspect-[460/620] items-center justify-center p-0">
                                    <Image
                                        src={image.src}
                                        alt={image.alt}
                                        width={460}
                                        height={620}
                                        className="w-full h-full object-cover"
                                        data-ai-hint={image.hint}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    </motion.section>
);
const FeaturesGridSection = () => (
    <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={FADE_IN_VARIANTS}
        className="w-full py-12 md:py-24 bg-white"
    >
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div variants={FADE_IN_VARIANTS} className="lg:col-span-2 rounded-2xl bg-muted p-8 flex flex-col justify-center">
                    <h2 className="text-5xl font-bold text-primary mb-4">ماذا يميز كرسبر؟</h2>
                    <p className="text-lg text-foreground/80">نحن لا نقدم وجبات سريعة فحسب، بل نقدم تجربة متكاملة من النكهات الأصيلة والخدمة الاستثنائية.</p>
                </motion.div>
                <motion.div
                    variants={FADE_IN_VARIANTS}
                    className="relative h-96 md:h-auto rounded-2xl overflow-hidden"
                >
                    <Image
                        src={a6}
                        alt="Burger Closeup"
                        fill
                        className="object-fill" // استرتش الصورة لتملأ الحاوية بالكامل
                        data-ai-hint="burger closeup"
                    />
                </motion.div>

                 <motion.div variants={FADE_IN_VARIANTS} className="relative h-96 md:h-auto rounded-2xl overflow-hidden">
                    <Image
                        src={a7}
                        alt="Burger Closeup"
                        fill
                        className="object-fill" // استرتش الصورة لتملأ الحاوية بالكامل
                        data-ai-hint="burger closeup"
                    />                </motion.div>
                 <motion.div variants={FADE_IN_VARIANTS} className="lg:col-span-2 rounded-2xl bg-muted p-8 flex flex-col justify-center">
                     <h3 className="text-3xl font-semibold mb-3">الجودة أولاً</h3>
                     <p className="text-md text-foreground/70">
                        نؤمن بأن سر الطعم الاستثنائي يكمن في جودة المكونات. لذلك، نستخدم فقط اللحوم الطازجة والخضروات المحلية لنقدم لكم وجبات شهية لا تُقاوم.
                     </p>
                </motion.div>
                 <motion.div variants={FADE_IN_VARIANTS} className="lg:col-span-2 rounded-2xl bg-muted p-8 flex flex-col justify-center">
                     <h3 className="text-3xl font-semibold mb-3">سرعة ودقة</h3>
                    <p className="text-md text-foreground/70">
                        وقتكم ثمين! نظامنا المبتكر في المطبخ يضمن تحضير طلبكم بسرعة فائقة دون التنازل عن الجودة، لتستمتعوا بوجبتكم في أسرع وقت.
                    </p>
                </motion.div>
                 <motion.div variants={FADE_IN_VARIANTS} className="relative h-96 md:h-auto rounded-2xl overflow-hidden">
                    <Image
                        src={a8}
                        alt="Burger Closeup"
                        fill
                        className="object-fill" // استرتش الصورة لتملأ الحاوية بالكامل
                        data-ai-hint="burger closeup"
                    />                </motion.div>
            </div>
        </div>
    </motion.section>
);


const FeaturedCategorySection = ({ categoryId, imageSrc, imageAlt, imageHint, reverse = false }: { categoryId: string, imageSrc: string, imageAlt: string, imageHint: string, reverse?: boolean }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([fetch('/api/categories'), fetch('/api/products')]);
        setCategories(await catRes.json());
        setProducts(await prodRes.json());
      } catch (error) {
        console.error("Failed to fetch data for FeaturedCategorySection", error);
      }
    }
    fetchData();
  }, []);

  const category = categories.find(c => c.id === categoryId);
  const items = products.filter(p => p.categoryId === categoryId);
  const featuredItem = items.length > 0 ? items[0] : null;

  if (!category || items.length === 0) {
    return null;
  }

  return (
    <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={FADE_IN_VARIANTS}
        className="w-full py-12 md:py-24"
    >
        <div className="container mx-auto px-4">
            <Card className={cn("grid grid-cols-1 lg:grid-cols-2 items-center p-8 md:p-12 rounded-3xl shadow-lg", reverse && "dir-rtl")}>
                <div className={cn("space-y-8", reverse && "lg:order-2")}>
                    <h2 className="text-4xl font-bold mb-6">{category.name}</h2>
                    {items.map((item, index) => (
                        <motion.div 
                            key={item.id}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.5 }}
                            variants={{
                                hidden: { opacity: 0, x: reverse ? 20 : -20 },
                                visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: index * 0.1 } }
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-semibold">{item.name}</h3>
                                    <p className="text-card-foreground/70 mt-1 max-w-md">معدة بعناية من أجود المكونات.</p>
                                </div>
                                <p className="text-lg font-bold text-primary shrink-0 pl-4">{item.price.toLocaleString('ar-SA')} ر.ي</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className={cn("relative h-96 lg:h-[600px] w-full mt-8 lg:mt-0", reverse && "lg:order-1")}>
                    <Image 
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className="object-cover rounded-2xl"
                        data-ai-hint={imageHint}
                    />
                    {featuredItem && <div className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm text-card-foreground font-semibold px-4 py-2 rounded-full">{featuredItem.name}</div>}
                </div>
            </Card>
        </div>
    </motion.section>
  )
};


const reviewsRow1 = ["عالمي", "من بعد ثاني !", "يفوز!", "ما يمزح!", "خوراافي"];
const reviewsRow2 = ["فانتاستيكو", "يجنننننننن", "رووعة !", "واااو", "اسطووري!", "OMG !", "إبداع", "نار وشرار", "شيء فاخر"];

const MarqueeRow = ({ reviews, direction = 'forward' }: { reviews: string[], direction?: 'forward' | 'backward' }) => {
    const marqueeClass = direction === 'forward' ? 'animate-marquee' : 'animate-marquee-reverse';
    const content = reviews.map((text, i) => (
         <div key={i} className="flex-shrink-0 mx-2">
            <Button variant="outline" className="border-foreground/20 hover:bg-card/80 h-16 rounded-2xl border-2 px-6">
                <span className="text-lg font-bold text-foreground">{text}</span>
            </Button>
        </div>
    ));

    return (
        <div className="relative flex overflow-x-hidden">
            <div className={cn("whitespace-nowrap flex items-center", marqueeClass)}>
                {content}
            </div>
            <div className={cn("absolute top-0 whitespace-nowrap flex items-center", direction === 'forward' ? 'animate-marquee2' : 'animate-marquee2-reverse')}>
                {content}
            </div>
        </div>
    )
};

const ReviewsMarquee = () => (
    <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        variants={FADE_IN_VARIANTS}
    >
        <div className="py-12 md:py-16 lg:py-24 space-y-4">
            <MarqueeRow reviews={reviewsRow1} direction="forward" />
            <MarqueeRow reviews={reviewsRow2} direction="backward" />
        </div>
    </motion.div>
);

const MenuContent = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [catRes, prodRes] = await Promise.all([fetch('/api/categories'), fetch('/api/products')]);
                setCategories(await catRes.json());
                setProducts(await prodRes.json());
            } catch (error) {
                console.error("Failed to fetch menu data", error);
            }
        }
        fetchData();
    }, []);

    const productsByCategory = categories.map(category => ({
        ...category,
        products: products.filter(p => p.categoryId === category.id),
    }));

    const filteredProducts = selectedCategory === 'all'
        ? productsByCategory
        : productsByCategory.filter(c => c.id === selectedCategory);

    return (
      <>
      <div className="container mx-auto px-4 py-8 pt-24 md:pt-32">
           <section className="py-6 relative">
            <div className="flex justify-center" style={{ opacity: 1, transform: 'none' }}>
              <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      "px-8 py-2 mb-2 rounded-2xl border-2 border-primary text-primary transition-colors text-base font-semibold hover:bg-primary/10",
                      selectedCategory === 'all' ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card text-card-foreground"
                    )}
                  >
                    الكل
                  </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "px-8 py-2 mb-2 rounded-2xl border-2 border-primary text-primary transition-colors text-base font-semibold hover:bg-primary/10",
                      selectedCategory === category.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-card text-card-foreground"
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section id="menu" className="w-full">
              <div className="space-y-16">
                {filteredProducts.map(category => (
                  <motion.div
                    key={category.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={FADE_IN_VARIANTS}
                  >
                    <h3 className="text-3xl font-bold mb-8 text-center">{category.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-16">
                      {category.products.map(product => (
                        <div
                          key={product.id}
                          className="relative flex flex-col text-center"
                        >
                          <div className="group">
                            <div className="w-full bg-gray-200/50 dark:bg-primary-800 rounded-[1.64rem] transition-all duration-300 group-hover:shadow-lg mb-20">
                              <div className="h-[8rem] md:h-[12.64rem]"></div>
                            </div>
                            <Image
                              className="absolute top-0 left-1/2 transform -translate-x-1/2 h-[12rem] md:h-[17.86rem] object-contain transition-transform duration-300 group-hover:scale-105"
                              alt={product.name}
                              src={product.imageUrl}
                              width={280}
                              height={280}
                              data-ai-hint={product.imageHint}
                            />
                            <div className="flex flex-col items-center gap-2 text-center mt-3 md:mt-4">
                              <h3 className="font-bold text-lg md:text-2xl h-14">{product.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1 px-2 h-10">{product.description}</p>
                              <p className="font-semibold text-primary text-xl flex items-center justify-center h-4">
                                {product.price.toLocaleString('ar-SA')}
                                <span className="ml-1">ر.ي</span>
                              </p>
                            </div>
                          </div>
                           <Button className="mt-4" onClick={() => setSelectedProduct(product)}>
                                أضف للسلة
                           </Button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
          </section>
      </div>
       {selectedProduct && (
        <AddToCartDialog
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      </>
    );
};

const AboutSection = () => (
    <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={FADE_IN_VARIANTS}
        className="w-full py-12 md:py-24"
    >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 bg-white p-8 rounded-3xl shadow-lg">
              <h2 className="text-4xl font-bold mb-4">نحن نحب ما نصنع</h2>
              <p className="text-card-foreground/80 mb-4">
                 كرسبر هو وجهتكم الأولى للوجبات السريعة والشهية في قلب المدينة. نحن نؤمن بأن السرعة لا تعني التنازل عن الجودة. لذلك، نحرص على استخدام أفضل المكونات الطازجة لتحضير وجباتكم المفضلة، من البرجر اللذيذ إلى البطاطس المقرمشة.
              </p>
              <p className="text-card-foreground/80 mb-6">
                انضم إلينا لتستمتع بلحظات من اللذة مع كل قضمة.
              </p>
              <div className="mb-8">
                <h3 className="font-bold mb-2">الموقع:</h3>
                <p className="text-card-foreground/80">
                  سيئون، حضرموت<br/>
                  حي الوحدة<br/>
                  بجانب مستشفى بن زيلع
                </p>
              </div>
              <a href="https://www.google.com/maps/dir/?api=1&destination=15.9277274,48.7913031" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full text-base">
                    زيارة المطعم
                </Button>
              </a>
            </div>
            <div className="relative h-[600px] lg:h-[700px] w-full rounded-2xl overflow-hidden order-1 lg:order-2">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3589.6894713675453!2d48.7887282!3d15.9277274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3de6a1006fe88d8b%3A0x6f22c75207112f1b!2z2YXYs9iq2LTZgdiMINi52YHZitmB2Kc!5e0!3m2!1sen!2sus!4v1722291986566!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
    </motion.section>
);

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
     <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={FADE_IN_VARIANTS}
        className="relative w-full bg-gray-100 dark:bg-black px-4 pb-8 pt-48"
      >
        <div className="mx-auto text-center max-md:max-w-6xl">
            <div className="text-primary-800 dark:text-primary">
                <p className="text-5xl md:text-7xl font-bold" style={{ whiteSpace: 'pre-wrap' }}>
                    نقدم الذوق في كل وجبة سريعة
                </p>
                <p className="text-5xl md:text-7xl font-bold" style={{ whiteSpace: 'pre-wrap' }} dir="ltr">
                    Serving taste in every fast meal
                </p>
            </div>
            <div className="mb-8 flex justify-center gap-3 md:my-12 md:gap-4">
                 <a href="https://www.instagram.com/crispr_r2?igsh=bW1oMW8wdmNnMmVi" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-transform hover:scale-110">
                    <Instagram className="text-primary-800 dark:text-white h-5 w-5 md:h-8 md:w-8" />
                </a>
                 <a href="https://www.tiktok.com/@crispr_r2?_t=ZS-90IGvLwfy0f&_r=1" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition-transform hover:scale-110">
                    <svg className="text-primary-800 dark:text-white h-5 w-5 md:h-8 md:w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.04-5.36-.01-4.03-.01-8.05.02-12.07z"></path></svg>
                </a>
                 <a href="https://wa.me/967782427779" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="transition-transform hover:scale-110">
                    <Phone className="text-primary-800 dark:text-white h-5 w-5 md:h-8 md:w-8" />
                </a>
            </div>
             <div className="absolute left-10 bottom-10">
                <Button variant="outline" size="icon" onClick={scrollToTop} className="h-14 w-14 rounded-xl bg-white border-transparent text-gray-500 hover:bg-gray-200">
                    <ArrowUp className="h-6 w-6 text-gray-500"/>
                </Button>
            </div>
            <div className="text-center font-normal">
                <span className="text-primary-950 dark:text-white">جميع الحقوق محفوظة لصالح كرسبر - </span>
                <span className="text-gray-400">2024 م</span>
                 <p className="text-xs text-gray-500 mt-2">dev by abdullahbalfaqih0@gmail.com</p>
            </div>
        </div>
      </motion.footer>
    );
};

interface LandingPageProps {
  isMenuPage?: boolean;
}

export default function LandingPage({ isMenuPage = false }: LandingPageProps) {
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-body">
      
      <main className="flex-1">
        {isMenuPage ? (
          <MenuContent />
        ) : (
          <>
            <HeroSection isMenuPage={isMenuPage} />
            <CarouselSection />
            <FeaturedCategorySection 
              categoryId="cl38j4d6m000409l8g6z5b7d1" 
              imageSrc="https://picsum.photos/seed/landing-meal/800/600"
              imageAlt="Featured Meal"
              imageHint="delicious meal"
              reverse={true}
            />
            <FeaturedCategorySection 
              categoryId="cl38j4d6m000509l8g6z5b7d2"
              imageSrc="https://picsum.photos/seed/landing-drink/800/600"
              imageAlt="Featured Drink"
              imageHint="refreshing drink"
            />
            <ReviewsMarquee />
            <FeaturesGridSection />
            <AboutSection />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
