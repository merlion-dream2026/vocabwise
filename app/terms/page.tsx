import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="text-sm text-purple-500 font-semibold hover:underline">← Trang chủ</Link>
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-2">Điều khoản sử dụng</h1>
        <p className="text-sm text-gray-400 font-semibold mb-8">Cập nhật lần cuối: 23/05/2025</p>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">1. Giới thiệu</h2>
            <p className="mb-2">VocabWise (&quot;Dịch vụ&quot;) là ứng dụng học từ vựng tiếng Anh dành cho trẻ em, được sáng tạo và vận hành bởi <strong>Thầy Andie Nguyễn</strong> — Đồng sáng lập thương hiệu IELTS CHAMPION.</p>
            <p className="mb-2 text-gray-500 text-xs leading-relaxed">Thầy Andie Nguyễn: hơn 10 năm kinh nghiệm giảng dạy IELTS/SAT · IELTS 8.5 Overall (8.5 Writing) · Thạc sỹ Quản trị Kinh doanh (Vương quốc Anh) · Học bổng toàn phần Chính phủ Singapore · Tốt nghiệp National University of Singapore (top 8 thế giới).</p>
            <p>Bằng việc đăng ký và sử dụng Dịch vụ, bạn (phụ huynh/người giám hộ) đồng ý với các điều khoản dưới đây.</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">2. Tài khoản người dùng</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mỗi tài khoản đại diện cho một gia đình và do phụ huynh hoặc người giám hộ quản lý.</li>
              <li>Bạn có trách nhiệm bảo mật thông tin đăng nhập và mật khẩu tài khoản.</li>
              <li>Vui lòng thông báo ngay cho chúng tôi nếu phát hiện hành vi sử dụng trái phép tài khoản của bạn.</li>
              <li>Mỗi tài khoản chỉ được sử dụng cho mục đích cá nhân, phi thương mại.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">3. Gói dịch vụ</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Gói Free:</strong> Miễn phí, bao gồm 1 hồ sơ bé và 1 chủ đề đầu mỗi cấp độ.</li>
              <li><strong>Gói Premium:</strong> Trả phí, mở khóa toàn bộ nội dung và không giới hạn số hồ sơ bé.</li>
              <li>Chúng tôi có quyền thay đổi tính năng của các gói dịch vụ với thông báo trước.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">4. Nội dung và bản quyền</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Toàn bộ nội dung trong Dịch vụ — bao gồm giáo trình, từ vựng, bài đọc, bài tập, trò chơi, câu chuyện và âm thanh — là tài sản trí tuệ độc quyền của VocabWise / IELTS CHAMPION, được bảo hộ theo pháp luật Việt Nam và quốc tế về quyền tác giả.</li>
              <li><strong>Nghiêm cấm</strong> sao chép, trích xuất, tái phân phối hoặc sử dụng bất kỳ phần nội dung nào dưới bất kỳ hình thức nào — dù có hay không có mục đích thương mại — mà không có văn bản chấp thuận của chúng tôi.</li>
              <li>Nội dung chỉ được sử dụng cho mục đích học tập cá nhân trong phạm vi gia đình đăng ký.</li>
              <li>Chúng tôi áp dụng kỹ thuật nhận dạng nguồn gốc nội dung. Mọi hành vi vi phạm đều có thể bị truy vết và xử lý theo quy định pháp luật.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">5. Hành vi bị cấm</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chia sẻ tài khoản cho người ngoài gia đình.</li>
              <li>Cố gắng truy cập trái phép vào hệ thống hoặc tài khoản người dùng khác.</li>
              <li>Sử dụng Dịch vụ để phát tán nội dung độc hại, không phù hợp với trẻ em.</li>
              <li>Sử dụng bot, script tự động hoặc bất kỳ công cụ nào để thu thập, khai thác hoặc sao chép nội dung từ Dịch vụ (web scraping, API crawling, v.v.).</li>
              <li>Tái sử dụng nội dung giáo trình để xây dựng sản phẩm, dịch vụ hoặc tài liệu cạnh tranh.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">6. Giới hạn trách nhiệm</h2>
            <p>Dịch vụ được cung cấp &quot;nguyên trạng&quot;. Chúng tôi không đảm bảo Dịch vụ hoạt động liên tục không gián đoạn. Chúng tôi không chịu trách nhiệm về các thiệt hại gián tiếp phát sinh từ việc sử dụng Dịch vụ.</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">7. Chấm dứt dịch vụ</h2>
            <p>Chúng tôi có quyền tạm dừng hoặc chấm dứt tài khoản vi phạm Điều khoản này. Bạn có thể yêu cầu xóa tài khoản bất kỳ lúc nào bằng cách liên hệ qua email.</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">8. Liên hệ</h2>
            <p>Mọi thắc mắc về Điều khoản sử dụng, vui lòng liên hệ qua Zalo: <a href="https://zalo.me/0977347707" target="_blank" rel="noopener noreferrer" className="text-purple-500 underline">0977 347 707</a> hoặc email: <span className="text-purple-500">vocab.kids.pro&#64;gmail.com</span></p>
          </section>
        </div>

        <div className="mt-6 flex gap-4 text-sm text-gray-400 font-semibold justify-center">
          <Link href="/privacy" className="hover:text-gray-600">Chính sách bảo mật</Link>
          <span>·</span>
          <Link href="/" className="hover:text-gray-600">Trang chủ</Link>
        </div>
      </div>
    </div>
  )
}
