import { redirect } from "next/navigation";
import { DEFAULT_TOOL_ID } from "../lib/tool-registry";

export default function HomePage() {
  redirect(`/tools/${DEFAULT_TOOL_ID}`);
}
