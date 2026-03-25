using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagementApi.Data;
using TaskManagementApi.Models;

namespace TaskManagementApi.Controllers
{
    [Authorize] // هذا هو القفل
    [ApiController]
    [Route("api/[controller]")]

    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }
        [HttpPost]
        public async Task<ActionResult<TaskItem>> PostTask(TaskItem taskItem)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            // ربط المهمة بالمستخدم الحالي
            taskItem.UserId = int.Parse(userIdClaim.Value);

            _context.Tasks.Add(taskItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTask), new { id = taskItem.Id }, taskItem);
        }
        // 1. دالة التعديل (Update Task) - استبدل أو أضف هذه الدالة
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTask(int id, TaskItem taskItem)
        {
            // استخراج رقم المستخدم من التوكن للتأكد من الخصوصية
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);

            // البحث عن المهمة الأصلية في قاعدة البيانات
            var existingTask = await _context.Tasks.FindAsync(id);

            if (existingTask == null) return NotFound();

            // التأكد أن المستخدم يملك هذه المهمة فعلاً
            if (existingTask.UserId != userId) return Forbid();

            // تحديث البيانات فقط
            existingTask.Title = taskItem.Title;
            existingTask.DueDate = taskItem.DueDate;
            // يمكنك إضافة تحديث الحالة هنا أيضاً إذا أردت

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TaskExists(id)) return NotFound();
                else throw;
            }

            return Ok(existingTask); // إرجاع المهمة بعد التعديل
        }

        // دالة مساعدة (تأكد من وجودها في أسفل الكلاس)
        private bool TaskExists(int id)
        {
            return _context.Tasks.Any(e => e.Id == id);
        }
        // جلب كل المهام
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
        {
            // استخراج رقم المستخدم (Id) من التوكن
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            int userId = int.Parse(userIdClaim.Value);

            // جلب المهام التي تملك هذا الـ UserId فقط
            return await _context.Tasks
                .Where(t => t.UserId == userId)
                .ToListAsync();
        }

        // جلب مهمة واحدة
        [HttpGet("{id}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();
            return task;
        }
       
        // إضافة مهمة جديدة


        // تبديل حالة الإكمال
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> ToggleComplete(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            task.Status = task.Status == Models.TaskStatus.Todo ? Models.TaskStatus.Completed : Models.TaskStatus.Todo;
            await _context.SaveChangesAsync();
            return Ok(task);
        }

        // حذف مهمة
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}