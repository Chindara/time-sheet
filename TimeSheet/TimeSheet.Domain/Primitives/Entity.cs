namespace TimeSheet.Domain.Primitives;

public abstract class Entity
{
    private readonly List<DomainEvent> _domainEvent = new();

    public IReadOnlyCollection<DomainEvent> GetDomainEvents() => _domainEvent.ToList();

    public void ClearDomainEvents()
    {
        _domainEvent.Clear();
    }

    protected void Raise(DomainEvent domainEvent)
    {   
        _domainEvent.Add(domainEvent);
    }
}
