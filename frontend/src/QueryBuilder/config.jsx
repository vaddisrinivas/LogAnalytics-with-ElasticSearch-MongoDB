import { MuiConfig } from "@react-awesome-query-builder/mui";

const InitialConfig = MuiConfig;

const fields = {
  level: {
    label: "Level",
    type: "text",
    valueSources: ["value"],
  },
  message: {
    label: "Message",
    type: "text",
    valueSources: ["value"],
    mainWidgetProps: {
      valueLabel: "Message",
      valuePlaceholder: "Enter message",
    },
  },
  resourceId: {
    label: "Resource ID",
    type: "text",
    valueSources: ["value"],
  },
  timestamp: {
    label: "Timestamp",
    type: "datetime",
    valueSources: ["value"],
  },
  traceId: {
    label: "Trace ID",
    type: "text",
    valueSources: ["value"],
    mainWidgetProps: {
      valueLabel: "Trace ID",
      valuePlaceholder: "Enter trace ID",
    }
  },
  spanId: {
    label: "Span ID",
    type: "text",
    valueSources: ["value"]
  },
  commit: {
    label: "Commit",
    type: "text",
    valueSources: ["value"]
  },
  parentResourceId: {
    label: "Parent Resource ID",
    type: "text",
    valueSources: ["value"],
  },
};



const settings = {
  ...InitialConfig.settings,

  valueSourcesInfo: {
    value: {
      label: "Value"
    },
    field: {
      label: "Field",
      widget: "field",
    },
  },
  canReorder: true,
  canRegroup: true,
  showNot: true,
  showLabels: true,
  canLeaveEmptyGroup: false,
  exportAsString: true,
};

const operators ={
  ...InitialConfig.operators,
}
delete operators.proximity

const config = {
  ...InitialConfig,
  operators,
  settings,
  fields,
};

export default config;

