using System.ComponentModel.DataAnnotations;

namespace TaskManagementApi.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty; // الباسورد مشفر

        // ربط المستخدم بالمهام (كل مستخدم لديه قائمة مهام)
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    }
}