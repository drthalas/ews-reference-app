package com.ewsreference.app.devtools.api;

import com.ewsreference.app.devtools.service.DevWorkItemService;
import com.ewsreference.app.workitem.api.WorkItemDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev/work-items")
@Tag(name = "DEV WorkItems", description = "Minimal demo helpers for WorkItem scenarios")
public class DevWorkItemController {

    private final DevWorkItemService service;

    public DevWorkItemController(DevWorkItemService service) {
        this.service = service;
    }

    @PostMapping("/{id}/external-change")
    @Operation(
            summary = "Simulate an external WorkItem change",
            description = "Toggles the WorkItem status and adds the external-change tag for polling demos."
    )
    public WorkItemDto externalChange(@PathVariable String id) {
        return WorkItemDto.fromDomain(service.applyExternalChange(id));
    }
}
