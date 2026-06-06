package com.ewsreference.app.devtools.service;

import com.ewsreference.app.workitem.domain.WorkItem;
import com.ewsreference.app.workitem.service.WorkItemService;
import org.springframework.stereotype.Service;

@Service
public class DevWorkItemService {

    private final WorkItemService workItemService;

    public DevWorkItemService(WorkItemService workItemService) {
        this.workItemService = workItemService;
    }

    public WorkItem applyExternalChange(String id) {
        return workItemService.applyExternalChange(id);
    }
}
