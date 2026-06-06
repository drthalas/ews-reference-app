package com.ewsreference.app.devtools.service;

import com.ewsreference.app.devtools.domain.DevSettings;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Service;

@Service
public class DevFailureService {

    public static final int MAX_RESPONSE_DELAY_MS = 5000;

    private final Clock clock;
    private final AtomicInteger responseDelayMs = new AtomicInteger(0);
    private final AtomicBoolean failNextRequest = new AtomicBoolean(false);
    private final AtomicBoolean failNextCommand = new AtomicBoolean(false);
    private final AtomicBoolean staleResponseMode = new AtomicBoolean(false);
    private final AtomicBoolean staleResponseArmed = new AtomicBoolean(false);
    private final AtomicBoolean conflictMode = new AtomicBoolean(false);
    private final AtomicBoolean conflictArmed = new AtomicBoolean(false);
    private final AtomicReference<Instant> lastResetAt;
    private final AtomicReference<String> lastDevAction = new AtomicReference<>("initial seed");

    public DevFailureService() {
        this(Clock.systemUTC());
    }

    DevFailureService(Clock clock) {
        this.clock = clock;
        this.lastResetAt = new AtomicReference<>(Instant.now(clock));
    }

    public DevSettings settings() {
        return new DevSettings(
                responseDelayMs.get(),
                failNextRequest.get(),
                failNextCommand.get(),
                staleResponseMode.get() || staleResponseArmed.get(),
                conflictMode.get() || conflictArmed.get(),
                lastResetAt.get(),
                lastDevAction.get()
        );
    }

    public DevSettings updateSettings(int responseDelayMs, boolean staleResponseMode, boolean conflictMode) {
        validateDelay(responseDelayMs);
        this.responseDelayMs.set(responseDelayMs);
        this.staleResponseMode.set(staleResponseMode);
        this.conflictMode.set(conflictMode);
        recordAction("settings updated");
        return settings();
    }

    public void failNextRequest() {
        failNextRequest.set(true);
        recordAction("fail next request armed");
    }

    public boolean consumeFailNextPatch() {
        return failNextRequest.compareAndSet(true, false);
    }

    public void failNextCommand() {
        failNextCommand.set(true);
        recordAction("fail next command armed");
    }

    public boolean consumeFailNextCommand() {
        return failNextCommand.compareAndSet(true, false);
    }

    public void triggerStaleResponse() {
        staleResponseArmed.set(true);
        recordAction("stale response trigger armed");
    }

    public boolean shouldReturnStaleResponse() {
        if (staleResponseMode.get()) {
            return true;
        }
        return staleResponseArmed.compareAndSet(true, false);
    }

    public void triggerConflict() {
        conflictArmed.set(true);
        recordAction("conflict trigger armed");
    }

    public boolean consumePatchConflict() {
        if (conflictMode.get()) {
            return true;
        }
        return conflictArmed.compareAndSet(true, false);
    }

    public void applyResponseDelay() {
        int delayMs = responseDelayMs.get();
        if (delayMs <= 0) {
            return;
        }
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    public void reset() {
        responseDelayMs.set(0);
        failNextRequest.set(false);
        failNextCommand.set(false);
        staleResponseMode.set(false);
        staleResponseArmed.set(false);
        conflictMode.set(false);
        conflictArmed.set(false);
        lastResetAt.set(Instant.now(clock));
        recordAction("backend state reset");
    }

    public void recordAction(String action) {
        lastDevAction.set(action);
    }

    private void validateDelay(int value) {
        if (value < 0 || value > MAX_RESPONSE_DELAY_MS) {
            throw new DevSettingsValidationException(Map.of(
                    "field", "responseDelayMs",
                    "min", 0,
                    "max", MAX_RESPONSE_DELAY_MS,
                    "actual", value
            ));
        }
    }
}
