import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket } from "../../../shared/lib/socketClient.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

// Keeps the candidate socket connected while the portal is mounted and refreshes react-query
// caches (+ toasts) when the recruiter side pushes an update. The socket authenticates with the
// same httpOnly cookie; the backend routes candidate sockets to their private room (docs/13 §1.2).
export function useCandidateRealtime() {
  const queryClient = useQueryClient();
  const pushToast = useNotificationsStore((s) => s.pushToast);

  useEffect(() => {
    const socket = connectSocket();

    const onNotification = () => queryClient.invalidateQueries({ queryKey: ["candidate", "notifications"] });
    const onInterview = () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "interviews"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "notifications"] });
      pushToast({ tone: "info", message: "A new interview has been scheduled for you." });
    };
    const onApplication = () => queryClient.invalidateQueries({ queryKey: ["candidate", "applications"] });
    const onMessage = (payload) => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "notifications"] });
      if (payload?.conversationId) {
        queryClient.invalidateQueries({ queryKey: ["candidate", "conversation", payload.conversationId] });
      }
    };
    const onOffer = () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "offers"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "applications"] });
      pushToast({ tone: "success", message: "You have received a job offer!" });
    };
    const onAssessment = () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "assessments"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "notifications"] });
      pushToast({ tone: "info", message: "A new assessment has been assigned to you." });
    };
    const onOnboarding = () => {
      queryClient.invalidateQueries({ queryKey: ["candidate", "onboarding"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", "applications"] });
      pushToast({ tone: "success", message: "Welcome aboard — your onboarding has started!" });
    };

    socket.on("candidate:notification:new", onNotification);
    socket.on("candidate:interview:scheduled", onInterview);
    socket.on("candidate:application:updated", onApplication);
    socket.on("candidate:message:new", onMessage);
    socket.on("candidate:offer:released", onOffer);
    socket.on("candidate:assessment:assigned", onAssessment);
    socket.on("candidate:onboarding:started", onOnboarding);

    return () => {
      socket.off("candidate:notification:new", onNotification);
      socket.off("candidate:interview:scheduled", onInterview);
      socket.off("candidate:application:updated", onApplication);
      socket.off("candidate:message:new", onMessage);
      socket.off("candidate:offer:released", onOffer);
      socket.off("candidate:assessment:assigned", onAssessment);
      socket.off("candidate:onboarding:started", onOnboarding);
    };
  }, [queryClient, pushToast]);
}
