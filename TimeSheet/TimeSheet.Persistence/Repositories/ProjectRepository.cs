using TimeSheet.Domain.Entities;
using TimeSheet.Domain.Interfaces;

namespace TimeSheet.Persistence.Repositories;

internal sealed class ProjectRepository: Repository<Project>, IProjectRepository
{
    public ProjectRepository(ApplicationDbContext context)
        : base(context)
    {
        
    }
}
