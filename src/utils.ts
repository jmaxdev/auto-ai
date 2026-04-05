import { Service, ChatOptions } from "./types";

let currentServiceIndex = 0;

const inferServiceFromModel = (
  services: Service[],
  model: string
): Service | null => {
  const normalizedModel = model.toLowerCase();
  const slashIndex = normalizedModel.indexOf("/");

  if (slashIndex > 0) {
    const prefix = normalizedModel.slice(0, slashIndex);
    if (prefix === "groq") {
      return services.find((s) => s.name === "Groq") || null;
    }
    if (prefix === "cerebras") {
      return services.find((s) => s.name === "Cerebras") || null;
    }
    if (prefix === "google") {
      return services.find((s) => s.name === "Google") || null;
    }
    return services.find((s) => s.name === "OpenRouter") || null;
  }

  if (normalizedModel.includes("cerebras")) {
    return services.find((s) => s.name === "Cerebras") || null;
  }

  if (
    normalizedModel.includes("gemini") ||
    normalizedModel.includes("google")
  ) {
    return services.find((s) => s.name === "Google") || null;
  }

  if (
    normalizedModel.includes("mixtral") ||
    normalizedModel.includes("gemma")
  ) {
    return services.find((s) => s.name === "Groq") || null;
  }

  return null;
};

const getServiceForModel = (
  services: Service[],
  options?: ChatOptions
): Service => {
  const model = options?.model;
  const serviceName = options?.service;
  // Extract the optional exclusions list
  const exclusions = options?.serviceExclusion;

  // 1. Filter the available services based on exclusions
  let availableServices: Service[] = services;
  if (exclusions && exclusions.length > 0) {
    availableServices = services.filter((s) => !exclusions.includes(s.name));
  }

  // --- START LOGIC USING FILTERED SERVICES ---

  // 1. If service is explicitly specified, check if it's excluded
  if (serviceName) {
    const service = availableServices.find(
      (s) => s.name.toLowerCase() === serviceName.toLowerCase()
    );
    if (service) {
      return service;
    }
    console.warn(
      `Service '${serviceName}' is either not found or was explicitly excluded. Using automatic detection.`
    );
  }

  if (model) {
    // 2. Check prefix syntax: "service:model"
    if (model.includes(":")) {
      const [servicePrefix] = model.split(":", 2);
      // We must search the filtered list (availableServices)
      const service = availableServices.find(
        (s) => s.name.toLowerCase() === servicePrefix.toLowerCase()
      );
      if (service) {
        return service;
      }
    }

    // 3. Try to infer service by model name pattern
    const inferredService = inferServiceFromModel(availableServices, model);
    if (inferredService) {
      // Check if the inferred service is still available (not excluded)
      if (availableServices.includes(inferredService)) {
        if (model.includes("/") && inferredService.name === "OpenRouter") {
          console.warn(
            `Model '${model}' may be available on multiple providers. OpenRouter is selected by default. Use explicit 'service' or prefix syntax to disambiguate.`
          );
        }
        return inferredService;
      }
      // If inferredService is excluded, we proceed to the fallback rotation logic.
    }

    // Fallback to service rotation when the model is ambiguous or the inferred service is excluded
    console.warn(
      `Model '${model}' requires a service that is unavailable or ambiguous. Falling back to rotation.`
    );
  }

  // If no model specified or detection failed, rotate between *available* services
  const service = availableServices[currentServiceIndex];
  // We must use the length of availableServices for correct rotation
  currentServiceIndex = (currentServiceIndex + 1) % availableServices.length;
  return service;
};

export { getServiceForModel };
