import * as fs from "fs";
import { yamlParse } from "yaml-cfn";
import { classifyResource } from "./types";

function readFileSync(path: string): string {
  return fs.readFileSync(path, "utf8");
}

const filePath = "test.yaml";
const content = readFileSync(filePath);
const parsed = yamlParse(content);

type ResourceId = string;

interface CloudFormationTemplate {
  Resources: {
    [key: string]: CloudFormationResource;
  };
}

interface CloudFormationResource {
  Type: string;
  Properties?: Record<string, any>;
  DependsOn?: string | string[];
}

interface CFNode {
  id: ResourceId;
  rType: string;
  nodeGroup: string;
  type: string;
  service: string;
  properties: Record<string, any>;
}

interface CFEdge {
  source: ResourceId;
  target: ResourceId;
  relationship: "depends_on" | "references" | "get_attr";
}

interface GraphData {
  nodes: CFNode[];
  edges: CFEdge[];
}

class CloudFormationParser {
  private template: CloudFormationTemplate;

  constructor(template: CloudFormationTemplate) {
    this.template = template;
  }

  public generateGraph(): GraphData {
    const nodes: CFNode[] = [];
    const edges: CFEdge[] = [];

    Object.entries(this.template.Resources).forEach(([id, resource]) => {
      const [_, service] = resource.Type.split("::");
      const resourceType = classifyResource(resource.Type);
      nodes.push({
        id,
        type: resource.Type,
        rType: resourceType.category,
        nodeGroup: resourceType.nodeGroup,
        service: service || "Unknown",
        properties: resource.Properties || {},
      });

      this.processResource(id, resource, edges);
    });

    return { nodes, edges };
  }

  private processResource(
    sourceId: ResourceId,
    resource: CloudFormationResource,
    edges: CFEdge[],
  ): void {
    if (resource.DependsOn) {
      const deps = Array.isArray(resource.DependsOn)
        ? resource.DependsOn
        : [resource.DependsOn];
      deps.forEach((target) => {
        edges.push({ source: sourceId, target, relationship: "depends_on" });
      });
    }

    this.processObject(sourceId, resource.Properties || {}, edges);
  }

  private processObject(
    sourceId: ResourceId,
    obj: Record<string, any>,
    edges: CFEdge[],
  ): void {
    if (!obj || typeof obj !== "object") return;

    Object.entries(obj).forEach(([_, value]) => {
      if (typeof value === "object") {
        if (value?.Ref) {
          edges.push({
            source: sourceId,
            target: value.Ref,
            relationship: "references",
          });
        }
        if (value?.["Fn::GetAtt"]) {
          edges.push({
            source: sourceId,
            target: value["Fn::GetAtt"][0],
            relationship: "get_attr",
          });
        }
        this.processObject(sourceId, value, edges);
      }
    });
  }

  public exportJson(filepath: string): void {
    const graphData = this.generateGraph();
    fs.writeFileSync(filepath, JSON.stringify(graphData, null, 2));
  }
}

const parser = new CloudFormationParser(parsed);

parser.exportJson("graph.json");
