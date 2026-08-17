import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { messagingApi } from "../services/messagingApi.js";
import { candidatesApi } from "../../candidates/services/candidatesApi.js";
import { useNotificationsStore } from "../../../shared/store/notificationsStore.js";

const TONES = ["Professional", "Casual", "Technical"];
const LENGTHS = ["Short", "Medium", "Long"];

export function useMessagingViewModel() {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const [tone, setTone] = useState(TONES[0]);
  const [length, setLength] = useState(LENGTHS[1]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [insertions, setInsertions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const { data: candidate } = useQuery({
    queryKey: ["candidates", candidateId],
    queryFn: () => candidatesApi.get(candidateId),
    enabled: !!candidateId,
  });

  const draftMutation = useMutation({
    mutationFn: () => messagingApi.draft({ candidateId, jobId, tone, length }),
    onSuccess: (data) => {
      setSubject(data.subject);
      setBody(data.body);
      setInsertions(data.insertions || []);
      setIsEditing(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => messagingApi.send({ candidateId, subject, body }),
    onSuccess: () => pushToast({ tone: "success", message: "Message sent." }),
    onError: () => pushToast({ tone: "danger", message: "Couldn't send the message." }),
  });

  return {
    candidate,
    tones: TONES,
    tone,
    setTone,
    lengths: LENGTHS,
    length,
    setLength,
    subject,
    setSubject,
    body,
    setBody,
    insertions,
    isEditing,
    setIsEditing,
    generateDraft: draftMutation.mutate,
    isDrafting: draftMutation.isPending,
    hasDraft: !!body,
    send: sendMutation.mutate,
    isSending: sendMutation.isPending,
  };
}
