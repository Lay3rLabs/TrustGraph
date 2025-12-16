import path from 'path'

import { IEnv, ProcessConfigOptions } from './types'
import { readJson, readJsonKey } from './utils'

/**
 * Process component config file and return list of keys and values.
 *
 * @param file - The component config file to read
 * @param env - Extra environment variables to use for substitution (overrides process.env)
 * @returns The list of keys and values
 */
export const processComponentConfigFile = (
  file: string,
  options: ProcessConfigOptions
): [string, unknown][] => {
  // Read and process config template into list of keys and values.
  const config = processComponentConfigValues(
    readJson(
      // Expect template JSON file to exist.
      path.resolve(path.join(__dirname, `../config/${file}.template.json`))
    ),
    file,
    options
  )

  // Save the config to a file as a JSON object.
  // fs.writeFileSync(
  //   path.resolve(path.join(__dirname, `../config/${file}.json`)),
  //   JSON.stringify(Object.fromEntries(config), null, 2)
  // )

  // Return the list of keys and values.
  return config
}

/**
 * Process component config values and return list of keys and values.
 *
 * @param config - The component config values
 * @param name - The name/file of the component, for error messages
 * @param env - Extra environment variables to use for substitution (overrides process.env)
 * @returns The list of keys and values
 */
export const processComponentConfigValues = (
  config: Record<string, unknown>,
  name: string,
  options: ProcessConfigOptions
): [string, unknown][] =>
  Object.entries({ ...config, ...options.extraValues }).map(([key, value]) => {
    return [
      key,
      typeof value === 'string'
        ? value
            // Replace all ${get(json.path.to.key)} patterns with the value of the key from the deployment summary JSON file.
            .replaceAll(/\${get\(([^)]+)\)}/g, (_, p1) =>
              readJsonKey('.docker/deployment_summary.json', p1)
            )
            // Replace all ${getEnv(field)} patterns with the value of the field from the deployment environment.
            .replaceAll(/\${getEnv\(([^)]+)\)}/g, (_, p1) => {
              if (!(p1 in options.env)) {
                throw new Error(
                  `Invalid environment key: ${p1} not found in env.`
                )
              }
              const envVar = options.env[p1 as keyof IEnv]
              if (envVar === undefined) {
                throw new Error(
                  `Env field ${p1} does not exist in deployment environment but is needed for component "${name}" config value "${key}"`
                )
              }
              return envVar.toString()
            })
            // Replace all ${VAR_NAME} patterns with their environment variable values.
            .replaceAll(/\${\s*([^{}]+)\s*}/g, (_, p1) => {
              const envVar = process.env[p1]
              if (!envVar) {
                throw new Error(
                  `Environment variable ${p1} is not set but needed for component "${name}" config value "${key}"`
                )
              }
              return envVar
            })
        : value,
    ]
  })
