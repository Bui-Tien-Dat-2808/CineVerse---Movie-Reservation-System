import { useState } from 'react'

interface PolicyModalProps {
  isOpen: boolean
  initialTab?: 'terms' | 'privacy'
  onClose: () => void
}

export default function PolicyModal({ isOpen, initialTab = 'terms', onClose }: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#111118] border border-white/10 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#161622]">
          <div className="flex gap-3 bg-[#09090e] p-1 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-[#e8b84b] text-[#09090e] shadow-sm'
                  : 'text-[#a09e9a] hover:text-[#f0ede8]'
              }`}
            >
              Điều khoản dịch vụ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-[#e8b84b] text-[#09090e] shadow-sm'
                  : 'text-[#a09e9a] hover:text-[#f0ede8]'
              }`}
            >
              Chính sách bảo mật
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-[#a09e9a] hover:text-[#f0ede8] flex items-center justify-center border-0 cursor-pointer text-base transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto text-sm text-[#c0bdb8] leading-relaxed space-y-4 font-sans max-h-[60vh]">
          {activeTab === 'terms' ? (
            <>
              <h4 className="text-lg font-bold text-[#f0ede8] font-display">
                ĐIỀU KHOẢN DỊCH VỤ CINEVERSE
              </h4>
              <p className="text-xs text-[#e8b84b]">Cập nhật lần cuối: Ngày 01 tháng 08 năm 2026</p>

              <div className="space-y-3">
                <h5 className="font-bold text-[#f0ede8]">1. Chấp thuận các điều khoản</h5>
                <p>
                  Bằng việc truy cập, đăng ký tài khoản hoặc sử dụng dịch vụ đặt vé xem phim trực tuyến CineVerse, quý khách hàng mặc nhiên đồng ý tuân thủ toàn bộ các quy định và điều khoản được nêu tại đây.
                </p>

                <h5 className="font-bold text-[#f0ede8]">2. Tài khoản người dùng</h5>
                <p>
                  - Quý khách có trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình.<br />
                  - Mọi hoạt động phát sinh từ tài khoản của quý khách sẽ do quý khách chịu trách nhiệm pháp lý.<br />
                  - Quý khách phải cung cấp chính xác email và số điện thoại cá nhân để phục vụ cho việc nhận mã vé điện tử.
                </p>

                <h5 className="font-bold text-[#f0ede8]">3. Quy định đặt vé & Thanh toán</h5>
                <p>
                  - Vé xem phim đã thanh toán thành công <strong>không được hoàn trả hoặc đổi sang suất chiếu khác</strong> ngoại trừ các trường hợp do lỗi kỹ thuật từ phía rạp chiếu.<br />
                  - Quý khách giữ mã vé điện tử (QR Code / Vé SMS) để quét vào phòng chiếu trước thời gian khởi chiếu ít nhất 10 phút.
                </p>

                <h5 className="font-bold text-[#f0ede8]">4. Quy định độ tuổi xem phim</h5>
                <p>
                  Khán giả phải tuân thủ đúng phân loại độ tuổi điện ảnh Việt Nam (P, K, T13, T16, T18). Rạp có quyền từ chối cho vào phòng chiếu và không hoàn tiền nếu khách hàng không xuất trình được giấy tờ tùy thân hợp lệ chứng minh đủ độ tuổi quy định.
                </p>

                <h5 className="font-bold text-[#f0ede8]">5. Quyền sở hữu trí tuệ</h5>
                <p>
                  Nghiêm cấm mọi hành vi sao chép, ghi âm, ghi hình trực tiếp trong phòng chiếu hoặc phát tán nội dung phim dưới mọi hình thức mà không có sự đồng ý bằng văn bản của CineVerse và nhà phát hành.
                </p>
              </div>
            </>
          ) : (
            <>
              <h4 className="text-lg font-bold text-[#f0ede8] font-display">
                CHÍNH SÁCH BẢO MẬT THÔNG TIN CINEVERSE
              </h4>
              <p className="text-xs text-[#e8b84b]">Cập nhật lần cuối: Ngày 01 tháng 08 năm 2026</p>

              <div className="space-y-3">
                <h5 className="font-bold text-[#f0ede8]">1. Thu thập thông tin cá nhân</h5>
                <p>
                  Chúng tôi thu thập các thông tin sau khi quý khách đăng ký hoặc sử dụng dịch vụ: Họ và tên, Email, Số điện thoại, Ngày sinh, Giới tính, Khu vực sinh sống và lịch sử đặt vé.
                </p>

                <h5 className="font-bold text-[#f0ede8]">2. Mục đích sử dụng thông tin</h5>
                <p>
                  - Xác nhận thông tin và gửi mã vé điện tử qua Email / tin nhắn.<br />
                  - Gửi thông báo về lịch chiếu, khuyến mãi đặc quyền dành riêng cho hội viên CineVerse.<br />
                  - Xử lý các yêu cầu hỗ trợ khách hàng và giải quyết khiếu nại.
                </p>

                <h5 className="font-bold text-[#f0ede8]">3. Cam kết bảo mật</h5>
                <p>
                  CineVerse áp dụng các giải pháp mã hóa chuẩn SSL/TLS và mã hóa mật khẩu bcrypt tiên tiến để bảo vệ dữ liệu cá nhân của quý khách khỏi các truy cập trái phép. Chúng tôi cam kết <strong>không bán hoặc chia sẻ thông tin cá nhân</strong> cho bên thứ ba ngoại trừ các đối tác thanh toán đối soát trực tiếp.
                </p>

                <h5 className="font-bold text-[#f0ede8]">4. Quyền của khách hàng</h5>
                <p>
                  Quý khách có quyền truy cập, cập nhật thông tin cá nhân hoặc yêu cầu khóa / xóa tài khoản bất kỳ lúc nào thông qua phần quản lý tài khoản hoặc liên hệ bộ phận hỗ trợ khách hàng qua email support@cineverse.vn.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#161622] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#e8b84b] text-[#09090e] px-6 py-2.5 rounded-lg text-xs font-bold cursor-pointer hover:shadow-[0_4px_16px_rgba(232,184,75,0.3)] transition-all"
          >
            Tôi đã hiểu & Đồng ý
          </button>
        </div>
      </div>
    </div>
  )
}
