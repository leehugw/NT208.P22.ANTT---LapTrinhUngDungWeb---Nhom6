const LecturerInformationService = require('../../Services/lecturer/LecturerInformationService');

class LecturerInformationController {
    static async getProfile(req, res) {
        try {
            const userRole = req.user.role;
            let lecturer_id;
    
            if (userRole === 'lecturer') {
                lecturer_id = req.user.lecturer_id; // Giảng viên chỉ xem được chính họ
            } else if (userRole === 'admin') {
                lecturer_id = req.query.lecturer_id; // Admin có thể xem bất kỳ ai
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền truy cập vào thông tin này"
                });
            }
    
            if (!lecturer_id) {
                return res.status(400).json({ 
                    success: false,
                    message: "Vui lòng cung cấp lecturer_id" 
                });
            }
    
            const profile = await LecturerInformationService.getLecturerProfile(lecturer_id);
            
            return res.json({
                success: true,
                type: "lecturer",
                data: profile
            });
        } catch (error) {
            console.error("Lỗi server:", error);
            res.status(500).json({ 
                success: false,
                message: error.message || "Lỗi server",
                error: error.message 
            });
        }
    }    
}

module.exports = LecturerInformationController;