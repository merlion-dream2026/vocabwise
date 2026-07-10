import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link href="/" className="text-sm text-purple-500 font-semibold hover:underline">← Trang chủ</Link>
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-2">Chính sách bảo mật</h1>
        <p className="text-sm text-gray-400 font-semibold mb-8">Cập nhật lần cuối: 23/05/2025</p>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6 text-sm text-gray-600 leading-relaxed">

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">1. Giới thiệu</h2>
            <p>IELTS CHAMPION (&quot;chúng tôi&quot;) vận hành ứng dụng VocabWise và cam kết bảo vệ quyền riêng tư của người dùng. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi sử dụng Dịch vụ.</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">2. Thông tin chúng tôi thu thập</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Thông tin tài khoản:</strong> Tên đăng nhập, địa chỉ email (tùy chọn), mật khẩu đã được mã hóa.</li>
              <li><strong>Thông tin hồ sơ bé:</strong> Tên bé, emoji đại diện, cấp độ học, màu theme.</li>
              <li><strong>Dữ liệu học tập:</strong> Từ vựng đã học, điểm số, streak, tiến độ từng chủ đề, lịch sử hoạt động hàng ngày.</li>
              <li><strong>Dữ liệu kỹ thuật:</strong> Thông tin thiết bị, trình duyệt, địa chỉ IP (được lưu tự động bởi hệ thống hosting).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">3. Mục đích sử dụng thông tin</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cung cấp và cải thiện Dịch vụ học từ vựng cho trẻ em.</li>
              <li>Theo dõi tiến độ học và gửi báo cáo qua email (nếu phụ huynh đã bật tính năng này).</li>
              <li>Xác thực danh tính và bảo mật tài khoản.</li>
              <li>Hỗ trợ kỹ thuật khi cần thiết.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">4. Chia sẻ thông tin</h2>
            <p className="mb-2">Chúng tôi <strong>không bán</strong> thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin với:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase:</strong> Nền tảng lưu trữ dữ liệu (đặt tại Mỹ/EU, tuân thủ GDPR).</li>
              <li><strong>Gmail (Google):</strong> Dịch vụ gửi email thông báo và OTP xác thực.</li>
              <li><strong>Vercel:</strong> Nền tảng hosting ứng dụng.</li>
            </ul>
            <p className="mt-2">Chúng tôi không chia sẻ thông tin với bên thứ ba cho mục đích quảng cáo.</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">5. Bảo mật dữ liệu</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mật khẩu được mã hóa bằng bcrypt trước khi lưu trữ — chúng tôi không thể đọc mật khẩu của bạn.</li>
              <li>Kết nối được bảo mật bằng HTTPS/TLS.</li>
              <li>Phiên đăng nhập được xác thực bằng JWT token có thời hạn.</li>
              <li>Truy cập cơ sở dữ liệu được giới hạn theo nguyên tắc least-privilege.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">6. Quyền của người dùng</h2>
            <p className="mb-2">Là phụ huynh/người giám hộ, bạn có quyền:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Truy cập:</strong> Xem toàn bộ dữ liệu học tập trên Dashboard.</li>
              <li><strong>Chỉnh sửa:</strong> Cập nhật thông tin hồ sơ bé bất kỳ lúc nào.</li>
              <li><strong>Xóa:</strong> Reset tiến độ học của bé hoặc yêu cầu xóa tài khoản hoàn toàn.</li>
              <li><strong>Từ chối email:</strong> Tắt tính năng báo cáo email trong Cài đặt bất kỳ lúc nào.</li>
            </ul>
            <p className="mt-2">Để yêu cầu xóa tài khoản hoàn toàn, vui lòng liên hệ qua email.</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">7. Bảo vệ trẻ em</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dịch vụ được thiết kế dành cho trẻ em dưới sự giám sát của phụ huynh.</li>
              <li>Tài khoản được đăng ký và quản lý bởi phụ huynh — không phải trẻ em.</li>
              <li>Chúng tôi không thu thập thông tin cá nhân trực tiếp từ trẻ em.</li>
              <li>Không có tính năng mạng xã hội, chat hay giao tiếp giữa các người dùng.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">8. Cookie và lưu trữ cục bộ</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Chúng tôi sử dụng cookie phiên đăng nhập (HttpOnly, Secure) để xác thực tài khoản.</li>
              <li>Không sử dụng cookie theo dõi hay quảng cáo.</li>
              <li>Dữ liệu học tập được đồng bộ lên server — không phụ thuộc vào localStorage.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">9. Thay đổi chính sách</h2>
            <p>Khi có thay đổi quan trọng, chúng tôi sẽ thông báo qua email (nếu bạn đã cung cấp) hoặc hiển thị thông báo trong ứng dụng. Tiếp tục sử dụng Dịch vụ sau khi thay đổi có hiệu lực đồng nghĩa với việc bạn chấp thuận chính sách mới.</p>
          </section>

          <section>
            <h2 className="font-black text-gray-800 text-base mb-2">10. Liên hệ</h2>
            <p>Mọi thắc mắc về Chính sách bảo mật, vui lòng liên hệ qua Zalo: <a href="https://zalo.me/0977347707" target="_blank" rel="noopener noreferrer" className="text-purple-500 underline">0977 347 707</a> hoặc email: <span className="text-purple-500">vocab.kids.pro&#64;gmail.com</span></p>
          </section>
        </div>

        <div className="mt-6 flex gap-4 text-sm text-gray-400 font-semibold justify-center">
          <Link href="/terms" className="hover:text-gray-600">Điều khoản sử dụng</Link>
          <span>·</span>
          <Link href="/" className="hover:text-gray-600">Trang chủ</Link>
        </div>
      </div>
    </div>
  )
}
