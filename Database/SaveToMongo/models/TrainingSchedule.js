const mongoose = require('mongoose');

const TrainingScheduleSchema = new mongoose.Schema({
  academicYear: { type: String, required: true }, // Ví dụ: "2024-2025"
  systems: [
    {
      systemName: { type: String, required: true }, // Ví dụ: "Chính quy"
      educational_format: [
        {
          format_name: { type: String }, // Có thể để trống
          courses: [
            {
              program_id: [{ type: String, required: true }], // Ví dụ: ["K2024"]
              activities: [
                {
                  title: { type: String, required: true },
                  description: { type: String },
                  date: [
                    {
                      startDate: { type: Date, required: true },
                      endDate: { type: Date, required: true }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      common_activities: [
        {
          activities_title: { type: String }, // Ví dụ: "Học kì hè"
          activities: [
            {
              title: { type: String, required: true },
              description: { type: String },
              date: [
                {
                  startDate: { type: Date, required: true },
                  endDate: { type: Date, required: true }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}, { collection: "training_schedule", timestamps: true });

module.exports = mongoose.model('TrainingSchedule', TrainingScheduleSchema);

