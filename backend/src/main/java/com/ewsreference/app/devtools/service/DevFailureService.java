package com.ewsreference.app.devtools.service;

import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.stereotype.Service;

@Service
public class DevFailureService {

    private final AtomicBoolean failNextRequest = new AtomicBoolean(false);

    public void failNextRequest() {
        failNextRequest.set(true);
    }

    public boolean consumeFailNextPatch() {
        return failNextRequest.compareAndSet(true, false);
    }
}
