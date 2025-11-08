import { Calendar, User } from 'lucide-react';

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">Tin tức</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Cập nhật tin tức y tế mới nhất
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <NewsCard
            title="Khai trương khoa Tim mạch can thiệp"
            excerpt="Bệnh viện chính thức đưa vào hoạt động khoa Tim mạch can thiệp với trang thiết bị hiện đại..."
            date="15/01/2025"
            author="Admin"
            image="/news-1.jpg"
          />
          <NewsCard
            title="Chương trình khám sức khỏe miễn phí"
            excerpt="Khám sức khỏe miễn phí cho người cao tuổi và trẻ em dưới 6 tuổi..."
            date="10/01/2025"
            author="Admin"
            image="/news-2.jpg"
          />
          <NewsCard
            title="Hội thảo chăm sóc sức khỏe tim mạch"
            excerpt="Hội thảo với sự tham gia của các chuyên gia hàng đầu về tim mạch..."
            date="05/01/2025"
            author="Admin"
            image="/news-3.jpg"
          />
        </div>
      </div>
    </div>
  );
}

function NewsCard({ title, excerpt, date, author, image }: any) {
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6">
        <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
        <p className="mb-4 text-gray-600">{excerpt}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            {date}
          </div>
          <div className="flex items-center">
            <User className="mr-1 h-4 w-4" />
            {author}
          </div>
        </div>
      </div>
    </div>
  );
}
