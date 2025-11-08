import { Calendar, Clock } from 'lucide-react';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-center text-4xl font-bold text-white md:text-5xl">Blog sức khỏe</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90">
            Kiến thức y tế và mẹo chăm sóc sức khỏe
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <BlogCard
              title="10 cách phòng ngừa bệnh tim mạch hiệu quả"
              excerpt="Bệnh tim mạch là một trong những nguyên nhân gây tử vong hàng đầu. Dưới đây là 10 cách đơn giản giúp bạn phòng ngừa..."
              date="15/01/2025"
              readTime="5 phút đọc"
              category="Tim mạch"
            />
            <BlogCard
              title="Chế độ ăn uống lành mạnh cho người tiểu đường"
              excerpt="Người mắc bệnh tiểu đường cần có chế độ ăn uống khoa học để kiểm soát đường huyết..."
              date="12/01/2025"
              readTime="7 phút đọc"
              category="Dinh dưỡng"
            />
            <BlogCard
              title="Tầm quan trọng của việc khám sức khỏe định kỳ"
              excerpt="Khám sức khỏe định kỳ giúp phát hiện sớm các bệnh lý, từ đó có phương án điều trị kịp thời..."
              date="08/01/2025"
              readTime="4 phút đọc"
              category="Sức khỏe"
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Danh mục</h3>
              <div className="space-y-2">
                <CategoryItem name="Tim mạch" count={12} />
                <CategoryItem name="Dinh dưỡng" count={18} />
                <CategoryItem name="Sức khỏe" count={24} />
                <CategoryItem name="Y học" count={15} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogCard({ title, excerpt, date, readTime, category }: any) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-3">
        <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
          {category}
        </span>
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mb-4 text-gray-600">{excerpt}</p>
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="mr-1 h-4 w-4" />
          {date}
        </div>
        <div className="flex items-center">
          <Clock className="mr-1 h-4 w-4" />
          {readTime}
        </div>
      </div>
    </div>
  );
}

function CategoryItem({ name, count }: { name: string; count: number }) {
  return (
    <div className="flex justify-between py-2 hover:text-primary">
      <span>{name}</span>
      <span className="text-gray-500">({count})</span>
    </div>
  );
}
