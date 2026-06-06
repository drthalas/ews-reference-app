package com.ewsreference.app.devtools.service;

import com.ewsreference.app.workitem.domain.WorkItem;
import com.ewsreference.app.workitem.service.WorkItemService;
import org.springframework.stereotype.Service;

@Service
public class DevWorkItemService {

    private final DevFailureService devFailureService;
    private final WorkItemService workItemService;

    public DevWorkItemService(DevFailureService devFailureService, WorkItemService workItemService) {
        this.devFailureService = devFailureService;
        this.workItemService = workItemService;
    }

    public void failNextRequest() {
        devFailureService.failNextRequest();
    }

    public WorkItem applyExternalChange(String id) {
        return workItemService.applyExternalChange(id);
    }
}
