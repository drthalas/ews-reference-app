package com.ewsreference.app.workitem.domain;

import java.time.Instant;
import java.util.List;

public record WorkItem(
        String id,
        String title,
        WorkItemStatus status,
        WorkItemPriority priority,
        String assignee,
        List<String> tags,
        long revision,
        Instant updatedAt
) {
    public WorkItem {
        tags = List.copyOf(tags);
    }
}
