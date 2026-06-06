package com.ewsreference.app.devtools.api;

import com.ewsreference.app.devtools.service.DevWorkItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev")
@Tag(name = "DEV Simulation", description = "Minimal demo helpers for failure scenarios")
public class DevSimulationController {

    private final DevWorkItemService service;

    public DevSimulationController(DevWorkItemService service) {
        this.service = service;
    }

    @PostMapping("/fail-next-request")
    @Operation(
            summary = "Fail the next WorkItem PATCH request",
            description = "Arms a one-shot DEV failure so the next WorkItem PATCH returns DEV_FORCED_FAILURE."
    )
    public Map<String, Object> failNextRequest() {
        service.failNextRequest();
        return Map.of("failNextRequest", true);
    }
}
