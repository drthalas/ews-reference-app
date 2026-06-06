package com.ewsreference.app.workitem.storage;

import com.ewsreference.app.workitem.domain.WorkItem;
import com.ewsreference.app.workitem.domain.WorkItemPriority;
import com.ewsreference.app.workitem.domain.WorkItemStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryWorkItemRepository implements WorkItemRepository {

    private final ConcurrentHashMap<String, WorkItem> items = new ConcurrentHashMap<>();

    public InMemoryWorkItemRepository() {
        seed();
    }

    @Override
    public List<WorkItem> findAll() {
        return items.values().stream()
                .sorted((left, right) -> left.id().compareTo(right.id()))
                .toList();
    }

    @Override
    public Optional<WorkItem> findById(String id) {
        return Optional.ofNullable(items.get(id));
    }

    @Override
    public WorkItem save(WorkItem workItem) {
        items.put(workItem.id(), workItem);
        return workItem;
    }

    @Override
    public void reset() {
        items.clear();
        seed();
    }

    private void seed() {
        Instant seedTime = Instant.parse("2026-06-06T00:00:00Z");
        save(new WorkItem(
                "wi-1",
                "Review intake",
                WorkItemStatus.NEW,
                WorkItemPriority.MEDIUM,
                "Alex",
                List.of("intake", "backend"),
                1,
                seedTime,
                null
        ));
        save(new WorkItem(
                "wi-2",
                "Prepare field validation",
                WorkItemStatus.IN_PROGRESS,
                WorkItemPriority.HIGH,
                "Morgan",
                List.of("validation"),
                1,
                seedTime,
                null
        ));
        save(new WorkItem(
                "wi-3",
                "Confirm error contract",
                WorkItemStatus.BLOCKED,
                WorkItemPriority.CRITICAL,
                null,
                List.of("api", "errors"),
                1,
                seedTime,
                null
        ));
        save(new WorkItem(
                "wi-4",
                "Document seed data",
                WorkItemStatus.DONE,
                WorkItemPriority.LOW,
                "Sam",
                List.of("docs"),
                1,
                seedTime,
                null
        ));
    }
}
