package com.ewsreference.app.devtools.api;

import com.ewsreference.app.devtools.domain.DevSettings;
import com.ewsreference.app.devtools.service.DevWorkItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @GetMapping("/settings")
    @Operation(
            summary = "Read current DEV settings",
            description = "Returns local-only simulation settings and one-shot flags."
    )
    public DevSettings settings() {
        return service.settings();
    }

    @PutMapping("/settings")
    @Operation(
            summary = "Update DEV settings",
            description = "Updates response delay, stale response mode, and conflict mode."
    )
    public DevSettings updateSettings(@RequestBody(required = false) UpdateDevSettingsRequest request) {
        return service.updateSettings(request);
    }

    @PostMapping("/reset")
    @Operation(
            summary = "Reset in-memory demo state",
            description = "Restores deterministic WorkItem seed data, clears command operations, and resets DEV flags."
    )
    public DevSettings reset() {
        return service.reset();
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

    @PostMapping("/fail-next-command")
    @Operation(
            summary = "Fail the next async command",
            description = "Arms a one-shot flag so the next accepted WorkItem command completes as failed."
    )
    public Map<String, Object> failNextCommand() {
        service.failNextCommand();
        return Map.of("failNextCommand", true);
    }

    @PostMapping("/trigger-stale-response")
    @Operation(
            summary = "Trigger a stale WorkItem response",
            description = "Arms a one-shot stale response for the next eligible WorkItem list or detail request."
    )
    public Map<String, Object> triggerStaleResponse() {
        service.triggerStaleResponse();
        return Map.of("staleResponseMode", true);
    }

    @PostMapping("/trigger-conflict")
    @Operation(
            summary = "Trigger a DEV WorkItem conflict",
            description = "Arms a one-shot 409 DEV_CONFLICT response for the next WorkItem PATCH request."
    )
    public Map<String, Object> triggerConflict() {
        service.triggerConflict();
        return Map.of("conflictMode", true);
    }
}
