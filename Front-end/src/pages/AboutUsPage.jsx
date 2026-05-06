import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiAward, FiHeart, FiShield, FiStar, FiUsers, FiGlobe, FiFeather, FiCheckCircle, FiBookOpen } from 'react-icons/fi';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './AboutUsPage.css';

const milestones = [
  { year: '01', title: 'Kết nối cộng đồng', description: 'Xây dựng một không gian nơi khách hàng có thể tìm thấy các sản phẩm Công giáo mang ý nghĩa và giá trị bền vững.' },
  { year: '02', title: 'Tôn vinh tay nghề', description: 'Đồng hành cùng nghệ nhân địa phương để giới thiệu kỹ thuật thủ công, chất liệu tốt và tinh thần phụng vụ.' },
  { year: '03', title: 'Cá nhân hóa dễ dàng', description: 'Hỗ trợ đặt hàng riêng, điều chỉnh theo nhu cầu sử dụng, quà tặng và những dịp đặc biệt của giáo xứ.' },
];

const values = [
  { icon: FiHeart, title: 'Tận tâm', text: 'Mỗi sản phẩm được chọn lọc với sự chăm chút trong từng chi tiết.' },
  { icon: FiShield, title: 'Tin cậy', text: 'Quy trình đặt hàng, thanh toán và hỗ trợ được thiết kế minh bạch.' },
  { icon: FiStar, title: 'Chất lượng', text: 'Ưu tiên vật liệu, hoàn thiện và trải nghiệm sử dụng lâu dài.' },
  { icon: FiUsers, title: 'Đồng hành', text: 'Cùng nghệ nhân và khách hàng tạo nên giá trị chung, bền vững.' },
];

const highlights = [
  'Danh mục sản phẩm phong phú cho nhu cầu cá nhân, giáo xứ và quà tặng.',
  'Kết nối trực tiếp với nghệ nhân để tạo sản phẩm theo yêu cầu.',
  'Hỗ trợ tư vấn nhanh chóng, minh bạch và thân thiện.',
  'Tập trung vào giá trị thủ công, thẩm mỹ và ý nghĩa tinh thần.',
];

const stats = [
  { value: '100%', label: 'Tập trung vào giá trị thủ công' },
  { value: '24/7', label: 'Hỗ trợ đặt hàng và theo dõi' },
  { value: '3 bước', label: 'Đặt, duyệt, nhận sản phẩm' },
];

const AboutUsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <Header />

      <main className="about-main">
        <section className="about-hero">
          <div className="container about-hero-grid">
            <div className="about-hero-copy">
              <span className="about-pill">Về chúng tôi</span>
              <h1>Không chỉ là cửa hàng, mà là nơi gìn giữ vẻ đẹp đức tin qua từng sản phẩm thủ công.</h1>
              <p>
                Sanctus được tạo ra để kết nối cộng đồng Công giáo với những nghệ nhân thủ công giàu kinh nghiệm.
                Chúng tôi tin rằng mỗi món quà, vật phẩm phụng vụ hay sản phẩm lưu niệm đều có thể trở thành một
                phần của hành trình đức tin, được kể bằng sự tinh tế và tôn trọng.
              </p>
              <div className="about-hero-actions">
                <button type="button" className="btn btn-primary" onClick={() => navigate('/shop')}>
                  Khám phá sản phẩm <FiArrowRight />
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/custom-order')}>
                  Đặt hàng riêng
                </button>
              </div>

              <div className="about-stats">
                {stats.map((item) => (
                  <article key={item.label} className="about-stat-card">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>
            </div>

            <div className="about-hero-panel">
              <div className="about-hero-card accent">
                <FiBookOpen size={22} />
                <h2>Sứ mệnh của chúng tôi</h2>
                <p>
                  Mang đến một trải nghiệm mua sắm mang tính cộng đồng, nơi giá trị tôn giáo, nghệ thuật và
                  thủ công cùng được đề cao.
                </p>
              </div>
              <div className="about-hero-card">
                <FiGlobe size={22} />
                <h2>Tầm nhìn</h2>
                <p>
                  Trở thành điểm đến tin cậy cho những ai tìm kiếm quà tặng Công giáo và sản phẩm thủ công có
                  chiều sâu văn hóa, thẩm mỹ và ý nghĩa.
                </p>
              </div>
              <div className="about-hero-card highlight-list">
                <div className="about-card-title">
                  <FiFeather size={20} />
                  <h2>Điểm nổi bật</h2>
                </div>
                <ul>
                  {highlights.map((item) => (
                    <li key={item}>
                      <FiCheckCircle size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section about-values-section">
          <div className="container">
            <div className="section-header about-section-header">
              <span className="section-kicker">Giá trị cốt lõi</span>
              <h2>Những nguyên tắc định hình trải nghiệm Sanctus</h2>
              <p>
                Chúng tôi xây dựng nền tảng dựa trên sự tin cậy, chất lượng và tinh thần phục vụ cộng đồng.
              </p>
            </div>

            <div className="about-values-grid">
              {values.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="about-value-card">
                    <div className="about-value-icon"><Icon size={20} /></div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="about-section about-story-section">
          <div className="container about-story-grid">
            <div className="about-story-copy">
              <span className="section-kicker">Hành trình</span>
              <h2>Từ ý tưởng kết nối đến nền tảng đồng hành với nghệ nhân</h2>
              <p>
                Sanctus không chỉ bán sản phẩm. Chúng tôi muốn tạo ra một cầu nối nơi người mua có thể tìm thấy
                sản phẩm phù hợp với nhu cầu, còn nghệ nhân có thêm cơ hội giới thiệu tay nghề của mình đến đúng
                cộng đồng đang trân trọng những giá trị ấy.
              </p>
              <div className="about-timeline">
                {milestones.map((item) => (
                  <article key={item.year} className="timeline-item">
                    <div className="timeline-year">{item.year}</div>
                    <div className="timeline-content">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="about-story-panel">
              <div className="about-story-quote">
                <FiAward size={24} />
                <p>
                  “Mỗi sản phẩm thủ công đều xứng đáng được kể bằng một câu chuyện đẹp, trung thực và giàu ý nghĩa.”
                </p>
              </div>
              <div className="about-story-metrics">
                <div>
                  <strong>01</strong>
                  <span>Chuẩn hóa quy trình đặt hàng</span>
                </div>
                <div>
                  <strong>02</strong>
                  <span>Kết nối nghệ nhân theo nhu cầu</span>
                </div>
                <div>
                  <strong>03</strong>
                  <span>Hỗ trợ sau bán hàng tận tâm</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section about-cta-section">
          <div className="container about-cta-box">
            <div>
              <span className="about-pill">Bắt đầu ngay</span>
              <h2>Khám phá những sản phẩm mang đậm tinh thần Công giáo và tay nghề thủ công Việt.</h2>
              <p>
                Dù bạn đang tìm một món quà ý nghĩa hay cần thiết kế riêng cho nhu cầu cá nhân, Sanctus luôn sẵn
                sàng đồng hành.
              </p>
            </div>
            <div className="about-cta-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/shop')}>
                Xem cửa hàng <FiArrowRight />
              </button>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/templates')}>
                Xem mẫu cá nhân hóa
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUsPage;
