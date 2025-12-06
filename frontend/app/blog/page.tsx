'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, Clock, User, Search, ArrowRight,
  Tag, TrendingUp, Heart, Share2, Bookmark,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';

// Blog categories
const categories = [
  { id: 'all', name: 'Tất cả', count: 24 },
  { id: 'heart', name: 'Tim mạch', count: 8 },
  { id: 'nutrition', name: 'Dinh dưỡng', count: 12 },
  { id: 'health', name: 'Sức khỏe', count: 18 },
  { id: 'medicine', name: 'Y học', count: 10 },
  { id: 'mental', name: 'Tâm lý', count: 6 },
];

// Featured blog post
const featuredPost = {
  id: 'featured-1',
  title: 'Những bước tiến mới trong điều trị bệnh tim mạch năm 2025',
  excerpt: 'Khám phá những công nghệ và phương pháp điều trị tiên tiến nhất trong lĩnh vực tim mạch, giúp cải thiện đáng kể chất lượng cuộc sống cho bệnh nhân.',
  image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&q=80&w=1200',
  author: 'BS. Nguyễn Văn An',
  authorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100',
  date: '15/01/2025',
  readTime: '10 phút đọc',
  category: 'Tim mạch',
  views: 2450,
};

// Blog posts data
const blogPosts = [
  {
    id: '1',
    title: '10 cách phòng ngừa bệnh tim mạch hiệu quả từ chuyên gia',
    excerpt: 'Bệnh tim mạch là một trong những nguyên nhân gây tử vong hàng đầu. Dưới đây là 10 cách đơn giản giúp bạn phòng ngừa hiệu quả...',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=600',
    author: 'BS. Trần Minh Đức',
    date: '12/01/2025',
    readTime: '5 phút đọc',
    category: 'Tim mạch',
    views: 1823,
  },
  {
    id: '2',
    title: 'Chế độ ăn uống lành mạnh cho người tiểu đường',
    excerpt: 'Người mắc bệnh tiểu đường cần có chế độ ăn uống khoa học để kiểm soát đường huyết hiệu quả...',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=600',
    author: 'ThS. Lê Thị Hương',
    date: '10/01/2025',
    readTime: '7 phút đọc',
    category: 'Dinh dưỡng',
    views: 2156,
  },
  {
    id: '3',
    title: 'Tầm quan trọng của việc khám sức khỏe định kỳ',
    excerpt: 'Khám sức khỏe định kỳ giúp phát hiện sớm các bệnh lý, từ đó có phương án điều trị kịp thời và hiệu quả...',
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80&w=600',
    author: 'BS. Phạm Văn Hùng',
    date: '08/01/2025',
    readTime: '4 phút đọc',
    category: 'Sức khỏe',
    views: 1567,
  },
  {
    id: '4',
    title: 'Yoga và thiền định: Liều thuốc tinh thần cho cuộc sống hiện đại',
    excerpt: 'Khám phá lợi ích tuyệt vời của yoga và thiền định trong việc giảm stress và cải thiện sức khỏe tinh thần...',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
    author: 'ThS. Nguyễn Thu Hà',
    date: '05/01/2025',
    readTime: '6 phút đọc',
    category: 'Tâm lý',
    views: 1234,
  },
  {
    id: '5',
    title: 'Vaccine COVID-19: Những điều cần biết về mũi tăng cường',
    excerpt: 'Cập nhật thông tin mới nhất về vaccine tăng cường và lời khuyên từ các chuyên gia y tế...',
    image: 'https://images.unsplash.com/photo-1615631648086-325025c9e51e?auto=format&fit=crop&q=80&w=600',
    author: 'PGS.TS. Hoàng Minh Châu',
    date: '02/01/2025',
    readTime: '8 phút đọc',
    category: 'Y học',
    views: 3421,
  },
  {
    id: '6',
    title: 'Giấc ngủ và sức khỏe: Bí quyết ngủ ngon mỗi đêm',
    excerpt: 'Tìm hiểu về tầm quan trọng của giấc ngủ và các mẹo giúp bạn có được giấc ngủ chất lượng...',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=600',
    author: 'BS. Vũ Thị Mai',
    date: '28/12/2024',
    readTime: '5 phút đọc',
    category: 'Sức khỏe',
    views: 1890,
  },
];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);

  useEffect(() => {
    let result = blogPosts;

    if (activeCategory !== 'all') {
      result = result.filter(post =>
        post.category.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    if (searchQuery) {
      result = result.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPosts(result);
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 to-white font-sans text-slate-900">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-700 to-teal-800 pt-32 pb-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-5" />
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-cyan-100 backdrop-blur-sm">
              Kiến thức y tế từ chuyên gia
            </span>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Blog Sức Khỏe
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-cyan-100">
              Cập nhật thông tin y khoa, mẹo chăm sóc sức khỏe và lời khuyên từ đội ngũ bác sĩ hàng đầu
            </p>

            {/* Search Bar */}
            <div className="mx-auto mt-8 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  className="h-14 rounded-2xl border-0 bg-white pl-12 pr-4 text-base shadow-xl focus-visible:ring-2 focus-visible:ring-cyan-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="sticky top-16 z-20 border-b bg-white/80 py-4 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeCategory === category.id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {category.name}
                <span className={`ml-1 ${activeCategory === category.id ? 'text-cyan-200' : 'text-slate-400'}`}>
                  ({category.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Featured Post */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-900 to-teal-900 shadow-2xl">
            <div className="absolute inset-0 z-0">
              <Image
                src={featuredPost.image}
                alt={featuredPost.title}
                fill
                className="object-cover opacity-40"
              />
            </div>
            <div className="relative z-10 flex flex-col lg:flex-row">
              <div className="flex-1 p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-white">
                    Nổi bật
                  </span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {featuredPost.category}
                  </span>
                </div>
                <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
                  {featuredPost.title}
                </h2>
                <p className="mb-6 text-lg text-cyan-100 line-clamp-3">
                  {featuredPost.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-cyan-200">
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/30">
                      <Image
                        src={featuredPost.authorAvatar}
                        alt={featuredPost.author}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium text-white">{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {featuredPost.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {featuredPost.readTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {featuredPost.views.toLocaleString()} lượt xem
                  </div>
                </div>
                <Button className="mt-8 bg-white text-cyan-900 hover:bg-cyan-50">
                  Đọc ngay
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Blog Grid */}
        <section>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Bài viết mới nhất</h2>
            <span className="text-sm text-slate-500">{filteredPosts.length} bài viết</span>
          </div>

          <AnimatePresence mode="wait">
            {filteredPosts.length > 0 ? (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="rounded-full bg-white/90 p-2 text-slate-600 backdrop-blur-sm hover:bg-white">
                          <Heart className="h-4 w-4" />
                        </button>
                        <button className="rounded-full bg-white/90 p-2 text-slate-600 backdrop-blur-sm hover:bg-white">
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-700">
                          {post.category}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{post.readTime}</span>
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="mb-4 text-sm text-slate-600 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{post.author}</span>
                        </div>
                        <span className="text-xs text-slate-400">{post.date}</span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="mb-4 rounded-full bg-slate-100 p-6">
                  <Search className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Không tìm thấy bài viết</h3>
                <p className="mt-2 text-slate-500">
                  Vui lòng thử lại với từ khóa hoặc danh mục khác
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {filteredPosts.length > 0 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {[1, 2, 3, 4, 5].map((page) => (
                <Button
                  key={page}
                  variant={page === 1 ? 'default' : 'outline'}
                  size="icon"
                  className={`h-10 w-10 ${page === 1 ? 'bg-cyan-600 hover:bg-cyan-700' : ''}`}
                >
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="icon" className="h-10 w-10">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>

        {/* Newsletter CTA */}
        <section className="mt-20">
          <div className="rounded-3xl bg-gradient-to-r from-cyan-600 to-teal-600 p-8 text-center lg:p-12">
            <h2 className="mb-4 text-2xl font-bold text-white lg:text-3xl">
              Đăng ký nhận bản tin sức khỏe
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-cyan-100">
              Nhận các bài viết mới nhất, mẹo chăm sóc sức khỏe và thông tin y tế hữu ích trực tiếp vào hộp thư của bạn.
            </p>
            <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Email của bạn"
                className="h-12 flex-1 rounded-xl border-0 bg-white/90 text-slate-900 placeholder-slate-500"
              />
              <Button className="h-12 bg-white px-6 text-cyan-700 hover:bg-cyan-50">
                Đăng ký ngay
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
