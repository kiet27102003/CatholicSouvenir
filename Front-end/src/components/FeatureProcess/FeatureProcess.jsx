import React from 'react';
import './FeatureProcess.css';

const steps = [
    {
        num: '01',
        title: 'DANH MỤC SẢN PHẨM',
        desc: 'Duyệt và mua sắm các sản phẩm thủ công đã được duyệt từ nghệ nhân uy tín.',
    },
    {
        num: '02',
        title: 'YÊU CẦU ĐẶT LÀM RIÊNG',
        desc: 'Gửi yêu cầu thiết kế riêng, nghệ nhân báo giá và xác nhận trước khi sản xuất.',
    },
    {
        num: '03',
        title: 'THANH TOÁN THEO GIAI ĐOẠN',
        desc: 'Thanh toán qua ký quỹ, giải phóng khi đơn hàng hoàn thành.',
    },
    {
        num: '04',
        title: 'CÔNG CỤ HỖ TRỢ AI',
        desc: 'Tích hợp AI gợi ý hình ảnh, mẫu thiết kế cho đơn đặt làm riêng.',
    },
];

const FeatureProcess = () => {
    return (
        <section className="feature-process section">
            <div className="container">
                <div className="feature-process-grid">
                    <div className="process-left">
                        <h2 className="process-title">QUY TRÌNH TÍNH NĂNG</h2>
                        <ul className="process-list">
                            {steps.map((step, idx) => (
                                <li key={idx} className="process-item">
                                    <span className="process-num">{step.num}</span>
                                    <div>
                                        <h3 className="process-item-title">{step.title}</h3>
                                        <p className="process-item-desc">{step.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="process-right">
                        <h2 className="process-title">SƠ ĐỒ LUỒNG CÔNG VIỆC</h2>
                        <div className="workflow-diagram">
                            {/* Đơn hàng đặt riêng */}
                            <div className="workflow-flow">
                                <h3 className="workflow-flow-title">ĐƠN HÀNG ĐẶT RIÊNG (QUY TRÌNH PHỨC TẠP)</h3>
                                <div className="workflow-row">
                                    <div className="workflow-box">YÊU CẦU</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box">BÁO GIÁ</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box">LỰA CHỌN</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box">ĐẶT CỌC</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box">GIAI ĐOẠN 1</div>
                                </div>
                                <div className="workflow-row">
                                    <div className="workflow-box">GIAO HÀNG</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box workflow-box-accent">HOÀN TẤT</div>
                                </div>
                            </div>
                            {/* Mua hàng trực tiếp */}
                            <div className="workflow-flow">
                                <h3 className="workflow-flow-title">MUA HÀNG TRỰC TIẾP (SẢN PHẨM CÓ SẴN)</h3>
                                <div className="workflow-row">
                                    <div className="workflow-box">DANH MỤC</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box">GIỎ HÀNG</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box">THANH TOÁN</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box">XỬ LÝ</div>
                                    <span className="workflow-arrow">→</span>
                                    <div className="workflow-box">GIAO HÀNG</div>
                                </div>
                            </div>
                        </div>
                        <div className="ux-design">
                            <h3 className="ux-title">HỆ THỐNG THIẾT KẾ UI/UX</h3>
                            <ul className="ux-list">
                                <li>Thiết kế hiện đại, tinh tế</li>
                                <li>Tối ưu cho người dùng</li>
                                <li>Phù hợp văn hóa Công giáo</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeatureProcess;
