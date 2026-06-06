package com.ewsreference.app.devtools.service;

import com.ewsreference.app.workitem.domain.WorkItem;
import java.util.LinkedHashMap;
import java.util.Map;

public class DevConflictException extends RuntimeException {

    private final Map<String, Object> details;

    public DevConflictException(WorkItem serverWorkItem) {
        super("DEV conflict was triggered for the next WorkItem PATCH request.");
        Map<String, Object> serverFields = new LinkedHashMap<>();
        serverFields.put("id", serverWorkItem.id());
        serverFields.put("title", serverWorkItem.title());
        serverFields.put("status", serverWorkItem.status());
        serverFields.put("priority", serverWorkItem.priority());
        serverFields.put("assignee", serverWorkItem.assignee());
        serverFields.put("tags", serverWorkItem.tags());
        serverFields.put("revision", serverWorkItem.revision());
        serverFields.put("updatedAt", serverWorkItem.updatedAt());
        serverFields.put("pendingOperation", serverWorkItem.pendingOperation());

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("workItemId", serverWorkItem.id());
        details.put("clientRevision", Math.max(0, serverWorkItem.revision() - 1));
        details.put("serverRevision", serverWorkItem.revision());
        details.put("serverWorkItem", serverFields);
        this.details = details;
    }

    public Map<String, Object> details() {
        return details;
    }
}
