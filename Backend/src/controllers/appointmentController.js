

import Appointment from "../models/Appointment.js";

export const createAppointment = async (req, res) => {
  try {
    const { userID, service, date, timeSlot, notes } = req.body;
    console.log(req.body);
    
    
    

    if (!userID || !service || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "All required fields are missing",
      });
    }

    const existing = await Appointment.findOne({
      date,
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This slot is already booked",
      });
    }

    const appointment = await Appointment.create({
        userID,
      service,
      date,
      timeSlot,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyAppointments = async (req, res) => {
    try {
        
        const { status, page = 1, limit = 10 } = req.query;
        
        const query = { userID: req.params.userId};
        
        if (status && status !== 'all') {
          query.status = status;
        }
    
        const skip = (parseInt(page) - 1) * parseInt(limit);
    
        const appointments = await Appointment.find(query)
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('userID', 'name email phone');
    
        const total = await Appointment.countDocuments(query);
    
        // Get counts by status
        const statusCounts = await Appointment.aggregate([
          { $match: { userID: req.params.userId} },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);
    
        const counts = {
          total: total,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        };
    
        statusCounts.forEach(item => {
          counts[item._id] = item.count;
        });
    
        res.json({
          success: true,
          appointments,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          counts,
        });
      } catch (error) {
        console.error('Error fetching my appointments:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch appointments',
        });
      } 
}


// ===============================
// GET ALL APPOINTMENTS (ADMIN)
// ===============================

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("userID", "fullName phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAppointmentStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
        const [totalStats, todayStats, weekStats, monthStats] = await Promise.all([
          Appointment.aggregate([
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
              },
            },
          ]),
          Appointment.countDocuments({ date: { $gte: today }, status: { $ne: 'cancelled' } }),
          Appointment.countDocuments({ date: { $gte: thisWeek }, status: { $ne: 'cancelled' } }),
          Appointment.countDocuments({ date: { $gte: thisMonth }, status: { $ne: 'cancelled' } }),
        ]);

        
    
        res.json({
          success: true,
          stats: {
            total: totalStats[0]?.total || 0,
            pending: totalStats[0]?.pending || 0,
            confirmed: totalStats[0]?.confirmed || 0,
            completed: totalStats[0]?.completed || 0,
            cancelled: totalStats[0]?.cancelled || 0,
            today: todayStats,
            thisWeek: weekStats,
            thisMonth: monthStats,
          },
        });
      } catch (error) {
        console.error('Error fetching appointment stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch statistics',
        });
      }
}


// ===============================
// UPDATE STATUS
// ===============================

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Status updated",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};