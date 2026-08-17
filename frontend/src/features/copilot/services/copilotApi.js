import axiosClient from "../../../shared/lib/axiosClient.js";

export const copilotApi = {
  async ask({ context, question }) {
    // Backend streams via chunked response in production; the frontend hook below
    // simulates incremental rendering client-side if a non-streaming JSON body comes back,
    // so the UI works identically against either transport.
    const { data } = await axiosClient.post("/copilot/ask", { context, question });
    return data.data;
  },
};
