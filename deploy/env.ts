import fs from 'fs'
import path from 'path'

import { Command } from 'commander'

import {
  ContractDeployment,
  EnvName,
  EnvOverrides,
  IEnv,
  Network,
  NetworkDeploy,
  ProgramContext,
} from './types'
import {
  isNetworkComplete,
  loadDotenv,
  readJson,
  readJsonIfFileExists,
  readJsonKey,
  readJsonKeyIfFileExists,
} from './utils'

type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

type OmitFunctions<T> = Pick<T, NonFunctionPropertyNames<T>>

abstract class EnvBase implements IEnv {
  rpcUrl: string
  registry: string
  wasiNamespace: string
  triggerChain: string
  submitChain: string
  ipfs: {
    pinApi: string
    gateway: string
  }
  aggregatorTimerDelaySeconds: number
  networksConfigFile: string
  deployContracts: ContractDeployment[]

  constructor(options: OmitFunctions<IEnv>) {
    this.rpcUrl = options.rpcUrl
    this.registry = options.registry
    this.wasiNamespace = options.wasiNamespace
    this.triggerChain = options.triggerChain
    this.submitChain = options.submitChain
    this.ipfs = options.ipfs
    this.aggregatorTimerDelaySeconds = options.aggregatorTimerDelaySeconds
    this.networksConfigFile = options.networksConfigFile
    this.deployContracts = options.deployContracts
  }

  static get(envName: EnvName | string, overrides: EnvOverrides = {}): IEnv {
    switch (envName.toLowerCase()) {
      case 'dev':
        return new DevEnv(overrides)
      case 'prod':
        return new ProdEnv(overrides)
    }

    throw new Error(`Invalid environment: ${envName}`)
  }

  /**
   * Uploads a file to IPFS and returns the CID.
   *
   * @param file - The file to upload to IPFS
   * @returns The CID of the uploaded file
   */
  abstract uploadToIpfs(file: string, apiKey?: string): Promise<string>

  /**
   * Query IPFS for a CID and return the content.
   *
   * @param uriOrCid - The URI or CID to query
   * @returns The content of the file as a string
   */
  async queryIpfs(uriOrCid: string): Promise<string> {
    const cid = uriOrCid.replace('ipfs://', '')
    const response = await fetch(this.ipfs.gateway + cid)

    if (!response.ok) {
      throw new Error(
        `Failed to query IPFS: ${response.status} ${response.statusText}. Body: ${await response.text().catch(() => '<unable to read body>')}`
      )
    }

    return response.text()
  }

  /**
   * Generate deployment summary file.
   */
  generateDeploymentSummary(serviceManagerAddress: string): object {
    return {
      service_id: '',
      rpc_url: this.rpcUrl,
      wavs_service_manager: serviceManagerAddress,
      wavs_indexer: readJsonKey(
        '.docker/wavs_indexer_deploy.json',
        'wavs_indexer'
      ),
      eas: readJsonIfFileExists('.docker/eas_deploy.json'),
      networks: readJsonIfFileExists(this.networksConfigFile),
      zodiac_safes: readJsonIfFileExists('.docker/zodiac_safes_deploy.json'),
    }
  }

