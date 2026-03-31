import { notFound } from "next/navigation";
import ToolWorkspace from "../../../../components/ToolWorkspace";
import { getToolById } from "../../../../lib/tool-registry";

interface ToolParamsPageProps {
  params: Promise<{
    toolId: string;
    params: string[];
  }>;
}

export default async function ToolParamsPage({ params }: ToolParamsPageProps) {
  const { toolId, params: extraParams } = await params;
  const tool = getToolById(toolId);

  if (!tool) {
    notFound();
  }

  const initialInput = extraParams.length > 0 ? decodeURIComponent(extraParams[0]) : undefined;

  return <ToolWorkspace activeToolId={tool.id} initialInput={initialInput} />;
}
