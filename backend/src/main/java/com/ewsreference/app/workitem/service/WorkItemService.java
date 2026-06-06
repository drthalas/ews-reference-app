package com.ewsreference.app.workitem.service;

import com.ewsreference.app.devtools.service.DevFailureService;
import com.ewsreference.app.devtools.service.DevConflictException;
import com.ewsreference.app.devtools.service.DevForcedFailureException;
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
    private final DevFailureService devFailureService;

    @Autowired
    public WorkItemService(WorkItemRepository repository, DevFailureService devFailureService) {
        this(repository, Clock.systemUTC(), devFailureService);
    }

    WorkItemService(WorkItemRepository repository, Clock clock) {
        this(repository, clock, new DevFailureService());
    }

    WorkItemService(WorkItemRepository repository, Clock clock, DevFailureService devFailureService) {
        this.repository = repository;
        this.clock = clock;
        this.devFailureService = devFailureService;
    }

    public List<WorkItem> list() {
        devFailureService.applyResponseDelay();
        List<WorkItem> items = repository.findAll();
        if (!devFailureService.shouldReturnStaleResponse()) {
            return items;
        }
        devFailureService.recordAction("stale WorkItem list response returned");
        return items.stream().map(this::toStaleResponse).toList();
    }

    public WorkItem get(String id) {
        devFailureService.applyResponseDelay();
        WorkItem current = findRequired(id);
        if (devFailureService.shouldReturnStaleResponse()) {
            devFailureService.recordAction("stale WorkItem detail response returned");
            return toStaleResponse(current);
        }
        return current;
    }

    private WorkItem findRequired(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new WorkItemNotFoundException(id));
    }

    public WorkItem update(String id, UpdateWorkItemRequest request) {
        devFailureService.applyResponseDelay();
        if (devFailureService.consumeFailNextPatch()) {
            throw new DevForcedFailureException(id);
        }

        WorkItem current = findRequired(id);
        if (devFailureService.consumePatchConflict()) {
            throw new DevConflictException(current);
        }

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
                Instant.now(clock),
                current.pendingOperation()
        );
        return repository.save(updated);
    }

    public WorkItem applyExternalChange(String id) {
        devFailureService.applyResponseDelay();
        WorkItem current = findRequired(id);
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
                Instant.now(clock),
                current.pendingOperation()
        );
        return repository.save(updated);
    }

    public WorkItem markPendingOperation(String id, String operationId) {
        WorkItem current = findRequired(id);
        if (current.pendingOperation() != null) {
            throw validation("pendingOperation", "WorkItem already has a pending operation.");
        }

        WorkItem updated = new WorkItem(
                current.id(),
                current.title(),
                current.status(),
                current.priority(),
                current.assignee(),
                current.tags(),
                current.revision() + 1,
                Instant.now(clock),
                operationId
        );
        return repository.save(updated);
    }

    public WorkItem completePendingOperation(String id, String operationId) {
        WorkItem current = findRequired(id);
        if (!Objects.equals(current.pendingOperation(), operationId)) {
            return current;
        }

        WorkItem updated = new WorkItem(
                current.id(),
                current.title(),
                WorkItemStatus.DONE,
                current.priority(),
                current.assignee(),
                current.tags(),
                current.revision() + 1,
                Instant.now(clock),
                null
        );
        return repository.save(updated);
    }

    public WorkItem clearPendingOperation(String id, String operationId) {
        WorkItem current = findRequired(id);
        if (!Objects.equals(current.pendingOperation(), operationId)) {
            return current;
        }

        WorkItem updated = new WorkItem(
                current.id(),
                current.title(),
                current.status(),
                current.priority(),
                current.assignee(),
                current.tags(),
                current.revision() + 1,
                Instant.now(clock),
                null
        );
        return repository.save(updated);
    }

    public void reset() {
        repository.reset();
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
                current.updatedAt(),
                current.pendingOperation()
        );
    }

    private boolean sameData(WorkItem current, WorkItem candidate) {
        return Objects.equals(current.title(), candidate.title())
                && current.status() == candidate.status()
                && current.priority() == candidate.priority()
                && Objects.equals(current.assignee(), candidate.assignee())
                && Objects.equals(current.tags(), candidate.tags());
    }

    private WorkItem toStaleResponse(WorkItem current) {
        return new WorkItem(
                current.id(),
                current.title(),
                current.status(),
                current.priority(),
                current.assignee(),
                current.tags(),
                Math.max(0, current.revision() - 1),
                current.updatedAt().minusSeconds(1),
                current.pendingOperation()
        );
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
