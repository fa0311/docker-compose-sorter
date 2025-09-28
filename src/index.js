import { glob, globSync } from "node:fs";
import fs from "node:fs/promises";
import YAML from "yaml";

/**
 * @param {YAML.Document} docs
 * @param {string[]} keys
 */
const sortByKey = (docs, keys) => {
  for (const key of keys) {
    const data = docs.get(key, true);
    docs.delete(key);
    docs.add({ key: key, value: data });
  }
};

const getGuard = (data, fn) => {
  if (!data) return;
  if (data.items.length === 0) return;
  fn(data);
};

/**
 * Sorts the services in the Docker Compose file.
 * @param {YAML.Document | undefined} data
 */
const sortKeyName = (data) => {
  sortByKey(
    data,
    data.items
      .map((item) => item.key.value)
      .sort((a, b) => {
        const splitA = a.split(/[_-]/);
        const splitB = b.split(/[_-]/);
        if (splitA.every((part, index) => part === splitB[index])) {
          return -1;
        }
        if (splitB.every((part, index) => part === splitA[index])) {
          return 1;
        }
        return 0;
      }),
  );
};
/**
 * Sorts the entire Docker Compose file.
 * @param {YAML.Document} data
 */
const sortServicesKeys = (data) => {
  for (const service of data.items) {
    const sortedKeys = [
      "image",
      "build",
      "container_name",
      "restart",
      "ports",
      "environment",
      "volumes",
      "depends_on",
      "networks",
      "command",
      "entrypoint",
      "healthcheck",
      "logging",
      "labels",
    ];

    const serviceData = service.value;
    sortByKey(
      serviceData,
      serviceData.items
        .map((item) => item.key.value)
        .sort((a, b) => {
          const indexA = sortedKeys.indexOf(a);
          const indexB = sortedKeys.indexOf(b);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          if (indexA !== -1 && indexB === -1) return 0;
          return indexA - indexB;
        }),
    );
  }
};

for (const file of globSync("target/**/docker-compose.yml")) {
  console.log(`Sorting ${file}`);
  const data = YAML.parseDocument(await fs.readFile(file, "utf8"));
  getGuard(data.get("services"), (data) => sortKeyName(data));
  getGuard(data.get("volumes"), (data) => sortKeyName(data));
  getGuard(data.get("networks"), (data) => sortKeyName(data));
  getGuard(data.get("services"), (data) => sortServicesKeys(data));

  await fs.writeFile(file, data.toString());
}
