package com.ewsreference.app.workitem.storage;

import com.ewsreference.app.workitem.domain.WorkItem;
import java.util.List;
import java.util.Optional;

public interface WorkItemRepository {

    List<WorkItem> findAll();

    Optional<WorkItem> findById(String id);

    WorkItem save(WorkItem workItem);

    void reset();
}
