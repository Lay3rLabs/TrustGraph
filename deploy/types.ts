import { DotenvParseOutput } from 'dotenv'

export type ComponentsConfigFile = {
  components: {
    disabled?: boolean
    filename: string
    package_name: string
    package_version: string
    trigger:
      | {
          event: {
            contract_json_path: string
            event: string
            chain?: string
          }
        }
      | {
          block_interval: {
            blocks: number
            chain?: string
          }
        }
      | {
          cron: {
            schedule: string
            start_time: string
            end_time: string
          }
        }
    submit: {
      contract_json_path: string
      chain?: string
    }
    config?:
      | {
          file: string
        }
      | {
          values: Record<string, unknown>
        }
    env_variables?: string[]
  }[]
  aggregator_components: {
    disabled?: boolean
    filename: string
    package_name: string
    package_version: string
    config?:
      | {
          file: string
        }
      | {
          values: Record<string, unknown>
        }
    env_variables?: string[]
  }[]
}

export type ContractDeployment = {
  name: string
  script: string
  sig: string
  args: (ctx: ProgramContext) => string[]
}

export type EnvName = 'dev' | 'prod'

export type IEnv = {
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
  uploadToIpfs: (file: string, apiKey?: string) => Promise<string>
  generateDeploymentSummary: (serviceManagerAddress: string) => object
}

export type EnvOverrides = {
  rpcUrl?: string
  ipfsGateway?: string
}

export type ProgramContext = {
  /** The environment name */
  envName: EnvName
  /** The environment context */
  env: IEnv
  /** Passed in options */
  options: Record<string, any>
  /** The environment variables loaded from the .env file */
  dotenv: DotenvParseOutput
}

export type ProcessConfigOptions = {
  env: IEnv
  extraValues?: Record<string, unknown>
}
