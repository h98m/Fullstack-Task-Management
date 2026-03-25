using System.ComponentModel.DataAnnotations;

namespace TaskManagementApi.Models
{
    public enum TaskStatus { Todo, InProgress, Completed }

    public class TaskItem
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "العنوان مطلوب")]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public TaskStatus Status { get; set; } = TaskStatus.Todo;
        public DateTime? DueDate { get; set; }

        // --- أضف هذين السطرين هنا يا حجي ---
        public int? UserId { get; set; } // رقم المستخدم صاحب المهمة
        public User? User { get; set; }  // كائن المستخدم للربط البرمجي
    }
}