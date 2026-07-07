// JSON Schemas for each AI-produced structure, used to force tool-call
// output (see askJSON in lib/anthropic.ts). Forcing a tool call — instead of
// asking the model to type out raw JSON as text — means the API itself
// guarantees a complete, well-formed object back. Free-text JSON has no such
// guarantee: a model can wander into a longer, more conversational reply
// (especially when the day's context is emotionally weighty) and never
// reach a closing brace before hitting the token limit.

export const CAPTURE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["task", "stress", "project"] },
          title: { type: "string" },
          notes: { type: ["string", "null"] },
          domain: { type: ["string", "null"] },
          context: { type: "string", enum: ["work", "home", "any"] },
          size: { type: "string", enum: ["quick", "medium", "big"] },
          deadline: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
          children: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                context: { type: "string", enum: ["work", "home", "any"] },
                size: { type: "string", enum: ["quick", "medium", "big"] },
              },
              required: ["title"],
            },
          },
        },
        required: ["kind", "title", "context", "size"],
      },
    },
  },
  required: ["items"],
};

export const MORNING_SCHEMA = {
  type: "object",
  properties: {
    briefing: { type: "string", description: "2-5 sentences, prepared-assistant-notes voice" },
    mustIds: { type: "array", items: { type: "string" } },
    extraIds: { type: "array", items: { type: "string" } },
    sequencingNote: { type: ["string", "null"] },
  },
  required: ["briefing", "mustIds", "extraIds"],
};

export const EVENING_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    unblockTasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          context: { type: "string", enum: ["work", "home", "any"] },
          size: { type: "string", enum: ["quick", "medium", "big"] },
          followUpTaskId: { type: "string" },
        },
        required: ["title"],
      },
    },
    braveActs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          value: { type: "string" },
        },
        required: ["description"],
      },
    },
    tomorrowNote: { type: ["string", "null"] },
  },
  required: ["summary", "unblockTasks", "braveActs"],
};

export const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          context: { type: "string", enum: ["work", "home", "any"] },
          size: { type: "string", enum: ["quick", "medium", "big"] },
          deadline: { type: ["string", "null"] },
        },
        required: ["title"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                context: { type: "string", enum: ["work", "home", "any"] },
                size: { type: "string", enum: ["quick", "medium", "big"] },
              },
              required: ["title"],
            },
          },
        },
        required: ["title"],
      },
    },
    releasedTaskIds: { type: "array", items: { type: "string" } },
    intentions: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
  required: ["tasks", "projects", "releasedTaskIds", "intentions", "summary"],
};
