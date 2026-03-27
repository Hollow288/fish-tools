import { notFound } from "next/navigation";
import ToolWorkspace from "../../../components/ToolWorkspace";
import { ALL_TOOL_IDS, getToolById } from "../../../lib/tool-registry";

interface ToolPageProps {
  params: Promise<{
    toolId: string;
  }>;
}

export function generateStaticParams() {
  return ALL_TOOL_IDS.map((toolId) => ({ toolId }));
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params;
  const tool = getToolById(toolId);

  if (!tool) {
    notFound();
  }

  return <ToolWorkspace activeToolId={tool.id} />;
}