  /**
   * Update networks config file with deployed contracts and schemas from
   * network_deploy_*.json files.
   *
   * If env is `dev`, contracts, schemas, and trusted seeds will be updated.
   *
   * If env is `prod`, contracts and schemas will be set if missing. Trusted seeds will not be touched.
   *
   * @param env - The environment to use for updating the networks config file.
   */
  updateNetworksConfigWithDeployments = (env: 'dev' | 'prod'): void => {
    // Read existing networks config or initialize empty array
    let networks: Network[] = []
    if (fs.existsSync(this.networksConfigFile)) {
      networks = readJson(this.networksConfigFile)
    }

    // Find all network_deploy_*.json files
    const deployFiles = fs
      .readdirSync('config')
      .filter((file) => file.match(/^network_deploy_\d+\.json$/))
      .sort()

    for (const deployFile of deployFiles) {
      // Extract index from filename (e.g., "network_deploy_0.json" -> 0)
      const match = deployFile.match(/network_deploy_(\d+)\.json/)
      if (!match) {
        continue
      }
      const index = parseInt(match[1], 10)

      if (networks.length <= index) {
        throw new Error(
          `Cannot update network at index ${index} because there are only ${networks.length.toLocaleString()} networks configured.`
        )
      }

      const deployData = readJson<NetworkDeploy>(
        path.join('config', deployFile)
      )

      const network: Network = {
        ...networks[index],
        contracts: {
          merkleSnapshot: deployData.contracts.merkle_snapshot,
          easIndexerResolver: deployData.contracts.eas_indexer_resolver,
          merkleFundDistributor: deployData.contracts.fund_distributor,
        },
        schemas: Object.values(deployData.schemas).flatMap((data) => {
          // Ignore placeholder "_" key from forge serialization.
          if (data === '_') {
            return []
          }

          const fields = data.schema.split(',').map((field) => {
            const [type, name] = field.split(' ')
            return {
              name,
              type,
            }
          })

          return {
            ...data,
            fields,
          }
        }),
      }

      const networkToUpdate = networks[index]

      if (env === 'dev') {
        // Replace contracts, schemas, and trusted seeds for development.
        networkToUpdate.contracts = network.contracts
        networkToUpdate.schemas = network.schemas
        networkToUpdate.pagerank.trustedSeeds = [deployData.deployer]
      } else if (env === 'prod') {
        // Add or update missing contracts and schemas for production.
        Object.entries(network.contracts).forEach(([key, value]) => {
          if (!networkToUpdate.contracts[key as keyof Network['contracts']]) {
            networkToUpdate.contracts[key as keyof Network['contracts']] = value
          }
        })
        network.schemas.forEach((schema) => {
          const existingSchema = networkToUpdate.schemas.findIndex(
            (s) => s.key === schema.key
          )
          if (existingSchema !== -1) {
            networkToUpdate.schemas[existingSchema] = schema
          } else {
            networkToUpdate.schemas.push(schema)
          }
        })
      }

      // Verify the network is complete after updating.
      if (!isNetworkComplete(network)) {
        throw new Error(
          `Network at index ${index} is not complete after updating from ${deployFile}. Please make sure everything is configured correctly in ${this.networksConfigFile}.`
        )
      }
    }

    // Write updated networks config.
    fs.writeFileSync(
      this.networksConfigFile,
      JSON.stringify(networks, null, 2) + '\n'
    )
  }
}

export class DevEnv extends EnvBase {
  constructor({
    rpcUrl = 'http://127.0.0.1:8545',
    ipfsGateway = 'http://127.0.0.1:8080/ipfs/',
  }: EnvOverrides) {
    const networksConfigFile = 'config/networks.development.json'
    const networksConfigTemplateFile = networksConfigFile.replace(
      '.json',
      '.template.json'
    )
    if (!fs.existsSync(networksConfigTemplateFile)) {
      throw new Error(
        `Networks config template file ${networksConfigTemplateFile} does not exist`
      )
    }

    // Get the number of networks from the template file.
    const numNetworks = readJson<Network[]>(networksConfigTemplateFile).length

    super({
      rpcUrl,
      registry: 'http://localhost:8090',
      wasiNamespace: 'example',
      triggerChain: 'evm:31337',
      submitChain: 'evm:31337',
      ipfs: {
        pinApi: 'http://127.0.0.1:5001/api/v0/add?pin=true',
        gateway: ipfsGateway,
      },
      aggregatorTimerDelaySeconds: 0,
      networksConfigFile,
      deployContracts: [
        {
          name: 'EAS',
          script: 'script/DeployEAS.s.sol:DeployEAS',
          sig: 'run(string)',
          args: (ctx) => [ctx.options.serviceManagerAddress],
        },
        {
          name: 'Network',
          script: 'script/DeployNetwork.s.sol:DeployScript',
          sig: 'run(string,string,string,bool,uint256,uint256)',
          args: (ctx) => [
            ctx.options.serviceManagerAddress,
            readJsonKey('.docker/eas_deploy.json', 'eas'),
            readJsonKey('.docker/eas_deploy.json', 'schema_registrar'),
            true,
            0,
            numNetworks,
          ],
          postRun: () => {
            // Replace the networks config file with the template.
            fs.copyFileSync(networksConfigTemplateFile, this.networksConfigFile)
            this.updateNetworksConfigWithDeployments('dev')
          },
        },
        {
          name: 'Safes and Zodiac Modules',
          script: 'script/DeployZodiacSafes.s.sol:DeployZodiacSafes',
          sig: 'run(string,string)',
          args: (ctx) => [
            ctx.options.serviceManagerAddress,
            // Use existing merkle snapshot contract.
            readJsonKey(
              'config/network_deploy_0.json',
              'contracts.merkle_snapshot'
            ),
          ],
        },
        {
          name: 'Indexer',
          script: 'script/DeployWavsIndexer.s.sol:DeployWavsIndexer',
          sig: 'run(string)',
          args: (ctx) => [ctx.options.serviceManagerAddress],
        },
      ],
    })
  }

