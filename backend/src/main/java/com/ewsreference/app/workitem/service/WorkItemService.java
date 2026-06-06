package com.ewsreference.app.workitem.service;

import com.ewsreference.app.workitem.api.UpdateWorkItemRequest;
import com.ewsreference.app.workitem.domain.WorkItem;
import com.ewsreference.app.workitem.domain.WorkItemPriority;
import com.ewsreference.app.workitem.domain.WorkItemStatus;
import com.ewsreference.app.workitem.storage.WorkItemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class WorkItemService {

    private final WorkItemRepository repository;
    private final Clock clock;

    @Autowired
    public WorkItemService(WorkItemRepository repository) {
        this(repository, Clock.systemUTC());
    }

    WorkItemService(WorkItemRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public List<WorkItem> list() {
        return repository.findAll();
    }

    public WorkItem get(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new WorkItemNotFoundException(id));
    }

    public WorkItem update(String id, UpdateWorkItemRequest request) {
        WorkItem current = get(id);
        WorkItem candidate = applyPatch(current, request);

        if (sameData(current, candidate)) {
            return current;
        }

        WorkItem updated = new WorkItem(
                candidate.id(),
                candidate.title(),
                candidate.status(),
                candidate.priority(),
                candidate.assignee(),
                candidate.tags(),
                current.revision() + 1,
                Instant.now(clock)
        );
        return repository.save(updated);
    }

    public WorkItem applyExternalChange(String id) {
        WorkItem current = get(id);
        WorkItemStatus nextStatus = current.status() == WorkItemStatus.BLOCKED
                ? WorkItemStatus.IN_PROGRESS
                : WorkItemStatus.BLOCKED;
        List<String> tags = new ArrayList<>(current.tags());
        if (!tags.contains("external-change")) {
            tags.add("external-change");
        }

        WorkItem updated = new WorkItem(
                current.id(),
                current.title(),
                nextStatus,
                current.priority(),
                current.assignee(),
                tags,
                current.revision() + 1,
                Instant.now(clock)
        );
        return repository.save(updated);
    }

    private WorkItem applyPatch(WorkItem current, UpdateWorkItemRequest request) {
        if (request == null) {
            return current;
        }

        String title = request.title() == null ? current.title() : parseTitle(request.title());
        WorkItemStatus status = request.status() == null ? current.status() : parseStatus(request.status());
        WorkItemPriority priority = request.priority() == null ? current.priority() : parsePriority(request.priority());
        String assignee = request.assignee() == null ? current.assignee() : parseAssignee(request.assignee());
        List<String> tags = request.tags() == null ? current.tags() : parseTags(request.tags());

        return new WorkItem(
                current.id(),
                title,
                status,
                priority,
                assignee,
                tags,
                current.revision(),
                current.updatedAt()
        );
    }

    private boolean sameData(WorkItem current, WorkItem candidate) {
        return Objects.equals(current.title(), candidate.title())
                && current.status() == candidate.status()
                && current.priority() == candidate.priority()
                && Objects.equals(current.assignee(), candidate.assignee())
                && Objects.equals(current.tags(), candidate.tags());
    }

    private String parseTitle(JsonNode node) {
        if (!node.isTextual() || node.asText().isBlank()) {
            throw validation("title", "Title must be a non-empty string.");
        }
        return node.asText();
    }

    private WorkItemStatus parseStatus(JsonNode node) {
        if (!node.isTextual()) {
            throw validation("status", "Status must be one of: new, in_progress, blocked, done.");
        }
        try {
            return WorkItemStatus.fromValue(node.asText());
        } catch (IllegalArgumentException exception) {
            throw validation("status", "Status must be one of: new, in_progress, blocked, done.");
        }
    }

    private WorkItemPriority parsePriority(JsonNode node) {
        if (!node.isTextual()) {
            throw validation("priority", "Priority must be one of: low, medium, high, critical.");
        }
        try {
            return WorkItemPriority.fromValue(node.asText());
        } catch (IllegalArgumentException exception) {
            throw validation("priority", "Priority must be one of: low, medium, high, critical.");
        }
    }

    private String parseAssignee(JsonNode node) {
        if (node.isNull()) {
            return null;
        }
        if (!node.isTextual()) {
            throw validation("assignee", "Assignee must be a string or null.");
        }
        String value = node.asText();
        return value.isBlank() ? null : value;
    }

    private List<String> parseTags(JsonNode node) {
        if (!node.isArray()) {
            throw validation("tags", "Tags must be an array of strings without null values.");
        }

        List<String> tags = new ArrayList<>();
        for (JsonNode tagNode : node) {
            if (!tagNode.isTextual()) {
                throw validation("tags", "Tags must be an array of strings without null values.");
            }
            tags.add(tagNode.asText());
        }
        return tags;
    }

    private ValidationException validation(String field, String message) {
        return new ValidationException("WorkItem validation failed.", Map.of("field", field, "message", message));
    }
}
