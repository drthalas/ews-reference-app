package com.ewsreference.app.devtools.service;

import com.ewsreference.app.command.service.CommandService;
import com.ewsreference.app.devtools.api.UpdateDevSettingsRequest;
import com.ewsreference.app.devtools.domain.DevSettings;
import com.ewsreference.app.workitem.domain.WorkItem;
import com.ewsreference.app.workitem.service.WorkItemService;
import org.springframework.stereotype.Service;

@Service
public class DevWorkItemService {

    private final DevFailureService devFailureService;
    private final WorkItemService workItemService;
    private final CommandService commandService;

    public DevWorkItemService(
            DevFailureService devFailureService,
            WorkItemService workItemService,
            CommandService commandService
    ) {
        this.devFailureService = devFailureService;
        this.workItemService = workItemService;
        this.commandService = commandService;
    }

    public DevSettings settings() {
        return devFailureService.settings();
    }

    public DevSettings updateSettings(UpdateDevSettingsRequest request) {
        DevSettings current = devFailureService.settings();
        int responseDelayMs = request == null || request.responseDelayMs() == null
                ? current.responseDelayMs()
                : request.responseDelayMs();
        boolean staleResponseMode = request == null || request.staleResponseMode() == null
                ? current.staleResponseMode()
                : request.staleResponseMode();
        boolean conflictMode = request == null || request.conflictMode() == null
                ? current.conflictMode()
                : request.conflictMode();

        return devFailureService.updateSettings(responseDelayMs, staleResponseMode, conflictMode);
    }

    public DevSettings reset() {
        commandService.reset();
        workItemService.reset();
        devFailureService.reset();
        return devFailureService.settings();
    }

    public void failNextRequest() {
        devFailureService.applyResponseDelay();
        devFailureService.failNextRequest();
    }

    public void failNextCommand() {
        devFailureService.applyResponseDelay();
        devFailureService.failNextCommand();
    }

    public void triggerStaleResponse() {
        devFailureService.applyResponseDelay();
        devFailureService.triggerStaleResponse();
    }

    public void triggerConflict() {
        devFailureService.applyResponseDelay();
        devFailureService.triggerConflict();
    }

    public WorkItem applyExternalChange(String id) {
        return workItemService.applyExternalChange(id);
    }
}