  async uploadToIpfs(file: string, apiKey?: string): Promise<string> {
    const filePath = path.resolve(file)
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} does not exist`)
    }

    const formData = new FormData()
    formData.append(
      'file',
      new Blob([new Uint8Array(fs.readFileSync(filePath))])
    )

    const response = await fetch(this.ipfs.pinApi, {
      method: 'POST',
      body: formData,
      ...(apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {}),
    })

    if (!response.ok) {
      throw new Error(
        `Failed to upload file to IPFS: ${response.status} ${response.statusText}. Body: ${await response.text().catch(() => '<unable to read body>')}`
      )
    }

    const { Hash } = await response.json()

    // Verify the upload by querying IPFS for the file and checking the content
    // exists.
    let error
    for (let i = 0; i < 5; i++) {
      try {
        const content = await this.queryIpfs(Hash)
        if (content) {
          return Hash
        } else {
          throw new Error('Uploaded file content empty.')
        }
      } catch (err) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        error = err
      }
    }

    throw new Error(`Failed to verify IPFS upload: ${error}`)
  }
}

export class ProdEnv extends EnvBase {
  constructor({
    rpcUrl = 'https://optimism-rpc.publicnode.com',
    ipfsGateway = 'https://gateway.pinata.cloud/ipfs/',
  }: EnvOverrides) {
    const networksConfigFile = 'config/networks.production.json'
    if (!fs.existsSync(networksConfigFile)) {
      throw new Error(
        `Networks config file ${networksConfigFile} does not exist`
      )
    }

    const networks = readJson<Network[]>(networksConfigFile)

    super({
      rpcUrl,
      registry: 'https://wa.dev',
      wasiNamespace: 'en0va',
      // optimism
      triggerChain: 'evm:10',
      submitChain: 'evm:10',
      ipfs: {
        pinApi: 'https://uploads.pinata.cloud/v3/files',
        gateway: ipfsGateway,
      },
      // optimism wait ~1 block
      aggregatorTimerDelaySeconds: 3,
      networksConfigFile,
      deployContracts: [
        {
          name: 'EAS',
          script: 'script/DeployEAS.s.sol:DeployEAS',
          sig: 'run(string)',
          args: (ctx) => [ctx.options.serviceManagerAddress],
          // Skip if EAS is already deployed.
          skip: () =>
            readJsonKeyIfFileExists('.docker/eas_deploy.json', 'eas') !==
            undefined,
        },
        ...networks.map(
          (network, index): ContractDeployment => ({
            name: `Network: ${network.name}`,
            script: 'script/DeployNetwork.s.sol:DeployScript',
            sig: 'run(string,string,string,bool,uint256,uint256)',
            args: (ctx) => [
              ctx.options.serviceManagerAddress,
              readJsonKey('.docker/eas_deploy.json', 'eas'),
              readJsonKey('.docker/eas_deploy.json', 'schema_registrar'),
              false,
              index,
              1,
            ],
            postRun: () => this.updateNetworksConfigWithDeployments('prod'),
            // Skip if network is already complete.
            skip: () => isNetworkComplete(network),
          })
        ),
        {
          name: 'Indexer',
          script: 'script/DeployWavsIndexer.s.sol:DeployWavsIndexer',
          sig: 'run(string)',
          args: (ctx) => [ctx.options.serviceManagerAddress],
          // Skip if indexer is already deployed.
          skip: () =>
            readJsonKeyIfFileExists(
              '.docker/wavs_indexer_deploy.json',
              'wavs_indexer'
            ) !== undefined,
        },
      ],
    })
  }

  async uploadToIpfs(file: string, apiKey?: string): Promise<string> {
    if (!apiKey) {
      throw new Error('API key is required for IPFS uploads')
    }

    const filePath = path.resolve(file)
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} does not exist`)
    }

    const formData = new FormData()
    formData.append(
      'file',
      new Blob([new Uint8Array(fs.readFileSync(filePath))])
    )
    formData.append('network', 'public')
    formData.append('name', `service-${Date.now()}.json`)

    const response = await fetch(this.ipfs.pinApi, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to upload file to IPFS: ${response.status} ${response.statusText}. Body: ${await response.text().catch(() => '<unable to read body>')}`
      )
    }

    const {
      data: { cid },
    } = await response.json()

    // Verify the upload by querying IPFS for the file and checking the content
    // exists.
    let error
    for (let i = 0; i < 5; i++) {
      try {
        const content = await this.queryIpfs(cid)
        if (content) {
          return cid
        } else {
          throw new Error('Uploaded file content empty.')
        }
      } catch (err) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        error = err
      }
    }

    throw new Error(`Failed to verify IPFS upload: ${error}`)
  }
}

/**
 * Default option values.
 */
export const DEFAULT_OPTIONS: Record<string, () => string | undefined> = {
  rpcUrl: () => process.env.RPC_URL,
  fundedKey: () => process.env.FUNDED_KEY,
  ipfsApiKey: () => process.env.WAVS_ENV_PINATA_API_KEY,
  serviceManagerAddress: () =>
    readJsonKeyIfFileExists(
      '.nodes/poa_deploy.json',
      'addresses.POAStakeRegistry'
    ),
}

/**
 * Initialize the program by parsing the arguments and returning the relevant
 * environment and options.
 */
export const initProgram = (program: Command): ProgramContext => {
  // Create wavs.toml file from the example if it doesn't exist
  const wavsTomlFile = path.resolve(path.join(__dirname, '../wavs.toml'))
  if (!fs.existsSync(wavsTomlFile)) {
    const exampleWavsTomlFile = path.resolve(
      path.join(__dirname, '../wavs.toml.example')
    )
    if (!fs.existsSync(exampleWavsTomlFile)) {
      throw new Error(
        `Example wavs.toml file ${exampleWavsTomlFile} does not exist.`
      )
    }
    fs.copyFileSync(exampleWavsTomlFile, wavsTomlFile)
  }

  const dotenv = loadDotenv()

  program.parse(process.argv)

  const options = program.opts()
  // Set default environment before applying default options, since some default
  // options depend on the environment.
  if (!options.env) {
    options.env = process.env.DEPLOY_ENV?.toLowerCase() || 'dev'
  }

  const appliedOptions = applyDefaultOptions(options)
  const env = getEnv(options.env, options)

  return {
    envName: options.env,
    env,
    options: appliedOptions,
    dotenv,
  }
}

/**
 * Gets the environment variables for the given environment name. Throws an
 * error if the environment name is invalid.
 *
 * @param envName - The name of the environment
 * @returns The environment variables
 */
export const getEnv = (
  envName: EnvName,
  overrides: EnvOverrides = {}
): IEnv => {
  const env = EnvBase.get(envName, overrides)
  if (!env) {
    throw new Error(`Invalid environment: ${envName}`)
  }

  return env
}

/**
 * Apply default option values.
 *
 * @param options - The options to apply default values to
 * @param env - The environment
 * @returns The options with default values applied
 */
export const applyDefaultOptions = (options: Record<string, any>) =>
  Object.entries(DEFAULT_OPTIONS).reduce((acc, [key, value]) => {
    if (!options[key]) {
      acc[key] = value()
    }
    return acc
  }, options)
