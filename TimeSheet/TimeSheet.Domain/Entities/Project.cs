namespace TimeSheet.Domain.Entities;

public class Project
{
    public int Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public DateTime StartDate { get; private set; }
}