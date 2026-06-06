package com.ewsreference.app.workitem.api;

import com.ewsreference.app.workitem.service.WorkItemService;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/work-items")
public class WorkItemController {

    private final WorkItemService service;

    public WorkItemController(WorkItemService service) {
        this.service = service;
    }

    @Operation(summary = "List WorkItems", description = "Returns deterministic in-memory WorkItem seed data.")
    @GetMapping
    public List<WorkItemDto> listWorkItems() {
        return service.list().stream()
                .map(WorkItemDto::fromDomain)
                .toList();
    }

    @Operation(summary = "Get a WorkItem", description = "Returns a single WorkItem by id.")
    @GetMapping("/{id}")
    public WorkItemDto getWorkItem(@PathVariable String id) {
        return WorkItemDto.fromDomain(service.get(id));
    }

    @Operation(summary = "Patch a WorkItem", description = "Partially updates title, status, priority, assignee, or tags.")
    @PatchMapping("/{id}")
    public WorkItemDto updateWorkItem(@PathVariable String id, @RequestBody UpdateWorkItemRequest request) {
        return WorkItemDto.fromDomain(service.update(id, request));
    }
}
