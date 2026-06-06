package com.ewsreference.app.workitem.api;

import com.ewsreference.app.workitem.domain.WorkItem;
import com.ewsreference.app.workitem.domain.WorkItemPriority;
import com.ewsreference.app.workitem.domain.WorkItemStatus;
import java.time.Instant;
import java.util.List;

public record WorkItemDto(
        String id,
        String title,
        WorkItemStatus status,
        WorkItemPriority priority,
        String assignee,
        List<String> tags,
        long revision,
        Instant updatedAt
) {
    public static WorkItemDto fromDomain(WorkItem workItem) {
        return new WorkItemDto(
                workItem.id(),
                workItem.title(),
                workItem.status(),
                workItem.priority(),
                workItem.assignee(),
                workItem.tags(),
                workItem.revision(),
                workItem.updatedAt()
        );
    }
}
