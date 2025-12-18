import fs from 'fs'
import path from 'path'

import { Command } from 'commander'

import {
  ContractDeployment,
  EnvName,
  EnvOverrides,
  IEnv,
  ProgramContext,
} from './types'
import {
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
  deployContracts: ContractDeployment[]

  constructor(options: OmitFunctions<IEnv>) {
    this.rpcUrl = options.rpcUrl
    this.registry = options.registry
    this.wasiNamespace = options.wasiNamespace
    this.triggerChain = options.triggerChain
    this.submitChain = options.submitChain
    this.ipfs = options.ipfs
    this.aggregatorTimerDelaySeconds = options.aggregatorTimerDelaySeconds
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
      networks: fs
        .readdirSync('config')
        .filter((file) => file.startsWith('network_deploy_'))
        .map((file) => readJson(path.join('config', file))),
      zodiac_safes: readJsonIfFileExists('.docker/zodiac_safes_deploy.json'),
    }
  }
}

export class DevEnv extends EnvBase {
  constructor({
    rpcUrl = 'http://127.0.0.1:8545',
    ipfsGateway = 'http://127.0.0.1:8080/ipfs/',
  }: EnvOverrides) {
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
            3,
          ],
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
    formData.append('file', new Blob([fs.readFileSync(filePath)]))

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
            false,
            0,
            1,
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
    if (!apiKey) {
      throw new Error('API key is required for IPFS uploads')
    }

    const filePath = path.resolve(file)
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} does not exist`)
    }

    const formData = new FormData()
    formData.append('file', new Blob([fs.readFileSync(filePath)]))
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
