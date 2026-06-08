import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock, type MockProxy } from "vitest-mock-extended";
import { SmartFurnitureHookupMessageHandler } from "@presentation/event/handlers/SmartFurnitureHookupMessageHandler";
import type { SmartFurnitureHookupService } from "@application/inbound/SmartFurnitureHookupService";
import type { InboxRepository } from "@infrastructure/persistance/inbox/InboxRepository";
import type { DlqPublisher } from "@infrastructure/messaging/DlqPublisher";
import { UnrecoverableError } from "@presentation/event/errors";
import { aSmartFurnitureHookup } from "@test/domainFactories";
import {
  aCreatedEvent,
  aDeletedEvent,
  rawEnvelope,
} from "@test/eventFactories";

describe("SmartFurnitureHookupMessageHandler", () => {
  let service: MockProxy<SmartFurnitureHookupService>;
  let inbox: MockProxy<InboxRepository>;
  let dlq: MockProxy<DlqPublisher>;
  let handler: SmartFurnitureHookupMessageHandler;

  beforeEach(() => {
    service = mock<SmartFurnitureHookupService>();
    inbox = mock<InboxRepository>();
    dlq = mock<DlqPublisher>();

    inbox.tryAcquire.mockResolvedValue(true);
    service.createSmartFurnitureHookup.mockResolvedValue(
      aSmartFurnitureHookup({ id: "sfh-1" }),
    );
    service.deleteSmartFurnitureHookup.mockResolvedValue(undefined);

    handler = new SmartFurnitureHookupMessageHandler(service, inbox, dlq);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("happy paths", () => {
    it("processes a SmartFurnitureHookupCreatedEvent by creating the hookup", async () => {
      await handler.handle(aCreatedEvent("sfh-42", { eventId: "evt-1" }));

      expect(inbox.tryAcquire).toHaveBeenCalledWith("evt-1");
      expect(service.createSmartFurnitureHookup).toHaveBeenCalledWith("sfh-42");
      expect(dlq.publish).not.toHaveBeenCalled();
    });

    it("processes a SmartFurnitureHookupDeletedEvent by deleting the hookup", async () => {
      await handler.handle(aDeletedEvent("sfh-7"));

      expect(service.deleteSmartFurnitureHookup).toHaveBeenCalledWith("sfh-7");
      expect(dlq.publish).not.toHaveBeenCalled();
    });
  });

  describe("idempotency via the inbox", () => {
    it("skips processing when the eventId was already acquired", async () => {
      inbox.tryAcquire.mockResolvedValue(false);

      await handler.handle(aCreatedEvent("sfh-1"));

      expect(service.createSmartFurnitureHookup).not.toHaveBeenCalled();
      expect(dlq.publish).not.toHaveBeenCalled();
    });
  });

  describe("poison messages are routed to the DLQ", () => {
    it("dead-letters malformed JSON without touching the inbox", async () => {
      await handler.handle("not-json{");

      expect(dlq.publish).toHaveBeenCalledTimes(1);
      const [raw, reason] = dlq.publish.mock.calls[0];
      expect(raw).toBe("not-json{");
      expect(reason).toBeInstanceOf(UnrecoverableError);
      expect(inbox.tryAcquire).not.toHaveBeenCalled();
      expect(service.createSmartFurnitureHookup).not.toHaveBeenCalled();
    });

    it("dead-letters an envelope that fails schema validation", async () => {
      // Missing the required eventType field.
      await handler.handle(JSON.stringify({ eventId: "evt-1" }));

      expect(dlq.publish).toHaveBeenCalledTimes(1);
      expect(dlq.publish.mock.calls[0][1]).toBeInstanceOf(UnrecoverableError);
      expect(inbox.tryAcquire).not.toHaveBeenCalled();
    });

    it("dead-letters an unknown eventType", async () => {
      await handler.handle(rawEnvelope({ eventType: "SomethingElseEvent" }));

      expect(dlq.publish).toHaveBeenCalledTimes(1);
      const reason = dlq.publish.mock.calls[0][1] as UnrecoverableError;
      expect(reason).toBeInstanceOf(UnrecoverableError);
      expect(reason.message).toContain("Unexpected eventType");
      expect(inbox.tryAcquire).not.toHaveBeenCalled();
      expect(service.createSmartFurnitureHookup).not.toHaveBeenCalled();
    });

    it("dead-letters a payload that fails its schema", async () => {
      await handler.handle(
        rawEnvelope({
          eventType: "SmartFurnitureHookupCreatedEvent",
          payload: { wrong: "field" },
        }),
      );

      expect(dlq.publish).toHaveBeenCalledTimes(1);
      expect(dlq.publish.mock.calls[0][1]).toBeInstanceOf(UnrecoverableError);
      expect(inbox.tryAcquire).not.toHaveBeenCalled();
      expect(service.createSmartFurnitureHookup).not.toHaveBeenCalled();
    });
  });

  describe("retry behaviour (withRetry, fake timers)", () => {
    it("retries a transient (thrown) failure and succeeds without dead-lettering", async () => {
      vi.useFakeTimers();
      service.createSmartFurnitureHookup
        .mockRejectedValueOnce(new Error("flaky"))
        .mockRejectedValueOnce(new Error("flaky"))
        .mockResolvedValueOnce(aSmartFurnitureHookup({ id: "sfh-1" }));

      const pending = handler.handle(aCreatedEvent("sfh-1"));
      await vi.runAllTimersAsync();
      await pending;

      expect(service.createSmartFurnitureHookup).toHaveBeenCalledTimes(3);
      expect(dlq.publish).not.toHaveBeenCalled();
    });

    it("dead-letters the original raw message after retries are exhausted", async () => {
      vi.useFakeTimers();
      const boom = new Error("always fails");
      service.createSmartFurnitureHookup.mockRejectedValue(boom);

      const pending = handler.handle(
        aCreatedEvent("sfh-1", { eventId: "evt-1" }),
      );
      await vi.runAllTimersAsync();
      await pending;

      expect(service.createSmartFurnitureHookup).toHaveBeenCalledTimes(3);
      expect(dlq.publish).toHaveBeenCalledTimes(1);
      const [raw, reason] = dlq.publish.mock.calls[0];
      expect(JSON.parse(raw as string).eventId).toBe("evt-1");
      expect(reason).toBe(boom);
    });
  });

  describe("behaviour worth pinning down", () => {
    it("does NOT retry or dead-letter when the service RETURNS an Error (vs throwing)", async () => {
      // Domain failures are returned, not thrown, so withRetry treats the call
      // as a success: no retry, no DLQ. This documents a likely gap.
      service.createSmartFurnitureHookup.mockResolvedValue(
        new Error("AlreadyExists"),
      );

      await handler.handle(aCreatedEvent("sfh-1"));

      expect(service.createSmartFurnitureHookup).toHaveBeenCalledTimes(1);
      expect(dlq.publish).not.toHaveBeenCalled();
    });
  });
});
