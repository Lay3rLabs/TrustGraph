pub type TriggerAction = wavs::worker::layer_types::TriggerAction;
pub type WasmResponse = wavs::worker::layer_types::WasmResponse;
#[doc(hidden)]
#[allow(non_snake_case)]
pub unsafe fn _export_run_cabi<T: Guest>(arg0: *mut u8) -> *mut u8 {
    #[cfg(target_arch = "wasm32")]
    _rt::run_ctors_once();
    let l0 = *arg0.add(0).cast::<*mut u8>();
    let l1 = *arg0.add(4).cast::<usize>();
    let len2 = l1;
    let bytes2 = _rt::Vec::from_raw_parts(l0.cast(), len2, len2);
    let l3 = *arg0.add(8).cast::<*mut u8>();
    let l4 = *arg0.add(12).cast::<usize>();
    let len5 = l4;
    let bytes5 = _rt::Vec::from_raw_parts(l3.cast(), len5, len5);
    let l6 = i32::from(*arg0.add(16).cast::<u8>());
    use wavs::worker::layer_types::TriggerSource as V41;
    let v41 = match l6 {
        0 => {
            let e41 = {
                let l7 = *arg0.add(24).cast::<*mut u8>();
                let l8 = *arg0.add(28).cast::<usize>();
                let len9 = l8;
                let l10 = *arg0.add(32).cast::<*mut u8>();
                let l11 = *arg0.add(36).cast::<usize>();
                let len12 = l11;
                let bytes12 = _rt::Vec::from_raw_parts(l10.cast(), len12, len12);
                let l13 = *arg0.add(40).cast::<*mut u8>();
                let l14 = *arg0.add(44).cast::<usize>();
                let len15 = l14;
                wavs::worker::layer_types::TriggerSourceEvmContractEvent {
                    address: wavs::worker::layer_types::EvmAddress {
                        raw_bytes: _rt::Vec::from_raw_parts(l7.cast(), len9, len9),
                    },
                    chain_name: _rt::string_lift(bytes12),
                    event_hash: _rt::Vec::from_raw_parts(l13.cast(), len15, len15),
                }
            };
            V41::EvmContractEvent(e41)
        }
        1 => {
            let e41 = {
                let l16 = *arg0.add(24).cast::<*mut u8>();
                let l17 = *arg0.add(28).cast::<usize>();
                let len18 = l17;
                let bytes18 = _rt::Vec::from_raw_parts(l16.cast(), len18, len18);
                let l19 = *arg0.add(32).cast::<i32>();
                let l20 = *arg0.add(36).cast::<*mut u8>();
                let l21 = *arg0.add(40).cast::<usize>();
                let len22 = l21;
                let bytes22 = _rt::Vec::from_raw_parts(l20.cast(), len22, len22);
                let l23 = *arg0.add(44).cast::<*mut u8>();
                let l24 = *arg0.add(48).cast::<usize>();
                let len25 = l24;
                let bytes25 = _rt::Vec::from_raw_parts(l23.cast(), len25, len25);
                wavs::worker::layer_types::TriggerSourceCosmosContractEvent {
                    address: wavs::worker::layer_types::CosmosAddress {
                        bech32_addr: _rt::string_lift(bytes18),
                        prefix_len: l19 as u32,
                    },
                    chain_name: _rt::string_lift(bytes22),
                    event_type: _rt::string_lift(bytes25),
                }
            };
            V41::CosmosContractEvent(e41)
        }
        2 => {
            let e41 = {
                let l26 = *arg0.add(24).cast::<*mut u8>();
                let l27 = *arg0.add(28).cast::<usize>();
                let len28 = l27;
                let bytes28 = _rt::Vec::from_raw_parts(l26.cast(), len28, len28);
                let l29 = *arg0.add(32).cast::<i32>();
                let l30 = i32::from(*arg0.add(40).cast::<u8>());
                let l32 = i32::from(*arg0.add(56).cast::<u8>());
                wavs::worker::layer_types::BlockIntervalSource {
                    chain_name: _rt::string_lift(bytes28),
                    n_blocks: l29 as u32,
                    start_block: match l30 {
                        0 => None,
                        1 => {
                            let e = {
                                let l31 = *arg0.add(48).cast::<i64>();
                                l31 as u64
                            };
                            Some(e)
                        }
                        _ => _rt::invalid_enum_discriminant(),
                    },
                    end_block: match l32 {
                        0 => None,
                        1 => {
                            let e = {
                                let l33 = *arg0.add(64).cast::<i64>();
                                l33 as u64
                            };
                            Some(e)
                        }
                        _ => _rt::invalid_enum_discriminant(),
                    },
                }
            };
            V41::BlockInterval(e41)
        }
        3 => {
            let e41 = {
                let l34 = *arg0.add(24).cast::<*mut u8>();
                let l35 = *arg0.add(28).cast::<usize>();
                let len36 = l35;
                let bytes36 = _rt::Vec::from_raw_parts(l34.cast(), len36, len36);
                let l37 = i32::from(*arg0.add(32).cast::<u8>());
                let l39 = i32::from(*arg0.add(48).cast::<u8>());
                wavs::worker::layer_types::TriggerSourceCron {
                    schedule: _rt::string_lift(bytes36),
                    start_time: match l37 {
                        0 => None,
                        1 => {
                            let e = {
                                let l38 = *arg0.add(40).cast::<i64>();
                                wavs::worker::layer_types::Timestamp { nanos: l38 as u64 }
                            };
                            Some(e)
                        }
                        _ => _rt::invalid_enum_discriminant(),
                    },
                    end_time: match l39 {
                        0 => None,
                        1 => {
                            let e = {
                                let l40 = *arg0.add(56).cast::<i64>();
                                wavs::worker::layer_types::Timestamp { nanos: l40 as u64 }
                            };
                            Some(e)
                        }
                        _ => _rt::invalid_enum_discriminant(),
                    },
                }
            };
            V41::Cron(e41)
        }
        n => {
            debug_assert_eq!(n, 4, "invalid enum discriminant");
            V41::Manual
        }
    };
    let l42 = i32::from(*arg0.add(72).cast::<u8>());
    use wavs::worker::layer_types::TriggerData as V87;
    let v87 = match l42 {
        0 => {
            let e87 = {
                let l43 = *arg0.add(80).cast::<*mut u8>();
                let l44 = *arg0.add(84).cast::<usize>();
                let len45 = l44;
                let l46 = *arg0.add(88).cast::<*mut u8>();
                let l47 = *arg0.add(92).cast::<usize>();
                let len48 = l47;
                let bytes48 = _rt::Vec::from_raw_parts(l46.cast(), len48, len48);
                let l49 = *arg0.add(96).cast::<*mut u8>();
                let l50 = *arg0.add(100).cast::<usize>();
                let base54 = l49;
                let len54 = l50;
                let mut result54 = _rt::Vec::with_capacity(len54);
                for i in 0..len54 {
                    let base = base54.add(i * 8);
                    let e54 = {
                        let l51 = *base.add(0).cast::<*mut u8>();
                        let l52 = *base.add(4).cast::<usize>();
                        let len53 = l52;
                        _rt::Vec::from_raw_parts(l51.cast(), len53, len53)
                    };
                    result54.push(e54);
                }
                _rt::cabi_dealloc(base54, len54 * 8, 4);
                let l55 = *arg0.add(104).cast::<*mut u8>();
                let l56 = *arg0.add(108).cast::<usize>();
                let len57 = l56;
                let l58 = *arg0.add(112).cast::<i64>();
                wavs::worker::layer_types::TriggerDataEvmContractEvent {
                    contract_address: wavs::worker::layer_types::EvmAddress {
                        raw_bytes: _rt::Vec::from_raw_parts(l43.cast(), len45, len45),
                    },
                    chain_name: _rt::string_lift(bytes48),
                    log: wavs::worker::layer_types::EvmEventLogData {
                        topics: result54,
                        data: _rt::Vec::from_raw_parts(l55.cast(), len57, len57),
                    },
                    block_height: l58 as u64,
                }
            };
            V87::EvmContractEvent(e87)
        }
        1 => {
            let e87 = {
                let l59 = *arg0.add(80).cast::<*mut u8>();
                let l60 = *arg0.add(84).cast::<usize>();
                let len61 = l60;
                let bytes61 = _rt::Vec::from_raw_parts(l59.cast(), len61, len61);
                let l62 = *arg0.add(88).cast::<i32>();
                let l63 = *arg0.add(92).cast::<*mut u8>();
                let l64 = *arg0.add(96).cast::<usize>();
                let len65 = l64;
                let bytes65 = _rt::Vec::from_raw_parts(l63.cast(), len65, len65);
                let l66 = *arg0.add(100).cast::<*mut u8>();
                let l67 = *arg0.add(104).cast::<usize>();
                let len68 = l67;
                let bytes68 = _rt::Vec::from_raw_parts(l66.cast(), len68, len68);
                let l69 = *arg0.add(108).cast::<*mut u8>();
                let l70 = *arg0.add(112).cast::<usize>();
                let base77 = l69;
                let len77 = l70;
                let mut result77 = _rt::Vec::with_capacity(len77);
                for i in 0..len77 {
                    let base = base77.add(i * 16);
                    let e77 = {
                        let l71 = *base.add(0).cast::<*mut u8>();
                        let l72 = *base.add(4).cast::<usize>();
                        let len73 = l72;
                        let bytes73 = _rt::Vec::from_raw_parts(l71.cast(), len73, len73);
                        let l74 = *base.add(8).cast::<*mut u8>();
                        let l75 = *base.add(12).cast::<usize>();
                        let len76 = l75;
                        let bytes76 = _rt::Vec::from_raw_parts(l74.cast(), len76, len76);
                        (_rt::string_lift(bytes73), _rt::string_lift(bytes76))
                    };
                    result77.push(e77);
                }
                _rt::cabi_dealloc(base77, len77 * 16, 4);
                let l78 = *arg0.add(120).cast::<i64>();
                wavs::worker::layer_types::TriggerDataCosmosContractEvent {
                    contract_address: wavs::worker::layer_types::CosmosAddress {
                        bech32_addr: _rt::string_lift(bytes61),
                        prefix_len: l62 as u32,
                    },
                    chain_name: _rt::string_lift(bytes65),
                    event: wavs::worker::layer_types::CosmosEvent {
                        ty: _rt::string_lift(bytes68),
                        attributes: result77,
                    },
                    block_height: l78 as u64,
                }
            };
            V87::CosmosContractEvent(e87)
        }
        2 => {
            let e87 = {
                let l79 = *arg0.add(80).cast::<*mut u8>();
                let l80 = *arg0.add(84).cast::<usize>();
                let len81 = l80;
                let bytes81 = _rt::Vec::from_raw_parts(l79.cast(), len81, len81);
                let l82 = *arg0.add(88).cast::<i64>();
                wavs::worker::layer_types::BlockIntervalData {
                    chain_name: _rt::string_lift(bytes81),
                    block_height: l82 as u64,
                }
            };
            V87::BlockInterval(e87)
        }
        3 => {
            let e87 = {
                let l83 = *arg0.add(80).cast::<i64>();
                wavs::worker::layer_types::TriggerDataCron {
                    trigger_time: wavs::worker::layer_types::Timestamp { nanos: l83 as u64 },
                }
            };
            V87::Cron(e87)
        }
        n => {
            debug_assert_eq!(n, 4, "invalid enum discriminant");
            let e87 = {
                let l84 = *arg0.add(80).cast::<*mut u8>();
                let l85 = *arg0.add(84).cast::<usize>();
                let len86 = l85;
                _rt::Vec::from_raw_parts(l84.cast(), len86, len86)
            };
            V87::Raw(e87)
        }
    };
    let result88 = T::run(wavs::worker::layer_types::TriggerAction {
        config: wavs::worker::layer_types::TriggerConfig {
            service_id: _rt::string_lift(bytes2),
            workflow_id: _rt::string_lift(bytes5),
            trigger_source: v41,
        },
        data: v87,
    });
    _rt::cabi_dealloc(arg0, 128, 8);
    let ptr89 = _RET_AREA.0.as_mut_ptr().cast::<u8>();
    match result88 {
        Ok(e) => {
            *ptr89.add(0).cast::<u8>() = (0i32) as u8;
            match e {
                Some(e) => {
                    *ptr89.add(8).cast::<u8>() = (1i32) as u8;
                    let wavs::worker::layer_types::WasmResponse {
                        payload: payload90,
                        ordering: ordering90,
                    } = e;
                    let vec91 = (payload90).into_boxed_slice();
                    let ptr91 = vec91.as_ptr().cast::<u8>();
                    let len91 = vec91.len();
                    ::core::mem::forget(vec91);
                    *ptr89.add(20).cast::<usize>() = len91;
                    *ptr89.add(16).cast::<*mut u8>() = ptr91.cast_mut();
                    match ordering90 {
                        Some(e) => {
                            *ptr89.add(24).cast::<u8>() = (1i32) as u8;
                            *ptr89.add(32).cast::<i64>() = _rt::as_i64(e);
                        }
                        None => {
                            *ptr89.add(24).cast::<u8>() = (0i32) as u8;
                        }
                    };
                }
                None => {
                    *ptr89.add(8).cast::<u8>() = (0i32) as u8;
                }
            };
        }
        Err(e) => {
            *ptr89.add(0).cast::<u8>() = (1i32) as u8;
            let vec92 = (e.into_bytes()).into_boxed_slice();
            let ptr92 = vec92.as_ptr().cast::<u8>();
            let len92 = vec92.len();
            ::core::mem::forget(vec92);
            *ptr89.add(12).cast::<usize>() = len92;
            *ptr89.add(8).cast::<*mut u8>() = ptr92.cast_mut();
        }
    };
    ptr89
}
#[doc(hidden)]
#[allow(non_snake_case)]
pub unsafe fn __post_return_run<T: Guest>(arg0: *mut u8) {
    let l0 = i32::from(*arg0.add(0).cast::<u8>());
    match l0 {
        0 => {
            let l1 = i32::from(*arg0.add(8).cast::<u8>());
            match l1 {
                0 => {}
                _ => {
                    let l2 = *arg0.add(16).cast::<*mut u8>();
                    let l3 = *arg0.add(20).cast::<usize>();
                    let base4 = l2;
                    let len4 = l3;
                    _rt::cabi_dealloc(base4, len4 * 1, 1);
                }
            }
        }
        _ => {
            let l5 = *arg0.add(8).cast::<*mut u8>();
            let l6 = *arg0.add(12).cast::<usize>();
            _rt::cabi_dealloc(l5, l6, 1);
        }
    }
}
pub trait Guest {
    fn run(trigger_action: TriggerAction) -> Result<Option<WasmResponse>, _rt::String>;
}
#[doc(hidden)]
macro_rules! __export_world_layer_trigger_world_cabi {
    ($ty:ident with_types_in $($path_to_types:tt)*) => {
        const _ : () = { #[export_name = "run"] unsafe extern "C" fn export_run(arg0 : *
        mut u8,) -> * mut u8 { $($path_to_types)*:: _export_run_cabi::<$ty > (arg0) }
        #[export_name = "cabi_post_run"] unsafe extern "C" fn _post_return_run(arg0 : *
        mut u8,) { $($path_to_types)*:: __post_return_run::<$ty > (arg0) } };
    };
}
#[doc(hidden)]
pub(crate) use __export_world_layer_trigger_world_cabi;
#[repr(align(8))]
struct _RetArea([::core::mem::MaybeUninit<u8>; 40]);
static mut _RET_AREA: _RetArea = _RetArea([::core::mem::MaybeUninit::uninit(); 40]);
#[allow(dead_code)]
pub mod wavs {
    #[allow(dead_code)]
    pub mod agent {
        #[allow(dead_code, clippy::all)]
        pub mod errors {
            #[used]
            #[doc(hidden)]
            static __FORCE_SECTION_REF: fn() =
                super::super::super::__link_custom_section_describing_imports;
            use super::super::super::_rt;
            /// Possible error types that can occur during agent operations
            #[derive(Clone)]
            pub enum AgentError {
                /// API error
                Api(_rt::String),
                /// HTTP error
                Http(_rt::String),
                /// External service error
                ExternalService(_rt::String),
                /// Configuration errors
                Config(_rt::String),
                /// Contract error
                Contract(_rt::String),
                /// Error related to configuration parsing or validation
                Configuration(_rt::String),
                /// Error when loading context from URI or environment
                ContextLoading(_rt::String),
                /// Error when validating context
                ContextValidation(_rt::String),
                /// Error during LLM processing
                Llm(_rt::String),
                /// IO errors from std::io
                Io(_rt::String),
                /// Error related to transaction generation or validation
                Transaction(_rt::String),
                /// UTF-8 decoding error
                Utf8(_rt::String),
                /// Other general errors
                Other(_rt::String),
            }
            impl ::core::fmt::Debug for AgentError {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    match self {
                        AgentError::Api(e) => f.debug_tuple("AgentError::Api").field(e).finish(),
                        AgentError::Http(e) => f.debug_tuple("AgentError::Http").field(e).finish(),
                        AgentError::ExternalService(e) => {
                            f.debug_tuple("AgentError::ExternalService").field(e).finish()
                        }
                        AgentError::Config(e) => {
                            f.debug_tuple("AgentError::Config").field(e).finish()
                        }
                        AgentError::Contract(e) => {
                            f.debug_tuple("AgentError::Contract").field(e).finish()
                        }
                        AgentError::Configuration(e) => {
                            f.debug_tuple("AgentError::Configuration").field(e).finish()
                        }
                        AgentError::ContextLoading(e) => {
                            f.debug_tuple("AgentError::ContextLoading").field(e).finish()
                        }
                        AgentError::ContextValidation(e) => {
                            f.debug_tuple("AgentError::ContextValidation").field(e).finish()
                        }
                        AgentError::Llm(e) => f.debug_tuple("AgentError::Llm").field(e).finish(),
                        AgentError::Io(e) => f.debug_tuple("AgentError::Io").field(e).finish(),
                        AgentError::Transaction(e) => {
                            f.debug_tuple("AgentError::Transaction").field(e).finish()
                        }
                        AgentError::Utf8(e) => f.debug_tuple("AgentError::Utf8").field(e).finish(),
                        AgentError::Other(e) => {
                            f.debug_tuple("AgentError::Other").field(e).finish()
                        }
                    }
                }
            }
            impl ::core::fmt::Display for AgentError {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    write!(f, "{:?}", self)
                }
            }
            impl std::error::Error for AgentError {}
        }
        #[allow(dead_code, clippy::all)]
        pub mod types {
            #[used]
            #[doc(hidden)]
            static __FORCE_SECTION_REF: fn() =
                super::super::super::__link_custom_section_describing_imports;
            use super::super::super::_rt;
            /// Function definition for tool calls
            #[derive(Clone)]
            pub struct Function {
                pub name: _rt::String,
                pub description: Option<_rt::String>,
                pub parameters: Option<_rt::String>,
            }
            impl ::core::fmt::Debug for Function {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("Function")
                        .field("name", &self.name)
                        .field("description", &self.description)
                        .field("parameters", &self.parameters)
                        .finish()
                }
            }
            /// Tool definition for chat completions
            #[derive(Clone)]
            pub struct Tool {
                pub tool_type: _rt::String,
                pub function: Function,
            }
            impl ::core::fmt::Debug for Tool {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("Tool")
                        .field("tool-type", &self.tool_type)
                        .field("function", &self.function)
                        .finish()
                }
            }
            /// Function call details
            #[derive(Clone)]
            pub struct ToolCallFunction {
                pub name: _rt::String,
                pub arguments: _rt::String,
            }
            impl ::core::fmt::Debug for ToolCallFunction {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("ToolCallFunction")
                        .field("name", &self.name)
                        .field("arguments", &self.arguments)
                        .finish()
                }
            }
            /// Tool call for chat completions
            #[derive(Clone)]
            pub struct ToolCall {
                pub id: _rt::String,
                pub tool_type: _rt::String,
                pub function: ToolCallFunction,
            }
            impl ::core::fmt::Debug for ToolCall {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("ToolCall")
                        .field("id", &self.id)
                        .field("tool-type", &self.tool_type)
                        .field("function", &self.function)
                        .finish()
                }
            }
            /// Common message structure for chat completions
            #[derive(Clone)]
            pub struct Message {
                pub role: _rt::String,
                pub content: Option<_rt::String>,
                pub tool_calls: Option<_rt::Vec<ToolCall>>,
                pub tool_call_id: Option<_rt::String>,
                pub name: Option<_rt::String>,
            }
            impl ::core::fmt::Debug for Message {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("Message")
                        .field("role", &self.role)
                        .field("content", &self.content)
                        .field("tool-calls", &self.tool_calls)
                        .field("tool-call-id", &self.tool_call_id)
                        .field("name", &self.name)
                        .finish()
                }
            }
            /// Handler for custom tool calls
            #[derive(Debug)]
            #[repr(transparent)]
            pub struct CustomToolHandler {
                handle: _rt::Resource<CustomToolHandler>,
            }
            impl CustomToolHandler {
                #[doc(hidden)]
                pub unsafe fn from_handle(handle: u32) -> Self {
                    Self { handle: _rt::Resource::from_handle(handle) }
                }
                #[doc(hidden)]
                pub fn take_handle(&self) -> u32 {
                    _rt::Resource::take_handle(&self.handle)
                }
                #[doc(hidden)]
                pub fn handle(&self) -> u32 {
                    _rt::Resource::handle(&self.handle)
                }
            }
            unsafe impl _rt::WasmResource for CustomToolHandler {
                #[inline]
                unsafe fn drop(_handle: u32) {
                    #[cfg(not(target_arch = "wasm32"))]
                    unreachable!();
                    #[cfg(target_arch = "wasm32")]
                    {
                        #[link(wasm_import_module = "wavs:agent/types@0.0.1")]
                        extern "C" {
                            #[link_name = "[resource-drop]custom-tool-handler"]
                            fn drop(_: u32);
                        }
                        drop(_handle);
                    }
                }
            }
            /// Configuration options for LLM API requests
            #[repr(C)]
            #[derive(Clone, Copy)]
            pub struct LlmOptions {
                /// Temperature controls randomness (0.0-2.0)
                pub temperature: f32,
                /// Top_p controls diversity (0.0-1.0)
                pub top_p: f32,
                /// Seed for deterministic outputs
                pub seed: u32,
                /// Maximum tokens to generate
                pub max_tokens: Option<u32>,
                /// Context window size (mainly for Ollama)
                pub context_window: Option<u32>,
            }
            impl ::core::fmt::Debug for LlmOptions {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("LlmOptions")
                        .field("temperature", &self.temperature)
                        .field("top-p", &self.top_p)
                        .field("seed", &self.seed)
                        .field("max-tokens", &self.max_tokens)
                        .field("context-window", &self.context_window)
                        .finish()
                }
            }
            /// Client configuration for LLM interactions
            #[derive(Clone)]
            pub struct LlmClient {
                /// The model name to use
                pub model: _rt::String,
                /// Configuration options for LLM requests
                pub config: LlmOptions,
                /// The API URL to send requests to
                pub api_url: _rt::String,
                /// Optional API key for authenticated services
                pub api_key: Option<_rt::String>,
            }
            impl ::core::fmt::Debug for LlmClient {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("LlmClient")
                        .field("model", &self.model)
                        .field("config", &self.config)
                        .field("api-url", &self.api_url)
                        .field("api-key", &self.api_key)
                        .finish()
                }
            }
            /// Represents a smart contract that the DAO can interact with
            #[derive(Clone)]
            pub struct Contract {
                pub name: _rt::String,
                pub address: _rt::String,
                pub abi: _rt::String,
                pub description: Option<_rt::String>,
            }
            impl ::core::fmt::Debug for Contract {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("Contract")
                        .field("name", &self.name)
                        .field("address", &self.address)
                        .field("abi", &self.abi)
                        .field("description", &self.description)
                        .finish()
                }
            }
            /// Generic configuration for agent's decision making
            #[derive(Clone)]
            pub struct Config {
                pub contracts: _rt::Vec<Contract>,
                pub llm_config: LlmOptions,
                pub model: _rt::String,
                pub messages: _rt::Vec<Message>,
                /// Any global configuration values
                pub config: _rt::Vec<(_rt::String, _rt::String)>,
            }
            impl ::core::fmt::Debug for Config {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("Config")
                        .field("contracts", &self.contracts)
                        .field("llm-config", &self.llm_config)
                        .field("model", &self.model)
                        .field("messages", &self.messages)
                        .field("config", &self.config)
                        .finish()
                }
            }
            /// Represents a contract function call
            #[derive(Clone)]
            pub struct ContractCall {
                pub function: _rt::String,
                pub args: _rt::Vec<_rt::String>,
            }
            impl ::core::fmt::Debug for ContractCall {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("ContractCall")
                        .field("function", &self.function)
                        .field("args", &self.args)
                        .finish()
                }
            }
            /// Represents a transaction to be executed through a wallet
            #[derive(Clone)]
            pub struct Transaction {
                pub to: _rt::String,
                pub value: _rt::String,
                pub contract_call: Option<ContractCall>,
                pub data: _rt::String,
                pub description: _rt::String,
            }
            impl ::core::fmt::Debug for Transaction {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("Transaction")
                        .field("to", &self.to)
                        .field("value", &self.value)
                        .field("contract-call", &self.contract_call)
                        .field("data", &self.data)
                        .field("description", &self.description)
                        .finish()
                }
            }
            /// Response from an LLM interaction
            #[derive(Clone)]
            pub enum LlmResponse {
                /// Transaction to be executed
                Transaction(Transaction),
                /// Text response (when no action is needed)
                Text(_rt::String),
            }
            impl ::core::fmt::Debug for LlmResponse {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    match self {
                        LlmResponse::Transaction(e) => {
                            f.debug_tuple("LlmResponse::Transaction").field(e).finish()
                        }
                        LlmResponse::Text(e) => {
                            f.debug_tuple("LlmResponse::Text").field(e).finish()
                        }
                    }
                }
            }
            impl CustomToolHandler {
                #[allow(unused_unsafe, clippy::all)]
                /// Returns true if this handler can handle the given tool name
                pub fn can_handle(&self, tool_name: &str) -> bool {
                    unsafe {
                        let vec0 = tool_name;
                        let ptr0 = vec0.as_ptr().cast::<u8>();
                        let len0 = vec0.len();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/types@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]custom-tool-handler.can-handle"]
                            fn wit_import(_: i32, _: *mut u8, _: usize) -> i32;
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8, _: usize) -> i32 {
                            unreachable!()
                        }
                        let ret = wit_import((self).handle() as i32, ptr0.cast_mut(), len0);
                        _rt::bool_lift(ret as u8)
                    }
                }
            }
            impl CustomToolHandler {
                #[allow(unused_unsafe, clippy::all)]
                /// Execute the tool call and return a result
                pub fn execute(&self, tool_call: &ToolCall) -> Result<_rt::String, _rt::String> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 12]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 12]);
                        let ToolCall { id: id0, tool_type: tool_type0, function: function0 } =
                            tool_call;
                        let vec1 = id0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = tool_type0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let ToolCallFunction { name: name3, arguments: arguments3 } = function0;
                        let vec4 = name3;
                        let ptr4 = vec4.as_ptr().cast::<u8>();
                        let len4 = vec4.len();
                        let vec5 = arguments3;
                        let ptr5 = vec5.as_ptr().cast::<u8>();
                        let len5 = vec5.len();
                        let ptr6 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/types@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]custom-tool-handler.execute"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr4.cast_mut(),
                            len4,
                            ptr5.cast_mut(),
                            len5,
                            ptr6,
                        );
                        let l7 = i32::from(*ptr6.add(0).cast::<u8>());
                        match l7 {
                            0 => {
                                let e = {
                                    let l8 = *ptr6.add(4).cast::<*mut u8>();
                                    let l9 = *ptr6.add(8).cast::<usize>();
                                    let len10 = l9;
                                    let bytes10 = _rt::Vec::from_raw_parts(l8.cast(), len10, len10);
                                    _rt::string_lift(bytes10)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l11 = *ptr6.add(4).cast::<*mut u8>();
                                    let l12 = *ptr6.add(8).cast::<usize>();
                                    let len13 = l12;
                                    let bytes13 =
                                        _rt::Vec::from_raw_parts(l11.cast(), len13, len13);
                                    _rt::string_lift(bytes13)
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
        }
        #[allow(dead_code, clippy::all)]
        pub mod client {
            #[used]
            #[doc(hidden)]
            static __FORCE_SECTION_REF: fn() =
                super::super::super::__link_custom_section_describing_imports;
            use super::super::super::_rt;
            pub type AgentError = super::super::super::wavs::agent::errors::AgentError;
            pub type Message = super::super::super::wavs::agent::types::Message;
            pub type Tool = super::super::super::wavs::agent::types::Tool;
            pub type CustomToolHandler = super::super::super::wavs::agent::types::CustomToolHandler;
            pub type LlmResponse = super::super::super::wavs::agent::types::LlmResponse;
            pub type Config = super::super::super::wavs::agent::types::Config;
            pub type LlmOptions = super::super::super::wavs::agent::types::LlmOptions;
            pub type LlmClient = super::super::super::wavs::agent::types::LlmClient;
            /// Client for making LLM API requests
            #[derive(Debug)]
            #[repr(transparent)]
            pub struct LlmClientManager {
                handle: _rt::Resource<LlmClientManager>,
            }
            impl LlmClientManager {
                #[doc(hidden)]
                pub unsafe fn from_handle(handle: u32) -> Self {
                    Self { handle: _rt::Resource::from_handle(handle) }
                }
                #[doc(hidden)]
                pub fn take_handle(&self) -> u32 {
                    _rt::Resource::take_handle(&self.handle)
                }
                #[doc(hidden)]
                pub fn handle(&self) -> u32 {
                    _rt::Resource::handle(&self.handle)
                }
            }
            unsafe impl _rt::WasmResource for LlmClientManager {
                #[inline]
                unsafe fn drop(_handle: u32) {
                    #[cfg(not(target_arch = "wasm32"))]
                    unreachable!();
                    #[cfg(target_arch = "wasm32")]
                    {
                        #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                        extern "C" {
                            #[link_name = "[resource-drop]llm-client-manager"]
                            fn drop(_: u32);
                        }
                        drop(_handle);
                    }
                }
            }
            #[allow(unused_unsafe, clippy::all)]
            /// Create a new LLM client with default configuration
            pub fn new_client(model: &str) -> Result<LlmClient, AgentError> {
                unsafe {
                    #[repr(align(4))]
                    struct RetArea([::core::mem::MaybeUninit<u8>; 60]);
                    let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 60]);
                    let vec0 = model;
                    let ptr0 = vec0.as_ptr().cast::<u8>();
                    let len0 = vec0.len();
                    let ptr1 = ret_area.0.as_mut_ptr().cast::<u8>();
                    #[cfg(target_arch = "wasm32")]
                    #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                    extern "C" {
                        #[link_name = "new-client"]
                        fn wit_import(_: *mut u8, _: usize, _: *mut u8);
                    }
                    #[cfg(not(target_arch = "wasm32"))]
                    fn wit_import(_: *mut u8, _: usize, _: *mut u8) {
                        unreachable!()
                    }
                    wit_import(ptr0.cast_mut(), len0, ptr1);
                    let l2 = i32::from(*ptr1.add(0).cast::<u8>());
                    match l2 {
                        0 => {
                            let e = {
                                let l3 = *ptr1.add(4).cast::<*mut u8>();
                                let l4 = *ptr1.add(8).cast::<usize>();
                                let len5 = l4;
                                let bytes5 = _rt::Vec::from_raw_parts(l3.cast(), len5, len5);
                                let l6 = *ptr1.add(12).cast::<f32>();
                                let l7 = *ptr1.add(16).cast::<f32>();
                                let l8 = *ptr1.add(20).cast::<i32>();
                                let l9 = i32::from(*ptr1.add(24).cast::<u8>());
                                let l11 = i32::from(*ptr1.add(32).cast::<u8>());
                                let l13 = *ptr1.add(40).cast::<*mut u8>();
                                let l14 = *ptr1.add(44).cast::<usize>();
                                let len15 = l14;
                                let bytes15 = _rt::Vec::from_raw_parts(l13.cast(), len15, len15);
                                let l16 = i32::from(*ptr1.add(48).cast::<u8>());
                                super::super::super::wavs::agent::types::LlmClient {
                                    model: _rt::string_lift(bytes5),
                                    config: super::super::super::wavs::agent::types::LlmOptions {
                                        temperature: l6,
                                        top_p: l7,
                                        seed: l8 as u32,
                                        max_tokens: match l9 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l10 = *ptr1.add(28).cast::<i32>();
                                                    l10 as u32
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                        context_window: match l11 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l12 = *ptr1.add(36).cast::<i32>();
                                                    l12 as u32
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                    },
                                    api_url: _rt::string_lift(bytes15),
                                    api_key: match l16 {
                                        0 => None,
                                        1 => {
                                            let e = {
                                                let l17 = *ptr1.add(52).cast::<*mut u8>();
                                                let l18 = *ptr1.add(56).cast::<usize>();
                                                let len19 = l18;
                                                let bytes19 = _rt::Vec::from_raw_parts(
                                                    l17.cast(),
                                                    len19,
                                                    len19,
                                                );
                                                _rt::string_lift(bytes19)
                                            };
                                            Some(e)
                                        }
                                        _ => _rt::invalid_enum_discriminant(),
                                    },
                                }
                            };
                            Ok(e)
                        }
                        1 => {
                            let e = {
                                let l20 = i32::from(*ptr1.add(4).cast::<u8>());
                                use super::super::super::wavs::agent::errors::AgentError as V60;
                                let v60 = match l20 {
                                    0 => {
                                        let e60 = {
                                            let l21 = *ptr1.add(8).cast::<*mut u8>();
                                            let l22 = *ptr1.add(12).cast::<usize>();
                                            let len23 = l22;
                                            let bytes23 =
                                                _rt::Vec::from_raw_parts(l21.cast(), len23, len23);
                                            _rt::string_lift(bytes23)
                                        };
                                        V60::Api(e60)
                                    }
                                    1 => {
                                        let e60 = {
                                            let l24 = *ptr1.add(8).cast::<*mut u8>();
                                            let l25 = *ptr1.add(12).cast::<usize>();
                                            let len26 = l25;
                                            let bytes26 =
                                                _rt::Vec::from_raw_parts(l24.cast(), len26, len26);
                                            _rt::string_lift(bytes26)
                                        };
                                        V60::Http(e60)
                                    }
                                    2 => {
                                        let e60 = {
                                            let l27 = *ptr1.add(8).cast::<*mut u8>();
                                            let l28 = *ptr1.add(12).cast::<usize>();
                                            let len29 = l28;
                                            let bytes29 =
                                                _rt::Vec::from_raw_parts(l27.cast(), len29, len29);
                                            _rt::string_lift(bytes29)
                                        };
                                        V60::ExternalService(e60)
                                    }
                                    3 => {
                                        let e60 = {
                                            let l30 = *ptr1.add(8).cast::<*mut u8>();
                                            let l31 = *ptr1.add(12).cast::<usize>();
                                            let len32 = l31;
                                            let bytes32 =
                                                _rt::Vec::from_raw_parts(l30.cast(), len32, len32);
                                            _rt::string_lift(bytes32)
                                        };
                                        V60::Config(e60)
                                    }
                                    4 => {
                                        let e60 = {
                                            let l33 = *ptr1.add(8).cast::<*mut u8>();
                                            let l34 = *ptr1.add(12).cast::<usize>();
                                            let len35 = l34;
                                            let bytes35 =
                                                _rt::Vec::from_raw_parts(l33.cast(), len35, len35);
                                            _rt::string_lift(bytes35)
                                        };
                                        V60::Contract(e60)
                                    }
                                    5 => {
                                        let e60 = {
                                            let l36 = *ptr1.add(8).cast::<*mut u8>();
                                            let l37 = *ptr1.add(12).cast::<usize>();
                                            let len38 = l37;
                                            let bytes38 =
                                                _rt::Vec::from_raw_parts(l36.cast(), len38, len38);
                                            _rt::string_lift(bytes38)
                                        };
                                        V60::Configuration(e60)
                                    }
                                    6 => {
                                        let e60 = {
                                            let l39 = *ptr1.add(8).cast::<*mut u8>();
                                            let l40 = *ptr1.add(12).cast::<usize>();
                                            let len41 = l40;
                                            let bytes41 =
                                                _rt::Vec::from_raw_parts(l39.cast(), len41, len41);
                                            _rt::string_lift(bytes41)
                                        };
                                        V60::ContextLoading(e60)
                                    }
                                    7 => {
                                        let e60 = {
                                            let l42 = *ptr1.add(8).cast::<*mut u8>();
                                            let l43 = *ptr1.add(12).cast::<usize>();
                                            let len44 = l43;
                                            let bytes44 =
                                                _rt::Vec::from_raw_parts(l42.cast(), len44, len44);
                                            _rt::string_lift(bytes44)
                                        };
                                        V60::ContextValidation(e60)
                                    }
                                    8 => {
                                        let e60 = {
                                            let l45 = *ptr1.add(8).cast::<*mut u8>();
                                            let l46 = *ptr1.add(12).cast::<usize>();
                                            let len47 = l46;
                                            let bytes47 =
                                                _rt::Vec::from_raw_parts(l45.cast(), len47, len47);
                                            _rt::string_lift(bytes47)
                                        };
                                        V60::Llm(e60)
                                    }
                                    9 => {
                                        let e60 = {
                                            let l48 = *ptr1.add(8).cast::<*mut u8>();
                                            let l49 = *ptr1.add(12).cast::<usize>();
                                            let len50 = l49;
                                            let bytes50 =
                                                _rt::Vec::from_raw_parts(l48.cast(), len50, len50);
                                            _rt::string_lift(bytes50)
                                        };
                                        V60::Io(e60)
                                    }
                                    10 => {
                                        let e60 = {
                                            let l51 = *ptr1.add(8).cast::<*mut u8>();
                                            let l52 = *ptr1.add(12).cast::<usize>();
                                            let len53 = l52;
                                            let bytes53 =
                                                _rt::Vec::from_raw_parts(l51.cast(), len53, len53);
                                            _rt::string_lift(bytes53)
                                        };
                                        V60::Transaction(e60)
                                    }
                                    11 => {
                                        let e60 = {
                                            let l54 = *ptr1.add(8).cast::<*mut u8>();
                                            let l55 = *ptr1.add(12).cast::<usize>();
                                            let len56 = l55;
                                            let bytes56 =
                                                _rt::Vec::from_raw_parts(l54.cast(), len56, len56);
                                            _rt::string_lift(bytes56)
                                        };
                                        V60::Utf8(e60)
                                    }
                                    n => {
                                        debug_assert_eq!(n, 12, "invalid enum discriminant");
                                        let e60 = {
                                            let l57 = *ptr1.add(8).cast::<*mut u8>();
                                            let l58 = *ptr1.add(12).cast::<usize>();
                                            let len59 = l58;
                                            let bytes59 =
                                                _rt::Vec::from_raw_parts(l57.cast(), len59, len59);
                                            _rt::string_lift(bytes59)
                                        };
                                        V60::Other(e60)
                                    }
                                };
                                v60
                            };
                            Err(e)
                        }
                        _ => _rt::invalid_enum_discriminant(),
                    }
                }
            }
            #[allow(unused_unsafe, clippy::all)]
            /// Create a new LLM client from a JSON configuration string
            pub fn from_json(model: &str, json_config: &str) -> Result<LlmClient, AgentError> {
                unsafe {
                    #[repr(align(4))]
                    struct RetArea([::core::mem::MaybeUninit<u8>; 60]);
                    let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 60]);
                    let vec0 = model;
                    let ptr0 = vec0.as_ptr().cast::<u8>();
                    let len0 = vec0.len();
                    let vec1 = json_config;
                    let ptr1 = vec1.as_ptr().cast::<u8>();
                    let len1 = vec1.len();
                    let ptr2 = ret_area.0.as_mut_ptr().cast::<u8>();
                    #[cfg(target_arch = "wasm32")]
                    #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                    extern "C" {
                        #[link_name = "from-json"]
                        fn wit_import(_: *mut u8, _: usize, _: *mut u8, _: usize, _: *mut u8);
                    }
                    #[cfg(not(target_arch = "wasm32"))]
                    fn wit_import(_: *mut u8, _: usize, _: *mut u8, _: usize, _: *mut u8) {
                        unreachable!()
                    }
                    wit_import(ptr0.cast_mut(), len0, ptr1.cast_mut(), len1, ptr2);
                    let l3 = i32::from(*ptr2.add(0).cast::<u8>());
                    match l3 {
                        0 => {
                            let e = {
                                let l4 = *ptr2.add(4).cast::<*mut u8>();
                                let l5 = *ptr2.add(8).cast::<usize>();
                                let len6 = l5;
                                let bytes6 = _rt::Vec::from_raw_parts(l4.cast(), len6, len6);
                                let l7 = *ptr2.add(12).cast::<f32>();
                                let l8 = *ptr2.add(16).cast::<f32>();
                                let l9 = *ptr2.add(20).cast::<i32>();
                                let l10 = i32::from(*ptr2.add(24).cast::<u8>());
                                let l12 = i32::from(*ptr2.add(32).cast::<u8>());
                                let l14 = *ptr2.add(40).cast::<*mut u8>();
                                let l15 = *ptr2.add(44).cast::<usize>();
                                let len16 = l15;
                                let bytes16 = _rt::Vec::from_raw_parts(l14.cast(), len16, len16);
                                let l17 = i32::from(*ptr2.add(48).cast::<u8>());
                                super::super::super::wavs::agent::types::LlmClient {
                                    model: _rt::string_lift(bytes6),
                                    config: super::super::super::wavs::agent::types::LlmOptions {
                                        temperature: l7,
                                        top_p: l8,
                                        seed: l9 as u32,
                                        max_tokens: match l10 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l11 = *ptr2.add(28).cast::<i32>();
                                                    l11 as u32
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                        context_window: match l12 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l13 = *ptr2.add(36).cast::<i32>();
                                                    l13 as u32
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                    },
                                    api_url: _rt::string_lift(bytes16),
                                    api_key: match l17 {
                                        0 => None,
                                        1 => {
                                            let e = {
                                                let l18 = *ptr2.add(52).cast::<*mut u8>();
                                                let l19 = *ptr2.add(56).cast::<usize>();
                                                let len20 = l19;
                                                let bytes20 = _rt::Vec::from_raw_parts(
                                                    l18.cast(),
                                                    len20,
                                                    len20,
                                                );
                                                _rt::string_lift(bytes20)
                                            };
                                            Some(e)
                                        }
                                        _ => _rt::invalid_enum_discriminant(),
                                    },
                                }
                            };
                            Ok(e)
                        }
                        1 => {
                            let e = {
                                let l21 = i32::from(*ptr2.add(4).cast::<u8>());
                                use super::super::super::wavs::agent::errors::AgentError as V61;
                                let v61 = match l21 {
                                    0 => {
                                        let e61 = {
                                            let l22 = *ptr2.add(8).cast::<*mut u8>();
                                            let l23 = *ptr2.add(12).cast::<usize>();
                                            let len24 = l23;
                                            let bytes24 =
                                                _rt::Vec::from_raw_parts(l22.cast(), len24, len24);
                                            _rt::string_lift(bytes24)
                                        };
                                        V61::Api(e61)
                                    }
                                    1 => {
                                        let e61 = {
                                            let l25 = *ptr2.add(8).cast::<*mut u8>();
                                            let l26 = *ptr2.add(12).cast::<usize>();
                                            let len27 = l26;
                                            let bytes27 =
                                                _rt::Vec::from_raw_parts(l25.cast(), len27, len27);
                                            _rt::string_lift(bytes27)
                                        };
                                        V61::Http(e61)
                                    }
                                    2 => {
                                        let e61 = {
                                            let l28 = *ptr2.add(8).cast::<*mut u8>();
                                            let l29 = *ptr2.add(12).cast::<usize>();
                                            let len30 = l29;
                                            let bytes30 =
                                                _rt::Vec::from_raw_parts(l28.cast(), len30, len30);
                                            _rt::string_lift(bytes30)
                                        };
                                        V61::ExternalService(e61)
                                    }
                                    3 => {
                                        let e61 = {
                                            let l31 = *ptr2.add(8).cast::<*mut u8>();
                                            let l32 = *ptr2.add(12).cast::<usize>();
                                            let len33 = l32;
                                            let bytes33 =
                                                _rt::Vec::from_raw_parts(l31.cast(), len33, len33);
                                            _rt::string_lift(bytes33)
                                        };
                                        V61::Config(e61)
                                    }
                                    4 => {
                                        let e61 = {
                                            let l34 = *ptr2.add(8).cast::<*mut u8>();
                                            let l35 = *ptr2.add(12).cast::<usize>();
                                            let len36 = l35;
                                            let bytes36 =
                                                _rt::Vec::from_raw_parts(l34.cast(), len36, len36);
                                            _rt::string_lift(bytes36)
                                        };
                                        V61::Contract(e61)
                                    }
                                    5 => {
                                        let e61 = {
                                            let l37 = *ptr2.add(8).cast::<*mut u8>();
                                            let l38 = *ptr2.add(12).cast::<usize>();
                                            let len39 = l38;
                                            let bytes39 =
                                                _rt::Vec::from_raw_parts(l37.cast(), len39, len39);
                                            _rt::string_lift(bytes39)
                                        };
                                        V61::Configuration(e61)
                                    }
                                    6 => {
                                        let e61 = {
                                            let l40 = *ptr2.add(8).cast::<*mut u8>();
                                            let l41 = *ptr2.add(12).cast::<usize>();
                                            let len42 = l41;
                                            let bytes42 =
                                                _rt::Vec::from_raw_parts(l40.cast(), len42, len42);
                                            _rt::string_lift(bytes42)
                                        };
                                        V61::ContextLoading(e61)
                                    }
                                    7 => {
                                        let e61 = {
                                            let l43 = *ptr2.add(8).cast::<*mut u8>();
                                            let l44 = *ptr2.add(12).cast::<usize>();
                                            let len45 = l44;
                                            let bytes45 =
                                                _rt::Vec::from_raw_parts(l43.cast(), len45, len45);
                                            _rt::string_lift(bytes45)
                                        };
                                        V61::ContextValidation(e61)
                                    }
                                    8 => {
                                        let e61 = {
                                            let l46 = *ptr2.add(8).cast::<*mut u8>();
                                            let l47 = *ptr2.add(12).cast::<usize>();
                                            let len48 = l47;
                                            let bytes48 =
                                                _rt::Vec::from_raw_parts(l46.cast(), len48, len48);
                                            _rt::string_lift(bytes48)
                                        };
                                        V61::Llm(e61)
                                    }
                                    9 => {
                                        let e61 = {
                                            let l49 = *ptr2.add(8).cast::<*mut u8>();
                                            let l50 = *ptr2.add(12).cast::<usize>();
                                            let len51 = l50;
                                            let bytes51 =
                                                _rt::Vec::from_raw_parts(l49.cast(), len51, len51);
                                            _rt::string_lift(bytes51)
                                        };
                                        V61::Io(e61)
                                    }
                                    10 => {
                                        let e61 = {
                                            let l52 = *ptr2.add(8).cast::<*mut u8>();
                                            let l53 = *ptr2.add(12).cast::<usize>();
                                            let len54 = l53;
                                            let bytes54 =
                                                _rt::Vec::from_raw_parts(l52.cast(), len54, len54);
                                            _rt::string_lift(bytes54)
                                        };
                                        V61::Transaction(e61)
                                    }
                                    11 => {
                                        let e61 = {
                                            let l55 = *ptr2.add(8).cast::<*mut u8>();
                                            let l56 = *ptr2.add(12).cast::<usize>();
                                            let len57 = l56;
                                            let bytes57 =
                                                _rt::Vec::from_raw_parts(l55.cast(), len57, len57);
                                            _rt::string_lift(bytes57)
                                        };
                                        V61::Utf8(e61)
                                    }
                                    n => {
                                        debug_assert_eq!(n, 12, "invalid enum discriminant");
                                        let e61 = {
                                            let l58 = *ptr2.add(8).cast::<*mut u8>();
                                            let l59 = *ptr2.add(12).cast::<usize>();
                                            let len60 = l59;
                                            let bytes60 =
                                                _rt::Vec::from_raw_parts(l58.cast(), len60, len60);
                                            _rt::string_lift(bytes60)
                                        };
                                        V61::Other(e61)
                                    }
                                };
                                v61
                            };
                            Err(e)
                        }
                        _ => _rt::invalid_enum_discriminant(),
                    }
                }
            }
            #[allow(unused_unsafe, clippy::all)]
            /// Create a new LLM client with custom configuration
            pub fn with_config(model: &str, config: LlmOptions) -> Result<LlmClient, AgentError> {
                unsafe {
                    #[repr(align(4))]
                    struct RetArea([::core::mem::MaybeUninit<u8>; 60]);
                    let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 60]);
                    let vec0 = model;
                    let ptr0 = vec0.as_ptr().cast::<u8>();
                    let len0 = vec0.len();
                    let super::super::super::wavs::agent::types::LlmOptions {
                        temperature: temperature1,
                        top_p: top_p1,
                        seed: seed1,
                        max_tokens: max_tokens1,
                        context_window: context_window1,
                    } = config;
                    let (result2_0, result2_1) = match max_tokens1 {
                        Some(e) => (1i32, _rt::as_i32(e)),
                        None => (0i32, 0i32),
                    };
                    let (result3_0, result3_1) = match context_window1 {
                        Some(e) => (1i32, _rt::as_i32(e)),
                        None => (0i32, 0i32),
                    };
                    let ptr4 = ret_area.0.as_mut_ptr().cast::<u8>();
                    #[cfg(target_arch = "wasm32")]
                    #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                    extern "C" {
                        #[link_name = "with-config"]
                        fn wit_import(
                            _: *mut u8,
                            _: usize,
                            _: f32,
                            _: f32,
                            _: i32,
                            _: i32,
                            _: i32,
                            _: i32,
                            _: i32,
                            _: *mut u8,
                        );
                    }
                    #[cfg(not(target_arch = "wasm32"))]
                    fn wit_import(
                        _: *mut u8,
                        _: usize,
                        _: f32,
                        _: f32,
                        _: i32,
                        _: i32,
                        _: i32,
                        _: i32,
                        _: i32,
                        _: *mut u8,
                    ) {
                        unreachable!()
                    }
                    wit_import(
                        ptr0.cast_mut(),
                        len0,
                        _rt::as_f32(temperature1),
                        _rt::as_f32(top_p1),
                        _rt::as_i32(seed1),
                        result2_0,
                        result2_1,
                        result3_0,
                        result3_1,
                        ptr4,
                    );
                    let l5 = i32::from(*ptr4.add(0).cast::<u8>());
                    match l5 {
                        0 => {
                            let e = {
                                let l6 = *ptr4.add(4).cast::<*mut u8>();
                                let l7 = *ptr4.add(8).cast::<usize>();
                                let len8 = l7;
                                let bytes8 = _rt::Vec::from_raw_parts(l6.cast(), len8, len8);
                                let l9 = *ptr4.add(12).cast::<f32>();
                                let l10 = *ptr4.add(16).cast::<f32>();
                                let l11 = *ptr4.add(20).cast::<i32>();
                                let l12 = i32::from(*ptr4.add(24).cast::<u8>());
                                let l14 = i32::from(*ptr4.add(32).cast::<u8>());
                                let l16 = *ptr4.add(40).cast::<*mut u8>();
                                let l17 = *ptr4.add(44).cast::<usize>();
                                let len18 = l17;
                                let bytes18 = _rt::Vec::from_raw_parts(l16.cast(), len18, len18);
                                let l19 = i32::from(*ptr4.add(48).cast::<u8>());
                                super::super::super::wavs::agent::types::LlmClient {
                                    model: _rt::string_lift(bytes8),
                                    config: super::super::super::wavs::agent::types::LlmOptions {
                                        temperature: l9,
                                        top_p: l10,
                                        seed: l11 as u32,
                                        max_tokens: match l12 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l13 = *ptr4.add(28).cast::<i32>();
                                                    l13 as u32
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                        context_window: match l14 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l15 = *ptr4.add(36).cast::<i32>();
                                                    l15 as u32
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                    },
                                    api_url: _rt::string_lift(bytes18),
                                    api_key: match l19 {
                                        0 => None,
                                        1 => {
                                            let e = {
                                                let l20 = *ptr4.add(52).cast::<*mut u8>();
                                                let l21 = *ptr4.add(56).cast::<usize>();
                                                let len22 = l21;
                                                let bytes22 = _rt::Vec::from_raw_parts(
                                                    l20.cast(),
                                                    len22,
                                                    len22,
                                                );
                                                _rt::string_lift(bytes22)
                                            };
                                            Some(e)
                                        }
                                        _ => _rt::invalid_enum_discriminant(),
                                    },
                                }
                            };
                            Ok(e)
                        }
                        1 => {
                            let e = {
                                let l23 = i32::from(*ptr4.add(4).cast::<u8>());
                                use super::super::super::wavs::agent::errors::AgentError as V63;
                                let v63 = match l23 {
                                    0 => {
                                        let e63 = {
                                            let l24 = *ptr4.add(8).cast::<*mut u8>();
                                            let l25 = *ptr4.add(12).cast::<usize>();
                                            let len26 = l25;
                                            let bytes26 =
                                                _rt::Vec::from_raw_parts(l24.cast(), len26, len26);
                                            _rt::string_lift(bytes26)
                                        };
                                        V63::Api(e63)
                                    }
                                    1 => {
                                        let e63 = {
                                            let l27 = *ptr4.add(8).cast::<*mut u8>();
                                            let l28 = *ptr4.add(12).cast::<usize>();
                                            let len29 = l28;
                                            let bytes29 =
                                                _rt::Vec::from_raw_parts(l27.cast(), len29, len29);
                                            _rt::string_lift(bytes29)
                                        };
                                        V63::Http(e63)
                                    }
                                    2 => {
                                        let e63 = {
                                            let l30 = *ptr4.add(8).cast::<*mut u8>();
                                            let l31 = *ptr4.add(12).cast::<usize>();
                                            let len32 = l31;
                                            let bytes32 =
                                                _rt::Vec::from_raw_parts(l30.cast(), len32, len32);
                                            _rt::string_lift(bytes32)
                                        };
                                        V63::ExternalService(e63)
                                    }
                                    3 => {
                                        let e63 = {
                                            let l33 = *ptr4.add(8).cast::<*mut u8>();
                                            let l34 = *ptr4.add(12).cast::<usize>();
                                            let len35 = l34;
                                            let bytes35 =
                                                _rt::Vec::from_raw_parts(l33.cast(), len35, len35);
                                            _rt::string_lift(bytes35)
                                        };
                                        V63::Config(e63)
                                    }
                                    4 => {
                                        let e63 = {
                                            let l36 = *ptr4.add(8).cast::<*mut u8>();
                                            let l37 = *ptr4.add(12).cast::<usize>();
                                            let len38 = l37;
                                            let bytes38 =
                                                _rt::Vec::from_raw_parts(l36.cast(), len38, len38);
                                            _rt::string_lift(bytes38)
                                        };
                                        V63::Contract(e63)
                                    }
                                    5 => {
                                        let e63 = {
                                            let l39 = *ptr4.add(8).cast::<*mut u8>();
                                            let l40 = *ptr4.add(12).cast::<usize>();
                                            let len41 = l40;
                                            let bytes41 =
                                                _rt::Vec::from_raw_parts(l39.cast(), len41, len41);
                                            _rt::string_lift(bytes41)
                                        };
                                        V63::Configuration(e63)
                                    }
                                    6 => {
                                        let e63 = {
                                            let l42 = *ptr4.add(8).cast::<*mut u8>();
                                            let l43 = *ptr4.add(12).cast::<usize>();
                                            let len44 = l43;
                                            let bytes44 =
                                                _rt::Vec::from_raw_parts(l42.cast(), len44, len44);
                                            _rt::string_lift(bytes44)
                                        };
                                        V63::ContextLoading(e63)
                                    }
                                    7 => {
                                        let e63 = {
                                            let l45 = *ptr4.add(8).cast::<*mut u8>();
                                            let l46 = *ptr4.add(12).cast::<usize>();
                                            let len47 = l46;
                                            let bytes47 =
                                                _rt::Vec::from_raw_parts(l45.cast(), len47, len47);
                                            _rt::string_lift(bytes47)
                                        };
                                        V63::ContextValidation(e63)
                                    }
                                    8 => {
                                        let e63 = {
                                            let l48 = *ptr4.add(8).cast::<*mut u8>();
                                            let l49 = *ptr4.add(12).cast::<usize>();
                                            let len50 = l49;
                                            let bytes50 =
                                                _rt::Vec::from_raw_parts(l48.cast(), len50, len50);
                                            _rt::string_lift(bytes50)
                                        };
                                        V63::Llm(e63)
                                    }
                                    9 => {
                                        let e63 = {
                                            let l51 = *ptr4.add(8).cast::<*mut u8>();
                                            let l52 = *ptr4.add(12).cast::<usize>();
                                            let len53 = l52;
                                            let bytes53 =
                                                _rt::Vec::from_raw_parts(l51.cast(), len53, len53);
                                            _rt::string_lift(bytes53)
                                        };
                                        V63::Io(e63)
                                    }
                                    10 => {
                                        let e63 = {
                                            let l54 = *ptr4.add(8).cast::<*mut u8>();
                                            let l55 = *ptr4.add(12).cast::<usize>();
                                            let len56 = l55;
                                            let bytes56 =
                                                _rt::Vec::from_raw_parts(l54.cast(), len56, len56);
                                            _rt::string_lift(bytes56)
                                        };
                                        V63::Transaction(e63)
                                    }
                                    11 => {
                                        let e63 = {
                                            let l57 = *ptr4.add(8).cast::<*mut u8>();
                                            let l58 = *ptr4.add(12).cast::<usize>();
                                            let len59 = l58;
                                            let bytes59 =
                                                _rt::Vec::from_raw_parts(l57.cast(), len59, len59);
                                            _rt::string_lift(bytes59)
                                        };
                                        V63::Utf8(e63)
                                    }
                                    n => {
                                        debug_assert_eq!(n, 12, "invalid enum discriminant");
                                        let e63 = {
                                            let l60 = *ptr4.add(8).cast::<*mut u8>();
                                            let l61 = *ptr4.add(12).cast::<usize>();
                                            let len62 = l61;
                                            let bytes62 =
                                                _rt::Vec::from_raw_parts(l60.cast(), len62, len62);
                                            _rt::string_lift(bytes62)
                                        };
                                        V63::Other(e63)
                                    }
                                };
                                v63
                            };
                            Err(e)
                        }
                        _ => _rt::invalid_enum_discriminant(),
                    }
                }
            }
            impl LlmClientManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Get the model name
                pub fn get_model(&self) -> _rt::String {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 8]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 8]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-client-manager.get-model"]
                            fn wit_import(_: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0);
                        let l1 = *ptr0.add(0).cast::<*mut u8>();
                        let l2 = *ptr0.add(4).cast::<usize>();
                        let len3 = l2;
                        let bytes3 = _rt::Vec::from_raw_parts(l1.cast(), len3, len3);
                        _rt::string_lift(bytes3)
                    }
                }
            }
            impl LlmClientManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Get a reference to the current configuration
                pub fn get_config(&self) -> LlmOptions {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 28]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 28]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-client-manager.get-config"]
                            fn wit_import(_: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0);
                        let l1 = *ptr0.add(0).cast::<f32>();
                        let l2 = *ptr0.add(4).cast::<f32>();
                        let l3 = *ptr0.add(8).cast::<i32>();
                        let l4 = i32::from(*ptr0.add(12).cast::<u8>());
                        let l6 = i32::from(*ptr0.add(20).cast::<u8>());
                        super::super::super::wavs::agent::types::LlmOptions {
                            temperature: l1,
                            top_p: l2,
                            seed: l3 as u32,
                            max_tokens: match l4 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l5 = *ptr0.add(16).cast::<i32>();
                                        l5 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            context_window: match l6 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l7 = *ptr0.add(24).cast::<i32>();
                                        l7 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl LlmClientManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Send a chat completion request, with optional tools
                pub fn chat_completion(
                    &self,
                    messages: &[Message],
                    tools: Option<&[Tool]>,
                ) -> Result<Message, AgentError> {
                    unsafe {
                        let mut cleanup_list = _rt::Vec::new();
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 60]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 60]);
                        let vec12 = messages;
                        let len12 = vec12.len();
                        let layout12 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec12.len() * 56, 4);
                        let result12 = if layout12.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout12).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout12);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec12.into_iter().enumerate() {
                            let base = result12.add(i * 56);
                            {
                                let super::super::super::wavs::agent::types::Message {
                                    role: role0,
                                    content: content0,
                                    tool_calls: tool_calls0,
                                    tool_call_id: tool_call_id0,
                                    name: name0,
                                } = e;
                                let vec1 = role0;
                                let ptr1 = vec1.as_ptr().cast::<u8>();
                                let len1 = vec1.len();
                                *base.add(4).cast::<usize>() = len1;
                                *base.add(0).cast::<*mut u8>() = ptr1.cast_mut();
                                match content0 {
                                    Some(e) => {
                                        *base.add(8).cast::<u8>() = (1i32) as u8;
                                        let vec2 = e;
                                        let ptr2 = vec2.as_ptr().cast::<u8>();
                                        let len2 = vec2.len();
                                        *base.add(16).cast::<usize>() = len2;
                                        *base.add(12).cast::<*mut u8>() = ptr2.cast_mut();
                                    }
                                    None => {
                                        *base.add(8).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match tool_calls0 {
                                    Some(e) => {
                                        *base.add(20).cast::<u8>() = (1i32) as u8;
                                        let vec9 = e;
                                        let len9 = vec9.len();
                                        let layout9 = _rt::alloc::Layout::from_size_align_unchecked(
                                            vec9.len() * 32,
                                            4,
                                        );
                                        let result9 = if layout9.size() != 0 {
                                            let ptr = _rt::alloc::alloc(layout9).cast::<u8>();
                                            if ptr.is_null() {
                                                _rt::alloc::handle_alloc_error(layout9);
                                            }
                                            ptr
                                        } else {
                                            ::core::ptr::null_mut()
                                        };
                                        for (i, e) in vec9.into_iter().enumerate() {
                                            let base = result9.add(i * 32);
                                            {
                                                let super::super::super::wavs::agent::types::ToolCall {
                                                    id: id3,
                                                    tool_type: tool_type3,
                                                    function: function3,
                                                } = e;
                                                let vec4 = id3;
                                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                                let len4 = vec4.len();
                                                *base.add(4).cast::<usize>() = len4;
                                                *base.add(0).cast::<*mut u8>() = ptr4.cast_mut();
                                                let vec5 = tool_type3;
                                                let ptr5 = vec5.as_ptr().cast::<u8>();
                                                let len5 = vec5.len();
                                                *base.add(12).cast::<usize>() = len5;
                                                *base.add(8).cast::<*mut u8>() = ptr5.cast_mut();
                                                let super::super::super::wavs::agent::types::ToolCallFunction {
                                                    name: name6,
                                                    arguments: arguments6,
                                                } = function3;
                                                let vec7 = name6;
                                                let ptr7 = vec7.as_ptr().cast::<u8>();
                                                let len7 = vec7.len();
                                                *base.add(20).cast::<usize>() = len7;
                                                *base.add(16).cast::<*mut u8>() = ptr7.cast_mut();
                                                let vec8 = arguments6;
                                                let ptr8 = vec8.as_ptr().cast::<u8>();
                                                let len8 = vec8.len();
                                                *base.add(28).cast::<usize>() = len8;
                                                *base.add(24).cast::<*mut u8>() = ptr8.cast_mut();
                                            }
                                        }
                                        *base.add(28).cast::<usize>() = len9;
                                        *base.add(24).cast::<*mut u8>() = result9;
                                        cleanup_list.extend_from_slice(&[(result9, layout9)]);
                                    }
                                    None => {
                                        *base.add(20).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match tool_call_id0 {
                                    Some(e) => {
                                        *base.add(32).cast::<u8>() = (1i32) as u8;
                                        let vec10 = e;
                                        let ptr10 = vec10.as_ptr().cast::<u8>();
                                        let len10 = vec10.len();
                                        *base.add(40).cast::<usize>() = len10;
                                        *base.add(36).cast::<*mut u8>() = ptr10.cast_mut();
                                    }
                                    None => {
                                        *base.add(32).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match name0 {
                                    Some(e) => {
                                        *base.add(44).cast::<u8>() = (1i32) as u8;
                                        let vec11 = e;
                                        let ptr11 = vec11.as_ptr().cast::<u8>();
                                        let len11 = vec11.len();
                                        *base.add(52).cast::<usize>() = len11;
                                        *base.add(48).cast::<*mut u8>() = ptr11.cast_mut();
                                    }
                                    None => {
                                        *base.add(44).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                            }
                        }
                        let (result20_0, result20_1, result20_2) = match tools {
                            Some(e) => {
                                let vec19 = e;
                                let len19 = vec19.len();
                                let layout19 = _rt::alloc::Layout::from_size_align_unchecked(
                                    vec19.len() * 40,
                                    4,
                                );
                                let result19 = if layout19.size() != 0 {
                                    let ptr = _rt::alloc::alloc(layout19).cast::<u8>();
                                    if ptr.is_null() {
                                        _rt::alloc::handle_alloc_error(layout19);
                                    }
                                    ptr
                                } else {
                                    ::core::ptr::null_mut()
                                };
                                for (i, e) in vec19.into_iter().enumerate() {
                                    let base = result19.add(i * 40);
                                    {
                                        let super::super::super::wavs::agent::types::Tool {
                                            tool_type: tool_type13,
                                            function: function13,
                                        } = e;
                                        let vec14 = tool_type13;
                                        let ptr14 = vec14.as_ptr().cast::<u8>();
                                        let len14 = vec14.len();
                                        *base.add(4).cast::<usize>() = len14;
                                        *base.add(0).cast::<*mut u8>() = ptr14.cast_mut();
                                        let super::super::super::wavs::agent::types::Function {
                                            name: name15,
                                            description: description15,
                                            parameters: parameters15,
                                        } = function13;
                                        let vec16 = name15;
                                        let ptr16 = vec16.as_ptr().cast::<u8>();
                                        let len16 = vec16.len();
                                        *base.add(12).cast::<usize>() = len16;
                                        *base.add(8).cast::<*mut u8>() = ptr16.cast_mut();
                                        match description15 {
                                            Some(e) => {
                                                *base.add(16).cast::<u8>() = (1i32) as u8;
                                                let vec17 = e;
                                                let ptr17 = vec17.as_ptr().cast::<u8>();
                                                let len17 = vec17.len();
                                                *base.add(24).cast::<usize>() = len17;
                                                *base.add(20).cast::<*mut u8>() = ptr17.cast_mut();
                                            }
                                            None => {
                                                *base.add(16).cast::<u8>() = (0i32) as u8;
                                            }
                                        };
                                        match parameters15 {
                                            Some(e) => {
                                                *base.add(28).cast::<u8>() = (1i32) as u8;
                                                let vec18 = e;
                                                let ptr18 = vec18.as_ptr().cast::<u8>();
                                                let len18 = vec18.len();
                                                *base.add(36).cast::<usize>() = len18;
                                                *base.add(32).cast::<*mut u8>() = ptr18.cast_mut();
                                            }
                                            None => {
                                                *base.add(28).cast::<u8>() = (0i32) as u8;
                                            }
                                        };
                                    }
                                }
                                cleanup_list.extend_from_slice(&[(result19, layout19)]);
                                (1i32, result19, len19)
                            }
                            None => (0i32, ::core::ptr::null_mut(), 0usize),
                        };
                        let ptr21 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-client-manager.chat-completion"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            result12,
                            len12,
                            result20_0,
                            result20_1,
                            result20_2,
                            ptr21,
                        );
                        let l22 = i32::from(*ptr21.add(0).cast::<u8>());
                        if layout12.size() != 0 {
                            _rt::alloc::dealloc(result12.cast(), layout12);
                        }
                        for (ptr, layout) in cleanup_list {
                            if layout.size() != 0 {
                                _rt::alloc::dealloc(ptr.cast(), layout);
                            }
                        }
                        match l22 {
                            0 => {
                                let e = {
                                    let l23 = *ptr21.add(4).cast::<*mut u8>();
                                    let l24 = *ptr21.add(8).cast::<usize>();
                                    let len25 = l24;
                                    let bytes25 =
                                        _rt::Vec::from_raw_parts(l23.cast(), len25, len25);
                                    let l26 = i32::from(*ptr21.add(12).cast::<u8>());
                                    let l30 = i32::from(*ptr21.add(24).cast::<u8>());
                                    let l46 = i32::from(*ptr21.add(36).cast::<u8>());
                                    let l50 = i32::from(*ptr21.add(48).cast::<u8>());
                                    super::super::super::wavs::agent::types::Message {
                                        role: _rt::string_lift(bytes25),
                                        content: match l26 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l27 = *ptr21.add(16).cast::<*mut u8>();
                                                    let l28 = *ptr21.add(20).cast::<usize>();
                                                    let len29 = l28;
                                                    let bytes29 = _rt::Vec::from_raw_parts(
                                                        l27.cast(),
                                                        len29,
                                                        len29,
                                                    );
                                                    _rt::string_lift(bytes29)
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                        tool_calls: match l30 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l31 = *ptr21.add(28).cast::<*mut u8>();
                                                    let l32 = *ptr21.add(32).cast::<usize>();
                                                    let base45 = l31;
                                                    let len45 = l32;
                                                    let mut result45 =
                                                        _rt::Vec::with_capacity(len45);
                                                    for i in 0..len45 {
                                                        let base = base45.add(i * 32);
                                                        let e45 = {
                                                            let l33 =
                                                                *base.add(0).cast::<*mut u8>();
                                                            let l34 = *base.add(4).cast::<usize>();
                                                            let len35 = l34;
                                                            let bytes35 = _rt::Vec::from_raw_parts(
                                                                l33.cast(),
                                                                len35,
                                                                len35,
                                                            );
                                                            let l36 =
                                                                *base.add(8).cast::<*mut u8>();
                                                            let l37 = *base.add(12).cast::<usize>();
                                                            let len38 = l37;
                                                            let bytes38 = _rt::Vec::from_raw_parts(
                                                                l36.cast(),
                                                                len38,
                                                                len38,
                                                            );
                                                            let l39 =
                                                                *base.add(16).cast::<*mut u8>();
                                                            let l40 = *base.add(20).cast::<usize>();
                                                            let len41 = l40;
                                                            let bytes41 = _rt::Vec::from_raw_parts(
                                                                l39.cast(),
                                                                len41,
                                                                len41,
                                                            );
                                                            let l42 =
                                                                *base.add(24).cast::<*mut u8>();
                                                            let l43 = *base.add(28).cast::<usize>();
                                                            let len44 = l43;
                                                            let bytes44 = _rt::Vec::from_raw_parts(
                                                                l42.cast(),
                                                                len44,
                                                                len44,
                                                            );
                                                            super::super::super::wavs::agent::types::ToolCall {
                                                                id: _rt::string_lift(bytes35),
                                                                tool_type: _rt::string_lift(bytes38),
                                                                function: super::super::super::wavs::agent::types::ToolCallFunction {
                                                                    name: _rt::string_lift(bytes41),
                                                                    arguments: _rt::string_lift(bytes44),
                                                                },
                                                            }
                                                        };
                                                        result45.push(e45);
                                                    }
                                                    _rt::cabi_dealloc(base45, len45 * 32, 4);
                                                    result45
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                        tool_call_id: match l46 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l47 = *ptr21.add(40).cast::<*mut u8>();
                                                    let l48 = *ptr21.add(44).cast::<usize>();
                                                    let len49 = l48;
                                                    let bytes49 = _rt::Vec::from_raw_parts(
                                                        l47.cast(),
                                                        len49,
                                                        len49,
                                                    );
                                                    _rt::string_lift(bytes49)
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                        name: match l50 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l51 = *ptr21.add(52).cast::<*mut u8>();
                                                    let l52 = *ptr21.add(56).cast::<usize>();
                                                    let len53 = l52;
                                                    let bytes53 = _rt::Vec::from_raw_parts(
                                                        l51.cast(),
                                                        len53,
                                                        len53,
                                                    );
                                                    _rt::string_lift(bytes53)
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                    }
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l54 = i32::from(*ptr21.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V94;
                                    let v94 = match l54 {
                                        0 => {
                                            let e94 = {
                                                let l55 = *ptr21.add(8).cast::<*mut u8>();
                                                let l56 = *ptr21.add(12).cast::<usize>();
                                                let len57 = l56;
                                                let bytes57 = _rt::Vec::from_raw_parts(
                                                    l55.cast(),
                                                    len57,
                                                    len57,
                                                );
                                                _rt::string_lift(bytes57)
                                            };
                                            V94::Api(e94)
                                        }
                                        1 => {
                                            let e94 = {
                                                let l58 = *ptr21.add(8).cast::<*mut u8>();
                                                let l59 = *ptr21.add(12).cast::<usize>();
                                                let len60 = l59;
                                                let bytes60 = _rt::Vec::from_raw_parts(
                                                    l58.cast(),
                                                    len60,
                                                    len60,
                                                );
                                                _rt::string_lift(bytes60)
                                            };
                                            V94::Http(e94)
                                        }
                                        2 => {
                                            let e94 = {
                                                let l61 = *ptr21.add(8).cast::<*mut u8>();
                                                let l62 = *ptr21.add(12).cast::<usize>();
                                                let len63 = l62;
                                                let bytes63 = _rt::Vec::from_raw_parts(
                                                    l61.cast(),
                                                    len63,
                                                    len63,
                                                );
                                                _rt::string_lift(bytes63)
                                            };
                                            V94::ExternalService(e94)
                                        }
                                        3 => {
                                            let e94 = {
                                                let l64 = *ptr21.add(8).cast::<*mut u8>();
                                                let l65 = *ptr21.add(12).cast::<usize>();
                                                let len66 = l65;
                                                let bytes66 = _rt::Vec::from_raw_parts(
                                                    l64.cast(),
                                                    len66,
                                                    len66,
                                                );
                                                _rt::string_lift(bytes66)
                                            };
                                            V94::Config(e94)
                                        }
                                        4 => {
                                            let e94 = {
                                                let l67 = *ptr21.add(8).cast::<*mut u8>();
                                                let l68 = *ptr21.add(12).cast::<usize>();
                                                let len69 = l68;
                                                let bytes69 = _rt::Vec::from_raw_parts(
                                                    l67.cast(),
                                                    len69,
                                                    len69,
                                                );
                                                _rt::string_lift(bytes69)
                                            };
                                            V94::Contract(e94)
                                        }
                                        5 => {
                                            let e94 = {
                                                let l70 = *ptr21.add(8).cast::<*mut u8>();
                                                let l71 = *ptr21.add(12).cast::<usize>();
                                                let len72 = l71;
                                                let bytes72 = _rt::Vec::from_raw_parts(
                                                    l70.cast(),
                                                    len72,
                                                    len72,
                                                );
                                                _rt::string_lift(bytes72)
                                            };
                                            V94::Configuration(e94)
                                        }
                                        6 => {
                                            let e94 = {
                                                let l73 = *ptr21.add(8).cast::<*mut u8>();
                                                let l74 = *ptr21.add(12).cast::<usize>();
                                                let len75 = l74;
                                                let bytes75 = _rt::Vec::from_raw_parts(
                                                    l73.cast(),
                                                    len75,
                                                    len75,
                                                );
                                                _rt::string_lift(bytes75)
                                            };
                                            V94::ContextLoading(e94)
                                        }
                                        7 => {
                                            let e94 = {
                                                let l76 = *ptr21.add(8).cast::<*mut u8>();
                                                let l77 = *ptr21.add(12).cast::<usize>();
                                                let len78 = l77;
                                                let bytes78 = _rt::Vec::from_raw_parts(
                                                    l76.cast(),
                                                    len78,
                                                    len78,
                                                );
                                                _rt::string_lift(bytes78)
                                            };
                                            V94::ContextValidation(e94)
                                        }
                                        8 => {
                                            let e94 = {
                                                let l79 = *ptr21.add(8).cast::<*mut u8>();
                                                let l80 = *ptr21.add(12).cast::<usize>();
                                                let len81 = l80;
                                                let bytes81 = _rt::Vec::from_raw_parts(
                                                    l79.cast(),
                                                    len81,
                                                    len81,
                                                );
                                                _rt::string_lift(bytes81)
                                            };
                                            V94::Llm(e94)
                                        }
                                        9 => {
                                            let e94 = {
                                                let l82 = *ptr21.add(8).cast::<*mut u8>();
                                                let l83 = *ptr21.add(12).cast::<usize>();
                                                let len84 = l83;
                                                let bytes84 = _rt::Vec::from_raw_parts(
                                                    l82.cast(),
                                                    len84,
                                                    len84,
                                                );
                                                _rt::string_lift(bytes84)
                                            };
                                            V94::Io(e94)
                                        }
                                        10 => {
                                            let e94 = {
                                                let l85 = *ptr21.add(8).cast::<*mut u8>();
                                                let l86 = *ptr21.add(12).cast::<usize>();
                                                let len87 = l86;
                                                let bytes87 = _rt::Vec::from_raw_parts(
                                                    l85.cast(),
                                                    len87,
                                                    len87,
                                                );
                                                _rt::string_lift(bytes87)
                                            };
                                            V94::Transaction(e94)
                                        }
                                        11 => {
                                            let e94 = {
                                                let l88 = *ptr21.add(8).cast::<*mut u8>();
                                                let l89 = *ptr21.add(12).cast::<usize>();
                                                let len90 = l89;
                                                let bytes90 = _rt::Vec::from_raw_parts(
                                                    l88.cast(),
                                                    len90,
                                                    len90,
                                                );
                                                _rt::string_lift(bytes90)
                                            };
                                            V94::Utf8(e94)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e94 = {
                                                let l91 = *ptr21.add(8).cast::<*mut u8>();
                                                let l92 = *ptr21.add(12).cast::<usize>();
                                                let len93 = l92;
                                                let bytes93 = _rt::Vec::from_raw_parts(
                                                    l91.cast(),
                                                    len93,
                                                    len93,
                                                );
                                                _rt::string_lift(bytes93)
                                            };
                                            V94::Other(e94)
                                        }
                                    };
                                    v94
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl LlmClientManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Helper method to get just the content string from a chat completion
                pub fn chat_completion_text(
                    &self,
                    messages: &[Message],
                ) -> Result<_rt::String, AgentError> {
                    unsafe {
                        let mut cleanup_list = _rt::Vec::new();
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 16]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 16]);
                        let vec12 = messages;
                        let len12 = vec12.len();
                        let layout12 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec12.len() * 56, 4);
                        let result12 = if layout12.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout12).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout12);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec12.into_iter().enumerate() {
                            let base = result12.add(i * 56);
                            {
                                let super::super::super::wavs::agent::types::Message {
                                    role: role0,
                                    content: content0,
                                    tool_calls: tool_calls0,
                                    tool_call_id: tool_call_id0,
                                    name: name0,
                                } = e;
                                let vec1 = role0;
                                let ptr1 = vec1.as_ptr().cast::<u8>();
                                let len1 = vec1.len();
                                *base.add(4).cast::<usize>() = len1;
                                *base.add(0).cast::<*mut u8>() = ptr1.cast_mut();
                                match content0 {
                                    Some(e) => {
                                        *base.add(8).cast::<u8>() = (1i32) as u8;
                                        let vec2 = e;
                                        let ptr2 = vec2.as_ptr().cast::<u8>();
                                        let len2 = vec2.len();
                                        *base.add(16).cast::<usize>() = len2;
                                        *base.add(12).cast::<*mut u8>() = ptr2.cast_mut();
                                    }
                                    None => {
                                        *base.add(8).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match tool_calls0 {
                                    Some(e) => {
                                        *base.add(20).cast::<u8>() = (1i32) as u8;
                                        let vec9 = e;
                                        let len9 = vec9.len();
                                        let layout9 = _rt::alloc::Layout::from_size_align_unchecked(
                                            vec9.len() * 32,
                                            4,
                                        );
                                        let result9 = if layout9.size() != 0 {
                                            let ptr = _rt::alloc::alloc(layout9).cast::<u8>();
                                            if ptr.is_null() {
                                                _rt::alloc::handle_alloc_error(layout9);
                                            }
                                            ptr
                                        } else {
                                            ::core::ptr::null_mut()
                                        };
                                        for (i, e) in vec9.into_iter().enumerate() {
                                            let base = result9.add(i * 32);
                                            {
                                                let super::super::super::wavs::agent::types::ToolCall {
                                                    id: id3,
                                                    tool_type: tool_type3,
                                                    function: function3,
                                                } = e;
                                                let vec4 = id3;
                                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                                let len4 = vec4.len();
                                                *base.add(4).cast::<usize>() = len4;
                                                *base.add(0).cast::<*mut u8>() = ptr4.cast_mut();
                                                let vec5 = tool_type3;
                                                let ptr5 = vec5.as_ptr().cast::<u8>();
                                                let len5 = vec5.len();
                                                *base.add(12).cast::<usize>() = len5;
                                                *base.add(8).cast::<*mut u8>() = ptr5.cast_mut();
                                                let super::super::super::wavs::agent::types::ToolCallFunction {
                                                    name: name6,
                                                    arguments: arguments6,
                                                } = function3;
                                                let vec7 = name6;
                                                let ptr7 = vec7.as_ptr().cast::<u8>();
                                                let len7 = vec7.len();
                                                *base.add(20).cast::<usize>() = len7;
                                                *base.add(16).cast::<*mut u8>() = ptr7.cast_mut();
                                                let vec8 = arguments6;
                                                let ptr8 = vec8.as_ptr().cast::<u8>();
                                                let len8 = vec8.len();
                                                *base.add(28).cast::<usize>() = len8;
                                                *base.add(24).cast::<*mut u8>() = ptr8.cast_mut();
                                            }
                                        }
                                        *base.add(28).cast::<usize>() = len9;
                                        *base.add(24).cast::<*mut u8>() = result9;
                                        cleanup_list.extend_from_slice(&[(result9, layout9)]);
                                    }
                                    None => {
                                        *base.add(20).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match tool_call_id0 {
                                    Some(e) => {
                                        *base.add(32).cast::<u8>() = (1i32) as u8;
                                        let vec10 = e;
                                        let ptr10 = vec10.as_ptr().cast::<u8>();
                                        let len10 = vec10.len();
                                        *base.add(40).cast::<usize>() = len10;
                                        *base.add(36).cast::<*mut u8>() = ptr10.cast_mut();
                                    }
                                    None => {
                                        *base.add(32).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match name0 {
                                    Some(e) => {
                                        *base.add(44).cast::<u8>() = (1i32) as u8;
                                        let vec11 = e;
                                        let ptr11 = vec11.as_ptr().cast::<u8>();
                                        let len11 = vec11.len();
                                        *base.add(52).cast::<usize>() = len11;
                                        *base.add(48).cast::<*mut u8>() = ptr11.cast_mut();
                                    }
                                    None => {
                                        *base.add(44).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                            }
                        }
                        let ptr13 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-client-manager.chat-completion-text"]
                            fn wit_import(_: i32, _: *mut u8, _: usize, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8, _: usize, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, result12, len12, ptr13);
                        let l14 = i32::from(*ptr13.add(0).cast::<u8>());
                        if layout12.size() != 0 {
                            _rt::alloc::dealloc(result12.cast(), layout12);
                        }
                        for (ptr, layout) in cleanup_list {
                            if layout.size() != 0 {
                                _rt::alloc::dealloc(ptr.cast(), layout);
                            }
                        }
                        match l14 {
                            0 => {
                                let e = {
                                    let l15 = *ptr13.add(4).cast::<*mut u8>();
                                    let l16 = *ptr13.add(8).cast::<usize>();
                                    let len17 = l16;
                                    let bytes17 =
                                        _rt::Vec::from_raw_parts(l15.cast(), len17, len17);
                                    _rt::string_lift(bytes17)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l18 = i32::from(*ptr13.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V58;
                                    let v58 = match l18 {
                                        0 => {
                                            let e58 = {
                                                let l19 = *ptr13.add(8).cast::<*mut u8>();
                                                let l20 = *ptr13.add(12).cast::<usize>();
                                                let len21 = l20;
                                                let bytes21 = _rt::Vec::from_raw_parts(
                                                    l19.cast(),
                                                    len21,
                                                    len21,
                                                );
                                                _rt::string_lift(bytes21)
                                            };
                                            V58::Api(e58)
                                        }
                                        1 => {
                                            let e58 = {
                                                let l22 = *ptr13.add(8).cast::<*mut u8>();
                                                let l23 = *ptr13.add(12).cast::<usize>();
                                                let len24 = l23;
                                                let bytes24 = _rt::Vec::from_raw_parts(
                                                    l22.cast(),
                                                    len24,
                                                    len24,
                                                );
                                                _rt::string_lift(bytes24)
                                            };
                                            V58::Http(e58)
                                        }
                                        2 => {
                                            let e58 = {
                                                let l25 = *ptr13.add(8).cast::<*mut u8>();
                                                let l26 = *ptr13.add(12).cast::<usize>();
                                                let len27 = l26;
                                                let bytes27 = _rt::Vec::from_raw_parts(
                                                    l25.cast(),
                                                    len27,
                                                    len27,
                                                );
                                                _rt::string_lift(bytes27)
                                            };
                                            V58::ExternalService(e58)
                                        }
                                        3 => {
                                            let e58 = {
                                                let l28 = *ptr13.add(8).cast::<*mut u8>();
                                                let l29 = *ptr13.add(12).cast::<usize>();
                                                let len30 = l29;
                                                let bytes30 = _rt::Vec::from_raw_parts(
                                                    l28.cast(),
                                                    len30,
                                                    len30,
                                                );
                                                _rt::string_lift(bytes30)
                                            };
                                            V58::Config(e58)
                                        }
                                        4 => {
                                            let e58 = {
                                                let l31 = *ptr13.add(8).cast::<*mut u8>();
                                                let l32 = *ptr13.add(12).cast::<usize>();
                                                let len33 = l32;
                                                let bytes33 = _rt::Vec::from_raw_parts(
                                                    l31.cast(),
                                                    len33,
                                                    len33,
                                                );
                                                _rt::string_lift(bytes33)
                                            };
                                            V58::Contract(e58)
                                        }
                                        5 => {
                                            let e58 = {
                                                let l34 = *ptr13.add(8).cast::<*mut u8>();
                                                let l35 = *ptr13.add(12).cast::<usize>();
                                                let len36 = l35;
                                                let bytes36 = _rt::Vec::from_raw_parts(
                                                    l34.cast(),
                                                    len36,
                                                    len36,
                                                );
                                                _rt::string_lift(bytes36)
                                            };
                                            V58::Configuration(e58)
                                        }
                                        6 => {
                                            let e58 = {
                                                let l37 = *ptr13.add(8).cast::<*mut u8>();
                                                let l38 = *ptr13.add(12).cast::<usize>();
                                                let len39 = l38;
                                                let bytes39 = _rt::Vec::from_raw_parts(
                                                    l37.cast(),
                                                    len39,
                                                    len39,
                                                );
                                                _rt::string_lift(bytes39)
                                            };
                                            V58::ContextLoading(e58)
                                        }
                                        7 => {
                                            let e58 = {
                                                let l40 = *ptr13.add(8).cast::<*mut u8>();
                                                let l41 = *ptr13.add(12).cast::<usize>();
                                                let len42 = l41;
                                                let bytes42 = _rt::Vec::from_raw_parts(
                                                    l40.cast(),
                                                    len42,
                                                    len42,
                                                );
                                                _rt::string_lift(bytes42)
                                            };
                                            V58::ContextValidation(e58)
                                        }
                                        8 => {
                                            let e58 = {
                                                let l43 = *ptr13.add(8).cast::<*mut u8>();
                                                let l44 = *ptr13.add(12).cast::<usize>();
                                                let len45 = l44;
                                                let bytes45 = _rt::Vec::from_raw_parts(
                                                    l43.cast(),
                                                    len45,
                                                    len45,
                                                );
                                                _rt::string_lift(bytes45)
                                            };
                                            V58::Llm(e58)
                                        }
                                        9 => {
                                            let e58 = {
                                                let l46 = *ptr13.add(8).cast::<*mut u8>();
                                                let l47 = *ptr13.add(12).cast::<usize>();
                                                let len48 = l47;
                                                let bytes48 = _rt::Vec::from_raw_parts(
                                                    l46.cast(),
                                                    len48,
                                                    len48,
                                                );
                                                _rt::string_lift(bytes48)
                                            };
                                            V58::Io(e58)
                                        }
                                        10 => {
                                            let e58 = {
                                                let l49 = *ptr13.add(8).cast::<*mut u8>();
                                                let l50 = *ptr13.add(12).cast::<usize>();
                                                let len51 = l50;
                                                let bytes51 = _rt::Vec::from_raw_parts(
                                                    l49.cast(),
                                                    len51,
                                                    len51,
                                                );
                                                _rt::string_lift(bytes51)
                                            };
                                            V58::Transaction(e58)
                                        }
                                        11 => {
                                            let e58 = {
                                                let l52 = *ptr13.add(8).cast::<*mut u8>();
                                                let l53 = *ptr13.add(12).cast::<usize>();
                                                let len54 = l53;
                                                let bytes54 = _rt::Vec::from_raw_parts(
                                                    l52.cast(),
                                                    len54,
                                                    len54,
                                                );
                                                _rt::string_lift(bytes54)
                                            };
                                            V58::Utf8(e58)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e58 = {
                                                let l55 = *ptr13.add(8).cast::<*mut u8>();
                                                let l56 = *ptr13.add(12).cast::<usize>();
                                                let len57 = l56;
                                                let bytes57 = _rt::Vec::from_raw_parts(
                                                    l55.cast(),
                                                    len57,
                                                    len57,
                                                );
                                                _rt::string_lift(bytes57)
                                            };
                                            V58::Other(e58)
                                        }
                                    };
                                    v58
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl LlmClientManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Process a prompt with the LLM and return either a Transaction or text response
                pub fn process_prompt(
                    &self,
                    prompt: &str,
                    config: &Config,
                    custom_tools: Option<&[Tool]>,
                    custom_handlers: Option<_rt::Vec<CustomToolHandler>>,
                ) -> Result<LlmResponse, AgentError> {
                    unsafe {
                        let mut cleanup_list = _rt::Vec::new();
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 96]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 96]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        *ptr0.add(0).cast::<i32>() = (self).handle() as i32;
                        let vec1 = prompt;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        *ptr0.add(8).cast::<usize>() = len1;
                        *ptr0.add(4).cast::<*mut u8>() = ptr1.cast_mut();
                        let super::super::super::wavs::agent::types::Config {
                            contracts: contracts2,
                            llm_config: llm_config2,
                            model: model2,
                            messages: messages2,
                            config: config2,
                        } = config;
                        let vec8 = contracts2;
                        let len8 = vec8.len();
                        let layout8 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec8.len() * 36, 4);
                        let result8 = if layout8.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout8).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout8);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec8.into_iter().enumerate() {
                            let base = result8.add(i * 36);
                            {
                                let super::super::super::wavs::agent::types::Contract {
                                    name: name3,
                                    address: address3,
                                    abi: abi3,
                                    description: description3,
                                } = e;
                                let vec4 = name3;
                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                let len4 = vec4.len();
                                *base.add(4).cast::<usize>() = len4;
                                *base.add(0).cast::<*mut u8>() = ptr4.cast_mut();
                                let vec5 = address3;
                                let ptr5 = vec5.as_ptr().cast::<u8>();
                                let len5 = vec5.len();
                                *base.add(12).cast::<usize>() = len5;
                                *base.add(8).cast::<*mut u8>() = ptr5.cast_mut();
                                let vec6 = abi3;
                                let ptr6 = vec6.as_ptr().cast::<u8>();
                                let len6 = vec6.len();
                                *base.add(20).cast::<usize>() = len6;
                                *base.add(16).cast::<*mut u8>() = ptr6.cast_mut();
                                match description3 {
                                    Some(e) => {
                                        *base.add(24).cast::<u8>() = (1i32) as u8;
                                        let vec7 = e;
                                        let ptr7 = vec7.as_ptr().cast::<u8>();
                                        let len7 = vec7.len();
                                        *base.add(32).cast::<usize>() = len7;
                                        *base.add(28).cast::<*mut u8>() = ptr7.cast_mut();
                                    }
                                    None => {
                                        *base.add(24).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                            }
                        }
                        *ptr0.add(16).cast::<usize>() = len8;
                        *ptr0.add(12).cast::<*mut u8>() = result8;
                        let super::super::super::wavs::agent::types::LlmOptions {
                            temperature: temperature9,
                            top_p: top_p9,
                            seed: seed9,
                            max_tokens: max_tokens9,
                            context_window: context_window9,
                        } = llm_config2;
                        *ptr0.add(20).cast::<f32>() = _rt::as_f32(temperature9);
                        *ptr0.add(24).cast::<f32>() = _rt::as_f32(top_p9);
                        *ptr0.add(28).cast::<i32>() = _rt::as_i32(seed9);
                        match max_tokens9 {
                            Some(e) => {
                                *ptr0.add(32).cast::<u8>() = (1i32) as u8;
                                *ptr0.add(36).cast::<i32>() = _rt::as_i32(e);
                            }
                            None => {
                                *ptr0.add(32).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        match context_window9 {
                            Some(e) => {
                                *ptr0.add(40).cast::<u8>() = (1i32) as u8;
                                *ptr0.add(44).cast::<i32>() = _rt::as_i32(e);
                            }
                            None => {
                                *ptr0.add(40).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        let vec10 = model2;
                        let ptr10 = vec10.as_ptr().cast::<u8>();
                        let len10 = vec10.len();
                        *ptr0.add(52).cast::<usize>() = len10;
                        *ptr0.add(48).cast::<*mut u8>() = ptr10.cast_mut();
                        let vec23 = messages2;
                        let len23 = vec23.len();
                        let layout23 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec23.len() * 56, 4);
                        let result23 = if layout23.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout23).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout23);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec23.into_iter().enumerate() {
                            let base = result23.add(i * 56);
                            {
                                let super::super::super::wavs::agent::types::Message {
                                    role: role11,
                                    content: content11,
                                    tool_calls: tool_calls11,
                                    tool_call_id: tool_call_id11,
                                    name: name11,
                                } = e;
                                let vec12 = role11;
                                let ptr12 = vec12.as_ptr().cast::<u8>();
                                let len12 = vec12.len();
                                *base.add(4).cast::<usize>() = len12;
                                *base.add(0).cast::<*mut u8>() = ptr12.cast_mut();
                                match content11 {
                                    Some(e) => {
                                        *base.add(8).cast::<u8>() = (1i32) as u8;
                                        let vec13 = e;
                                        let ptr13 = vec13.as_ptr().cast::<u8>();
                                        let len13 = vec13.len();
                                        *base.add(16).cast::<usize>() = len13;
                                        *base.add(12).cast::<*mut u8>() = ptr13.cast_mut();
                                    }
                                    None => {
                                        *base.add(8).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match tool_calls11 {
                                    Some(e) => {
                                        *base.add(20).cast::<u8>() = (1i32) as u8;
                                        let vec20 = e;
                                        let len20 = vec20.len();
                                        let layout20 =
                                            _rt::alloc::Layout::from_size_align_unchecked(
                                                vec20.len() * 32,
                                                4,
                                            );
                                        let result20 = if layout20.size() != 0 {
                                            let ptr = _rt::alloc::alloc(layout20).cast::<u8>();
                                            if ptr.is_null() {
                                                _rt::alloc::handle_alloc_error(layout20);
                                            }
                                            ptr
                                        } else {
                                            ::core::ptr::null_mut()
                                        };
                                        for (i, e) in vec20.into_iter().enumerate() {
                                            let base = result20.add(i * 32);
                                            {
                                                let super::super::super::wavs::agent::types::ToolCall {
                                                    id: id14,
                                                    tool_type: tool_type14,
                                                    function: function14,
                                                } = e;
                                                let vec15 = id14;
                                                let ptr15 = vec15.as_ptr().cast::<u8>();
                                                let len15 = vec15.len();
                                                *base.add(4).cast::<usize>() = len15;
                                                *base.add(0).cast::<*mut u8>() = ptr15.cast_mut();
                                                let vec16 = tool_type14;
                                                let ptr16 = vec16.as_ptr().cast::<u8>();
                                                let len16 = vec16.len();
                                                *base.add(12).cast::<usize>() = len16;
                                                *base.add(8).cast::<*mut u8>() = ptr16.cast_mut();
                                                let super::super::super::wavs::agent::types::ToolCallFunction {
                                                    name: name17,
                                                    arguments: arguments17,
                                                } = function14;
                                                let vec18 = name17;
                                                let ptr18 = vec18.as_ptr().cast::<u8>();
                                                let len18 = vec18.len();
                                                *base.add(20).cast::<usize>() = len18;
                                                *base.add(16).cast::<*mut u8>() = ptr18.cast_mut();
                                                let vec19 = arguments17;
                                                let ptr19 = vec19.as_ptr().cast::<u8>();
                                                let len19 = vec19.len();
                                                *base.add(28).cast::<usize>() = len19;
                                                *base.add(24).cast::<*mut u8>() = ptr19.cast_mut();
                                            }
                                        }
                                        *base.add(28).cast::<usize>() = len20;
                                        *base.add(24).cast::<*mut u8>() = result20;
                                        cleanup_list.extend_from_slice(&[(result20, layout20)]);
                                    }
                                    None => {
                                        *base.add(20).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match tool_call_id11 {
                                    Some(e) => {
                                        *base.add(32).cast::<u8>() = (1i32) as u8;
                                        let vec21 = e;
                                        let ptr21 = vec21.as_ptr().cast::<u8>();
                                        let len21 = vec21.len();
                                        *base.add(40).cast::<usize>() = len21;
                                        *base.add(36).cast::<*mut u8>() = ptr21.cast_mut();
                                    }
                                    None => {
                                        *base.add(32).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match name11 {
                                    Some(e) => {
                                        *base.add(44).cast::<u8>() = (1i32) as u8;
                                        let vec22 = e;
                                        let ptr22 = vec22.as_ptr().cast::<u8>();
                                        let len22 = vec22.len();
                                        *base.add(52).cast::<usize>() = len22;
                                        *base.add(48).cast::<*mut u8>() = ptr22.cast_mut();
                                    }
                                    None => {
                                        *base.add(44).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                            }
                        }
                        *ptr0.add(60).cast::<usize>() = len23;
                        *ptr0.add(56).cast::<*mut u8>() = result23;
                        let vec27 = config2;
                        let len27 = vec27.len();
                        let layout27 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec27.len() * 16, 4);
                        let result27 = if layout27.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout27).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout27);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec27.into_iter().enumerate() {
                            let base = result27.add(i * 16);
                            {
                                let (t24_0, t24_1) = e;
                                let vec25 = t24_0;
                                let ptr25 = vec25.as_ptr().cast::<u8>();
                                let len25 = vec25.len();
                                *base.add(4).cast::<usize>() = len25;
                                *base.add(0).cast::<*mut u8>() = ptr25.cast_mut();
                                let vec26 = t24_1;
                                let ptr26 = vec26.as_ptr().cast::<u8>();
                                let len26 = vec26.len();
                                *base.add(12).cast::<usize>() = len26;
                                *base.add(8).cast::<*mut u8>() = ptr26.cast_mut();
                            }
                        }
                        *ptr0.add(68).cast::<usize>() = len27;
                        *ptr0.add(64).cast::<*mut u8>() = result27;
                        match custom_tools {
                            Some(e) => {
                                *ptr0.add(72).cast::<u8>() = (1i32) as u8;
                                let vec34 = e;
                                let len34 = vec34.len();
                                let layout34 = _rt::alloc::Layout::from_size_align_unchecked(
                                    vec34.len() * 40,
                                    4,
                                );
                                let result34 = if layout34.size() != 0 {
                                    let ptr = _rt::alloc::alloc(layout34).cast::<u8>();
                                    if ptr.is_null() {
                                        _rt::alloc::handle_alloc_error(layout34);
                                    }
                                    ptr
                                } else {
                                    ::core::ptr::null_mut()
                                };
                                for (i, e) in vec34.into_iter().enumerate() {
                                    let base = result34.add(i * 40);
                                    {
                                        let super::super::super::wavs::agent::types::Tool {
                                            tool_type: tool_type28,
                                            function: function28,
                                        } = e;
                                        let vec29 = tool_type28;
                                        let ptr29 = vec29.as_ptr().cast::<u8>();
                                        let len29 = vec29.len();
                                        *base.add(4).cast::<usize>() = len29;
                                        *base.add(0).cast::<*mut u8>() = ptr29.cast_mut();
                                        let super::super::super::wavs::agent::types::Function {
                                            name: name30,
                                            description: description30,
                                            parameters: parameters30,
                                        } = function28;
                                        let vec31 = name30;
                                        let ptr31 = vec31.as_ptr().cast::<u8>();
                                        let len31 = vec31.len();
                                        *base.add(12).cast::<usize>() = len31;
                                        *base.add(8).cast::<*mut u8>() = ptr31.cast_mut();
                                        match description30 {
                                            Some(e) => {
                                                *base.add(16).cast::<u8>() = (1i32) as u8;
                                                let vec32 = e;
                                                let ptr32 = vec32.as_ptr().cast::<u8>();
                                                let len32 = vec32.len();
                                                *base.add(24).cast::<usize>() = len32;
                                                *base.add(20).cast::<*mut u8>() = ptr32.cast_mut();
                                            }
                                            None => {
                                                *base.add(16).cast::<u8>() = (0i32) as u8;
                                            }
                                        };
                                        match parameters30 {
                                            Some(e) => {
                                                *base.add(28).cast::<u8>() = (1i32) as u8;
                                                let vec33 = e;
                                                let ptr33 = vec33.as_ptr().cast::<u8>();
                                                let len33 = vec33.len();
                                                *base.add(36).cast::<usize>() = len33;
                                                *base.add(32).cast::<*mut u8>() = ptr33.cast_mut();
                                            }
                                            None => {
                                                *base.add(28).cast::<u8>() = (0i32) as u8;
                                            }
                                        };
                                    }
                                }
                                *ptr0.add(80).cast::<usize>() = len34;
                                *ptr0.add(76).cast::<*mut u8>() = result34;
                                cleanup_list.extend_from_slice(&[(result34, layout34)]);
                            }
                            None => {
                                *ptr0.add(72).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        match &custom_handlers {
                            Some(e) => {
                                *ptr0.add(84).cast::<u8>() = (1i32) as u8;
                                let vec35 = e;
                                let len35 = vec35.len();
                                let layout35 = _rt::alloc::Layout::from_size_align_unchecked(
                                    vec35.len() * 4,
                                    4,
                                );
                                let result35 = if layout35.size() != 0 {
                                    let ptr = _rt::alloc::alloc(layout35).cast::<u8>();
                                    if ptr.is_null() {
                                        _rt::alloc::handle_alloc_error(layout35);
                                    }
                                    ptr
                                } else {
                                    ::core::ptr::null_mut()
                                };
                                for (i, e) in vec35.into_iter().enumerate() {
                                    let base = result35.add(i * 4);
                                    {
                                        *base.add(0).cast::<i32>() = (e).take_handle() as i32;
                                    }
                                }
                                *ptr0.add(92).cast::<usize>() = len35;
                                *ptr0.add(88).cast::<*mut u8>() = result35;
                                cleanup_list.extend_from_slice(&[(result35, layout35)]);
                            }
                            None => {
                                *ptr0.add(84).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        let ptr36 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/client@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-client-manager.process-prompt"]
                            fn wit_import(_: *mut u8, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: *mut u8, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import(ptr0, ptr36);
                        let l37 = i32::from(*ptr36.add(0).cast::<u8>());
                        if layout8.size() != 0 {
                            _rt::alloc::dealloc(result8.cast(), layout8);
                        }
                        if layout23.size() != 0 {
                            _rt::alloc::dealloc(result23.cast(), layout23);
                        }
                        if layout27.size() != 0 {
                            _rt::alloc::dealloc(result27.cast(), layout27);
                        }
                        for (ptr, layout) in cleanup_list {
                            if layout.size() != 0 {
                                _rt::alloc::dealloc(ptr.cast(), layout);
                            }
                        }
                        match l37 {
                            0 => {
                                let e = {
                                    let l38 = i32::from(*ptr36.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::types::LlmResponse as V64;
                                    let v64 = match l38 {
                                        0 => {
                                            let e64 = {
                                                let l39 = *ptr36.add(8).cast::<*mut u8>();
                                                let l40 = *ptr36.add(12).cast::<usize>();
                                                let len41 = l40;
                                                let bytes41 = _rt::Vec::from_raw_parts(
                                                    l39.cast(),
                                                    len41,
                                                    len41,
                                                );
                                                let l42 = *ptr36.add(16).cast::<*mut u8>();
                                                let l43 = *ptr36.add(20).cast::<usize>();
                                                let len44 = l43;
                                                let bytes44 = _rt::Vec::from_raw_parts(
                                                    l42.cast(),
                                                    len44,
                                                    len44,
                                                );
                                                let l45 = i32::from(*ptr36.add(24).cast::<u8>());
                                                let l55 = *ptr36.add(44).cast::<*mut u8>();
                                                let l56 = *ptr36.add(48).cast::<usize>();
                                                let len57 = l56;
                                                let bytes57 = _rt::Vec::from_raw_parts(
                                                    l55.cast(),
                                                    len57,
                                                    len57,
                                                );
                                                let l58 = *ptr36.add(52).cast::<*mut u8>();
                                                let l59 = *ptr36.add(56).cast::<usize>();
                                                let len60 = l59;
                                                let bytes60 = _rt::Vec::from_raw_parts(
                                                    l58.cast(),
                                                    len60,
                                                    len60,
                                                );
                                                super::super::super::wavs::agent::types::Transaction {
                                                    to: _rt::string_lift(bytes41),
                                                    value: _rt::string_lift(bytes44),
                                                    contract_call: match l45 {
                                                        0 => None,
                                                        1 => {
                                                            let e = {
                                                                let l46 = *ptr36.add(28).cast::<*mut u8>();
                                                                let l47 = *ptr36.add(32).cast::<usize>();
                                                                let len48 = l47;
                                                                let bytes48 = _rt::Vec::from_raw_parts(
                                                                    l46.cast(),
                                                                    len48,
                                                                    len48,
                                                                );
                                                                let l49 = *ptr36.add(36).cast::<*mut u8>();
                                                                let l50 = *ptr36.add(40).cast::<usize>();
                                                                let base54 = l49;
                                                                let len54 = l50;
                                                                let mut result54 = _rt::Vec::with_capacity(len54);
                                                                for i in 0..len54 {
                                                                    let base = base54.add(i * 8);
                                                                    let e54 = {
                                                                        let l51 = *base.add(0).cast::<*mut u8>();
                                                                        let l52 = *base.add(4).cast::<usize>();
                                                                        let len53 = l52;
                                                                        let bytes53 = _rt::Vec::from_raw_parts(
                                                                            l51.cast(),
                                                                            len53,
                                                                            len53,
                                                                        );
                                                                        _rt::string_lift(bytes53)
                                                                    };
                                                                    result54.push(e54);
                                                                }
                                                                _rt::cabi_dealloc(base54, len54 * 8, 4);
                                                                super::super::super::wavs::agent::types::ContractCall {
                                                                    function: _rt::string_lift(bytes48),
                                                                    args: result54,
                                                                }
                                                            };
                                                            Some(e)
                                                        }
                                                        _ => _rt::invalid_enum_discriminant(),
                                                    },
                                                    data: _rt::string_lift(bytes57),
                                                    description: _rt::string_lift(bytes60),
                                                }
                                            };
                                            V64::Transaction(e64)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 1, "invalid enum discriminant");
                                            let e64 = {
                                                let l61 = *ptr36.add(8).cast::<*mut u8>();
                                                let l62 = *ptr36.add(12).cast::<usize>();
                                                let len63 = l62;
                                                let bytes63 = _rt::Vec::from_raw_parts(
                                                    l61.cast(),
                                                    len63,
                                                    len63,
                                                );
                                                _rt::string_lift(bytes63)
                                            };
                                            V64::Text(e64)
                                        }
                                    };
                                    v64
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l65 = i32::from(*ptr36.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V105;
                                    let v105 = match l65 {
                                        0 => {
                                            let e105 = {
                                                let l66 = *ptr36.add(8).cast::<*mut u8>();
                                                let l67 = *ptr36.add(12).cast::<usize>();
                                                let len68 = l67;
                                                let bytes68 = _rt::Vec::from_raw_parts(
                                                    l66.cast(),
                                                    len68,
                                                    len68,
                                                );
                                                _rt::string_lift(bytes68)
                                            };
                                            V105::Api(e105)
                                        }
                                        1 => {
                                            let e105 = {
                                                let l69 = *ptr36.add(8).cast::<*mut u8>();
                                                let l70 = *ptr36.add(12).cast::<usize>();
                                                let len71 = l70;
                                                let bytes71 = _rt::Vec::from_raw_parts(
                                                    l69.cast(),
                                                    len71,
                                                    len71,
                                                );
                                                _rt::string_lift(bytes71)
                                            };
                                            V105::Http(e105)
                                        }
                                        2 => {
                                            let e105 = {
                                                let l72 = *ptr36.add(8).cast::<*mut u8>();
                                                let l73 = *ptr36.add(12).cast::<usize>();
                                                let len74 = l73;
                                                let bytes74 = _rt::Vec::from_raw_parts(
                                                    l72.cast(),
                                                    len74,
                                                    len74,
                                                );
                                                _rt::string_lift(bytes74)
                                            };
                                            V105::ExternalService(e105)
                                        }
                                        3 => {
                                            let e105 = {
                                                let l75 = *ptr36.add(8).cast::<*mut u8>();
                                                let l76 = *ptr36.add(12).cast::<usize>();
                                                let len77 = l76;
                                                let bytes77 = _rt::Vec::from_raw_parts(
                                                    l75.cast(),
                                                    len77,
                                                    len77,
                                                );
                                                _rt::string_lift(bytes77)
                                            };
                                            V105::Config(e105)
                                        }
                                        4 => {
                                            let e105 = {
                                                let l78 = *ptr36.add(8).cast::<*mut u8>();
                                                let l79 = *ptr36.add(12).cast::<usize>();
                                                let len80 = l79;
                                                let bytes80 = _rt::Vec::from_raw_parts(
                                                    l78.cast(),
                                                    len80,
                                                    len80,
                                                );
                                                _rt::string_lift(bytes80)
                                            };
                                            V105::Contract(e105)
                                        }
                                        5 => {
                                            let e105 = {
                                                let l81 = *ptr36.add(8).cast::<*mut u8>();
                                                let l82 = *ptr36.add(12).cast::<usize>();
                                                let len83 = l82;
                                                let bytes83 = _rt::Vec::from_raw_parts(
                                                    l81.cast(),
                                                    len83,
                                                    len83,
                                                );
                                                _rt::string_lift(bytes83)
                                            };
                                            V105::Configuration(e105)
                                        }
                                        6 => {
                                            let e105 = {
                                                let l84 = *ptr36.add(8).cast::<*mut u8>();
                                                let l85 = *ptr36.add(12).cast::<usize>();
                                                let len86 = l85;
                                                let bytes86 = _rt::Vec::from_raw_parts(
                                                    l84.cast(),
                                                    len86,
                                                    len86,
                                                );
                                                _rt::string_lift(bytes86)
                                            };
                                            V105::ContextLoading(e105)
                                        }
                                        7 => {
                                            let e105 = {
                                                let l87 = *ptr36.add(8).cast::<*mut u8>();
                                                let l88 = *ptr36.add(12).cast::<usize>();
                                                let len89 = l88;
                                                let bytes89 = _rt::Vec::from_raw_parts(
                                                    l87.cast(),
                                                    len89,
                                                    len89,
                                                );
                                                _rt::string_lift(bytes89)
                                            };
                                            V105::ContextValidation(e105)
                                        }
                                        8 => {
                                            let e105 = {
                                                let l90 = *ptr36.add(8).cast::<*mut u8>();
                                                let l91 = *ptr36.add(12).cast::<usize>();
                                                let len92 = l91;
                                                let bytes92 = _rt::Vec::from_raw_parts(
                                                    l90.cast(),
                                                    len92,
                                                    len92,
                                                );
                                                _rt::string_lift(bytes92)
                                            };
                                            V105::Llm(e105)
                                        }
                                        9 => {
                                            let e105 = {
                                                let l93 = *ptr36.add(8).cast::<*mut u8>();
                                                let l94 = *ptr36.add(12).cast::<usize>();
                                                let len95 = l94;
                                                let bytes95 = _rt::Vec::from_raw_parts(
                                                    l93.cast(),
                                                    len95,
                                                    len95,
                                                );
                                                _rt::string_lift(bytes95)
                                            };
                                            V105::Io(e105)
                                        }
                                        10 => {
                                            let e105 = {
                                                let l96 = *ptr36.add(8).cast::<*mut u8>();
                                                let l97 = *ptr36.add(12).cast::<usize>();
                                                let len98 = l97;
                                                let bytes98 = _rt::Vec::from_raw_parts(
                                                    l96.cast(),
                                                    len98,
                                                    len98,
                                                );
                                                _rt::string_lift(bytes98)
                                            };
                                            V105::Transaction(e105)
                                        }
                                        11 => {
                                            let e105 = {
                                                let l99 = *ptr36.add(8).cast::<*mut u8>();
                                                let l100 = *ptr36.add(12).cast::<usize>();
                                                let len101 = l100;
                                                let bytes101 = _rt::Vec::from_raw_parts(
                                                    l99.cast(),
                                                    len101,
                                                    len101,
                                                );
                                                _rt::string_lift(bytes101)
                                            };
                                            V105::Utf8(e105)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e105 = {
                                                let l102 = *ptr36.add(8).cast::<*mut u8>();
                                                let l103 = *ptr36.add(12).cast::<usize>();
                                                let len104 = l103;
                                                let bytes104 = _rt::Vec::from_raw_parts(
                                                    l102.cast(),
                                                    len104,
                                                    len104,
                                                );
                                                _rt::string_lift(bytes104)
                                            };
                                            V105::Other(e105)
                                        }
                                    };
                                    v105
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
        }
        #[allow(dead_code, clippy::all)]
        pub mod config {
            #[used]
            #[doc(hidden)]
            static __FORCE_SECTION_REF: fn() =
                super::super::super::__link_custom_section_describing_imports;
            use super::super::super::_rt;
            pub type AgentError = super::super::super::wavs::agent::errors::AgentError;
            pub type Config = super::super::super::wavs::agent::types::Config;
            pub type LlmOptions = super::super::super::wavs::agent::types::LlmOptions;
            pub type Contract = super::super::super::wavs::agent::types::Contract;
            /// Functions for manipulating LLM options
            #[derive(Debug)]
            #[repr(transparent)]
            pub struct LlmOptionsFuncs {
                handle: _rt::Resource<LlmOptionsFuncs>,
            }
            impl LlmOptionsFuncs {
                #[doc(hidden)]
                pub unsafe fn from_handle(handle: u32) -> Self {
                    Self { handle: _rt::Resource::from_handle(handle) }
                }
                #[doc(hidden)]
                pub fn take_handle(&self) -> u32 {
                    _rt::Resource::take_handle(&self.handle)
                }
                #[doc(hidden)]
                pub fn handle(&self) -> u32 {
                    _rt::Resource::handle(&self.handle)
                }
            }
            unsafe impl _rt::WasmResource for LlmOptionsFuncs {
                #[inline]
                unsafe fn drop(_handle: u32) {
                    #[cfg(not(target_arch = "wasm32"))]
                    unreachable!();
                    #[cfg(target_arch = "wasm32")]
                    {
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[resource-drop]llm-options-funcs"]
                            fn drop(_: u32);
                        }
                        drop(_handle);
                    }
                }
            }
            /// Configuration resource for loading and managing configuration
            #[derive(Debug)]
            #[repr(transparent)]
            pub struct ConfigManager {
                handle: _rt::Resource<ConfigManager>,
            }
            impl ConfigManager {
                #[doc(hidden)]
                pub unsafe fn from_handle(handle: u32) -> Self {
                    Self { handle: _rt::Resource::from_handle(handle) }
                }
                #[doc(hidden)]
                pub fn take_handle(&self) -> u32 {
                    _rt::Resource::take_handle(&self.handle)
                }
                #[doc(hidden)]
                pub fn handle(&self) -> u32 {
                    _rt::Resource::handle(&self.handle)
                }
            }
            unsafe impl _rt::WasmResource for ConfigManager {
                #[inline]
                unsafe fn drop(_handle: u32) {
                    #[cfg(not(target_arch = "wasm32"))]
                    unreachable!();
                    #[cfg(target_arch = "wasm32")]
                    {
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[resource-drop]config-manager"]
                            fn drop(_: u32);
                        }
                        drop(_handle);
                    }
                }
            }
            impl LlmOptionsFuncs {
                #[allow(unused_unsafe, clippy::all)]
                /// Create a new config with default values
                pub fn new(&self) -> LlmOptions {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 28]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 28]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-options-funcs.new"]
                            fn wit_import(_: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0);
                        let l1 = *ptr0.add(0).cast::<f32>();
                        let l2 = *ptr0.add(4).cast::<f32>();
                        let l3 = *ptr0.add(8).cast::<i32>();
                        let l4 = i32::from(*ptr0.add(12).cast::<u8>());
                        let l6 = i32::from(*ptr0.add(20).cast::<u8>());
                        super::super::super::wavs::agent::types::LlmOptions {
                            temperature: l1,
                            top_p: l2,
                            seed: l3 as u32,
                            max_tokens: match l4 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l5 = *ptr0.add(16).cast::<i32>();
                                        l5 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            context_window: match l6 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l7 = *ptr0.add(24).cast::<i32>();
                                        l7 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl LlmOptionsFuncs {
                #[allow(unused_unsafe, clippy::all)]
                /// Set temperature
                pub fn temperature(&self, temp: f32) -> LlmOptions {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 28]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 28]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-options-funcs.temperature"]
                            fn wit_import(_: i32, _: f32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: f32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, _rt::as_f32(&temp), ptr0);
                        let l1 = *ptr0.add(0).cast::<f32>();
                        let l2 = *ptr0.add(4).cast::<f32>();
                        let l3 = *ptr0.add(8).cast::<i32>();
                        let l4 = i32::from(*ptr0.add(12).cast::<u8>());
                        let l6 = i32::from(*ptr0.add(20).cast::<u8>());
                        super::super::super::wavs::agent::types::LlmOptions {
                            temperature: l1,
                            top_p: l2,
                            seed: l3 as u32,
                            max_tokens: match l4 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l5 = *ptr0.add(16).cast::<i32>();
                                        l5 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            context_window: match l6 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l7 = *ptr0.add(24).cast::<i32>();
                                        l7 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl LlmOptionsFuncs {
                #[allow(unused_unsafe, clippy::all)]
                /// Set top_p
                pub fn top_p(&self, top_p: f32) -> LlmOptions {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 28]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 28]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-options-funcs.top-p"]
                            fn wit_import(_: i32, _: f32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: f32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, _rt::as_f32(&top_p), ptr0);
                        let l1 = *ptr0.add(0).cast::<f32>();
                        let l2 = *ptr0.add(4).cast::<f32>();
                        let l3 = *ptr0.add(8).cast::<i32>();
                        let l4 = i32::from(*ptr0.add(12).cast::<u8>());
                        let l6 = i32::from(*ptr0.add(20).cast::<u8>());
                        super::super::super::wavs::agent::types::LlmOptions {
                            temperature: l1,
                            top_p: l2,
                            seed: l3 as u32,
                            max_tokens: match l4 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l5 = *ptr0.add(16).cast::<i32>();
                                        l5 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            context_window: match l6 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l7 = *ptr0.add(24).cast::<i32>();
                                        l7 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl LlmOptionsFuncs {
                #[allow(unused_unsafe, clippy::all)]
                /// Set seed
                pub fn seed(&self, seed: u32) -> LlmOptions {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 28]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 28]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-options-funcs.seed"]
                            fn wit_import(_: i32, _: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, _rt::as_i32(&seed), ptr0);
                        let l1 = *ptr0.add(0).cast::<f32>();
                        let l2 = *ptr0.add(4).cast::<f32>();
                        let l3 = *ptr0.add(8).cast::<i32>();
                        let l4 = i32::from(*ptr0.add(12).cast::<u8>());
                        let l6 = i32::from(*ptr0.add(20).cast::<u8>());
                        super::super::super::wavs::agent::types::LlmOptions {
                            temperature: l1,
                            top_p: l2,
                            seed: l3 as u32,
                            max_tokens: match l4 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l5 = *ptr0.add(16).cast::<i32>();
                                        l5 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            context_window: match l6 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l7 = *ptr0.add(24).cast::<i32>();
                                        l7 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl LlmOptionsFuncs {
                #[allow(unused_unsafe, clippy::all)]
                /// Set max tokens
                pub fn max_tokens(&self, max_tokens: Option<u32>) -> LlmOptions {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 28]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 28]);
                        let (result0_0, result0_1) = match max_tokens {
                            Some(e) => (1i32, _rt::as_i32(e)),
                            None => (0i32, 0i32),
                        };
                        let ptr1 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-options-funcs.max-tokens"]
                            fn wit_import(_: i32, _: i32, _: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: i32, _: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, result0_0, result0_1, ptr1);
                        let l2 = *ptr1.add(0).cast::<f32>();
                        let l3 = *ptr1.add(4).cast::<f32>();
                        let l4 = *ptr1.add(8).cast::<i32>();
                        let l5 = i32::from(*ptr1.add(12).cast::<u8>());
                        let l7 = i32::from(*ptr1.add(20).cast::<u8>());
                        super::super::super::wavs::agent::types::LlmOptions {
                            temperature: l2,
                            top_p: l3,
                            seed: l4 as u32,
                            max_tokens: match l5 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l6 = *ptr1.add(16).cast::<i32>();
                                        l6 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            context_window: match l7 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l8 = *ptr1.add(24).cast::<i32>();
                                        l8 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl LlmOptionsFuncs {
                #[allow(unused_unsafe, clippy::all)]
                /// Set context window size
                pub fn context_window(&self, context_window: Option<u32>) -> LlmOptions {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 28]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 28]);
                        let (result0_0, result0_1) = match context_window {
                            Some(e) => (1i32, _rt::as_i32(e)),
                            None => (0i32, 0i32),
                        };
                        let ptr1 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]llm-options-funcs.context-window"]
                            fn wit_import(_: i32, _: i32, _: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: i32, _: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, result0_0, result0_1, ptr1);
                        let l2 = *ptr1.add(0).cast::<f32>();
                        let l3 = *ptr1.add(4).cast::<f32>();
                        let l4 = *ptr1.add(8).cast::<i32>();
                        let l5 = i32::from(*ptr1.add(12).cast::<u8>());
                        let l7 = i32::from(*ptr1.add(20).cast::<u8>());
                        super::super::super::wavs::agent::types::LlmOptions {
                            temperature: l2,
                            top_p: l3,
                            seed: l4 as u32,
                            max_tokens: match l5 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l6 = *ptr1.add(16).cast::<i32>();
                                        l6 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            context_window: match l7 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l8 = *ptr1.add(24).cast::<i32>();
                                        l8 as u32
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl ConfigManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Load Config from environment variable CONFIG_URI or use default
                pub fn load(&self) -> Result<Config, _rt::String> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 64]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 64]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]config-manager.load"]
                            fn wit_import(_: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0);
                        let l1 = i32::from(*ptr0.add(0).cast::<u8>());
                        match l1 {
                            0 => {
                                let e = {
                                    let l2 = *ptr0.add(4).cast::<*mut u8>();
                                    let l3 = *ptr0.add(8).cast::<usize>();
                                    let base17 = l2;
                                    let len17 = l3;
                                    let mut result17 = _rt::Vec::with_capacity(len17);
                                    for i in 0..len17 {
                                        let base = base17.add(i * 36);
                                        let e17 = {
                                            let l4 = *base.add(0).cast::<*mut u8>();
                                            let l5 = *base.add(4).cast::<usize>();
                                            let len6 = l5;
                                            let bytes6 =
                                                _rt::Vec::from_raw_parts(l4.cast(), len6, len6);
                                            let l7 = *base.add(8).cast::<*mut u8>();
                                            let l8 = *base.add(12).cast::<usize>();
                                            let len9 = l8;
                                            let bytes9 =
                                                _rt::Vec::from_raw_parts(l7.cast(), len9, len9);
                                            let l10 = *base.add(16).cast::<*mut u8>();
                                            let l11 = *base.add(20).cast::<usize>();
                                            let len12 = l11;
                                            let bytes12 =
                                                _rt::Vec::from_raw_parts(l10.cast(), len12, len12);
                                            let l13 = i32::from(*base.add(24).cast::<u8>());
                                            super::super::super::wavs::agent::types::Contract {
                                                name: _rt::string_lift(bytes6),
                                                address: _rt::string_lift(bytes9),
                                                abi: _rt::string_lift(bytes12),
                                                description: match l13 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l14 =
                                                                *base.add(28).cast::<*mut u8>();
                                                            let l15 = *base.add(32).cast::<usize>();
                                                            let len16 = l15;
                                                            let bytes16 = _rt::Vec::from_raw_parts(
                                                                l14.cast(),
                                                                len16,
                                                                len16,
                                                            );
                                                            _rt::string_lift(bytes16)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            }
                                        };
                                        result17.push(e17);
                                    }
                                    _rt::cabi_dealloc(base17, len17 * 36, 4);
                                    let l18 = *ptr0.add(12).cast::<f32>();
                                    let l19 = *ptr0.add(16).cast::<f32>();
                                    let l20 = *ptr0.add(20).cast::<i32>();
                                    let l21 = i32::from(*ptr0.add(24).cast::<u8>());
                                    let l23 = i32::from(*ptr0.add(32).cast::<u8>());
                                    let l25 = *ptr0.add(40).cast::<*mut u8>();
                                    let l26 = *ptr0.add(44).cast::<usize>();
                                    let len27 = l26;
                                    let bytes27 =
                                        _rt::Vec::from_raw_parts(l25.cast(), len27, len27);
                                    let l28 = *ptr0.add(48).cast::<*mut u8>();
                                    let l29 = *ptr0.add(52).cast::<usize>();
                                    let base61 = l28;
                                    let len61 = l29;
                                    let mut result61 = _rt::Vec::with_capacity(len61);
                                    for i in 0..len61 {
                                        let base = base61.add(i * 56);
                                        let e61 = {
                                            let l30 = *base.add(0).cast::<*mut u8>();
                                            let l31 = *base.add(4).cast::<usize>();
                                            let len32 = l31;
                                            let bytes32 =
                                                _rt::Vec::from_raw_parts(l30.cast(), len32, len32);
                                            let l33 = i32::from(*base.add(8).cast::<u8>());
                                            let l37 = i32::from(*base.add(20).cast::<u8>());
                                            let l53 = i32::from(*base.add(32).cast::<u8>());
                                            let l57 = i32::from(*base.add(44).cast::<u8>());
                                            super::super::super::wavs::agent::types::Message {
                                                role: _rt::string_lift(bytes32),
                                                content: match l33 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l34 =
                                                                *base.add(12).cast::<*mut u8>();
                                                            let l35 = *base.add(16).cast::<usize>();
                                                            let len36 = l35;
                                                            let bytes36 = _rt::Vec::from_raw_parts(
                                                                l34.cast(),
                                                                len36,
                                                                len36,
                                                            );
                                                            _rt::string_lift(bytes36)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                tool_calls: match l37 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l38 =
                                                                *base.add(24).cast::<*mut u8>();
                                                            let l39 = *base.add(28).cast::<usize>();
                                                            let base52 = l38;
                                                            let len52 = l39;
                                                            let mut result52 =
                                                                _rt::Vec::with_capacity(len52);
                                                            for i in 0..len52 {
                                                                let base = base52.add(i * 32);
                                                                let e52 = {
                                                                    let l40 = *base
                                                                        .add(0)
                                                                        .cast::<*mut u8>();
                                                                    let l41 = *base
                                                                        .add(4)
                                                                        .cast::<usize>();
                                                                    let len42 = l41;
                                                                    let bytes42 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l40.cast(),
                                                                            len42,
                                                                            len42,
                                                                        );
                                                                    let l43 = *base
                                                                        .add(8)
                                                                        .cast::<*mut u8>();
                                                                    let l44 = *base
                                                                        .add(12)
                                                                        .cast::<usize>();
                                                                    let len45 = l44;
                                                                    let bytes45 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l43.cast(),
                                                                            len45,
                                                                            len45,
                                                                        );
                                                                    let l46 = *base
                                                                        .add(16)
                                                                        .cast::<*mut u8>();
                                                                    let l47 = *base
                                                                        .add(20)
                                                                        .cast::<usize>();
                                                                    let len48 = l47;
                                                                    let bytes48 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l46.cast(),
                                                                            len48,
                                                                            len48,
                                                                        );
                                                                    let l49 = *base
                                                                        .add(24)
                                                                        .cast::<*mut u8>();
                                                                    let l50 = *base
                                                                        .add(28)
                                                                        .cast::<usize>();
                                                                    let len51 = l50;
                                                                    let bytes51 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l49.cast(),
                                                                            len51,
                                                                            len51,
                                                                        );
                                                                    super::super::super::wavs::agent::types::ToolCall {
                                                                        id: _rt::string_lift(bytes42),
                                                                        tool_type: _rt::string_lift(bytes45),
                                                                        function: super::super::super::wavs::agent::types::ToolCallFunction {
                                                                            name: _rt::string_lift(bytes48),
                                                                            arguments: _rt::string_lift(bytes51),
                                                                        },
                                                                    }
                                                                };
                                                                result52.push(e52);
                                                            }
                                                            _rt::cabi_dealloc(
                                                                base52,
                                                                len52 * 32,
                                                                4,
                                                            );
                                                            result52
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                tool_call_id: match l53 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l54 =
                                                                *base.add(36).cast::<*mut u8>();
                                                            let l55 = *base.add(40).cast::<usize>();
                                                            let len56 = l55;
                                                            let bytes56 = _rt::Vec::from_raw_parts(
                                                                l54.cast(),
                                                                len56,
                                                                len56,
                                                            );
                                                            _rt::string_lift(bytes56)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                name: match l57 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l58 =
                                                                *base.add(48).cast::<*mut u8>();
                                                            let l59 = *base.add(52).cast::<usize>();
                                                            let len60 = l59;
                                                            let bytes60 = _rt::Vec::from_raw_parts(
                                                                l58.cast(),
                                                                len60,
                                                                len60,
                                                            );
                                                            _rt::string_lift(bytes60)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            }
                                        };
                                        result61.push(e61);
                                    }
                                    _rt::cabi_dealloc(base61, len61 * 56, 4);
                                    let l62 = *ptr0.add(56).cast::<*mut u8>();
                                    let l63 = *ptr0.add(60).cast::<usize>();
                                    let base70 = l62;
                                    let len70 = l63;
                                    let mut result70 = _rt::Vec::with_capacity(len70);
                                    for i in 0..len70 {
                                        let base = base70.add(i * 16);
                                        let e70 = {
                                            let l64 = *base.add(0).cast::<*mut u8>();
                                            let l65 = *base.add(4).cast::<usize>();
                                            let len66 = l65;
                                            let bytes66 =
                                                _rt::Vec::from_raw_parts(l64.cast(), len66, len66);
                                            let l67 = *base.add(8).cast::<*mut u8>();
                                            let l68 = *base.add(12).cast::<usize>();
                                            let len69 = l68;
                                            let bytes69 =
                                                _rt::Vec::from_raw_parts(l67.cast(), len69, len69);
                                            (_rt::string_lift(bytes66), _rt::string_lift(bytes69))
                                        };
                                        result70.push(e70);
                                    }
                                    _rt::cabi_dealloc(base70, len70 * 16, 4);
                                    super::super::super::wavs::agent::types::Config {
                                        contracts: result17,
                                        llm_config:
                                            super::super::super::wavs::agent::types::LlmOptions {
                                                temperature: l18,
                                                top_p: l19,
                                                seed: l20 as u32,
                                                max_tokens: match l21 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l22 = *ptr0.add(28).cast::<i32>();
                                                            l22 as u32
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                context_window: match l23 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l24 = *ptr0.add(36).cast::<i32>();
                                                            l24 as u32
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            },
                                        model: _rt::string_lift(bytes27),
                                        messages: result61,
                                        config: result70,
                                    }
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l71 = *ptr0.add(4).cast::<*mut u8>();
                                    let l72 = *ptr0.add(8).cast::<usize>();
                                    let len73 = l72;
                                    let bytes73 =
                                        _rt::Vec::from_raw_parts(l71.cast(), len73, len73);
                                    _rt::string_lift(bytes73)
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ConfigManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Load Config from a URI
                pub fn load_from_uri(&self, uri: &str) -> Result<Config, _rt::String> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 64]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 64]);
                        let vec0 = uri;
                        let ptr0 = vec0.as_ptr().cast::<u8>();
                        let len0 = vec0.len();
                        let ptr1 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]config-manager.load-from-uri"]
                            fn wit_import(_: i32, _: *mut u8, _: usize, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8, _: usize, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0.cast_mut(), len0, ptr1);
                        let l2 = i32::from(*ptr1.add(0).cast::<u8>());
                        match l2 {
                            0 => {
                                let e = {
                                    let l3 = *ptr1.add(4).cast::<*mut u8>();
                                    let l4 = *ptr1.add(8).cast::<usize>();
                                    let base18 = l3;
                                    let len18 = l4;
                                    let mut result18 = _rt::Vec::with_capacity(len18);
                                    for i in 0..len18 {
                                        let base = base18.add(i * 36);
                                        let e18 = {
                                            let l5 = *base.add(0).cast::<*mut u8>();
                                            let l6 = *base.add(4).cast::<usize>();
                                            let len7 = l6;
                                            let bytes7 =
                                                _rt::Vec::from_raw_parts(l5.cast(), len7, len7);
                                            let l8 = *base.add(8).cast::<*mut u8>();
                                            let l9 = *base.add(12).cast::<usize>();
                                            let len10 = l9;
                                            let bytes10 =
                                                _rt::Vec::from_raw_parts(l8.cast(), len10, len10);
                                            let l11 = *base.add(16).cast::<*mut u8>();
                                            let l12 = *base.add(20).cast::<usize>();
                                            let len13 = l12;
                                            let bytes13 =
                                                _rt::Vec::from_raw_parts(l11.cast(), len13, len13);
                                            let l14 = i32::from(*base.add(24).cast::<u8>());
                                            super::super::super::wavs::agent::types::Contract {
                                                name: _rt::string_lift(bytes7),
                                                address: _rt::string_lift(bytes10),
                                                abi: _rt::string_lift(bytes13),
                                                description: match l14 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l15 =
                                                                *base.add(28).cast::<*mut u8>();
                                                            let l16 = *base.add(32).cast::<usize>();
                                                            let len17 = l16;
                                                            let bytes17 = _rt::Vec::from_raw_parts(
                                                                l15.cast(),
                                                                len17,
                                                                len17,
                                                            );
                                                            _rt::string_lift(bytes17)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            }
                                        };
                                        result18.push(e18);
                                    }
                                    _rt::cabi_dealloc(base18, len18 * 36, 4);
                                    let l19 = *ptr1.add(12).cast::<f32>();
                                    let l20 = *ptr1.add(16).cast::<f32>();
                                    let l21 = *ptr1.add(20).cast::<i32>();
                                    let l22 = i32::from(*ptr1.add(24).cast::<u8>());
                                    let l24 = i32::from(*ptr1.add(32).cast::<u8>());
                                    let l26 = *ptr1.add(40).cast::<*mut u8>();
                                    let l27 = *ptr1.add(44).cast::<usize>();
                                    let len28 = l27;
                                    let bytes28 =
                                        _rt::Vec::from_raw_parts(l26.cast(), len28, len28);
                                    let l29 = *ptr1.add(48).cast::<*mut u8>();
                                    let l30 = *ptr1.add(52).cast::<usize>();
                                    let base62 = l29;
                                    let len62 = l30;
                                    let mut result62 = _rt::Vec::with_capacity(len62);
                                    for i in 0..len62 {
                                        let base = base62.add(i * 56);
                                        let e62 = {
                                            let l31 = *base.add(0).cast::<*mut u8>();
                                            let l32 = *base.add(4).cast::<usize>();
                                            let len33 = l32;
                                            let bytes33 =
                                                _rt::Vec::from_raw_parts(l31.cast(), len33, len33);
                                            let l34 = i32::from(*base.add(8).cast::<u8>());
                                            let l38 = i32::from(*base.add(20).cast::<u8>());
                                            let l54 = i32::from(*base.add(32).cast::<u8>());
                                            let l58 = i32::from(*base.add(44).cast::<u8>());
                                            super::super::super::wavs::agent::types::Message {
                                                role: _rt::string_lift(bytes33),
                                                content: match l34 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l35 =
                                                                *base.add(12).cast::<*mut u8>();
                                                            let l36 = *base.add(16).cast::<usize>();
                                                            let len37 = l36;
                                                            let bytes37 = _rt::Vec::from_raw_parts(
                                                                l35.cast(),
                                                                len37,
                                                                len37,
                                                            );
                                                            _rt::string_lift(bytes37)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                tool_calls: match l38 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l39 =
                                                                *base.add(24).cast::<*mut u8>();
                                                            let l40 = *base.add(28).cast::<usize>();
                                                            let base53 = l39;
                                                            let len53 = l40;
                                                            let mut result53 =
                                                                _rt::Vec::with_capacity(len53);
                                                            for i in 0..len53 {
                                                                let base = base53.add(i * 32);
                                                                let e53 = {
                                                                    let l41 = *base
                                                                        .add(0)
                                                                        .cast::<*mut u8>();
                                                                    let l42 = *base
                                                                        .add(4)
                                                                        .cast::<usize>();
                                                                    let len43 = l42;
                                                                    let bytes43 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l41.cast(),
                                                                            len43,
                                                                            len43,
                                                                        );
                                                                    let l44 = *base
                                                                        .add(8)
                                                                        .cast::<*mut u8>();
                                                                    let l45 = *base
                                                                        .add(12)
                                                                        .cast::<usize>();
                                                                    let len46 = l45;
                                                                    let bytes46 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l44.cast(),
                                                                            len46,
                                                                            len46,
                                                                        );
                                                                    let l47 = *base
                                                                        .add(16)
                                                                        .cast::<*mut u8>();
                                                                    let l48 = *base
                                                                        .add(20)
                                                                        .cast::<usize>();
                                                                    let len49 = l48;
                                                                    let bytes49 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l47.cast(),
                                                                            len49,
                                                                            len49,
                                                                        );
                                                                    let l50 = *base
                                                                        .add(24)
                                                                        .cast::<*mut u8>();
                                                                    let l51 = *base
                                                                        .add(28)
                                                                        .cast::<usize>();
                                                                    let len52 = l51;
                                                                    let bytes52 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l50.cast(),
                                                                            len52,
                                                                            len52,
                                                                        );
                                                                    super::super::super::wavs::agent::types::ToolCall {
                                                                        id: _rt::string_lift(bytes43),
                                                                        tool_type: _rt::string_lift(bytes46),
                                                                        function: super::super::super::wavs::agent::types::ToolCallFunction {
                                                                            name: _rt::string_lift(bytes49),
                                                                            arguments: _rt::string_lift(bytes52),
                                                                        },
                                                                    }
                                                                };
                                                                result53.push(e53);
                                                            }
                                                            _rt::cabi_dealloc(
                                                                base53,
                                                                len53 * 32,
                                                                4,
                                                            );
                                                            result53
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                tool_call_id: match l54 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l55 =
                                                                *base.add(36).cast::<*mut u8>();
                                                            let l56 = *base.add(40).cast::<usize>();
                                                            let len57 = l56;
                                                            let bytes57 = _rt::Vec::from_raw_parts(
                                                                l55.cast(),
                                                                len57,
                                                                len57,
                                                            );
                                                            _rt::string_lift(bytes57)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                name: match l58 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l59 =
                                                                *base.add(48).cast::<*mut u8>();
                                                            let l60 = *base.add(52).cast::<usize>();
                                                            let len61 = l60;
                                                            let bytes61 = _rt::Vec::from_raw_parts(
                                                                l59.cast(),
                                                                len61,
                                                                len61,
                                                            );
                                                            _rt::string_lift(bytes61)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            }
                                        };
                                        result62.push(e62);
                                    }
                                    _rt::cabi_dealloc(base62, len62 * 56, 4);
                                    let l63 = *ptr1.add(56).cast::<*mut u8>();
                                    let l64 = *ptr1.add(60).cast::<usize>();
                                    let base71 = l63;
                                    let len71 = l64;
                                    let mut result71 = _rt::Vec::with_capacity(len71);
                                    for i in 0..len71 {
                                        let base = base71.add(i * 16);
                                        let e71 = {
                                            let l65 = *base.add(0).cast::<*mut u8>();
                                            let l66 = *base.add(4).cast::<usize>();
                                            let len67 = l66;
                                            let bytes67 =
                                                _rt::Vec::from_raw_parts(l65.cast(), len67, len67);
                                            let l68 = *base.add(8).cast::<*mut u8>();
                                            let l69 = *base.add(12).cast::<usize>();
                                            let len70 = l69;
                                            let bytes70 =
                                                _rt::Vec::from_raw_parts(l68.cast(), len70, len70);
                                            (_rt::string_lift(bytes67), _rt::string_lift(bytes70))
                                        };
                                        result71.push(e71);
                                    }
                                    _rt::cabi_dealloc(base71, len71 * 16, 4);
                                    super::super::super::wavs::agent::types::Config {
                                        contracts: result18,
                                        llm_config:
                                            super::super::super::wavs::agent::types::LlmOptions {
                                                temperature: l19,
                                                top_p: l20,
                                                seed: l21 as u32,
                                                max_tokens: match l22 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l23 = *ptr1.add(28).cast::<i32>();
                                                            l23 as u32
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                context_window: match l24 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l25 = *ptr1.add(36).cast::<i32>();
                                                            l25 as u32
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            },
                                        model: _rt::string_lift(bytes28),
                                        messages: result62,
                                        config: result71,
                                    }
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l72 = *ptr1.add(4).cast::<*mut u8>();
                                    let l73 = *ptr1.add(8).cast::<usize>();
                                    let len74 = l73;
                                    let bytes74 =
                                        _rt::Vec::from_raw_parts(l72.cast(), len74, len74);
                                    _rt::string_lift(bytes74)
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ConfigManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Load Config from JSON
                pub fn from_json(&self, json: &str) -> Result<Config, AgentError> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 64]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 64]);
                        let vec0 = json;
                        let ptr0 = vec0.as_ptr().cast::<u8>();
                        let len0 = vec0.len();
                        let ptr1 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]config-manager.from-json"]
                            fn wit_import(_: i32, _: *mut u8, _: usize, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8, _: usize, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0.cast_mut(), len0, ptr1);
                        let l2 = i32::from(*ptr1.add(0).cast::<u8>());
                        match l2 {
                            0 => {
                                let e = {
                                    let l3 = *ptr1.add(4).cast::<*mut u8>();
                                    let l4 = *ptr1.add(8).cast::<usize>();
                                    let base18 = l3;
                                    let len18 = l4;
                                    let mut result18 = _rt::Vec::with_capacity(len18);
                                    for i in 0..len18 {
                                        let base = base18.add(i * 36);
                                        let e18 = {
                                            let l5 = *base.add(0).cast::<*mut u8>();
                                            let l6 = *base.add(4).cast::<usize>();
                                            let len7 = l6;
                                            let bytes7 =
                                                _rt::Vec::from_raw_parts(l5.cast(), len7, len7);
                                            let l8 = *base.add(8).cast::<*mut u8>();
                                            let l9 = *base.add(12).cast::<usize>();
                                            let len10 = l9;
                                            let bytes10 =
                                                _rt::Vec::from_raw_parts(l8.cast(), len10, len10);
                                            let l11 = *base.add(16).cast::<*mut u8>();
                                            let l12 = *base.add(20).cast::<usize>();
                                            let len13 = l12;
                                            let bytes13 =
                                                _rt::Vec::from_raw_parts(l11.cast(), len13, len13);
                                            let l14 = i32::from(*base.add(24).cast::<u8>());
                                            super::super::super::wavs::agent::types::Contract {
                                                name: _rt::string_lift(bytes7),
                                                address: _rt::string_lift(bytes10),
                                                abi: _rt::string_lift(bytes13),
                                                description: match l14 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l15 =
                                                                *base.add(28).cast::<*mut u8>();
                                                            let l16 = *base.add(32).cast::<usize>();
                                                            let len17 = l16;
                                                            let bytes17 = _rt::Vec::from_raw_parts(
                                                                l15.cast(),
                                                                len17,
                                                                len17,
                                                            );
                                                            _rt::string_lift(bytes17)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            }
                                        };
                                        result18.push(e18);
                                    }
                                    _rt::cabi_dealloc(base18, len18 * 36, 4);
                                    let l19 = *ptr1.add(12).cast::<f32>();
                                    let l20 = *ptr1.add(16).cast::<f32>();
                                    let l21 = *ptr1.add(20).cast::<i32>();
                                    let l22 = i32::from(*ptr1.add(24).cast::<u8>());
                                    let l24 = i32::from(*ptr1.add(32).cast::<u8>());
                                    let l26 = *ptr1.add(40).cast::<*mut u8>();
                                    let l27 = *ptr1.add(44).cast::<usize>();
                                    let len28 = l27;
                                    let bytes28 =
                                        _rt::Vec::from_raw_parts(l26.cast(), len28, len28);
                                    let l29 = *ptr1.add(48).cast::<*mut u8>();
                                    let l30 = *ptr1.add(52).cast::<usize>();
                                    let base62 = l29;
                                    let len62 = l30;
                                    let mut result62 = _rt::Vec::with_capacity(len62);
                                    for i in 0..len62 {
                                        let base = base62.add(i * 56);
                                        let e62 = {
                                            let l31 = *base.add(0).cast::<*mut u8>();
                                            let l32 = *base.add(4).cast::<usize>();
                                            let len33 = l32;
                                            let bytes33 =
                                                _rt::Vec::from_raw_parts(l31.cast(), len33, len33);
                                            let l34 = i32::from(*base.add(8).cast::<u8>());
                                            let l38 = i32::from(*base.add(20).cast::<u8>());
                                            let l54 = i32::from(*base.add(32).cast::<u8>());
                                            let l58 = i32::from(*base.add(44).cast::<u8>());
                                            super::super::super::wavs::agent::types::Message {
                                                role: _rt::string_lift(bytes33),
                                                content: match l34 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l35 =
                                                                *base.add(12).cast::<*mut u8>();
                                                            let l36 = *base.add(16).cast::<usize>();
                                                            let len37 = l36;
                                                            let bytes37 = _rt::Vec::from_raw_parts(
                                                                l35.cast(),
                                                                len37,
                                                                len37,
                                                            );
                                                            _rt::string_lift(bytes37)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                tool_calls: match l38 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l39 =
                                                                *base.add(24).cast::<*mut u8>();
                                                            let l40 = *base.add(28).cast::<usize>();
                                                            let base53 = l39;
                                                            let len53 = l40;
                                                            let mut result53 =
                                                                _rt::Vec::with_capacity(len53);
                                                            for i in 0..len53 {
                                                                let base = base53.add(i * 32);
                                                                let e53 = {
                                                                    let l41 = *base
                                                                        .add(0)
                                                                        .cast::<*mut u8>();
                                                                    let l42 = *base
                                                                        .add(4)
                                                                        .cast::<usize>();
                                                                    let len43 = l42;
                                                                    let bytes43 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l41.cast(),
                                                                            len43,
                                                                            len43,
                                                                        );
                                                                    let l44 = *base
                                                                        .add(8)
                                                                        .cast::<*mut u8>();
                                                                    let l45 = *base
                                                                        .add(12)
                                                                        .cast::<usize>();
                                                                    let len46 = l45;
                                                                    let bytes46 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l44.cast(),
                                                                            len46,
                                                                            len46,
                                                                        );
                                                                    let l47 = *base
                                                                        .add(16)
                                                                        .cast::<*mut u8>();
                                                                    let l48 = *base
                                                                        .add(20)
                                                                        .cast::<usize>();
                                                                    let len49 = l48;
                                                                    let bytes49 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l47.cast(),
                                                                            len49,
                                                                            len49,
                                                                        );
                                                                    let l50 = *base
                                                                        .add(24)
                                                                        .cast::<*mut u8>();
                                                                    let l51 = *base
                                                                        .add(28)
                                                                        .cast::<usize>();
                                                                    let len52 = l51;
                                                                    let bytes52 =
                                                                        _rt::Vec::from_raw_parts(
                                                                            l50.cast(),
                                                                            len52,
                                                                            len52,
                                                                        );
                                                                    super::super::super::wavs::agent::types::ToolCall {
                                                                        id: _rt::string_lift(bytes43),
                                                                        tool_type: _rt::string_lift(bytes46),
                                                                        function: super::super::super::wavs::agent::types::ToolCallFunction {
                                                                            name: _rt::string_lift(bytes49),
                                                                            arguments: _rt::string_lift(bytes52),
                                                                        },
                                                                    }
                                                                };
                                                                result53.push(e53);
                                                            }
                                                            _rt::cabi_dealloc(
                                                                base53,
                                                                len53 * 32,
                                                                4,
                                                            );
                                                            result53
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                tool_call_id: match l54 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l55 =
                                                                *base.add(36).cast::<*mut u8>();
                                                            let l56 = *base.add(40).cast::<usize>();
                                                            let len57 = l56;
                                                            let bytes57 = _rt::Vec::from_raw_parts(
                                                                l55.cast(),
                                                                len57,
                                                                len57,
                                                            );
                                                            _rt::string_lift(bytes57)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                name: match l58 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l59 =
                                                                *base.add(48).cast::<*mut u8>();
                                                            let l60 = *base.add(52).cast::<usize>();
                                                            let len61 = l60;
                                                            let bytes61 = _rt::Vec::from_raw_parts(
                                                                l59.cast(),
                                                                len61,
                                                                len61,
                                                            );
                                                            _rt::string_lift(bytes61)
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            }
                                        };
                                        result62.push(e62);
                                    }
                                    _rt::cabi_dealloc(base62, len62 * 56, 4);
                                    let l63 = *ptr1.add(56).cast::<*mut u8>();
                                    let l64 = *ptr1.add(60).cast::<usize>();
                                    let base71 = l63;
                                    let len71 = l64;
                                    let mut result71 = _rt::Vec::with_capacity(len71);
                                    for i in 0..len71 {
                                        let base = base71.add(i * 16);
                                        let e71 = {
                                            let l65 = *base.add(0).cast::<*mut u8>();
                                            let l66 = *base.add(4).cast::<usize>();
                                            let len67 = l66;
                                            let bytes67 =
                                                _rt::Vec::from_raw_parts(l65.cast(), len67, len67);
                                            let l68 = *base.add(8).cast::<*mut u8>();
                                            let l69 = *base.add(12).cast::<usize>();
                                            let len70 = l69;
                                            let bytes70 =
                                                _rt::Vec::from_raw_parts(l68.cast(), len70, len70);
                                            (_rt::string_lift(bytes67), _rt::string_lift(bytes70))
                                        };
                                        result71.push(e71);
                                    }
                                    _rt::cabi_dealloc(base71, len71 * 16, 4);
                                    super::super::super::wavs::agent::types::Config {
                                        contracts: result18,
                                        llm_config:
                                            super::super::super::wavs::agent::types::LlmOptions {
                                                temperature: l19,
                                                top_p: l20,
                                                seed: l21 as u32,
                                                max_tokens: match l22 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l23 = *ptr1.add(28).cast::<i32>();
                                                            l23 as u32
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                                context_window: match l24 {
                                                    0 => None,
                                                    1 => {
                                                        let e = {
                                                            let l25 = *ptr1.add(36).cast::<i32>();
                                                            l25 as u32
                                                        };
                                                        Some(e)
                                                    }
                                                    _ => _rt::invalid_enum_discriminant(),
                                                },
                                            },
                                        model: _rt::string_lift(bytes28),
                                        messages: result62,
                                        config: result71,
                                    }
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l72 = i32::from(*ptr1.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V112;
                                    let v112 = match l72 {
                                        0 => {
                                            let e112 = {
                                                let l73 = *ptr1.add(8).cast::<*mut u8>();
                                                let l74 = *ptr1.add(12).cast::<usize>();
                                                let len75 = l74;
                                                let bytes75 = _rt::Vec::from_raw_parts(
                                                    l73.cast(),
                                                    len75,
                                                    len75,
                                                );
                                                _rt::string_lift(bytes75)
                                            };
                                            V112::Api(e112)
                                        }
                                        1 => {
                                            let e112 = {
                                                let l76 = *ptr1.add(8).cast::<*mut u8>();
                                                let l77 = *ptr1.add(12).cast::<usize>();
                                                let len78 = l77;
                                                let bytes78 = _rt::Vec::from_raw_parts(
                                                    l76.cast(),
                                                    len78,
                                                    len78,
                                                );
                                                _rt::string_lift(bytes78)
                                            };
                                            V112::Http(e112)
                                        }
                                        2 => {
                                            let e112 = {
                                                let l79 = *ptr1.add(8).cast::<*mut u8>();
                                                let l80 = *ptr1.add(12).cast::<usize>();
                                                let len81 = l80;
                                                let bytes81 = _rt::Vec::from_raw_parts(
                                                    l79.cast(),
                                                    len81,
                                                    len81,
                                                );
                                                _rt::string_lift(bytes81)
                                            };
                                            V112::ExternalService(e112)
                                        }
                                        3 => {
                                            let e112 = {
                                                let l82 = *ptr1.add(8).cast::<*mut u8>();
                                                let l83 = *ptr1.add(12).cast::<usize>();
                                                let len84 = l83;
                                                let bytes84 = _rt::Vec::from_raw_parts(
                                                    l82.cast(),
                                                    len84,
                                                    len84,
                                                );
                                                _rt::string_lift(bytes84)
                                            };
                                            V112::Config(e112)
                                        }
                                        4 => {
                                            let e112 = {
                                                let l85 = *ptr1.add(8).cast::<*mut u8>();
                                                let l86 = *ptr1.add(12).cast::<usize>();
                                                let len87 = l86;
                                                let bytes87 = _rt::Vec::from_raw_parts(
                                                    l85.cast(),
                                                    len87,
                                                    len87,
                                                );
                                                _rt::string_lift(bytes87)
                                            };
                                            V112::Contract(e112)
                                        }
                                        5 => {
                                            let e112 = {
                                                let l88 = *ptr1.add(8).cast::<*mut u8>();
                                                let l89 = *ptr1.add(12).cast::<usize>();
                                                let len90 = l89;
                                                let bytes90 = _rt::Vec::from_raw_parts(
                                                    l88.cast(),
                                                    len90,
                                                    len90,
                                                );
                                                _rt::string_lift(bytes90)
                                            };
                                            V112::Configuration(e112)
                                        }
                                        6 => {
                                            let e112 = {
                                                let l91 = *ptr1.add(8).cast::<*mut u8>();
                                                let l92 = *ptr1.add(12).cast::<usize>();
                                                let len93 = l92;
                                                let bytes93 = _rt::Vec::from_raw_parts(
                                                    l91.cast(),
                                                    len93,
                                                    len93,
                                                );
                                                _rt::string_lift(bytes93)
                                            };
                                            V112::ContextLoading(e112)
                                        }
                                        7 => {
                                            let e112 = {
                                                let l94 = *ptr1.add(8).cast::<*mut u8>();
                                                let l95 = *ptr1.add(12).cast::<usize>();
                                                let len96 = l95;
                                                let bytes96 = _rt::Vec::from_raw_parts(
                                                    l94.cast(),
                                                    len96,
                                                    len96,
                                                );
                                                _rt::string_lift(bytes96)
                                            };
                                            V112::ContextValidation(e112)
                                        }
                                        8 => {
                                            let e112 = {
                                                let l97 = *ptr1.add(8).cast::<*mut u8>();
                                                let l98 = *ptr1.add(12).cast::<usize>();
                                                let len99 = l98;
                                                let bytes99 = _rt::Vec::from_raw_parts(
                                                    l97.cast(),
                                                    len99,
                                                    len99,
                                                );
                                                _rt::string_lift(bytes99)
                                            };
                                            V112::Llm(e112)
                                        }
                                        9 => {
                                            let e112 = {
                                                let l100 = *ptr1.add(8).cast::<*mut u8>();
                                                let l101 = *ptr1.add(12).cast::<usize>();
                                                let len102 = l101;
                                                let bytes102 = _rt::Vec::from_raw_parts(
                                                    l100.cast(),
                                                    len102,
                                                    len102,
                                                );
                                                _rt::string_lift(bytes102)
                                            };
                                            V112::Io(e112)
                                        }
                                        10 => {
                                            let e112 = {
                                                let l103 = *ptr1.add(8).cast::<*mut u8>();
                                                let l104 = *ptr1.add(12).cast::<usize>();
                                                let len105 = l104;
                                                let bytes105 = _rt::Vec::from_raw_parts(
                                                    l103.cast(),
                                                    len105,
                                                    len105,
                                                );
                                                _rt::string_lift(bytes105)
                                            };
                                            V112::Transaction(e112)
                                        }
                                        11 => {
                                            let e112 = {
                                                let l106 = *ptr1.add(8).cast::<*mut u8>();
                                                let l107 = *ptr1.add(12).cast::<usize>();
                                                let len108 = l107;
                                                let bytes108 = _rt::Vec::from_raw_parts(
                                                    l106.cast(),
                                                    len108,
                                                    len108,
                                                );
                                                _rt::string_lift(bytes108)
                                            };
                                            V112::Utf8(e112)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e112 = {
                                                let l109 = *ptr1.add(8).cast::<*mut u8>();
                                                let l110 = *ptr1.add(12).cast::<usize>();
                                                let len111 = l110;
                                                let bytes111 = _rt::Vec::from_raw_parts(
                                                    l109.cast(),
                                                    len111,
                                                    len111,
                                                );
                                                _rt::string_lift(bytes111)
                                            };
                                            V112::Other(e112)
                                        }
                                    };
                                    v112
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ConfigManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Serialize the Config to a JSON string
                pub fn to_json(&self) -> Result<_rt::String, _rt::String> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 12]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 12]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]config-manager.to-json"]
                            fn wit_import(_: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0);
                        let l1 = i32::from(*ptr0.add(0).cast::<u8>());
                        match l1 {
                            0 => {
                                let e = {
                                    let l2 = *ptr0.add(4).cast::<*mut u8>();
                                    let l3 = *ptr0.add(8).cast::<usize>();
                                    let len4 = l3;
                                    let bytes4 = _rt::Vec::from_raw_parts(l2.cast(), len4, len4);
                                    _rt::string_lift(bytes4)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l5 = *ptr0.add(4).cast::<*mut u8>();
                                    let l6 = *ptr0.add(8).cast::<usize>();
                                    let len7 = l6;
                                    let bytes7 = _rt::Vec::from_raw_parts(l5.cast(), len7, len7);
                                    _rt::string_lift(bytes7)
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ConfigManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Format contract descriptions for the system prompt
                pub fn format_contract_descriptions(&self) -> _rt::String {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 8]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 8]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]config-manager.format-contract-descriptions"]
                            fn wit_import(_: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0);
                        let l1 = *ptr0.add(0).cast::<*mut u8>();
                        let l2 = *ptr0.add(4).cast::<usize>();
                        let len3 = l2;
                        let bytes3 = _rt::Vec::from_raw_parts(l1.cast(), len3, len3);
                        _rt::string_lift(bytes3)
                    }
                }
            }
            impl ConfigManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Get a smart contract by name
                pub fn get_contract_by_name(&self, name: &str) -> Option<Contract> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 40]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 40]);
                        let vec0 = name;
                        let ptr0 = vec0.as_ptr().cast::<u8>();
                        let len0 = vec0.len();
                        let ptr1 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]config-manager.get-contract-by-name"]
                            fn wit_import(_: i32, _: *mut u8, _: usize, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8, _: usize, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0.cast_mut(), len0, ptr1);
                        let l2 = i32::from(*ptr1.add(0).cast::<u8>());
                        match l2 {
                            0 => None,
                            1 => {
                                let e = {
                                    let l3 = *ptr1.add(4).cast::<*mut u8>();
                                    let l4 = *ptr1.add(8).cast::<usize>();
                                    let len5 = l4;
                                    let bytes5 = _rt::Vec::from_raw_parts(l3.cast(), len5, len5);
                                    let l6 = *ptr1.add(12).cast::<*mut u8>();
                                    let l7 = *ptr1.add(16).cast::<usize>();
                                    let len8 = l7;
                                    let bytes8 = _rt::Vec::from_raw_parts(l6.cast(), len8, len8);
                                    let l9 = *ptr1.add(20).cast::<*mut u8>();
                                    let l10 = *ptr1.add(24).cast::<usize>();
                                    let len11 = l10;
                                    let bytes11 = _rt::Vec::from_raw_parts(l9.cast(), len11, len11);
                                    let l12 = i32::from(*ptr1.add(28).cast::<u8>());
                                    super::super::super::wavs::agent::types::Contract {
                                        name: _rt::string_lift(bytes5),
                                        address: _rt::string_lift(bytes8),
                                        abi: _rt::string_lift(bytes11),
                                        description: match l12 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l13 = *ptr1.add(32).cast::<*mut u8>();
                                                    let l14 = *ptr1.add(36).cast::<usize>();
                                                    let len15 = l14;
                                                    let bytes15 = _rt::Vec::from_raw_parts(
                                                        l13.cast(),
                                                        len15,
                                                        len15,
                                                    );
                                                    _rt::string_lift(bytes15)
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                    }
                                };
                                Some(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ConfigManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Validate the Config for required fields and logical consistency
                pub fn validate(&self) -> Result<(), AgentError> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 16]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 16]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/config@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]config-manager.validate"]
                            fn wit_import(_: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0);
                        let l1 = i32::from(*ptr0.add(0).cast::<u8>());
                        match l1 {
                            0 => {
                                let e = ();
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l2 = i32::from(*ptr0.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V42;
                                    let v42 = match l2 {
                                        0 => {
                                            let e42 = {
                                                let l3 = *ptr0.add(8).cast::<*mut u8>();
                                                let l4 = *ptr0.add(12).cast::<usize>();
                                                let len5 = l4;
                                                let bytes5 =
                                                    _rt::Vec::from_raw_parts(l3.cast(), len5, len5);
                                                _rt::string_lift(bytes5)
                                            };
                                            V42::Api(e42)
                                        }
                                        1 => {
                                            let e42 = {
                                                let l6 = *ptr0.add(8).cast::<*mut u8>();
                                                let l7 = *ptr0.add(12).cast::<usize>();
                                                let len8 = l7;
                                                let bytes8 =
                                                    _rt::Vec::from_raw_parts(l6.cast(), len8, len8);
                                                _rt::string_lift(bytes8)
                                            };
                                            V42::Http(e42)
                                        }
                                        2 => {
                                            let e42 = {
                                                let l9 = *ptr0.add(8).cast::<*mut u8>();
                                                let l10 = *ptr0.add(12).cast::<usize>();
                                                let len11 = l10;
                                                let bytes11 = _rt::Vec::from_raw_parts(
                                                    l9.cast(),
                                                    len11,
                                                    len11,
                                                );
                                                _rt::string_lift(bytes11)
                                            };
                                            V42::ExternalService(e42)
                                        }
                                        3 => {
                                            let e42 = {
                                                let l12 = *ptr0.add(8).cast::<*mut u8>();
                                                let l13 = *ptr0.add(12).cast::<usize>();
                                                let len14 = l13;
                                                let bytes14 = _rt::Vec::from_raw_parts(
                                                    l12.cast(),
                                                    len14,
                                                    len14,
                                                );
                                                _rt::string_lift(bytes14)
                                            };
                                            V42::Config(e42)
                                        }
                                        4 => {
                                            let e42 = {
                                                let l15 = *ptr0.add(8).cast::<*mut u8>();
                                                let l16 = *ptr0.add(12).cast::<usize>();
                                                let len17 = l16;
                                                let bytes17 = _rt::Vec::from_raw_parts(
                                                    l15.cast(),
                                                    len17,
                                                    len17,
                                                );
                                                _rt::string_lift(bytes17)
                                            };
                                            V42::Contract(e42)
                                        }
                                        5 => {
                                            let e42 = {
                                                let l18 = *ptr0.add(8).cast::<*mut u8>();
                                                let l19 = *ptr0.add(12).cast::<usize>();
                                                let len20 = l19;
                                                let bytes20 = _rt::Vec::from_raw_parts(
                                                    l18.cast(),
                                                    len20,
                                                    len20,
                                                );
                                                _rt::string_lift(bytes20)
                                            };
                                            V42::Configuration(e42)
                                        }
                                        6 => {
                                            let e42 = {
                                                let l21 = *ptr0.add(8).cast::<*mut u8>();
                                                let l22 = *ptr0.add(12).cast::<usize>();
                                                let len23 = l22;
                                                let bytes23 = _rt::Vec::from_raw_parts(
                                                    l21.cast(),
                                                    len23,
                                                    len23,
                                                );
                                                _rt::string_lift(bytes23)
                                            };
                                            V42::ContextLoading(e42)
                                        }
                                        7 => {
                                            let e42 = {
                                                let l24 = *ptr0.add(8).cast::<*mut u8>();
                                                let l25 = *ptr0.add(12).cast::<usize>();
                                                let len26 = l25;
                                                let bytes26 = _rt::Vec::from_raw_parts(
                                                    l24.cast(),
                                                    len26,
                                                    len26,
                                                );
                                                _rt::string_lift(bytes26)
                                            };
                                            V42::ContextValidation(e42)
                                        }
                                        8 => {
                                            let e42 = {
                                                let l27 = *ptr0.add(8).cast::<*mut u8>();
                                                let l28 = *ptr0.add(12).cast::<usize>();
                                                let len29 = l28;
                                                let bytes29 = _rt::Vec::from_raw_parts(
                                                    l27.cast(),
                                                    len29,
                                                    len29,
                                                );
                                                _rt::string_lift(bytes29)
                                            };
                                            V42::Llm(e42)
                                        }
                                        9 => {
                                            let e42 = {
                                                let l30 = *ptr0.add(8).cast::<*mut u8>();
                                                let l31 = *ptr0.add(12).cast::<usize>();
                                                let len32 = l31;
                                                let bytes32 = _rt::Vec::from_raw_parts(
                                                    l30.cast(),
                                                    len32,
                                                    len32,
                                                );
                                                _rt::string_lift(bytes32)
                                            };
                                            V42::Io(e42)
                                        }
                                        10 => {
                                            let e42 = {
                                                let l33 = *ptr0.add(8).cast::<*mut u8>();
                                                let l34 = *ptr0.add(12).cast::<usize>();
                                                let len35 = l34;
                                                let bytes35 = _rt::Vec::from_raw_parts(
                                                    l33.cast(),
                                                    len35,
                                                    len35,
                                                );
                                                _rt::string_lift(bytes35)
                                            };
                                            V42::Transaction(e42)
                                        }
                                        11 => {
                                            let e42 = {
                                                let l36 = *ptr0.add(8).cast::<*mut u8>();
                                                let l37 = *ptr0.add(12).cast::<usize>();
                                                let len38 = l37;
                                                let bytes38 = _rt::Vec::from_raw_parts(
                                                    l36.cast(),
                                                    len38,
                                                    len38,
                                                );
                                                _rt::string_lift(bytes38)
                                            };
                                            V42::Utf8(e42)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e42 = {
                                                let l39 = *ptr0.add(8).cast::<*mut u8>();
                                                let l40 = *ptr0.add(12).cast::<usize>();
                                                let len41 = l40;
                                                let bytes41 = _rt::Vec::from_raw_parts(
                                                    l39.cast(),
                                                    len41,
                                                    len41,
                                                );
                                                _rt::string_lift(bytes41)
                                            };
                                            V42::Other(e42)
                                        }
                                    };
                                    v42
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
        }
        #[allow(dead_code, clippy::all)]
        pub mod contracts {
            #[used]
            #[doc(hidden)]
            static __FORCE_SECTION_REF: fn() =
                super::super::super::__link_custom_section_describing_imports;
            use super::super::super::_rt;
            pub type AgentError = super::super::super::wavs::agent::errors::AgentError;
            pub type Contract = super::super::super::wavs::agent::types::Contract;
            pub type Transaction = super::super::super::wavs::agent::types::Transaction;
            /// Helper methods for contracts
            #[derive(Debug)]
            #[repr(transparent)]
            pub struct ContractManager {
                handle: _rt::Resource<ContractManager>,
            }
            impl ContractManager {
                #[doc(hidden)]
                pub unsafe fn from_handle(handle: u32) -> Self {
                    Self { handle: _rt::Resource::from_handle(handle) }
                }
                #[doc(hidden)]
                pub fn take_handle(&self) -> u32 {
                    _rt::Resource::take_handle(&self.handle)
                }
                #[doc(hidden)]
                pub fn handle(&self) -> u32 {
                    _rt::Resource::handle(&self.handle)
                }
            }
            unsafe impl _rt::WasmResource for ContractManager {
                #[inline]
                unsafe fn drop(_handle: u32) {
                    #[cfg(not(target_arch = "wasm32"))]
                    unreachable!();
                    #[cfg(target_arch = "wasm32")]
                    {
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[resource-drop]contract-manager"]
                            fn drop(_: u32);
                        }
                        drop(_handle);
                    }
                }
            }
            /// Transaction management
            #[derive(Debug)]
            #[repr(transparent)]
            pub struct TransactionManager {
                handle: _rt::Resource<TransactionManager>,
            }
            impl TransactionManager {
                #[doc(hidden)]
                pub unsafe fn from_handle(handle: u32) -> Self {
                    Self { handle: _rt::Resource::from_handle(handle) }
                }
                #[doc(hidden)]
                pub fn take_handle(&self) -> u32 {
                    _rt::Resource::take_handle(&self.handle)
                }
                #[doc(hidden)]
                pub fn handle(&self) -> u32 {
                    _rt::Resource::handle(&self.handle)
                }
            }
            unsafe impl _rt::WasmResource for TransactionManager {
                #[inline]
                unsafe fn drop(_handle: u32) {
                    #[cfg(not(target_arch = "wasm32"))]
                    unreachable!();
                    #[cfg(target_arch = "wasm32")]
                    {
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[resource-drop]transaction-manager"]
                            fn drop(_: u32);
                        }
                        drop(_handle);
                    }
                }
            }
            impl ContractManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Create a new Contract instance
                pub fn new(&self, name: &str, address: &str, abi: &str) -> Contract {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 36]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 36]);
                        let vec0 = name;
                        let ptr0 = vec0.as_ptr().cast::<u8>();
                        let len0 = vec0.len();
                        let vec1 = address;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = abi;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let ptr3 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]contract-manager.new"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr0.cast_mut(),
                            len0,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr3,
                        );
                        let l4 = *ptr3.add(0).cast::<*mut u8>();
                        let l5 = *ptr3.add(4).cast::<usize>();
                        let len6 = l5;
                        let bytes6 = _rt::Vec::from_raw_parts(l4.cast(), len6, len6);
                        let l7 = *ptr3.add(8).cast::<*mut u8>();
                        let l8 = *ptr3.add(12).cast::<usize>();
                        let len9 = l8;
                        let bytes9 = _rt::Vec::from_raw_parts(l7.cast(), len9, len9);
                        let l10 = *ptr3.add(16).cast::<*mut u8>();
                        let l11 = *ptr3.add(20).cast::<usize>();
                        let len12 = l11;
                        let bytes12 = _rt::Vec::from_raw_parts(l10.cast(), len12, len12);
                        let l13 = i32::from(*ptr3.add(24).cast::<u8>());
                        super::super::super::wavs::agent::types::Contract {
                            name: _rt::string_lift(bytes6),
                            address: _rt::string_lift(bytes9),
                            abi: _rt::string_lift(bytes12),
                            description: match l13 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l14 = *ptr3.add(28).cast::<*mut u8>();
                                        let l15 = *ptr3.add(32).cast::<usize>();
                                        let len16 = l15;
                                        let bytes16 =
                                            _rt::Vec::from_raw_parts(l14.cast(), len16, len16);
                                        _rt::string_lift(bytes16)
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl ContractManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Create a new Contract instance with description
                pub fn new_with_description(
                    &self,
                    name: &str,
                    address: &str,
                    abi: &str,
                    description: &str,
                ) -> Contract {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 36]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 36]);
                        let vec0 = name;
                        let ptr0 = vec0.as_ptr().cast::<u8>();
                        let len0 = vec0.len();
                        let vec1 = address;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = abi;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let vec3 = description;
                        let ptr3 = vec3.as_ptr().cast::<u8>();
                        let len3 = vec3.len();
                        let ptr4 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]contract-manager.new-with-description"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr0.cast_mut(),
                            len0,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr3.cast_mut(),
                            len3,
                            ptr4,
                        );
                        let l5 = *ptr4.add(0).cast::<*mut u8>();
                        let l6 = *ptr4.add(4).cast::<usize>();
                        let len7 = l6;
                        let bytes7 = _rt::Vec::from_raw_parts(l5.cast(), len7, len7);
                        let l8 = *ptr4.add(8).cast::<*mut u8>();
                        let l9 = *ptr4.add(12).cast::<usize>();
                        let len10 = l9;
                        let bytes10 = _rt::Vec::from_raw_parts(l8.cast(), len10, len10);
                        let l11 = *ptr4.add(16).cast::<*mut u8>();
                        let l12 = *ptr4.add(20).cast::<usize>();
                        let len13 = l12;
                        let bytes13 = _rt::Vec::from_raw_parts(l11.cast(), len13, len13);
                        let l14 = i32::from(*ptr4.add(24).cast::<u8>());
                        super::super::super::wavs::agent::types::Contract {
                            name: _rt::string_lift(bytes7),
                            address: _rt::string_lift(bytes10),
                            abi: _rt::string_lift(bytes13),
                            description: match l14 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l15 = *ptr4.add(28).cast::<*mut u8>();
                                        let l16 = *ptr4.add(32).cast::<usize>();
                                        let len17 = l16;
                                        let bytes17 =
                                            _rt::Vec::from_raw_parts(l15.cast(), len17, len17);
                                        _rt::string_lift(bytes17)
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    }
                }
            }
            impl ContractManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Parse the JSON ABI to JsonAbi struct
                pub fn parse_abi(&self, contract: &Contract) -> Result<_rt::String, AgentError> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 16]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 16]);
                        let super::super::super::wavs::agent::types::Contract {
                            name: name0,
                            address: address0,
                            abi: abi0,
                            description: description0,
                        } = contract;
                        let vec1 = name0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = address0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let vec3 = abi0;
                        let ptr3 = vec3.as_ptr().cast::<u8>();
                        let len3 = vec3.len();
                        let (result5_0, result5_1, result5_2) = match description0 {
                            Some(e) => {
                                let vec4 = e;
                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                let len4 = vec4.len();
                                (1i32, ptr4.cast_mut(), len4)
                            }
                            None => (0i32, ::core::ptr::null_mut(), 0usize),
                        };
                        let ptr6 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]contract-manager.parse-abi"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr3.cast_mut(),
                            len3,
                            result5_0,
                            result5_1,
                            result5_2,
                            ptr6,
                        );
                        let l7 = i32::from(*ptr6.add(0).cast::<u8>());
                        match l7 {
                            0 => {
                                let e = {
                                    let l8 = *ptr6.add(4).cast::<*mut u8>();
                                    let l9 = *ptr6.add(8).cast::<usize>();
                                    let len10 = l9;
                                    let bytes10 = _rt::Vec::from_raw_parts(l8.cast(), len10, len10);
                                    _rt::string_lift(bytes10)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l11 = i32::from(*ptr6.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V51;
                                    let v51 = match l11 {
                                        0 => {
                                            let e51 = {
                                                let l12 = *ptr6.add(8).cast::<*mut u8>();
                                                let l13 = *ptr6.add(12).cast::<usize>();
                                                let len14 = l13;
                                                let bytes14 = _rt::Vec::from_raw_parts(
                                                    l12.cast(),
                                                    len14,
                                                    len14,
                                                );
                                                _rt::string_lift(bytes14)
                                            };
                                            V51::Api(e51)
                                        }
                                        1 => {
                                            let e51 = {
                                                let l15 = *ptr6.add(8).cast::<*mut u8>();
                                                let l16 = *ptr6.add(12).cast::<usize>();
                                                let len17 = l16;
                                                let bytes17 = _rt::Vec::from_raw_parts(
                                                    l15.cast(),
                                                    len17,
                                                    len17,
                                                );
                                                _rt::string_lift(bytes17)
                                            };
                                            V51::Http(e51)
                                        }
                                        2 => {
                                            let e51 = {
                                                let l18 = *ptr6.add(8).cast::<*mut u8>();
                                                let l19 = *ptr6.add(12).cast::<usize>();
                                                let len20 = l19;
                                                let bytes20 = _rt::Vec::from_raw_parts(
                                                    l18.cast(),
                                                    len20,
                                                    len20,
                                                );
                                                _rt::string_lift(bytes20)
                                            };
                                            V51::ExternalService(e51)
                                        }
                                        3 => {
                                            let e51 = {
                                                let l21 = *ptr6.add(8).cast::<*mut u8>();
                                                let l22 = *ptr6.add(12).cast::<usize>();
                                                let len23 = l22;
                                                let bytes23 = _rt::Vec::from_raw_parts(
                                                    l21.cast(),
                                                    len23,
                                                    len23,
                                                );
                                                _rt::string_lift(bytes23)
                                            };
                                            V51::Config(e51)
                                        }
                                        4 => {
                                            let e51 = {
                                                let l24 = *ptr6.add(8).cast::<*mut u8>();
                                                let l25 = *ptr6.add(12).cast::<usize>();
                                                let len26 = l25;
                                                let bytes26 = _rt::Vec::from_raw_parts(
                                                    l24.cast(),
                                                    len26,
                                                    len26,
                                                );
                                                _rt::string_lift(bytes26)
                                            };
                                            V51::Contract(e51)
                                        }
                                        5 => {
                                            let e51 = {
                                                let l27 = *ptr6.add(8).cast::<*mut u8>();
                                                let l28 = *ptr6.add(12).cast::<usize>();
                                                let len29 = l28;
                                                let bytes29 = _rt::Vec::from_raw_parts(
                                                    l27.cast(),
                                                    len29,
                                                    len29,
                                                );
                                                _rt::string_lift(bytes29)
                                            };
                                            V51::Configuration(e51)
                                        }
                                        6 => {
                                            let e51 = {
                                                let l30 = *ptr6.add(8).cast::<*mut u8>();
                                                let l31 = *ptr6.add(12).cast::<usize>();
                                                let len32 = l31;
                                                let bytes32 = _rt::Vec::from_raw_parts(
                                                    l30.cast(),
                                                    len32,
                                                    len32,
                                                );
                                                _rt::string_lift(bytes32)
                                            };
                                            V51::ContextLoading(e51)
                                        }
                                        7 => {
                                            let e51 = {
                                                let l33 = *ptr6.add(8).cast::<*mut u8>();
                                                let l34 = *ptr6.add(12).cast::<usize>();
                                                let len35 = l34;
                                                let bytes35 = _rt::Vec::from_raw_parts(
                                                    l33.cast(),
                                                    len35,
                                                    len35,
                                                );
                                                _rt::string_lift(bytes35)
                                            };
                                            V51::ContextValidation(e51)
                                        }
                                        8 => {
                                            let e51 = {
                                                let l36 = *ptr6.add(8).cast::<*mut u8>();
                                                let l37 = *ptr6.add(12).cast::<usize>();
                                                let len38 = l37;
                                                let bytes38 = _rt::Vec::from_raw_parts(
                                                    l36.cast(),
                                                    len38,
                                                    len38,
                                                );
                                                _rt::string_lift(bytes38)
                                            };
                                            V51::Llm(e51)
                                        }
                                        9 => {
                                            let e51 = {
                                                let l39 = *ptr6.add(8).cast::<*mut u8>();
                                                let l40 = *ptr6.add(12).cast::<usize>();
                                                let len41 = l40;
                                                let bytes41 = _rt::Vec::from_raw_parts(
                                                    l39.cast(),
                                                    len41,
                                                    len41,
                                                );
                                                _rt::string_lift(bytes41)
                                            };
                                            V51::Io(e51)
                                        }
                                        10 => {
                                            let e51 = {
                                                let l42 = *ptr6.add(8).cast::<*mut u8>();
                                                let l43 = *ptr6.add(12).cast::<usize>();
                                                let len44 = l43;
                                                let bytes44 = _rt::Vec::from_raw_parts(
                                                    l42.cast(),
                                                    len44,
                                                    len44,
                                                );
                                                _rt::string_lift(bytes44)
                                            };
                                            V51::Transaction(e51)
                                        }
                                        11 => {
                                            let e51 = {
                                                let l45 = *ptr6.add(8).cast::<*mut u8>();
                                                let l46 = *ptr6.add(12).cast::<usize>();
                                                let len47 = l46;
                                                let bytes47 = _rt::Vec::from_raw_parts(
                                                    l45.cast(),
                                                    len47,
                                                    len47,
                                                );
                                                _rt::string_lift(bytes47)
                                            };
                                            V51::Utf8(e51)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e51 = {
                                                let l48 = *ptr6.add(8).cast::<*mut u8>();
                                                let l49 = *ptr6.add(12).cast::<usize>();
                                                let len50 = l49;
                                                let bytes50 = _rt::Vec::from_raw_parts(
                                                    l48.cast(),
                                                    len50,
                                                    len50,
                                                );
                                                _rt::string_lift(bytes50)
                                            };
                                            V51::Other(e51)
                                        }
                                    };
                                    v51
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ContractManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Encode a function call for this contract using the ABI
                pub fn encode_function_call(
                    &self,
                    contract: &Contract,
                    function_name: &str,
                    args: &[_rt::String],
                ) -> Result<_rt::Vec<u8>, AgentError> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 16]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 16]);
                        let super::super::super::wavs::agent::types::Contract {
                            name: name0,
                            address: address0,
                            abi: abi0,
                            description: description0,
                        } = contract;
                        let vec1 = name0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = address0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let vec3 = abi0;
                        let ptr3 = vec3.as_ptr().cast::<u8>();
                        let len3 = vec3.len();
                        let (result5_0, result5_1, result5_2) = match description0 {
                            Some(e) => {
                                let vec4 = e;
                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                let len4 = vec4.len();
                                (1i32, ptr4.cast_mut(), len4)
                            }
                            None => (0i32, ::core::ptr::null_mut(), 0usize),
                        };
                        let vec6 = function_name;
                        let ptr6 = vec6.as_ptr().cast::<u8>();
                        let len6 = vec6.len();
                        let vec8 = args;
                        let len8 = vec8.len();
                        let layout8 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec8.len() * 8, 4);
                        let result8 = if layout8.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout8).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout8);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec8.into_iter().enumerate() {
                            let base = result8.add(i * 8);
                            {
                                let vec7 = e;
                                let ptr7 = vec7.as_ptr().cast::<u8>();
                                let len7 = vec7.len();
                                *base.add(4).cast::<usize>() = len7;
                                *base.add(0).cast::<*mut u8>() = ptr7.cast_mut();
                            }
                        }
                        let ptr9 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]contract-manager.encode-function-call"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr3.cast_mut(),
                            len3,
                            result5_0,
                            result5_1,
                            result5_2,
                            ptr6.cast_mut(),
                            len6,
                            result8,
                            len8,
                            ptr9,
                        );
                        let l10 = i32::from(*ptr9.add(0).cast::<u8>());
                        if layout8.size() != 0 {
                            _rt::alloc::dealloc(result8.cast(), layout8);
                        }
                        match l10 {
                            0 => {
                                let e = {
                                    let l11 = *ptr9.add(4).cast::<*mut u8>();
                                    let l12 = *ptr9.add(8).cast::<usize>();
                                    let len13 = l12;
                                    _rt::Vec::from_raw_parts(l11.cast(), len13, len13)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l14 = i32::from(*ptr9.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V54;
                                    let v54 = match l14 {
                                        0 => {
                                            let e54 = {
                                                let l15 = *ptr9.add(8).cast::<*mut u8>();
                                                let l16 = *ptr9.add(12).cast::<usize>();
                                                let len17 = l16;
                                                let bytes17 = _rt::Vec::from_raw_parts(
                                                    l15.cast(),
                                                    len17,
                                                    len17,
                                                );
                                                _rt::string_lift(bytes17)
                                            };
                                            V54::Api(e54)
                                        }
                                        1 => {
                                            let e54 = {
                                                let l18 = *ptr9.add(8).cast::<*mut u8>();
                                                let l19 = *ptr9.add(12).cast::<usize>();
                                                let len20 = l19;
                                                let bytes20 = _rt::Vec::from_raw_parts(
                                                    l18.cast(),
                                                    len20,
                                                    len20,
                                                );
                                                _rt::string_lift(bytes20)
                                            };
                                            V54::Http(e54)
                                        }
                                        2 => {
                                            let e54 = {
                                                let l21 = *ptr9.add(8).cast::<*mut u8>();
                                                let l22 = *ptr9.add(12).cast::<usize>();
                                                let len23 = l22;
                                                let bytes23 = _rt::Vec::from_raw_parts(
                                                    l21.cast(),
                                                    len23,
                                                    len23,
                                                );
                                                _rt::string_lift(bytes23)
                                            };
                                            V54::ExternalService(e54)
                                        }
                                        3 => {
                                            let e54 = {
                                                let l24 = *ptr9.add(8).cast::<*mut u8>();
                                                let l25 = *ptr9.add(12).cast::<usize>();
                                                let len26 = l25;
                                                let bytes26 = _rt::Vec::from_raw_parts(
                                                    l24.cast(),
                                                    len26,
                                                    len26,
                                                );
                                                _rt::string_lift(bytes26)
                                            };
                                            V54::Config(e54)
                                        }
                                        4 => {
                                            let e54 = {
                                                let l27 = *ptr9.add(8).cast::<*mut u8>();
                                                let l28 = *ptr9.add(12).cast::<usize>();
                                                let len29 = l28;
                                                let bytes29 = _rt::Vec::from_raw_parts(
                                                    l27.cast(),
                                                    len29,
                                                    len29,
                                                );
                                                _rt::string_lift(bytes29)
                                            };
                                            V54::Contract(e54)
                                        }
                                        5 => {
                                            let e54 = {
                                                let l30 = *ptr9.add(8).cast::<*mut u8>();
                                                let l31 = *ptr9.add(12).cast::<usize>();
                                                let len32 = l31;
                                                let bytes32 = _rt::Vec::from_raw_parts(
                                                    l30.cast(),
                                                    len32,
                                                    len32,
                                                );
                                                _rt::string_lift(bytes32)
                                            };
                                            V54::Configuration(e54)
                                        }
                                        6 => {
                                            let e54 = {
                                                let l33 = *ptr9.add(8).cast::<*mut u8>();
                                                let l34 = *ptr9.add(12).cast::<usize>();
                                                let len35 = l34;
                                                let bytes35 = _rt::Vec::from_raw_parts(
                                                    l33.cast(),
                                                    len35,
                                                    len35,
                                                );
                                                _rt::string_lift(bytes35)
                                            };
                                            V54::ContextLoading(e54)
                                        }
                                        7 => {
                                            let e54 = {
                                                let l36 = *ptr9.add(8).cast::<*mut u8>();
                                                let l37 = *ptr9.add(12).cast::<usize>();
                                                let len38 = l37;
                                                let bytes38 = _rt::Vec::from_raw_parts(
                                                    l36.cast(),
                                                    len38,
                                                    len38,
                                                );
                                                _rt::string_lift(bytes38)
                                            };
                                            V54::ContextValidation(e54)
                                        }
                                        8 => {
                                            let e54 = {
                                                let l39 = *ptr9.add(8).cast::<*mut u8>();
                                                let l40 = *ptr9.add(12).cast::<usize>();
                                                let len41 = l40;
                                                let bytes41 = _rt::Vec::from_raw_parts(
                                                    l39.cast(),
                                                    len41,
                                                    len41,
                                                );
                                                _rt::string_lift(bytes41)
                                            };
                                            V54::Llm(e54)
                                        }
                                        9 => {
                                            let e54 = {
                                                let l42 = *ptr9.add(8).cast::<*mut u8>();
                                                let l43 = *ptr9.add(12).cast::<usize>();
                                                let len44 = l43;
                                                let bytes44 = _rt::Vec::from_raw_parts(
                                                    l42.cast(),
                                                    len44,
                                                    len44,
                                                );
                                                _rt::string_lift(bytes44)
                                            };
                                            V54::Io(e54)
                                        }
                                        10 => {
                                            let e54 = {
                                                let l45 = *ptr9.add(8).cast::<*mut u8>();
                                                let l46 = *ptr9.add(12).cast::<usize>();
                                                let len47 = l46;
                                                let bytes47 = _rt::Vec::from_raw_parts(
                                                    l45.cast(),
                                                    len47,
                                                    len47,
                                                );
                                                _rt::string_lift(bytes47)
                                            };
                                            V54::Transaction(e54)
                                        }
                                        11 => {
                                            let e54 = {
                                                let l48 = *ptr9.add(8).cast::<*mut u8>();
                                                let l49 = *ptr9.add(12).cast::<usize>();
                                                let len50 = l49;
                                                let bytes50 = _rt::Vec::from_raw_parts(
                                                    l48.cast(),
                                                    len50,
                                                    len50,
                                                );
                                                _rt::string_lift(bytes50)
                                            };
                                            V54::Utf8(e54)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e54 = {
                                                let l51 = *ptr9.add(8).cast::<*mut u8>();
                                                let l52 = *ptr9.add(12).cast::<usize>();
                                                let len53 = l52;
                                                let bytes53 = _rt::Vec::from_raw_parts(
                                                    l51.cast(),
                                                    len53,
                                                    len53,
                                                );
                                                _rt::string_lift(bytes53)
                                            };
                                            V54::Other(e54)
                                        }
                                    };
                                    v54
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ContractManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Find a function in the ABI
                pub fn find_function(
                    &self,
                    contract: &Contract,
                    function_name: &str,
                ) -> Result<_rt::String, AgentError> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 16]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 16]);
                        let super::super::super::wavs::agent::types::Contract {
                            name: name0,
                            address: address0,
                            abi: abi0,
                            description: description0,
                        } = contract;
                        let vec1 = name0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = address0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let vec3 = abi0;
                        let ptr3 = vec3.as_ptr().cast::<u8>();
                        let len3 = vec3.len();
                        let (result5_0, result5_1, result5_2) = match description0 {
                            Some(e) => {
                                let vec4 = e;
                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                let len4 = vec4.len();
                                (1i32, ptr4.cast_mut(), len4)
                            }
                            None => (0i32, ::core::ptr::null_mut(), 0usize),
                        };
                        let vec6 = function_name;
                        let ptr6 = vec6.as_ptr().cast::<u8>();
                        let len6 = vec6.len();
                        let ptr7 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]contract-manager.find-function"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr3.cast_mut(),
                            len3,
                            result5_0,
                            result5_1,
                            result5_2,
                            ptr6.cast_mut(),
                            len6,
                            ptr7,
                        );
                        let l8 = i32::from(*ptr7.add(0).cast::<u8>());
                        match l8 {
                            0 => {
                                let e = {
                                    let l9 = *ptr7.add(4).cast::<*mut u8>();
                                    let l10 = *ptr7.add(8).cast::<usize>();
                                    let len11 = l10;
                                    let bytes11 = _rt::Vec::from_raw_parts(l9.cast(), len11, len11);
                                    _rt::string_lift(bytes11)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l12 = i32::from(*ptr7.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V52;
                                    let v52 = match l12 {
                                        0 => {
                                            let e52 = {
                                                let l13 = *ptr7.add(8).cast::<*mut u8>();
                                                let l14 = *ptr7.add(12).cast::<usize>();
                                                let len15 = l14;
                                                let bytes15 = _rt::Vec::from_raw_parts(
                                                    l13.cast(),
                                                    len15,
                                                    len15,
                                                );
                                                _rt::string_lift(bytes15)
                                            };
                                            V52::Api(e52)
                                        }
                                        1 => {
                                            let e52 = {
                                                let l16 = *ptr7.add(8).cast::<*mut u8>();
                                                let l17 = *ptr7.add(12).cast::<usize>();
                                                let len18 = l17;
                                                let bytes18 = _rt::Vec::from_raw_parts(
                                                    l16.cast(),
                                                    len18,
                                                    len18,
                                                );
                                                _rt::string_lift(bytes18)
                                            };
                                            V52::Http(e52)
                                        }
                                        2 => {
                                            let e52 = {
                                                let l19 = *ptr7.add(8).cast::<*mut u8>();
                                                let l20 = *ptr7.add(12).cast::<usize>();
                                                let len21 = l20;
                                                let bytes21 = _rt::Vec::from_raw_parts(
                                                    l19.cast(),
                                                    len21,
                                                    len21,
                                                );
                                                _rt::string_lift(bytes21)
                                            };
                                            V52::ExternalService(e52)
                                        }
                                        3 => {
                                            let e52 = {
                                                let l22 = *ptr7.add(8).cast::<*mut u8>();
                                                let l23 = *ptr7.add(12).cast::<usize>();
                                                let len24 = l23;
                                                let bytes24 = _rt::Vec::from_raw_parts(
                                                    l22.cast(),
                                                    len24,
                                                    len24,
                                                );
                                                _rt::string_lift(bytes24)
                                            };
                                            V52::Config(e52)
                                        }
                                        4 => {
                                            let e52 = {
                                                let l25 = *ptr7.add(8).cast::<*mut u8>();
                                                let l26 = *ptr7.add(12).cast::<usize>();
                                                let len27 = l26;
                                                let bytes27 = _rt::Vec::from_raw_parts(
                                                    l25.cast(),
                                                    len27,
                                                    len27,
                                                );
                                                _rt::string_lift(bytes27)
                                            };
                                            V52::Contract(e52)
                                        }
                                        5 => {
                                            let e52 = {
                                                let l28 = *ptr7.add(8).cast::<*mut u8>();
                                                let l29 = *ptr7.add(12).cast::<usize>();
                                                let len30 = l29;
                                                let bytes30 = _rt::Vec::from_raw_parts(
                                                    l28.cast(),
                                                    len30,
                                                    len30,
                                                );
                                                _rt::string_lift(bytes30)
                                            };
                                            V52::Configuration(e52)
                                        }
                                        6 => {
                                            let e52 = {
                                                let l31 = *ptr7.add(8).cast::<*mut u8>();
                                                let l32 = *ptr7.add(12).cast::<usize>();
                                                let len33 = l32;
                                                let bytes33 = _rt::Vec::from_raw_parts(
                                                    l31.cast(),
                                                    len33,
                                                    len33,
                                                );
                                                _rt::string_lift(bytes33)
                                            };
                                            V52::ContextLoading(e52)
                                        }
                                        7 => {
                                            let e52 = {
                                                let l34 = *ptr7.add(8).cast::<*mut u8>();
                                                let l35 = *ptr7.add(12).cast::<usize>();
                                                let len36 = l35;
                                                let bytes36 = _rt::Vec::from_raw_parts(
                                                    l34.cast(),
                                                    len36,
                                                    len36,
                                                );
                                                _rt::string_lift(bytes36)
                                            };
                                            V52::ContextValidation(e52)
                                        }
                                        8 => {
                                            let e52 = {
                                                let l37 = *ptr7.add(8).cast::<*mut u8>();
                                                let l38 = *ptr7.add(12).cast::<usize>();
                                                let len39 = l38;
                                                let bytes39 = _rt::Vec::from_raw_parts(
                                                    l37.cast(),
                                                    len39,
                                                    len39,
                                                );
                                                _rt::string_lift(bytes39)
                                            };
                                            V52::Llm(e52)
                                        }
                                        9 => {
                                            let e52 = {
                                                let l40 = *ptr7.add(8).cast::<*mut u8>();
                                                let l41 = *ptr7.add(12).cast::<usize>();
                                                let len42 = l41;
                                                let bytes42 = _rt::Vec::from_raw_parts(
                                                    l40.cast(),
                                                    len42,
                                                    len42,
                                                );
                                                _rt::string_lift(bytes42)
                                            };
                                            V52::Io(e52)
                                        }
                                        10 => {
                                            let e52 = {
                                                let l43 = *ptr7.add(8).cast::<*mut u8>();
                                                let l44 = *ptr7.add(12).cast::<usize>();
                                                let len45 = l44;
                                                let bytes45 = _rt::Vec::from_raw_parts(
                                                    l43.cast(),
                                                    len45,
                                                    len45,
                                                );
                                                _rt::string_lift(bytes45)
                                            };
                                            V52::Transaction(e52)
                                        }
                                        11 => {
                                            let e52 = {
                                                let l46 = *ptr7.add(8).cast::<*mut u8>();
                                                let l47 = *ptr7.add(12).cast::<usize>();
                                                let len48 = l47;
                                                let bytes48 = _rt::Vec::from_raw_parts(
                                                    l46.cast(),
                                                    len48,
                                                    len48,
                                                );
                                                _rt::string_lift(bytes48)
                                            };
                                            V52::Utf8(e52)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e52 = {
                                                let l49 = *ptr7.add(8).cast::<*mut u8>();
                                                let l50 = *ptr7.add(12).cast::<usize>();
                                                let len51 = l50;
                                                let bytes51 = _rt::Vec::from_raw_parts(
                                                    l49.cast(),
                                                    len51,
                                                    len51,
                                                );
                                                _rt::string_lift(bytes51)
                                            };
                                            V52::Other(e52)
                                        }
                                    };
                                    v52
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ContractManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Validate function arguments against the ABI
                pub fn validate_function_call(
                    &self,
                    contract: &Contract,
                    function_name: &str,
                    args: &[_rt::String],
                ) -> Result<(), AgentError> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 16]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 16]);
                        let super::super::super::wavs::agent::types::Contract {
                            name: name0,
                            address: address0,
                            abi: abi0,
                            description: description0,
                        } = contract;
                        let vec1 = name0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = address0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let vec3 = abi0;
                        let ptr3 = vec3.as_ptr().cast::<u8>();
                        let len3 = vec3.len();
                        let (result5_0, result5_1, result5_2) = match description0 {
                            Some(e) => {
                                let vec4 = e;
                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                let len4 = vec4.len();
                                (1i32, ptr4.cast_mut(), len4)
                            }
                            None => (0i32, ::core::ptr::null_mut(), 0usize),
                        };
                        let vec6 = function_name;
                        let ptr6 = vec6.as_ptr().cast::<u8>();
                        let len6 = vec6.len();
                        let vec8 = args;
                        let len8 = vec8.len();
                        let layout8 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec8.len() * 8, 4);
                        let result8 = if layout8.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout8).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout8);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec8.into_iter().enumerate() {
                            let base = result8.add(i * 8);
                            {
                                let vec7 = e;
                                let ptr7 = vec7.as_ptr().cast::<u8>();
                                let len7 = vec7.len();
                                *base.add(4).cast::<usize>() = len7;
                                *base.add(0).cast::<*mut u8>() = ptr7.cast_mut();
                            }
                        }
                        let ptr9 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]contract-manager.validate-function-call"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr3.cast_mut(),
                            len3,
                            result5_0,
                            result5_1,
                            result5_2,
                            ptr6.cast_mut(),
                            len6,
                            result8,
                            len8,
                            ptr9,
                        );
                        let l10 = i32::from(*ptr9.add(0).cast::<u8>());
                        if layout8.size() != 0 {
                            _rt::alloc::dealloc(result8.cast(), layout8);
                        }
                        match l10 {
                            0 => {
                                let e = ();
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l11 = i32::from(*ptr9.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V51;
                                    let v51 = match l11 {
                                        0 => {
                                            let e51 = {
                                                let l12 = *ptr9.add(8).cast::<*mut u8>();
                                                let l13 = *ptr9.add(12).cast::<usize>();
                                                let len14 = l13;
                                                let bytes14 = _rt::Vec::from_raw_parts(
                                                    l12.cast(),
                                                    len14,
                                                    len14,
                                                );
                                                _rt::string_lift(bytes14)
                                            };
                                            V51::Api(e51)
                                        }
                                        1 => {
                                            let e51 = {
                                                let l15 = *ptr9.add(8).cast::<*mut u8>();
                                                let l16 = *ptr9.add(12).cast::<usize>();
                                                let len17 = l16;
                                                let bytes17 = _rt::Vec::from_raw_parts(
                                                    l15.cast(),
                                                    len17,
                                                    len17,
                                                );
                                                _rt::string_lift(bytes17)
                                            };
                                            V51::Http(e51)
                                        }
                                        2 => {
                                            let e51 = {
                                                let l18 = *ptr9.add(8).cast::<*mut u8>();
                                                let l19 = *ptr9.add(12).cast::<usize>();
                                                let len20 = l19;
                                                let bytes20 = _rt::Vec::from_raw_parts(
                                                    l18.cast(),
                                                    len20,
                                                    len20,
                                                );
                                                _rt::string_lift(bytes20)
                                            };
                                            V51::ExternalService(e51)
                                        }
                                        3 => {
                                            let e51 = {
                                                let l21 = *ptr9.add(8).cast::<*mut u8>();
                                                let l22 = *ptr9.add(12).cast::<usize>();
                                                let len23 = l22;
                                                let bytes23 = _rt::Vec::from_raw_parts(
                                                    l21.cast(),
                                                    len23,
                                                    len23,
                                                );
                                                _rt::string_lift(bytes23)
                                            };
                                            V51::Config(e51)
                                        }
                                        4 => {
                                            let e51 = {
                                                let l24 = *ptr9.add(8).cast::<*mut u8>();
                                                let l25 = *ptr9.add(12).cast::<usize>();
                                                let len26 = l25;
                                                let bytes26 = _rt::Vec::from_raw_parts(
                                                    l24.cast(),
                                                    len26,
                                                    len26,
                                                );
                                                _rt::string_lift(bytes26)
                                            };
                                            V51::Contract(e51)
                                        }
                                        5 => {
                                            let e51 = {
                                                let l27 = *ptr9.add(8).cast::<*mut u8>();
                                                let l28 = *ptr9.add(12).cast::<usize>();
                                                let len29 = l28;
                                                let bytes29 = _rt::Vec::from_raw_parts(
                                                    l27.cast(),
                                                    len29,
                                                    len29,
                                                );
                                                _rt::string_lift(bytes29)
                                            };
                                            V51::Configuration(e51)
                                        }
                                        6 => {
                                            let e51 = {
                                                let l30 = *ptr9.add(8).cast::<*mut u8>();
                                                let l31 = *ptr9.add(12).cast::<usize>();
                                                let len32 = l31;
                                                let bytes32 = _rt::Vec::from_raw_parts(
                                                    l30.cast(),
                                                    len32,
                                                    len32,
                                                );
                                                _rt::string_lift(bytes32)
                                            };
                                            V51::ContextLoading(e51)
                                        }
                                        7 => {
                                            let e51 = {
                                                let l33 = *ptr9.add(8).cast::<*mut u8>();
                                                let l34 = *ptr9.add(12).cast::<usize>();
                                                let len35 = l34;
                                                let bytes35 = _rt::Vec::from_raw_parts(
                                                    l33.cast(),
                                                    len35,
                                                    len35,
                                                );
                                                _rt::string_lift(bytes35)
                                            };
                                            V51::ContextValidation(e51)
                                        }
                                        8 => {
                                            let e51 = {
                                                let l36 = *ptr9.add(8).cast::<*mut u8>();
                                                let l37 = *ptr9.add(12).cast::<usize>();
                                                let len38 = l37;
                                                let bytes38 = _rt::Vec::from_raw_parts(
                                                    l36.cast(),
                                                    len38,
                                                    len38,
                                                );
                                                _rt::string_lift(bytes38)
                                            };
                                            V51::Llm(e51)
                                        }
                                        9 => {
                                            let e51 = {
                                                let l39 = *ptr9.add(8).cast::<*mut u8>();
                                                let l40 = *ptr9.add(12).cast::<usize>();
                                                let len41 = l40;
                                                let bytes41 = _rt::Vec::from_raw_parts(
                                                    l39.cast(),
                                                    len41,
                                                    len41,
                                                );
                                                _rt::string_lift(bytes41)
                                            };
                                            V51::Io(e51)
                                        }
                                        10 => {
                                            let e51 = {
                                                let l42 = *ptr9.add(8).cast::<*mut u8>();
                                                let l43 = *ptr9.add(12).cast::<usize>();
                                                let len44 = l43;
                                                let bytes44 = _rt::Vec::from_raw_parts(
                                                    l42.cast(),
                                                    len44,
                                                    len44,
                                                );
                                                _rt::string_lift(bytes44)
                                            };
                                            V51::Transaction(e51)
                                        }
                                        11 => {
                                            let e51 = {
                                                let l45 = *ptr9.add(8).cast::<*mut u8>();
                                                let l46 = *ptr9.add(12).cast::<usize>();
                                                let len47 = l46;
                                                let bytes47 = _rt::Vec::from_raw_parts(
                                                    l45.cast(),
                                                    len47,
                                                    len47,
                                                );
                                                _rt::string_lift(bytes47)
                                            };
                                            V51::Utf8(e51)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e51 = {
                                                let l48 = *ptr9.add(8).cast::<*mut u8>();
                                                let l49 = *ptr9.add(12).cast::<usize>();
                                                let len50 = l49;
                                                let bytes50 = _rt::Vec::from_raw_parts(
                                                    l48.cast(),
                                                    len50,
                                                    len50,
                                                );
                                                _rt::string_lift(bytes50)
                                            };
                                            V51::Other(e51)
                                        }
                                    };
                                    v51
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl TransactionManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Basic validation of transaction fields
                pub fn is_valid(&self, transaction: &Transaction) -> bool {
                    unsafe {
                        let mut cleanup_list = _rt::Vec::new();
                        let super::super::super::wavs::agent::types::Transaction {
                            to: to0,
                            value: value0,
                            contract_call: contract_call0,
                            data: data0,
                            description: description0,
                        } = transaction;
                        let vec1 = to0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = value0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let (result7_0, result7_1, result7_2, result7_3, result7_4) =
                            match contract_call0 {
                                Some(e) => {
                                    let super::super::super::wavs::agent::types::ContractCall {
                                        function: function3,
                                        args: args3,
                                    } = e;
                                    let vec4 = function3;
                                    let ptr4 = vec4.as_ptr().cast::<u8>();
                                    let len4 = vec4.len();
                                    let vec6 = args3;
                                    let len6 = vec6.len();
                                    let layout6 = _rt::alloc::Layout::from_size_align_unchecked(
                                        vec6.len() * 8,
                                        4,
                                    );
                                    let result6 = if layout6.size() != 0 {
                                        let ptr = _rt::alloc::alloc(layout6).cast::<u8>();
                                        if ptr.is_null() {
                                            _rt::alloc::handle_alloc_error(layout6);
                                        }
                                        ptr
                                    } else {
                                        ::core::ptr::null_mut()
                                    };
                                    for (i, e) in vec6.into_iter().enumerate() {
                                        let base = result6.add(i * 8);
                                        {
                                            let vec5 = e;
                                            let ptr5 = vec5.as_ptr().cast::<u8>();
                                            let len5 = vec5.len();
                                            *base.add(4).cast::<usize>() = len5;
                                            *base.add(0).cast::<*mut u8>() = ptr5.cast_mut();
                                        }
                                    }
                                    cleanup_list.extend_from_slice(&[(result6, layout6)]);
                                    (1i32, ptr4.cast_mut(), len4, result6, len6)
                                }
                                None => (
                                    0i32,
                                    ::core::ptr::null_mut(),
                                    0usize,
                                    ::core::ptr::null_mut(),
                                    0usize,
                                ),
                            };
                        let vec8 = data0;
                        let ptr8 = vec8.as_ptr().cast::<u8>();
                        let len8 = vec8.len();
                        let vec9 = description0;
                        let ptr9 = vec9.as_ptr().cast::<u8>();
                        let len9 = vec9.len();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]transaction-manager.is-valid"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                            ) -> i32;
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                        ) -> i32 {
                            unreachable!()
                        }
                        let ret = wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            result7_0,
                            result7_1,
                            result7_2,
                            result7_3,
                            result7_4,
                            ptr8.cast_mut(),
                            len8,
                            ptr9.cast_mut(),
                            len9,
                        );
                        for (ptr, layout) in cleanup_list {
                            if layout.size() != 0 {
                                _rt::alloc::dealloc(ptr.cast(), layout);
                            }
                        }
                        _rt::bool_lift(ret as u8)
                    }
                }
            }
            impl TransactionManager {
                #[allow(unused_unsafe, clippy::all)]
                /// Validate a transaction
                pub fn validate_transaction(
                    &self,
                    transaction: &Transaction,
                ) -> Result<(), AgentError> {
                    unsafe {
                        let mut cleanup_list = _rt::Vec::new();
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 16]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 16]);
                        let super::super::super::wavs::agent::types::Transaction {
                            to: to0,
                            value: value0,
                            contract_call: contract_call0,
                            data: data0,
                            description: description0,
                        } = transaction;
                        let vec1 = to0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = value0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let (result7_0, result7_1, result7_2, result7_3, result7_4) =
                            match contract_call0 {
                                Some(e) => {
                                    let super::super::super::wavs::agent::types::ContractCall {
                                        function: function3,
                                        args: args3,
                                    } = e;
                                    let vec4 = function3;
                                    let ptr4 = vec4.as_ptr().cast::<u8>();
                                    let len4 = vec4.len();
                                    let vec6 = args3;
                                    let len6 = vec6.len();
                                    let layout6 = _rt::alloc::Layout::from_size_align_unchecked(
                                        vec6.len() * 8,
                                        4,
                                    );
                                    let result6 = if layout6.size() != 0 {
                                        let ptr = _rt::alloc::alloc(layout6).cast::<u8>();
                                        if ptr.is_null() {
                                            _rt::alloc::handle_alloc_error(layout6);
                                        }
                                        ptr
                                    } else {
                                        ::core::ptr::null_mut()
                                    };
                                    for (i, e) in vec6.into_iter().enumerate() {
                                        let base = result6.add(i * 8);
                                        {
                                            let vec5 = e;
                                            let ptr5 = vec5.as_ptr().cast::<u8>();
                                            let len5 = vec5.len();
                                            *base.add(4).cast::<usize>() = len5;
                                            *base.add(0).cast::<*mut u8>() = ptr5.cast_mut();
                                        }
                                    }
                                    cleanup_list.extend_from_slice(&[(result6, layout6)]);
                                    (1i32, ptr4.cast_mut(), len4, result6, len6)
                                }
                                None => (
                                    0i32,
                                    ::core::ptr::null_mut(),
                                    0usize,
                                    ::core::ptr::null_mut(),
                                    0usize,
                                ),
                            };
                        let vec8 = data0;
                        let ptr8 = vec8.as_ptr().cast::<u8>();
                        let len8 = vec8.len();
                        let vec9 = description0;
                        let ptr9 = vec9.as_ptr().cast::<u8>();
                        let len9 = vec9.len();
                        let ptr10 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]transaction-manager.validate-transaction"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            result7_0,
                            result7_1,
                            result7_2,
                            result7_3,
                            result7_4,
                            ptr8.cast_mut(),
                            len8,
                            ptr9.cast_mut(),
                            len9,
                            ptr10,
                        );
                        let l11 = i32::from(*ptr10.add(0).cast::<u8>());
                        for (ptr, layout) in cleanup_list {
                            if layout.size() != 0 {
                                _rt::alloc::dealloc(ptr.cast(), layout);
                            }
                        }
                        match l11 {
                            0 => {
                                let e = ();
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l12 = i32::from(*ptr10.add(4).cast::<u8>());
                                    use super::super::super::wavs::agent::errors::AgentError as V52;
                                    let v52 = match l12 {
                                        0 => {
                                            let e52 = {
                                                let l13 = *ptr10.add(8).cast::<*mut u8>();
                                                let l14 = *ptr10.add(12).cast::<usize>();
                                                let len15 = l14;
                                                let bytes15 = _rt::Vec::from_raw_parts(
                                                    l13.cast(),
                                                    len15,
                                                    len15,
                                                );
                                                _rt::string_lift(bytes15)
                                            };
                                            V52::Api(e52)
                                        }
                                        1 => {
                                            let e52 = {
                                                let l16 = *ptr10.add(8).cast::<*mut u8>();
                                                let l17 = *ptr10.add(12).cast::<usize>();
                                                let len18 = l17;
                                                let bytes18 = _rt::Vec::from_raw_parts(
                                                    l16.cast(),
                                                    len18,
                                                    len18,
                                                );
                                                _rt::string_lift(bytes18)
                                            };
                                            V52::Http(e52)
                                        }
                                        2 => {
                                            let e52 = {
                                                let l19 = *ptr10.add(8).cast::<*mut u8>();
                                                let l20 = *ptr10.add(12).cast::<usize>();
                                                let len21 = l20;
                                                let bytes21 = _rt::Vec::from_raw_parts(
                                                    l19.cast(),
                                                    len21,
                                                    len21,
                                                );
                                                _rt::string_lift(bytes21)
                                            };
                                            V52::ExternalService(e52)
                                        }
                                        3 => {
                                            let e52 = {
                                                let l22 = *ptr10.add(8).cast::<*mut u8>();
                                                let l23 = *ptr10.add(12).cast::<usize>();
                                                let len24 = l23;
                                                let bytes24 = _rt::Vec::from_raw_parts(
                                                    l22.cast(),
                                                    len24,
                                                    len24,
                                                );
                                                _rt::string_lift(bytes24)
                                            };
                                            V52::Config(e52)
                                        }
                                        4 => {
                                            let e52 = {
                                                let l25 = *ptr10.add(8).cast::<*mut u8>();
                                                let l26 = *ptr10.add(12).cast::<usize>();
                                                let len27 = l26;
                                                let bytes27 = _rt::Vec::from_raw_parts(
                                                    l25.cast(),
                                                    len27,
                                                    len27,
                                                );
                                                _rt::string_lift(bytes27)
                                            };
                                            V52::Contract(e52)
                                        }
                                        5 => {
                                            let e52 = {
                                                let l28 = *ptr10.add(8).cast::<*mut u8>();
                                                let l29 = *ptr10.add(12).cast::<usize>();
                                                let len30 = l29;
                                                let bytes30 = _rt::Vec::from_raw_parts(
                                                    l28.cast(),
                                                    len30,
                                                    len30,
                                                );
                                                _rt::string_lift(bytes30)
                                            };
                                            V52::Configuration(e52)
                                        }
                                        6 => {
                                            let e52 = {
                                                let l31 = *ptr10.add(8).cast::<*mut u8>();
                                                let l32 = *ptr10.add(12).cast::<usize>();
                                                let len33 = l32;
                                                let bytes33 = _rt::Vec::from_raw_parts(
                                                    l31.cast(),
                                                    len33,
                                                    len33,
                                                );
                                                _rt::string_lift(bytes33)
                                            };
                                            V52::ContextLoading(e52)
                                        }
                                        7 => {
                                            let e52 = {
                                                let l34 = *ptr10.add(8).cast::<*mut u8>();
                                                let l35 = *ptr10.add(12).cast::<usize>();
                                                let len36 = l35;
                                                let bytes36 = _rt::Vec::from_raw_parts(
                                                    l34.cast(),
                                                    len36,
                                                    len36,
                                                );
                                                _rt::string_lift(bytes36)
                                            };
                                            V52::ContextValidation(e52)
                                        }
                                        8 => {
                                            let e52 = {
                                                let l37 = *ptr10.add(8).cast::<*mut u8>();
                                                let l38 = *ptr10.add(12).cast::<usize>();
                                                let len39 = l38;
                                                let bytes39 = _rt::Vec::from_raw_parts(
                                                    l37.cast(),
                                                    len39,
                                                    len39,
                                                );
                                                _rt::string_lift(bytes39)
                                            };
                                            V52::Llm(e52)
                                        }
                                        9 => {
                                            let e52 = {
                                                let l40 = *ptr10.add(8).cast::<*mut u8>();
                                                let l41 = *ptr10.add(12).cast::<usize>();
                                                let len42 = l41;
                                                let bytes42 = _rt::Vec::from_raw_parts(
                                                    l40.cast(),
                                                    len42,
                                                    len42,
                                                );
                                                _rt::string_lift(bytes42)
                                            };
                                            V52::Io(e52)
                                        }
                                        10 => {
                                            let e52 = {
                                                let l43 = *ptr10.add(8).cast::<*mut u8>();
                                                let l44 = *ptr10.add(12).cast::<usize>();
                                                let len45 = l44;
                                                let bytes45 = _rt::Vec::from_raw_parts(
                                                    l43.cast(),
                                                    len45,
                                                    len45,
                                                );
                                                _rt::string_lift(bytes45)
                                            };
                                            V52::Transaction(e52)
                                        }
                                        11 => {
                                            let e52 = {
                                                let l46 = *ptr10.add(8).cast::<*mut u8>();
                                                let l47 = *ptr10.add(12).cast::<usize>();
                                                let len48 = l47;
                                                let bytes48 = _rt::Vec::from_raw_parts(
                                                    l46.cast(),
                                                    len48,
                                                    len48,
                                                );
                                                _rt::string_lift(bytes48)
                                            };
                                            V52::Utf8(e52)
                                        }
                                        n => {
                                            debug_assert_eq!(n, 12, "invalid enum discriminant");
                                            let e52 = {
                                                let l49 = *ptr10.add(8).cast::<*mut u8>();
                                                let l50 = *ptr10.add(12).cast::<usize>();
                                                let len51 = l50;
                                                let bytes51 = _rt::Vec::from_raw_parts(
                                                    l49.cast(),
                                                    len51,
                                                    len51,
                                                );
                                                _rt::string_lift(bytes51)
                                            };
                                            V52::Other(e52)
                                        }
                                    };
                                    v52
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            #[allow(unused_unsafe, clippy::all)]
            /// Helper function to create a transaction payload from a Transaction
            pub fn create_payload_from_tx(
                transaction: &Transaction,
            ) -> Result<_rt::String, AgentError> {
                unsafe {
                    let mut cleanup_list = _rt::Vec::new();
                    #[repr(align(4))]
                    struct RetArea([::core::mem::MaybeUninit<u8>; 16]);
                    let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 16]);
                    let super::super::super::wavs::agent::types::Transaction {
                        to: to0,
                        value: value0,
                        contract_call: contract_call0,
                        data: data0,
                        description: description0,
                    } = transaction;
                    let vec1 = to0;
                    let ptr1 = vec1.as_ptr().cast::<u8>();
                    let len1 = vec1.len();
                    let vec2 = value0;
                    let ptr2 = vec2.as_ptr().cast::<u8>();
                    let len2 = vec2.len();
                    let (result7_0, result7_1, result7_2, result7_3, result7_4) =
                        match contract_call0 {
                            Some(e) => {
                                let super::super::super::wavs::agent::types::ContractCall {
                                    function: function3,
                                    args: args3,
                                } = e;
                                let vec4 = function3;
                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                let len4 = vec4.len();
                                let vec6 = args3;
                                let len6 = vec6.len();
                                let layout6 = _rt::alloc::Layout::from_size_align_unchecked(
                                    vec6.len() * 8,
                                    4,
                                );
                                let result6 = if layout6.size() != 0 {
                                    let ptr = _rt::alloc::alloc(layout6).cast::<u8>();
                                    if ptr.is_null() {
                                        _rt::alloc::handle_alloc_error(layout6);
                                    }
                                    ptr
                                } else {
                                    ::core::ptr::null_mut()
                                };
                                for (i, e) in vec6.into_iter().enumerate() {
                                    let base = result6.add(i * 8);
                                    {
                                        let vec5 = e;
                                        let ptr5 = vec5.as_ptr().cast::<u8>();
                                        let len5 = vec5.len();
                                        *base.add(4).cast::<usize>() = len5;
                                        *base.add(0).cast::<*mut u8>() = ptr5.cast_mut();
                                    }
                                }
                                cleanup_list.extend_from_slice(&[(result6, layout6)]);
                                (1i32, ptr4.cast_mut(), len4, result6, len6)
                            }
                            None => (
                                0i32,
                                ::core::ptr::null_mut(),
                                0usize,
                                ::core::ptr::null_mut(),
                                0usize,
                            ),
                        };
                    let vec8 = data0;
                    let ptr8 = vec8.as_ptr().cast::<u8>();
                    let len8 = vec8.len();
                    let vec9 = description0;
                    let ptr9 = vec9.as_ptr().cast::<u8>();
                    let len9 = vec9.len();
                    let ptr10 = ret_area.0.as_mut_ptr().cast::<u8>();
                    #[cfg(target_arch = "wasm32")]
                    #[link(wasm_import_module = "wavs:agent/contracts@0.0.1")]
                    extern "C" {
                        #[link_name = "create-payload-from-tx"]
                        fn wit_import(
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        );
                    }
                    #[cfg(not(target_arch = "wasm32"))]
                    fn wit_import(
                        _: *mut u8,
                        _: usize,
                        _: *mut u8,
                        _: usize,
                        _: i32,
                        _: *mut u8,
                        _: usize,
                        _: *mut u8,
                        _: usize,
                        _: *mut u8,
                        _: usize,
                        _: *mut u8,
                        _: usize,
                        _: *mut u8,
                    ) {
                        unreachable!()
                    }
                    wit_import(
                        ptr1.cast_mut(),
                        len1,
                        ptr2.cast_mut(),
                        len2,
                        result7_0,
                        result7_1,
                        result7_2,
                        result7_3,
                        result7_4,
                        ptr8.cast_mut(),
                        len8,
                        ptr9.cast_mut(),
                        len9,
                        ptr10,
                    );
                    let l11 = i32::from(*ptr10.add(0).cast::<u8>());
                    for (ptr, layout) in cleanup_list {
                        if layout.size() != 0 {
                            _rt::alloc::dealloc(ptr.cast(), layout);
                        }
                    }
                    match l11 {
                        0 => {
                            let e = {
                                let l12 = *ptr10.add(4).cast::<*mut u8>();
                                let l13 = *ptr10.add(8).cast::<usize>();
                                let len14 = l13;
                                let bytes14 = _rt::Vec::from_raw_parts(l12.cast(), len14, len14);
                                _rt::string_lift(bytes14)
                            };
                            Ok(e)
                        }
                        1 => {
                            let e = {
                                let l15 = i32::from(*ptr10.add(4).cast::<u8>());
                                use super::super::super::wavs::agent::errors::AgentError as V55;
                                let v55 = match l15 {
                                    0 => {
                                        let e55 = {
                                            let l16 = *ptr10.add(8).cast::<*mut u8>();
                                            let l17 = *ptr10.add(12).cast::<usize>();
                                            let len18 = l17;
                                            let bytes18 =
                                                _rt::Vec::from_raw_parts(l16.cast(), len18, len18);
                                            _rt::string_lift(bytes18)
                                        };
                                        V55::Api(e55)
                                    }
                                    1 => {
                                        let e55 = {
                                            let l19 = *ptr10.add(8).cast::<*mut u8>();
                                            let l20 = *ptr10.add(12).cast::<usize>();
                                            let len21 = l20;
                                            let bytes21 =
                                                _rt::Vec::from_raw_parts(l19.cast(), len21, len21);
                                            _rt::string_lift(bytes21)
                                        };
                                        V55::Http(e55)
                                    }
                                    2 => {
                                        let e55 = {
                                            let l22 = *ptr10.add(8).cast::<*mut u8>();
                                            let l23 = *ptr10.add(12).cast::<usize>();
                                            let len24 = l23;
                                            let bytes24 =
                                                _rt::Vec::from_raw_parts(l22.cast(), len24, len24);
                                            _rt::string_lift(bytes24)
                                        };
                                        V55::ExternalService(e55)
                                    }
                                    3 => {
                                        let e55 = {
                                            let l25 = *ptr10.add(8).cast::<*mut u8>();
                                            let l26 = *ptr10.add(12).cast::<usize>();
                                            let len27 = l26;
                                            let bytes27 =
                                                _rt::Vec::from_raw_parts(l25.cast(), len27, len27);
                                            _rt::string_lift(bytes27)
                                        };
                                        V55::Config(e55)
                                    }
                                    4 => {
                                        let e55 = {
                                            let l28 = *ptr10.add(8).cast::<*mut u8>();
                                            let l29 = *ptr10.add(12).cast::<usize>();
                                            let len30 = l29;
                                            let bytes30 =
                                                _rt::Vec::from_raw_parts(l28.cast(), len30, len30);
                                            _rt::string_lift(bytes30)
                                        };
                                        V55::Contract(e55)
                                    }
                                    5 => {
                                        let e55 = {
                                            let l31 = *ptr10.add(8).cast::<*mut u8>();
                                            let l32 = *ptr10.add(12).cast::<usize>();
                                            let len33 = l32;
                                            let bytes33 =
                                                _rt::Vec::from_raw_parts(l31.cast(), len33, len33);
                                            _rt::string_lift(bytes33)
                                        };
                                        V55::Configuration(e55)
                                    }
                                    6 => {
                                        let e55 = {
                                            let l34 = *ptr10.add(8).cast::<*mut u8>();
                                            let l35 = *ptr10.add(12).cast::<usize>();
                                            let len36 = l35;
                                            let bytes36 =
                                                _rt::Vec::from_raw_parts(l34.cast(), len36, len36);
                                            _rt::string_lift(bytes36)
                                        };
                                        V55::ContextLoading(e55)
                                    }
                                    7 => {
                                        let e55 = {
                                            let l37 = *ptr10.add(8).cast::<*mut u8>();
                                            let l38 = *ptr10.add(12).cast::<usize>();
                                            let len39 = l38;
                                            let bytes39 =
                                                _rt::Vec::from_raw_parts(l37.cast(), len39, len39);
                                            _rt::string_lift(bytes39)
                                        };
                                        V55::ContextValidation(e55)
                                    }
                                    8 => {
                                        let e55 = {
                                            let l40 = *ptr10.add(8).cast::<*mut u8>();
                                            let l41 = *ptr10.add(12).cast::<usize>();
                                            let len42 = l41;
                                            let bytes42 =
                                                _rt::Vec::from_raw_parts(l40.cast(), len42, len42);
                                            _rt::string_lift(bytes42)
                                        };
                                        V55::Llm(e55)
                                    }
                                    9 => {
                                        let e55 = {
                                            let l43 = *ptr10.add(8).cast::<*mut u8>();
                                            let l44 = *ptr10.add(12).cast::<usize>();
                                            let len45 = l44;
                                            let bytes45 =
                                                _rt::Vec::from_raw_parts(l43.cast(), len45, len45);
                                            _rt::string_lift(bytes45)
                                        };
                                        V55::Io(e55)
                                    }
                                    10 => {
                                        let e55 = {
                                            let l46 = *ptr10.add(8).cast::<*mut u8>();
                                            let l47 = *ptr10.add(12).cast::<usize>();
                                            let len48 = l47;
                                            let bytes48 =
                                                _rt::Vec::from_raw_parts(l46.cast(), len48, len48);
                                            _rt::string_lift(bytes48)
                                        };
                                        V55::Transaction(e55)
                                    }
                                    11 => {
                                        let e55 = {
                                            let l49 = *ptr10.add(8).cast::<*mut u8>();
                                            let l50 = *ptr10.add(12).cast::<usize>();
                                            let len51 = l50;
                                            let bytes51 =
                                                _rt::Vec::from_raw_parts(l49.cast(), len51, len51);
                                            _rt::string_lift(bytes51)
                                        };
                                        V55::Utf8(e55)
                                    }
                                    n => {
                                        debug_assert_eq!(n, 12, "invalid enum discriminant");
                                        let e55 = {
                                            let l52 = *ptr10.add(8).cast::<*mut u8>();
                                            let l53 = *ptr10.add(12).cast::<usize>();
                                            let len54 = l53;
                                            let bytes54 =
                                                _rt::Vec::from_raw_parts(l52.cast(), len54, len54);
                                            _rt::string_lift(bytes54)
                                        };
                                        V55::Other(e55)
                                    }
                                };
                                v55
                            };
                            Err(e)
                        }
                        _ => _rt::invalid_enum_discriminant(),
                    }
                }
            }
        }
        #[allow(dead_code, clippy::all)]
        pub mod tools {
            #[used]
            #[doc(hidden)]
            static __FORCE_SECTION_REF: fn() =
                super::super::super::__link_custom_section_describing_imports;
            use super::super::super::_rt;
            pub type LlmClient = super::super::super::wavs::agent::client::LlmClient;
            pub type Message = super::super::super::wavs::agent::types::Message;
            pub type Tool = super::super::super::wavs::agent::types::Tool;
            pub type ToolCall = super::super::super::wavs::agent::types::ToolCall;
            pub type CustomToolHandler = super::super::super::wavs::agent::types::CustomToolHandler;
            pub type Contract = super::super::super::wavs::agent::types::Contract;
            /// Tool creation and management functions
            #[derive(Debug)]
            #[repr(transparent)]
            pub struct ToolsBuilder {
                handle: _rt::Resource<ToolsBuilder>,
            }
            impl ToolsBuilder {
                #[doc(hidden)]
                pub unsafe fn from_handle(handle: u32) -> Self {
                    Self { handle: _rt::Resource::from_handle(handle) }
                }
                #[doc(hidden)]
                pub fn take_handle(&self) -> u32 {
                    _rt::Resource::take_handle(&self.handle)
                }
                #[doc(hidden)]
                pub fn handle(&self) -> u32 {
                    _rt::Resource::handle(&self.handle)
                }
            }
            unsafe impl _rt::WasmResource for ToolsBuilder {
                #[inline]
                unsafe fn drop(_handle: u32) {
                    #[cfg(not(target_arch = "wasm32"))]
                    unreachable!();
                    #[cfg(target_arch = "wasm32")]
                    {
                        #[link(wasm_import_module = "wavs:agent/tools@0.0.1")]
                        extern "C" {
                            #[link_name = "[resource-drop]tools-builder"]
                            fn drop(_: u32);
                        }
                        drop(_handle);
                    }
                }
            }
            impl ToolsBuilder {
                #[allow(unused_unsafe, clippy::all)]
                /// Create a tool to send ETH through the DAO's Safe
                pub fn send_eth_tool(&self) -> Tool {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 40]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 40]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/tools@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]tools-builder.send-eth-tool"]
                            fn wit_import(_: i32, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: i32, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import((self).handle() as i32, ptr0);
                        let l1 = *ptr0.add(0).cast::<*mut u8>();
                        let l2 = *ptr0.add(4).cast::<usize>();
                        let len3 = l2;
                        let bytes3 = _rt::Vec::from_raw_parts(l1.cast(), len3, len3);
                        let l4 = *ptr0.add(8).cast::<*mut u8>();
                        let l5 = *ptr0.add(12).cast::<usize>();
                        let len6 = l5;
                        let bytes6 = _rt::Vec::from_raw_parts(l4.cast(), len6, len6);
                        let l7 = i32::from(*ptr0.add(16).cast::<u8>());
                        let l11 = i32::from(*ptr0.add(28).cast::<u8>());
                        super::super::super::wavs::agent::types::Tool {
                            tool_type: _rt::string_lift(bytes3),
                            function: super::super::super::wavs::agent::types::Function {
                                name: _rt::string_lift(bytes6),
                                description: match l7 {
                                    0 => None,
                                    1 => {
                                        let e = {
                                            let l8 = *ptr0.add(20).cast::<*mut u8>();
                                            let l9 = *ptr0.add(24).cast::<usize>();
                                            let len10 = l9;
                                            let bytes10 =
                                                _rt::Vec::from_raw_parts(l8.cast(), len10, len10);
                                            _rt::string_lift(bytes10)
                                        };
                                        Some(e)
                                    }
                                    _ => _rt::invalid_enum_discriminant(),
                                },
                                parameters: match l11 {
                                    0 => None,
                                    1 => {
                                        let e = {
                                            let l12 = *ptr0.add(32).cast::<*mut u8>();
                                            let l13 = *ptr0.add(36).cast::<usize>();
                                            let len14 = l13;
                                            let bytes14 =
                                                _rt::Vec::from_raw_parts(l12.cast(), len14, len14);
                                            _rt::string_lift(bytes14)
                                        };
                                        Some(e)
                                    }
                                    _ => _rt::invalid_enum_discriminant(),
                                },
                            },
                        }
                    }
                }
            }
            impl ToolsBuilder {
                #[allow(unused_unsafe, clippy::all)]
                /// Generate tools from a smart contract's ABI
                pub fn tools_from_contract(&self, contract: &Contract) -> _rt::Vec<Tool> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 8]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 8]);
                        let super::super::super::wavs::agent::types::Contract {
                            name: name0,
                            address: address0,
                            abi: abi0,
                            description: description0,
                        } = contract;
                        let vec1 = name0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = address0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let vec3 = abi0;
                        let ptr3 = vec3.as_ptr().cast::<u8>();
                        let len3 = vec3.len();
                        let (result5_0, result5_1, result5_2) = match description0 {
                            Some(e) => {
                                let vec4 = e;
                                let ptr4 = vec4.as_ptr().cast::<u8>();
                                let len4 = vec4.len();
                                (1i32, ptr4.cast_mut(), len4)
                            }
                            None => (0i32, ::core::ptr::null_mut(), 0usize),
                        };
                        let ptr6 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/tools@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]tools-builder.tools-from-contract"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr3.cast_mut(),
                            len3,
                            result5_0,
                            result5_1,
                            result5_2,
                            ptr6,
                        );
                        let l7 = *ptr6.add(0).cast::<*mut u8>();
                        let l8 = *ptr6.add(4).cast::<usize>();
                        let base23 = l7;
                        let len23 = l8;
                        let mut result23 = _rt::Vec::with_capacity(len23);
                        for i in 0..len23 {
                            let base = base23.add(i * 40);
                            let e23 = {
                                let l9 = *base.add(0).cast::<*mut u8>();
                                let l10 = *base.add(4).cast::<usize>();
                                let len11 = l10;
                                let bytes11 = _rt::Vec::from_raw_parts(l9.cast(), len11, len11);
                                let l12 = *base.add(8).cast::<*mut u8>();
                                let l13 = *base.add(12).cast::<usize>();
                                let len14 = l13;
                                let bytes14 = _rt::Vec::from_raw_parts(l12.cast(), len14, len14);
                                let l15 = i32::from(*base.add(16).cast::<u8>());
                                let l19 = i32::from(*base.add(28).cast::<u8>());
                                super::super::super::wavs::agent::types::Tool {
                                    tool_type: _rt::string_lift(bytes11),
                                    function: super::super::super::wavs::agent::types::Function {
                                        name: _rt::string_lift(bytes14),
                                        description: match l15 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l16 = *base.add(20).cast::<*mut u8>();
                                                    let l17 = *base.add(24).cast::<usize>();
                                                    let len18 = l17;
                                                    let bytes18 = _rt::Vec::from_raw_parts(
                                                        l16.cast(),
                                                        len18,
                                                        len18,
                                                    );
                                                    _rt::string_lift(bytes18)
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                        parameters: match l19 {
                                            0 => None,
                                            1 => {
                                                let e = {
                                                    let l20 = *base.add(32).cast::<*mut u8>();
                                                    let l21 = *base.add(36).cast::<usize>();
                                                    let len22 = l21;
                                                    let bytes22 = _rt::Vec::from_raw_parts(
                                                        l20.cast(),
                                                        len22,
                                                        len22,
                                                    );
                                                    _rt::string_lift(bytes22)
                                                };
                                                Some(e)
                                            }
                                            _ => _rt::invalid_enum_discriminant(),
                                        },
                                    },
                                }
                            };
                            result23.push(e23);
                        }
                        _rt::cabi_dealloc(base23, len23 * 40, 4);
                        result23
                    }
                }
            }
            impl ToolsBuilder {
                #[allow(unused_unsafe, clippy::all)]
                /// Create a custom tool with the specified name, description, and parameters
                pub fn custom_tool(&self, name: &str, description: &str, parameters: &str) -> Tool {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 40]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 40]);
                        let vec0 = name;
                        let ptr0 = vec0.as_ptr().cast::<u8>();
                        let len0 = vec0.len();
                        let vec1 = description;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = parameters;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let ptr3 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/tools@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]tools-builder.custom-tool"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr0.cast_mut(),
                            len0,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr3,
                        );
                        let l4 = *ptr3.add(0).cast::<*mut u8>();
                        let l5 = *ptr3.add(4).cast::<usize>();
                        let len6 = l5;
                        let bytes6 = _rt::Vec::from_raw_parts(l4.cast(), len6, len6);
                        let l7 = *ptr3.add(8).cast::<*mut u8>();
                        let l8 = *ptr3.add(12).cast::<usize>();
                        let len9 = l8;
                        let bytes9 = _rt::Vec::from_raw_parts(l7.cast(), len9, len9);
                        let l10 = i32::from(*ptr3.add(16).cast::<u8>());
                        let l14 = i32::from(*ptr3.add(28).cast::<u8>());
                        super::super::super::wavs::agent::types::Tool {
                            tool_type: _rt::string_lift(bytes6),
                            function: super::super::super::wavs::agent::types::Function {
                                name: _rt::string_lift(bytes9),
                                description: match l10 {
                                    0 => None,
                                    1 => {
                                        let e = {
                                            let l11 = *ptr3.add(20).cast::<*mut u8>();
                                            let l12 = *ptr3.add(24).cast::<usize>();
                                            let len13 = l12;
                                            let bytes13 =
                                                _rt::Vec::from_raw_parts(l11.cast(), len13, len13);
                                            _rt::string_lift(bytes13)
                                        };
                                        Some(e)
                                    }
                                    _ => _rt::invalid_enum_discriminant(),
                                },
                                parameters: match l14 {
                                    0 => None,
                                    1 => {
                                        let e = {
                                            let l15 = *ptr3.add(32).cast::<*mut u8>();
                                            let l16 = *ptr3.add(36).cast::<usize>();
                                            let len17 = l16;
                                            let bytes17 =
                                                _rt::Vec::from_raw_parts(l15.cast(), len17, len17);
                                            _rt::string_lift(bytes17)
                                        };
                                        Some(e)
                                    }
                                    _ => _rt::invalid_enum_discriminant(),
                                },
                            },
                        }
                    }
                }
            }
            impl ToolsBuilder {
                #[allow(unused_unsafe, clippy::all)]
                /// Execute a tool call and return the result
                pub fn execute_tool_call(
                    &self,
                    tool_call: &ToolCall,
                    custom_handlers: Option<_rt::Vec<CustomToolHandler>>,
                ) -> Result<_rt::String, _rt::String> {
                    unsafe {
                        let mut cleanup_list = _rt::Vec::new();
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 12]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 12]);
                        let super::super::super::wavs::agent::types::ToolCall {
                            id: id0,
                            tool_type: tool_type0,
                            function: function0,
                        } = tool_call;
                        let vec1 = id0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = tool_type0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let super::super::super::wavs::agent::types::ToolCallFunction {
                            name: name3,
                            arguments: arguments3,
                        } = function0;
                        let vec4 = name3;
                        let ptr4 = vec4.as_ptr().cast::<u8>();
                        let len4 = vec4.len();
                        let vec5 = arguments3;
                        let ptr5 = vec5.as_ptr().cast::<u8>();
                        let len5 = vec5.len();
                        let (result7_0, result7_1, result7_2) = match &custom_handlers {
                            Some(e) => {
                                let vec6 = e;
                                let len6 = vec6.len();
                                let layout6 = _rt::alloc::Layout::from_size_align_unchecked(
                                    vec6.len() * 4,
                                    4,
                                );
                                let result6 = if layout6.size() != 0 {
                                    let ptr = _rt::alloc::alloc(layout6).cast::<u8>();
                                    if ptr.is_null() {
                                        _rt::alloc::handle_alloc_error(layout6);
                                    }
                                    ptr
                                } else {
                                    ::core::ptr::null_mut()
                                };
                                for (i, e) in vec6.into_iter().enumerate() {
                                    let base = result6.add(i * 4);
                                    {
                                        *base.add(0).cast::<i32>() = (e).take_handle() as i32;
                                    }
                                }
                                cleanup_list.extend_from_slice(&[(result6, layout6)]);
                                (1i32, result6, len6)
                            }
                            None => (0i32, ::core::ptr::null_mut(), 0usize),
                        };
                        let ptr8 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/tools@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]tools-builder.execute-tool-call"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr4.cast_mut(),
                            len4,
                            ptr5.cast_mut(),
                            len5,
                            result7_0,
                            result7_1,
                            result7_2,
                            ptr8,
                        );
                        let l9 = i32::from(*ptr8.add(0).cast::<u8>());
                        for (ptr, layout) in cleanup_list {
                            if layout.size() != 0 {
                                _rt::alloc::dealloc(ptr.cast(), layout);
                            }
                        }
                        match l9 {
                            0 => {
                                let e = {
                                    let l10 = *ptr8.add(4).cast::<*mut u8>();
                                    let l11 = *ptr8.add(8).cast::<usize>();
                                    let len12 = l11;
                                    let bytes12 =
                                        _rt::Vec::from_raw_parts(l10.cast(), len12, len12);
                                    _rt::string_lift(bytes12)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l13 = *ptr8.add(4).cast::<*mut u8>();
                                    let l14 = *ptr8.add(8).cast::<usize>();
                                    let len15 = l14;
                                    let bytes15 =
                                        _rt::Vec::from_raw_parts(l13.cast(), len15, len15);
                                    _rt::string_lift(bytes15)
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ToolsBuilder {
                #[allow(unused_unsafe, clippy::all)]
                /// Parse an ETH transaction from tool call
                pub fn parse_eth_transaction(
                    &self,
                    tool_call: &ToolCall,
                ) -> Result<_rt::String, _rt::String> {
                    unsafe {
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 12]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 12]);
                        let super::super::super::wavs::agent::types::ToolCall {
                            id: id0,
                            tool_type: tool_type0,
                            function: function0,
                        } = tool_call;
                        let vec1 = id0;
                        let ptr1 = vec1.as_ptr().cast::<u8>();
                        let len1 = vec1.len();
                        let vec2 = tool_type0;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        let super::super::super::wavs::agent::types::ToolCallFunction {
                            name: name3,
                            arguments: arguments3,
                        } = function0;
                        let vec4 = name3;
                        let ptr4 = vec4.as_ptr().cast::<u8>();
                        let len4 = vec4.len();
                        let vec5 = arguments3;
                        let ptr5 = vec5.as_ptr().cast::<u8>();
                        let len5 = vec5.len();
                        let ptr6 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/tools@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]tools-builder.parse-eth-transaction"]
                            fn wit_import(
                                _: i32,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                                _: usize,
                                _: *mut u8,
                            );
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(
                            _: i32,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                            _: usize,
                            _: *mut u8,
                        ) {
                            unreachable!()
                        }
                        wit_import(
                            (self).handle() as i32,
                            ptr1.cast_mut(),
                            len1,
                            ptr2.cast_mut(),
                            len2,
                            ptr4.cast_mut(),
                            len4,
                            ptr5.cast_mut(),
                            len5,
                            ptr6,
                        );
                        let l7 = i32::from(*ptr6.add(0).cast::<u8>());
                        match l7 {
                            0 => {
                                let e = {
                                    let l8 = *ptr6.add(4).cast::<*mut u8>();
                                    let l9 = *ptr6.add(8).cast::<usize>();
                                    let len10 = l9;
                                    let bytes10 = _rt::Vec::from_raw_parts(l8.cast(), len10, len10);
                                    _rt::string_lift(bytes10)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l11 = *ptr6.add(4).cast::<*mut u8>();
                                    let l12 = *ptr6.add(8).cast::<usize>();
                                    let len13 = l12;
                                    let bytes13 =
                                        _rt::Vec::from_raw_parts(l11.cast(), len13, len13);
                                    _rt::string_lift(bytes13)
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
            impl ToolsBuilder {
                #[allow(unused_unsafe, clippy::all)]
                /// Process tool calls and generate a response
                pub fn process_tool_calls(
                    &self,
                    client: &LlmClient,
                    initial_messages: &[Message],
                    response: &Message,
                    tool_calls: &[ToolCall],
                    custom_handlers: Option<_rt::Vec<CustomToolHandler>>,
                ) -> Result<_rt::String, _rt::String> {
                    unsafe {
                        let mut cleanup_list = _rt::Vec::new();
                        #[repr(align(4))]
                        struct RetArea([::core::mem::MaybeUninit<u8>; 144]);
                        let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 144]);
                        let ptr0 = ret_area.0.as_mut_ptr().cast::<u8>();
                        *ptr0.add(0).cast::<i32>() = (self).handle() as i32;
                        let super::super::super::wavs::agent::types::LlmClient {
                            model: model1,
                            config: config1,
                            api_url: api_url1,
                            api_key: api_key1,
                        } = client;
                        let vec2 = model1;
                        let ptr2 = vec2.as_ptr().cast::<u8>();
                        let len2 = vec2.len();
                        *ptr0.add(8).cast::<usize>() = len2;
                        *ptr0.add(4).cast::<*mut u8>() = ptr2.cast_mut();
                        let super::super::super::wavs::agent::types::LlmOptions {
                            temperature: temperature3,
                            top_p: top_p3,
                            seed: seed3,
                            max_tokens: max_tokens3,
                            context_window: context_window3,
                        } = config1;
                        *ptr0.add(12).cast::<f32>() = _rt::as_f32(temperature3);
                        *ptr0.add(16).cast::<f32>() = _rt::as_f32(top_p3);
                        *ptr0.add(20).cast::<i32>() = _rt::as_i32(seed3);
                        match max_tokens3 {
                            Some(e) => {
                                *ptr0.add(24).cast::<u8>() = (1i32) as u8;
                                *ptr0.add(28).cast::<i32>() = _rt::as_i32(e);
                            }
                            None => {
                                *ptr0.add(24).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        match context_window3 {
                            Some(e) => {
                                *ptr0.add(32).cast::<u8>() = (1i32) as u8;
                                *ptr0.add(36).cast::<i32>() = _rt::as_i32(e);
                            }
                            None => {
                                *ptr0.add(32).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        let vec4 = api_url1;
                        let ptr4 = vec4.as_ptr().cast::<u8>();
                        let len4 = vec4.len();
                        *ptr0.add(44).cast::<usize>() = len4;
                        *ptr0.add(40).cast::<*mut u8>() = ptr4.cast_mut();
                        match api_key1 {
                            Some(e) => {
                                *ptr0.add(48).cast::<u8>() = (1i32) as u8;
                                let vec5 = e;
                                let ptr5 = vec5.as_ptr().cast::<u8>();
                                let len5 = vec5.len();
                                *ptr0.add(56).cast::<usize>() = len5;
                                *ptr0.add(52).cast::<*mut u8>() = ptr5.cast_mut();
                            }
                            None => {
                                *ptr0.add(48).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        let vec18 = initial_messages;
                        let len18 = vec18.len();
                        let layout18 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec18.len() * 56, 4);
                        let result18 = if layout18.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout18).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout18);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec18.into_iter().enumerate() {
                            let base = result18.add(i * 56);
                            {
                                let super::super::super::wavs::agent::types::Message {
                                    role: role6,
                                    content: content6,
                                    tool_calls: tool_calls6,
                                    tool_call_id: tool_call_id6,
                                    name: name6,
                                } = e;
                                let vec7 = role6;
                                let ptr7 = vec7.as_ptr().cast::<u8>();
                                let len7 = vec7.len();
                                *base.add(4).cast::<usize>() = len7;
                                *base.add(0).cast::<*mut u8>() = ptr7.cast_mut();
                                match content6 {
                                    Some(e) => {
                                        *base.add(8).cast::<u8>() = (1i32) as u8;
                                        let vec8 = e;
                                        let ptr8 = vec8.as_ptr().cast::<u8>();
                                        let len8 = vec8.len();
                                        *base.add(16).cast::<usize>() = len8;
                                        *base.add(12).cast::<*mut u8>() = ptr8.cast_mut();
                                    }
                                    None => {
                                        *base.add(8).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match tool_calls6 {
                                    Some(e) => {
                                        *base.add(20).cast::<u8>() = (1i32) as u8;
                                        let vec15 = e;
                                        let len15 = vec15.len();
                                        let layout15 =
                                            _rt::alloc::Layout::from_size_align_unchecked(
                                                vec15.len() * 32,
                                                4,
                                            );
                                        let result15 = if layout15.size() != 0 {
                                            let ptr = _rt::alloc::alloc(layout15).cast::<u8>();
                                            if ptr.is_null() {
                                                _rt::alloc::handle_alloc_error(layout15);
                                            }
                                            ptr
                                        } else {
                                            ::core::ptr::null_mut()
                                        };
                                        for (i, e) in vec15.into_iter().enumerate() {
                                            let base = result15.add(i * 32);
                                            {
                                                let super::super::super::wavs::agent::types::ToolCall {
                                                    id: id9,
                                                    tool_type: tool_type9,
                                                    function: function9,
                                                } = e;
                                                let vec10 = id9;
                                                let ptr10 = vec10.as_ptr().cast::<u8>();
                                                let len10 = vec10.len();
                                                *base.add(4).cast::<usize>() = len10;
                                                *base.add(0).cast::<*mut u8>() = ptr10.cast_mut();
                                                let vec11 = tool_type9;
                                                let ptr11 = vec11.as_ptr().cast::<u8>();
                                                let len11 = vec11.len();
                                                *base.add(12).cast::<usize>() = len11;
                                                *base.add(8).cast::<*mut u8>() = ptr11.cast_mut();
                                                let super::super::super::wavs::agent::types::ToolCallFunction {
                                                    name: name12,
                                                    arguments: arguments12,
                                                } = function9;
                                                let vec13 = name12;
                                                let ptr13 = vec13.as_ptr().cast::<u8>();
                                                let len13 = vec13.len();
                                                *base.add(20).cast::<usize>() = len13;
                                                *base.add(16).cast::<*mut u8>() = ptr13.cast_mut();
                                                let vec14 = arguments12;
                                                let ptr14 = vec14.as_ptr().cast::<u8>();
                                                let len14 = vec14.len();
                                                *base.add(28).cast::<usize>() = len14;
                                                *base.add(24).cast::<*mut u8>() = ptr14.cast_mut();
                                            }
                                        }
                                        *base.add(28).cast::<usize>() = len15;
                                        *base.add(24).cast::<*mut u8>() = result15;
                                        cleanup_list.extend_from_slice(&[(result15, layout15)]);
                                    }
                                    None => {
                                        *base.add(20).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match tool_call_id6 {
                                    Some(e) => {
                                        *base.add(32).cast::<u8>() = (1i32) as u8;
                                        let vec16 = e;
                                        let ptr16 = vec16.as_ptr().cast::<u8>();
                                        let len16 = vec16.len();
                                        *base.add(40).cast::<usize>() = len16;
                                        *base.add(36).cast::<*mut u8>() = ptr16.cast_mut();
                                    }
                                    None => {
                                        *base.add(32).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                                match name6 {
                                    Some(e) => {
                                        *base.add(44).cast::<u8>() = (1i32) as u8;
                                        let vec17 = e;
                                        let ptr17 = vec17.as_ptr().cast::<u8>();
                                        let len17 = vec17.len();
                                        *base.add(52).cast::<usize>() = len17;
                                        *base.add(48).cast::<*mut u8>() = ptr17.cast_mut();
                                    }
                                    None => {
                                        *base.add(44).cast::<u8>() = (0i32) as u8;
                                    }
                                };
                            }
                        }
                        *ptr0.add(64).cast::<usize>() = len18;
                        *ptr0.add(60).cast::<*mut u8>() = result18;
                        let super::super::super::wavs::agent::types::Message {
                            role: role19,
                            content: content19,
                            tool_calls: tool_calls19,
                            tool_call_id: tool_call_id19,
                            name: name19,
                        } = response;
                        let vec20 = role19;
                        let ptr20 = vec20.as_ptr().cast::<u8>();
                        let len20 = vec20.len();
                        *ptr0.add(72).cast::<usize>() = len20;
                        *ptr0.add(68).cast::<*mut u8>() = ptr20.cast_mut();
                        match content19 {
                            Some(e) => {
                                *ptr0.add(76).cast::<u8>() = (1i32) as u8;
                                let vec21 = e;
                                let ptr21 = vec21.as_ptr().cast::<u8>();
                                let len21 = vec21.len();
                                *ptr0.add(84).cast::<usize>() = len21;
                                *ptr0.add(80).cast::<*mut u8>() = ptr21.cast_mut();
                            }
                            None => {
                                *ptr0.add(76).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        match tool_calls19 {
                            Some(e) => {
                                *ptr0.add(88).cast::<u8>() = (1i32) as u8;
                                let vec28 = e;
                                let len28 = vec28.len();
                                let layout28 = _rt::alloc::Layout::from_size_align_unchecked(
                                    vec28.len() * 32,
                                    4,
                                );
                                let result28 = if layout28.size() != 0 {
                                    let ptr = _rt::alloc::alloc(layout28).cast::<u8>();
                                    if ptr.is_null() {
                                        _rt::alloc::handle_alloc_error(layout28);
                                    }
                                    ptr
                                } else {
                                    ::core::ptr::null_mut()
                                };
                                for (i, e) in vec28.into_iter().enumerate() {
                                    let base = result28.add(i * 32);
                                    {
                                        let super::super::super::wavs::agent::types::ToolCall {
                                            id: id22,
                                            tool_type: tool_type22,
                                            function: function22,
                                        } = e;
                                        let vec23 = id22;
                                        let ptr23 = vec23.as_ptr().cast::<u8>();
                                        let len23 = vec23.len();
                                        *base.add(4).cast::<usize>() = len23;
                                        *base.add(0).cast::<*mut u8>() = ptr23.cast_mut();
                                        let vec24 = tool_type22;
                                        let ptr24 = vec24.as_ptr().cast::<u8>();
                                        let len24 = vec24.len();
                                        *base.add(12).cast::<usize>() = len24;
                                        *base.add(8).cast::<*mut u8>() = ptr24.cast_mut();
                                        let super::super::super::wavs::agent::types::ToolCallFunction {
                                            name: name25,
                                            arguments: arguments25,
                                        } = function22;
                                        let vec26 = name25;
                                        let ptr26 = vec26.as_ptr().cast::<u8>();
                                        let len26 = vec26.len();
                                        *base.add(20).cast::<usize>() = len26;
                                        *base.add(16).cast::<*mut u8>() = ptr26.cast_mut();
                                        let vec27 = arguments25;
                                        let ptr27 = vec27.as_ptr().cast::<u8>();
                                        let len27 = vec27.len();
                                        *base.add(28).cast::<usize>() = len27;
                                        *base.add(24).cast::<*mut u8>() = ptr27.cast_mut();
                                    }
                                }
                                *ptr0.add(96).cast::<usize>() = len28;
                                *ptr0.add(92).cast::<*mut u8>() = result28;
                                cleanup_list.extend_from_slice(&[(result28, layout28)]);
                            }
                            None => {
                                *ptr0.add(88).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        match tool_call_id19 {
                            Some(e) => {
                                *ptr0.add(100).cast::<u8>() = (1i32) as u8;
                                let vec29 = e;
                                let ptr29 = vec29.as_ptr().cast::<u8>();
                                let len29 = vec29.len();
                                *ptr0.add(108).cast::<usize>() = len29;
                                *ptr0.add(104).cast::<*mut u8>() = ptr29.cast_mut();
                            }
                            None => {
                                *ptr0.add(100).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        match name19 {
                            Some(e) => {
                                *ptr0.add(112).cast::<u8>() = (1i32) as u8;
                                let vec30 = e;
                                let ptr30 = vec30.as_ptr().cast::<u8>();
                                let len30 = vec30.len();
                                *ptr0.add(120).cast::<usize>() = len30;
                                *ptr0.add(116).cast::<*mut u8>() = ptr30.cast_mut();
                            }
                            None => {
                                *ptr0.add(112).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        let vec37 = tool_calls;
                        let len37 = vec37.len();
                        let layout37 =
                            _rt::alloc::Layout::from_size_align_unchecked(vec37.len() * 32, 4);
                        let result37 = if layout37.size() != 0 {
                            let ptr = _rt::alloc::alloc(layout37).cast::<u8>();
                            if ptr.is_null() {
                                _rt::alloc::handle_alloc_error(layout37);
                            }
                            ptr
                        } else {
                            ::core::ptr::null_mut()
                        };
                        for (i, e) in vec37.into_iter().enumerate() {
                            let base = result37.add(i * 32);
                            {
                                let super::super::super::wavs::agent::types::ToolCall {
                                    id: id31,
                                    tool_type: tool_type31,
                                    function: function31,
                                } = e;
                                let vec32 = id31;
                                let ptr32 = vec32.as_ptr().cast::<u8>();
                                let len32 = vec32.len();
                                *base.add(4).cast::<usize>() = len32;
                                *base.add(0).cast::<*mut u8>() = ptr32.cast_mut();
                                let vec33 = tool_type31;
                                let ptr33 = vec33.as_ptr().cast::<u8>();
                                let len33 = vec33.len();
                                *base.add(12).cast::<usize>() = len33;
                                *base.add(8).cast::<*mut u8>() = ptr33.cast_mut();
                                let super::super::super::wavs::agent::types::ToolCallFunction {
                                    name: name34,
                                    arguments: arguments34,
                                } = function31;
                                let vec35 = name34;
                                let ptr35 = vec35.as_ptr().cast::<u8>();
                                let len35 = vec35.len();
                                *base.add(20).cast::<usize>() = len35;
                                *base.add(16).cast::<*mut u8>() = ptr35.cast_mut();
                                let vec36 = arguments34;
                                let ptr36 = vec36.as_ptr().cast::<u8>();
                                let len36 = vec36.len();
                                *base.add(28).cast::<usize>() = len36;
                                *base.add(24).cast::<*mut u8>() = ptr36.cast_mut();
                            }
                        }
                        *ptr0.add(128).cast::<usize>() = len37;
                        *ptr0.add(124).cast::<*mut u8>() = result37;
                        match &custom_handlers {
                            Some(e) => {
                                *ptr0.add(132).cast::<u8>() = (1i32) as u8;
                                let vec38 = e;
                                let len38 = vec38.len();
                                let layout38 = _rt::alloc::Layout::from_size_align_unchecked(
                                    vec38.len() * 4,
                                    4,
                                );
                                let result38 = if layout38.size() != 0 {
                                    let ptr = _rt::alloc::alloc(layout38).cast::<u8>();
                                    if ptr.is_null() {
                                        _rt::alloc::handle_alloc_error(layout38);
                                    }
                                    ptr
                                } else {
                                    ::core::ptr::null_mut()
                                };
                                for (i, e) in vec38.into_iter().enumerate() {
                                    let base = result38.add(i * 4);
                                    {
                                        *base.add(0).cast::<i32>() = (e).take_handle() as i32;
                                    }
                                }
                                *ptr0.add(140).cast::<usize>() = len38;
                                *ptr0.add(136).cast::<*mut u8>() = result38;
                                cleanup_list.extend_from_slice(&[(result38, layout38)]);
                            }
                            None => {
                                *ptr0.add(132).cast::<u8>() = (0i32) as u8;
                            }
                        };
                        let ptr39 = ret_area.0.as_mut_ptr().cast::<u8>();
                        #[cfg(target_arch = "wasm32")]
                        #[link(wasm_import_module = "wavs:agent/tools@0.0.1")]
                        extern "C" {
                            #[link_name = "[method]tools-builder.process-tool-calls"]
                            fn wit_import(_: *mut u8, _: *mut u8);
                        }
                        #[cfg(not(target_arch = "wasm32"))]
                        fn wit_import(_: *mut u8, _: *mut u8) {
                            unreachable!()
                        }
                        wit_import(ptr0, ptr39);
                        let l40 = i32::from(*ptr39.add(0).cast::<u8>());
                        if layout18.size() != 0 {
                            _rt::alloc::dealloc(result18.cast(), layout18);
                        }
                        if layout37.size() != 0 {
                            _rt::alloc::dealloc(result37.cast(), layout37);
                        }
                        for (ptr, layout) in cleanup_list {
                            if layout.size() != 0 {
                                _rt::alloc::dealloc(ptr.cast(), layout);
                            }
                        }
                        match l40 {
                            0 => {
                                let e = {
                                    let l41 = *ptr39.add(4).cast::<*mut u8>();
                                    let l42 = *ptr39.add(8).cast::<usize>();
                                    let len43 = l42;
                                    let bytes43 =
                                        _rt::Vec::from_raw_parts(l41.cast(), len43, len43);
                                    _rt::string_lift(bytes43)
                                };
                                Ok(e)
                            }
                            1 => {
                                let e = {
                                    let l44 = *ptr39.add(4).cast::<*mut u8>();
                                    let l45 = *ptr39.add(8).cast::<usize>();
                                    let len46 = l45;
                                    let bytes46 =
                                        _rt::Vec::from_raw_parts(l44.cast(), len46, len46);
                                    _rt::string_lift(bytes46)
                                };
                                Err(e)
                            }
                            _ => _rt::invalid_enum_discriminant(),
                        }
                    }
                }
            }
        }
    }
    #[allow(dead_code)]
    pub mod worker {
        #[allow(dead_code, clippy::all)]
        pub mod layer_types {
            #[used]
            #[doc(hidden)]
            static __FORCE_SECTION_REF: fn() =
                super::super::super::__link_custom_section_describing_imports;
            use super::super::super::_rt;
            #[repr(C)]
            #[derive(Clone, Copy)]
            pub struct Timestamp {
                pub nanos: u64,
            }
            impl ::core::fmt::Debug for Timestamp {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("Timestamp").field("nanos", &self.nanos).finish()
                }
            }
            #[derive(Clone)]
            pub struct CosmosAddress {
                pub bech32_addr: _rt::String,
                /// prefix is the first part of the bech32 address
                pub prefix_len: u32,
            }
            impl ::core::fmt::Debug for CosmosAddress {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("CosmosAddress")
                        .field("bech32-addr", &self.bech32_addr)
                        .field("prefix-len", &self.prefix_len)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct CosmosEvent {
                pub ty: _rt::String,
                pub attributes: _rt::Vec<(_rt::String, _rt::String)>,
            }
            impl ::core::fmt::Debug for CosmosEvent {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("CosmosEvent")
                        .field("ty", &self.ty)
                        .field("attributes", &self.attributes)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct CosmosChainConfig {
                pub chain_id: _rt::String,
                pub rpc_endpoint: Option<_rt::String>,
                pub grpc_endpoint: Option<_rt::String>,
                pub grpc_web_endpoint: Option<_rt::String>,
                pub gas_price: f32,
                pub gas_denom: _rt::String,
                pub bech32_prefix: _rt::String,
            }
            impl ::core::fmt::Debug for CosmosChainConfig {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("CosmosChainConfig")
                        .field("chain-id", &self.chain_id)
                        .field("rpc-endpoint", &self.rpc_endpoint)
                        .field("grpc-endpoint", &self.grpc_endpoint)
                        .field("grpc-web-endpoint", &self.grpc_web_endpoint)
                        .field("gas-price", &self.gas_price)
                        .field("gas-denom", &self.gas_denom)
                        .field("bech32-prefix", &self.bech32_prefix)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct EvmAddress {
                pub raw_bytes: _rt::Vec<u8>,
            }
            impl ::core::fmt::Debug for EvmAddress {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("EvmAddress").field("raw-bytes", &self.raw_bytes).finish()
                }
            }
            #[derive(Clone)]
            pub struct EvmEventLogData {
                /// the raw log topics that can be decoded into an event
                pub topics: _rt::Vec<_rt::Vec<u8>>,
                /// the raw log data that can be decoded into an event
                pub data: _rt::Vec<u8>,
            }
            impl ::core::fmt::Debug for EvmEventLogData {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("EvmEventLogData")
                        .field("topics", &self.topics)
                        .field("data", &self.data)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct EvmChainConfig {
                pub chain_id: _rt::String,
                pub ws_endpoint: Option<_rt::String>,
                pub http_endpoint: Option<_rt::String>,
            }
            impl ::core::fmt::Debug for EvmChainConfig {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("EvmChainConfig")
                        .field("chain-id", &self.chain_id)
                        .field("ws-endpoint", &self.ws_endpoint)
                        .field("http-endpoint", &self.http_endpoint)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct TriggerSourceEvmContractEvent {
                pub address: EvmAddress,
                pub chain_name: _rt::String,
                pub event_hash: _rt::Vec<u8>,
            }
            impl ::core::fmt::Debug for TriggerSourceEvmContractEvent {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("TriggerSourceEvmContractEvent")
                        .field("address", &self.address)
                        .field("chain-name", &self.chain_name)
                        .field("event-hash", &self.event_hash)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct TriggerSourceCosmosContractEvent {
                pub address: CosmosAddress,
                pub chain_name: _rt::String,
                pub event_type: _rt::String,
            }
            impl ::core::fmt::Debug for TriggerSourceCosmosContractEvent {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("TriggerSourceCosmosContractEvent")
                        .field("address", &self.address)
                        .field("chain-name", &self.chain_name)
                        .field("event-type", &self.event_type)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct BlockIntervalSource {
                pub chain_name: _rt::String,
                pub n_blocks: u32,
                pub start_block: Option<u64>,
                pub end_block: Option<u64>,
            }
            impl ::core::fmt::Debug for BlockIntervalSource {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("BlockIntervalSource")
                        .field("chain-name", &self.chain_name)
                        .field("n-blocks", &self.n_blocks)
                        .field("start-block", &self.start_block)
                        .field("end-block", &self.end_block)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct TriggerSourceCron {
                pub schedule: _rt::String,
                pub start_time: Option<Timestamp>,
                pub end_time: Option<Timestamp>,
            }
            impl ::core::fmt::Debug for TriggerSourceCron {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("TriggerSourceCron")
                        .field("schedule", &self.schedule)
                        .field("start-time", &self.start_time)
                        .field("end-time", &self.end_time)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub enum TriggerSource {
                EvmContractEvent(TriggerSourceEvmContractEvent),
                CosmosContractEvent(TriggerSourceCosmosContractEvent),
                BlockInterval(BlockIntervalSource),
                Cron(TriggerSourceCron),
                Manual,
            }
            impl ::core::fmt::Debug for TriggerSource {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    match self {
                        TriggerSource::EvmContractEvent(e) => {
                            f.debug_tuple("TriggerSource::EvmContractEvent").field(e).finish()
                        }
                        TriggerSource::CosmosContractEvent(e) => {
                            f.debug_tuple("TriggerSource::CosmosContractEvent").field(e).finish()
                        }
                        TriggerSource::BlockInterval(e) => {
                            f.debug_tuple("TriggerSource::BlockInterval").field(e).finish()
                        }
                        TriggerSource::Cron(e) => {
                            f.debug_tuple("TriggerSource::Cron").field(e).finish()
                        }
                        TriggerSource::Manual => f.debug_tuple("TriggerSource::Manual").finish(),
                    }
                }
            }
            #[derive(Clone)]
            pub struct TriggerConfig {
                pub service_id: _rt::String,
                pub workflow_id: _rt::String,
                pub trigger_source: TriggerSource,
            }
            impl ::core::fmt::Debug for TriggerConfig {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("TriggerConfig")
                        .field("service-id", &self.service_id)
                        .field("workflow-id", &self.workflow_id)
                        .field("trigger-source", &self.trigger_source)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct TriggerDataEvmContractEvent {
                pub contract_address: EvmAddress,
                pub chain_name: _rt::String,
                pub log: EvmEventLogData,
                pub block_height: u64,
            }
            impl ::core::fmt::Debug for TriggerDataEvmContractEvent {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("TriggerDataEvmContractEvent")
                        .field("contract-address", &self.contract_address)
                        .field("chain-name", &self.chain_name)
                        .field("log", &self.log)
                        .field("block-height", &self.block_height)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct TriggerDataCosmosContractEvent {
                pub contract_address: CosmosAddress,
                pub chain_name: _rt::String,
                pub event: CosmosEvent,
                pub block_height: u64,
            }
            impl ::core::fmt::Debug for TriggerDataCosmosContractEvent {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("TriggerDataCosmosContractEvent")
                        .field("contract-address", &self.contract_address)
                        .field("chain-name", &self.chain_name)
                        .field("event", &self.event)
                        .field("block-height", &self.block_height)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct BlockIntervalData {
                pub chain_name: _rt::String,
                pub block_height: u64,
            }
            impl ::core::fmt::Debug for BlockIntervalData {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("BlockIntervalData")
                        .field("chain-name", &self.chain_name)
                        .field("block-height", &self.block_height)
                        .finish()
                }
            }
            #[repr(C)]
            #[derive(Clone, Copy)]
            pub struct TriggerDataCron {
                pub trigger_time: Timestamp,
            }
            impl ::core::fmt::Debug for TriggerDataCron {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("TriggerDataCron")
                        .field("trigger-time", &self.trigger_time)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub enum TriggerData {
                EvmContractEvent(TriggerDataEvmContractEvent),
                CosmosContractEvent(TriggerDataCosmosContractEvent),
                BlockInterval(BlockIntervalData),
                Cron(TriggerDataCron),
                Raw(_rt::Vec<u8>),
            }
            impl ::core::fmt::Debug for TriggerData {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    match self {
                        TriggerData::EvmContractEvent(e) => {
                            f.debug_tuple("TriggerData::EvmContractEvent").field(e).finish()
                        }
                        TriggerData::CosmosContractEvent(e) => {
                            f.debug_tuple("TriggerData::CosmosContractEvent").field(e).finish()
                        }
                        TriggerData::BlockInterval(e) => {
                            f.debug_tuple("TriggerData::BlockInterval").field(e).finish()
                        }
                        TriggerData::Cron(e) => {
                            f.debug_tuple("TriggerData::Cron").field(e).finish()
                        }
                        TriggerData::Raw(e) => f.debug_tuple("TriggerData::Raw").field(e).finish(),
                    }
                }
            }
            #[derive(Clone)]
            pub struct TriggerAction {
                pub config: TriggerConfig,
                pub data: TriggerData,
            }
            impl ::core::fmt::Debug for TriggerAction {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("TriggerAction")
                        .field("config", &self.config)
                        .field("data", &self.data)
                        .finish()
                }
            }
            #[derive(Clone)]
            pub struct WasmResponse {
                pub payload: _rt::Vec<u8>,
                pub ordering: Option<u64>,
            }
            impl ::core::fmt::Debug for WasmResponse {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    f.debug_struct("WasmResponse")
                        .field("payload", &self.payload)
                        .field("ordering", &self.ordering)
                        .finish()
                }
            }
            #[derive(Clone, Copy)]
            pub enum LogLevel {
                Error,
                Warn,
                Info,
                Debug,
                Trace,
            }
            impl ::core::fmt::Debug for LogLevel {
                fn fmt(&self, f: &mut ::core::fmt::Formatter<'_>) -> ::core::fmt::Result {
                    match self {
                        LogLevel::Error => f.debug_tuple("LogLevel::Error").finish(),
                        LogLevel::Warn => f.debug_tuple("LogLevel::Warn").finish(),
                        LogLevel::Info => f.debug_tuple("LogLevel::Info").finish(),
                        LogLevel::Debug => f.debug_tuple("LogLevel::Debug").finish(),
                        LogLevel::Trace => f.debug_tuple("LogLevel::Trace").finish(),
                    }
                }
            }
        }
    }
}
#[allow(dead_code, clippy::all)]
pub mod host {
    #[used]
    #[doc(hidden)]
    static __FORCE_SECTION_REF: fn() = super::__link_custom_section_describing_imports;
    use super::_rt;
    pub type EvmChainConfig = super::wavs::worker::layer_types::EvmChainConfig;
    pub type CosmosChainConfig = super::wavs::worker::layer_types::CosmosChainConfig;
    pub type LogLevel = super::wavs::worker::layer_types::LogLevel;
    #[allow(unused_unsafe, clippy::all)]
    pub fn get_eth_chain_config(chain_name: &str) -> Option<EvmChainConfig> {
        unsafe {
            #[repr(align(4))]
            struct RetArea([::core::mem::MaybeUninit<u8>; 36]);
            let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 36]);
            let vec0 = chain_name;
            let ptr0 = vec0.as_ptr().cast::<u8>();
            let len0 = vec0.len();
            let ptr1 = ret_area.0.as_mut_ptr().cast::<u8>();
            #[cfg(target_arch = "wasm32")]
            #[link(wasm_import_module = "host")]
            extern "C" {
                #[link_name = "get-eth-chain-config"]
                fn wit_import(_: *mut u8, _: usize, _: *mut u8);
            }
            #[cfg(not(target_arch = "wasm32"))]
            fn wit_import(_: *mut u8, _: usize, _: *mut u8) {
                unreachable!()
            }
            wit_import(ptr0.cast_mut(), len0, ptr1);
            let l2 = i32::from(*ptr1.add(0).cast::<u8>());
            match l2 {
                0 => None,
                1 => {
                    let e = {
                        let l3 = *ptr1.add(4).cast::<*mut u8>();
                        let l4 = *ptr1.add(8).cast::<usize>();
                        let len5 = l4;
                        let bytes5 = _rt::Vec::from_raw_parts(l3.cast(), len5, len5);
                        let l6 = i32::from(*ptr1.add(12).cast::<u8>());
                        let l10 = i32::from(*ptr1.add(24).cast::<u8>());
                        super::wavs::worker::layer_types::EvmChainConfig {
                            chain_id: _rt::string_lift(bytes5),
                            ws_endpoint: match l6 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l7 = *ptr1.add(16).cast::<*mut u8>();
                                        let l8 = *ptr1.add(20).cast::<usize>();
                                        let len9 = l8;
                                        let bytes9 =
                                            _rt::Vec::from_raw_parts(l7.cast(), len9, len9);
                                        _rt::string_lift(bytes9)
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            http_endpoint: match l10 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l11 = *ptr1.add(28).cast::<*mut u8>();
                                        let l12 = *ptr1.add(32).cast::<usize>();
                                        let len13 = l12;
                                        let bytes13 =
                                            _rt::Vec::from_raw_parts(l11.cast(), len13, len13);
                                        _rt::string_lift(bytes13)
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                        }
                    };
                    Some(e)
                }
                _ => _rt::invalid_enum_discriminant(),
            }
        }
    }
    #[allow(unused_unsafe, clippy::all)]
    pub fn get_cosmos_chain_config(chain_name: &str) -> Option<CosmosChainConfig> {
        unsafe {
            #[repr(align(4))]
            struct RetArea([::core::mem::MaybeUninit<u8>; 68]);
            let mut ret_area = RetArea([::core::mem::MaybeUninit::uninit(); 68]);
            let vec0 = chain_name;
            let ptr0 = vec0.as_ptr().cast::<u8>();
            let len0 = vec0.len();
            let ptr1 = ret_area.0.as_mut_ptr().cast::<u8>();
            #[cfg(target_arch = "wasm32")]
            #[link(wasm_import_module = "host")]
            extern "C" {
                #[link_name = "get-cosmos-chain-config"]
                fn wit_import(_: *mut u8, _: usize, _: *mut u8);
            }
            #[cfg(not(target_arch = "wasm32"))]
            fn wit_import(_: *mut u8, _: usize, _: *mut u8) {
                unreachable!()
            }
            wit_import(ptr0.cast_mut(), len0, ptr1);
            let l2 = i32::from(*ptr1.add(0).cast::<u8>());
            match l2 {
                0 => None,
                1 => {
                    let e = {
                        let l3 = *ptr1.add(4).cast::<*mut u8>();
                        let l4 = *ptr1.add(8).cast::<usize>();
                        let len5 = l4;
                        let bytes5 = _rt::Vec::from_raw_parts(l3.cast(), len5, len5);
                        let l6 = i32::from(*ptr1.add(12).cast::<u8>());
                        let l10 = i32::from(*ptr1.add(24).cast::<u8>());
                        let l14 = i32::from(*ptr1.add(36).cast::<u8>());
                        let l18 = *ptr1.add(48).cast::<f32>();
                        let l19 = *ptr1.add(52).cast::<*mut u8>();
                        let l20 = *ptr1.add(56).cast::<usize>();
                        let len21 = l20;
                        let bytes21 = _rt::Vec::from_raw_parts(l19.cast(), len21, len21);
                        let l22 = *ptr1.add(60).cast::<*mut u8>();
                        let l23 = *ptr1.add(64).cast::<usize>();
                        let len24 = l23;
                        let bytes24 = _rt::Vec::from_raw_parts(l22.cast(), len24, len24);
                        super::wavs::worker::layer_types::CosmosChainConfig {
                            chain_id: _rt::string_lift(bytes5),
                            rpc_endpoint: match l6 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l7 = *ptr1.add(16).cast::<*mut u8>();
                                        let l8 = *ptr1.add(20).cast::<usize>();
                                        let len9 = l8;
                                        let bytes9 =
                                            _rt::Vec::from_raw_parts(l7.cast(), len9, len9);
                                        _rt::string_lift(bytes9)
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            grpc_endpoint: match l10 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l11 = *ptr1.add(28).cast::<*mut u8>();
                                        let l12 = *ptr1.add(32).cast::<usize>();
                                        let len13 = l12;
                                        let bytes13 =
                                            _rt::Vec::from_raw_parts(l11.cast(), len13, len13);
                                        _rt::string_lift(bytes13)
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            grpc_web_endpoint: match l14 {
                                0 => None,
                                1 => {
                                    let e = {
                                        let l15 = *ptr1.add(40).cast::<*mut u8>();
                                        let l16 = *ptr1.add(44).cast::<usize>();
                                        let len17 = l16;
                                        let bytes17 =
                                            _rt::Vec::from_raw_parts(l15.cast(), len17, len17);
                                        _rt::string_lift(bytes17)
                                    };
                                    Some(e)
                                }
                                _ => _rt::invalid_enum_discriminant(),
                            },
                            gas_price: l18,
                            gas_denom: _rt::string_lift(bytes21),
                            bech32_prefix: _rt::string_lift(bytes24),
                        }
                    };
                    Some(e)
                }
                _ => _rt::invalid_enum_discriminant(),
            }
        }
    }
    #[allow(unused_unsafe, clippy::all)]
    pub fn log(level: LogLevel, message: &str) {
        unsafe {
            use super::wavs::worker::layer_types::LogLevel as V0;
            let result1 = match level {
                V0::Error => 0i32,
                V0::Warn => 1i32,
                V0::Info => 2i32,
                V0::Debug => 3i32,
                V0::Trace => 4i32,
            };
            let vec2 = message;
            let ptr2 = vec2.as_ptr().cast::<u8>();
            let len2 = vec2.len();
            #[cfg(target_arch = "wasm32")]
            #[link(wasm_import_module = "host")]
            extern "C" {
                #[link_name = "log"]
                fn wit_import(_: i32, _: *mut u8, _: usize);
            }
            #[cfg(not(target_arch = "wasm32"))]
            fn wit_import(_: i32, _: *mut u8, _: usize) {
                unreachable!()
            }
            wit_import(result1, ptr2.cast_mut(), len2);
        }
    }
}
mod _rt {
    pub use alloc_crate::string::String;
    pub use alloc_crate::vec::Vec;
    use core::fmt;
    use core::marker;
    use core::sync::atomic::{AtomicU32, Ordering::Relaxed};
    /// A type which represents a component model resource, either imported or
    /// exported into this component.
    ///
    /// This is a low-level wrapper which handles the lifetime of the resource
    /// (namely this has a destructor). The `T` provided defines the component model
    /// intrinsics that this wrapper uses.
    ///
    /// One of the chief purposes of this type is to provide `Deref` implementations
    /// to access the underlying data when it is owned.
    ///
    /// This type is primarily used in generated code for exported and imported
    /// resources.
    #[repr(transparent)]
    pub struct Resource<T: WasmResource> {
        handle: AtomicU32,
        _marker: marker::PhantomData<T>,
    }
    /// A trait which all wasm resources implement, namely providing the ability to
    /// drop a resource.
    ///
    /// This generally is implemented by generated code, not user-facing code.
    #[allow(clippy::missing_safety_doc)]
    pub unsafe trait WasmResource {
        /// Invokes the `[resource-drop]...` intrinsic.
        unsafe fn drop(handle: u32);
    }
    impl<T: WasmResource> Resource<T> {
        #[doc(hidden)]
        pub unsafe fn from_handle(handle: u32) -> Self {
            debug_assert!(handle != u32::MAX);
            Self { handle: AtomicU32::new(handle), _marker: marker::PhantomData }
        }
        /// Takes ownership of the handle owned by `resource`.
        ///
        /// Note that this ideally would be `into_handle` taking `Resource<T>` by
        /// ownership. The code generator does not enable that in all situations,
        /// unfortunately, so this is provided instead.
        ///
        /// Also note that `take_handle` is in theory only ever called on values
        /// owned by a generated function. For example a generated function might
        /// take `Resource<T>` as an argument but then call `take_handle` on a
        /// reference to that argument. In that sense the dynamic nature of
        /// `take_handle` should only be exposed internally to generated code, not
        /// to user code.
        #[doc(hidden)]
        pub fn take_handle(resource: &Resource<T>) -> u32 {
            resource.handle.swap(u32::MAX, Relaxed)
        }
        #[doc(hidden)]
        pub fn handle(resource: &Resource<T>) -> u32 {
            resource.handle.load(Relaxed)
        }
    }
    impl<T: WasmResource> fmt::Debug for Resource<T> {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.debug_struct("Resource").field("handle", &self.handle).finish()
        }
    }
    impl<T: WasmResource> Drop for Resource<T> {
        fn drop(&mut self) {
            unsafe {
                match self.handle.load(Relaxed) {
                    u32::MAX => {}
                    other => T::drop(other),
                }
            }
        }
    }
    pub unsafe fn bool_lift(val: u8) -> bool {
        if cfg!(debug_assertions) {
            match val {
                0 => false,
                1 => true,
                _ => panic!("invalid bool discriminant"),
            }
        } else {
            val != 0
        }
    }
    pub unsafe fn string_lift(bytes: Vec<u8>) -> String {
        if cfg!(debug_assertions) {
            String::from_utf8(bytes).unwrap()
        } else {
            String::from_utf8_unchecked(bytes)
        }
    }
    pub unsafe fn invalid_enum_discriminant<T>() -> T {
        if cfg!(debug_assertions) {
            panic!("invalid enum discriminant")
        } else {
            core::hint::unreachable_unchecked()
        }
    }
    pub fn as_f32<T: AsF32>(t: T) -> f32 {
        t.as_f32()
    }
    pub trait AsF32 {
        fn as_f32(self) -> f32;
    }
    impl<'a, T: Copy + AsF32> AsF32 for &'a T {
        fn as_f32(self) -> f32 {
            (*self).as_f32()
        }
    }
    impl AsF32 for f32 {
        #[inline]
        fn as_f32(self) -> f32 {
            self as f32
        }
    }
    pub fn as_i32<T: AsI32>(t: T) -> i32 {
        t.as_i32()
    }
    pub trait AsI32 {
        fn as_i32(self) -> i32;
    }
    impl<'a, T: Copy + AsI32> AsI32 for &'a T {
        fn as_i32(self) -> i32 {
            (*self).as_i32()
        }
    }
    impl AsI32 for i32 {
        #[inline]
        fn as_i32(self) -> i32 {
            self as i32
        }
    }
    impl AsI32 for u32 {
        #[inline]
        fn as_i32(self) -> i32 {
            self as i32
        }
    }
    impl AsI32 for i16 {
        #[inline]
        fn as_i32(self) -> i32 {
            self as i32
        }
    }
    impl AsI32 for u16 {
        #[inline]
        fn as_i32(self) -> i32 {
            self as i32
        }
    }
    impl AsI32 for i8 {
        #[inline]
        fn as_i32(self) -> i32 {
            self as i32
        }
    }
    impl AsI32 for u8 {
        #[inline]
        fn as_i32(self) -> i32 {
            self as i32
        }
    }
    impl AsI32 for char {
        #[inline]
        fn as_i32(self) -> i32 {
            self as i32
        }
    }
    impl AsI32 for usize {
        #[inline]
        fn as_i32(self) -> i32 {
            self as i32
        }
    }
    pub use alloc_crate::alloc;
    pub unsafe fn cabi_dealloc(ptr: *mut u8, size: usize, align: usize) {
        if size == 0 {
            return;
        }
        let layout = alloc::Layout::from_size_align_unchecked(size, align);
        alloc::dealloc(ptr, layout);
    }
    #[cfg(target_arch = "wasm32")]
    pub fn run_ctors_once() {
        wit_bindgen_rt::run_ctors_once();
    }
    pub fn as_i64<T: AsI64>(t: T) -> i64 {
        t.as_i64()
    }
    pub trait AsI64 {
        fn as_i64(self) -> i64;
    }
    impl<'a, T: Copy + AsI64> AsI64 for &'a T {
        fn as_i64(self) -> i64 {
            (*self).as_i64()
        }
    }
    impl AsI64 for i64 {
        #[inline]
        fn as_i64(self) -> i64 {
            self as i64
        }
    }
    impl AsI64 for u64 {
        #[inline]
        fn as_i64(self) -> i64 {
            self as i64
        }
    }
    extern crate alloc as alloc_crate;
}
/// Generates `#[no_mangle]` functions to export the specified type as the
/// root implementation of all generated traits.
///
/// For more information see the documentation of `wit_bindgen::generate!`.
///
/// ```rust
/// # macro_rules! export{ ($($t:tt)*) => (); }
/// # trait Guest {}
/// struct MyType;
///
/// impl Guest for MyType {
///     // ...
/// }
///
/// export!(MyType);
/// ```
#[allow(unused_macros)]
#[doc(hidden)]
macro_rules! __export_layer_trigger_world_impl {
    ($ty:ident) => {
        self::export!($ty with_types_in self);
    };
    ($ty:ident with_types_in $($path_to_types_root:tt)*) => {
        $($path_to_types_root)*:: __export_world_layer_trigger_world_cabi!($ty
        with_types_in $($path_to_types_root)*);
    };
}
#[doc(inline)]
pub(crate) use __export_layer_trigger_world_impl as export;
#[cfg(target_arch = "wasm32")]
#[link_section = "component-type:wit-bindgen:0.35.0:component:dao-agent:layer-trigger-world:encoded world"]
#[doc(hidden)]
pub static __WIT_BINDGEN_COMPONENT_TYPE: [u8; 6544] = *b"\
\0asm\x0d\0\x01\0\0\x19\x16wit-component-encoding\x04\0\x07\x862\x01A\x02\x01A)\x01\
B1\x01r\x01\x05nanosw\x04\0\x09timestamp\x03\0\0\x01r\x02\x0bbech32-addrs\x0apre\
fix-leny\x04\0\x0ecosmos-address\x03\0\x02\x01o\x02ss\x01p\x04\x01r\x02\x02tys\x0a\
attributes\x05\x04\0\x0ccosmos-event\x03\0\x06\x01ks\x01r\x07\x08chain-ids\x0crp\
c-endpoint\x08\x0dgrpc-endpoint\x08\x11grpc-web-endpoint\x08\x09gas-pricev\x09ga\
s-denoms\x0dbech32-prefixs\x04\0\x13cosmos-chain-config\x03\0\x09\x01p}\x01r\x01\
\x09raw-bytes\x0b\x04\0\x0bevm-address\x03\0\x0c\x01p\x0b\x01r\x02\x06topics\x0e\
\x04data\x0b\x04\0\x12evm-event-log-data\x03\0\x0f\x01r\x03\x08chain-ids\x0bws-e\
ndpoint\x08\x0dhttp-endpoint\x08\x04\0\x10evm-chain-config\x03\0\x11\x01r\x03\x07\
address\x0d\x0achain-names\x0aevent-hash\x0b\x04\0!trigger-source-evm-contract-e\
vent\x03\0\x13\x01r\x03\x07address\x03\x0achain-names\x0aevent-types\x04\0$trigg\
er-source-cosmos-contract-event\x03\0\x15\x01kw\x01r\x04\x0achain-names\x08n-blo\
cksy\x0bstart-block\x17\x09end-block\x17\x04\0\x15block-interval-source\x03\0\x18\
\x01k\x01\x01r\x03\x08schedules\x0astart-time\x1a\x08end-time\x1a\x04\0\x13trigg\
er-source-cron\x03\0\x1b\x01q\x05\x12evm-contract-event\x01\x14\0\x15cosmos-cont\
ract-event\x01\x16\0\x0eblock-interval\x01\x19\0\x04cron\x01\x1c\0\x06manual\0\0\
\x04\0\x0etrigger-source\x03\0\x1d\x01r\x03\x0aservice-ids\x0bworkflow-ids\x0etr\
igger-source\x1e\x04\0\x0etrigger-config\x03\0\x1f\x01r\x04\x10contract-address\x0d\
\x0achain-names\x03log\x10\x0cblock-heightw\x04\0\x1ftrigger-data-evm-contract-e\
vent\x03\0!\x01r\x04\x10contract-address\x03\x0achain-names\x05event\x07\x0cbloc\
k-heightw\x04\0\"trigger-data-cosmos-contract-event\x03\0#\x01r\x02\x0achain-nam\
es\x0cblock-heightw\x04\0\x13block-interval-data\x03\0%\x01r\x01\x0ctrigger-time\
\x01\x04\0\x11trigger-data-cron\x03\0'\x01q\x05\x12evm-contract-event\x01\"\0\x15\
cosmos-contract-event\x01$\0\x0eblock-interval\x01&\0\x04cron\x01(\0\x03raw\x01\x0b\
\0\x04\0\x0ctrigger-data\x03\0)\x01r\x02\x06config\x20\x04data*\x04\0\x0etrigger\
-action\x03\0+\x01r\x02\x07payload\x0b\x08ordering\x17\x04\0\x0dwasm-response\x03\
\0-\x01q\x05\x05error\0\0\x04warn\0\0\x04info\0\0\x05debug\0\0\x05trace\0\0\x04\0\
\x09log-level\x03\0/\x03\0\x1dwavs:worker/layer-types@0.4.0\x05\0\x02\x03\0\0\x0e\
trigger-action\x03\0\x0etrigger-action\x03\0\x01\x02\x03\0\0\x0dwasm-response\x03\
\0\x0dwasm-response\x03\0\x03\x01B\x02\x01q\x0d\x03api\x01s\0\x04http\x01s\0\x10\
external-service\x01s\0\x06config\x01s\0\x08contract\x01s\0\x0dconfiguration\x01\
s\0\x0fcontext-loading\x01s\0\x12context-validation\x01s\0\x03llm\x01s\0\x02io\x01\
s\0\x0btransaction\x01s\0\x04utf8\x01s\0\x05other\x01s\0\x04\0\x0bagent-error\x03\
\0\0\x03\0\x17wavs:agent/errors@0.0.1\x05\x05\x01B+\x01ks\x01r\x03\x04name\0\x0b\
description\0\x0eparameter-type\0\x04\0\x12function-parameter\x03\0\x01\x01r\x03\
\x04names\x0bdescription\0\x0aparameters\0\x04\0\x08function\x03\0\x03\x01r\x02\x09\
tool-types\x08function\x04\x04\0\x04tool\x03\0\x05\x01r\x02\x04names\x09argument\
ss\x04\0\x12tool-call-function\x03\0\x07\x01r\x03\x02ids\x09tool-types\x08functi\
on\x08\x04\0\x09tool-call\x03\0\x09\x01p\x0a\x01k\x0b\x01r\x05\x04roles\x07conte\
nt\0\x0atool-calls\x0c\x0ctool-call-id\0\x04name\0\x04\0\x07message\x03\0\x0d\x04\
\0\x13custom-tool-handler\x03\x01\x01ky\x01r\x05\x0btemperaturev\x05top-pv\x04se\
edy\x0amax-tokens\x10\x0econtext-window\x10\x04\0\x0bllm-options\x03\0\x11\x01r\x04\
\x05models\x06config\x12\x07api-urls\x07api-key\0\x04\0\x0allm-client\x03\0\x13\x01\
r\x04\x04names\x07addresss\x03abis\x0bdescription\0\x04\0\x08contract\x03\0\x15\x01\
p\x16\x01p\x0e\x01o\x02ss\x01p\x19\x01r\x05\x09contracts\x17\x0allm-config\x12\x05\
models\x08messages\x18\x06config\x1a\x04\0\x06config\x03\0\x1b\x01ps\x01r\x02\x08\
functions\x04args\x1d\x04\0\x0dcontract-call\x03\0\x1e\x01k\x1f\x01r\x05\x02tos\x05\
values\x0dcontract-call\x20\x04datas\x0bdescriptions\x04\0\x0btransaction\x03\0!\
\x01q\x02\x0btransaction\x01\"\0\x04text\x01s\0\x04\0\x0cllm-response\x03\0#\x01\
h\x0f\x01@\x02\x04self%\x09tool-names\0\x7f\x04\0&[method]custom-tool-handler.ca\
n-handle\x01&\x01j\x01s\x01s\x01@\x02\x04self%\x09tool-call\x0a\0'\x04\0#[method\
]custom-tool-handler.execute\x01(\x03\0\x16wavs:agent/types@0.0.1\x05\x06\x02\x03\
\0\x01\x0bagent-error\x02\x03\0\x02\x07message\x02\x03\0\x02\x04tool\x02\x03\0\x02\
\x09tool-call\x02\x03\0\x02\x13custom-tool-handler\x02\x03\0\x02\x0cllm-response\
\x02\x03\0\x02\x0btransaction\x02\x03\0\x02\x06config\x02\x03\0\x02\x0bllm-optio\
ns\x02\x03\0\x02\x0allm-client\x01B0\x02\x03\x02\x01\x07\x04\0\x0bagent-error\x03\
\0\0\x02\x03\x02\x01\x08\x04\0\x07message\x03\0\x02\x02\x03\x02\x01\x09\x04\0\x04\
tool\x03\0\x04\x02\x03\x02\x01\x0a\x04\0\x09tool-call\x03\0\x06\x02\x03\x02\x01\x0b\
\x04\0\x13custom-tool-handler\x03\0\x08\x02\x03\x02\x01\x0c\x04\0\x0cllm-respons\
e\x03\0\x0a\x02\x03\x02\x01\x0d\x04\0\x0btransaction\x03\0\x0c\x02\x03\x02\x01\x0e\
\x04\0\x06config\x03\0\x0e\x02\x03\x02\x01\x0f\x04\0\x0bllm-options\x03\0\x10\x02\
\x03\x02\x01\x10\x04\0\x0allm-client\x03\0\x12\x04\0\x12llm-client-manager\x03\x01\
\x01h\x14\x01@\x01\x04self\x15\0s\x04\0$[method]llm-client-manager.get-model\x01\
\x16\x01@\x01\x04self\x15\0\x11\x04\0%[method]llm-client-manager.get-config\x01\x17\
\x01p\x03\x01p\x05\x01k\x19\x01j\x01\x03\x01\x01\x01@\x03\x04self\x15\x08message\
s\x18\x05tools\x1a\0\x1b\x04\0*[method]llm-client-manager.chat-completion\x01\x1c\
\x01j\x01s\x01\x01\x01@\x02\x04self\x15\x08messages\x18\0\x1d\x04\0/[method]llm-\
client-manager.chat-completion-text\x01\x1e\x01i\x09\x01p\x1f\x01k\x20\x01j\x01\x0b\
\x01\x01\x01@\x05\x04self\x15\x06prompts\x06config\x0f\x0ccustom-tools\x1a\x0fcu\
stom-handlers!\0\"\x04\0)[method]llm-client-manager.process-prompt\x01#\x01j\x01\
\x13\x01\x01\x01@\x01\x05models\0$\x04\0\x0anew-client\x01%\x01@\x02\x05models\x0b\
json-configs\0$\x04\0\x09from-json\x01&\x01@\x02\x05models\x06config\x11\0$\x04\0\
\x0bwith-config\x01'\x03\0\x17wavs:agent/client@0.0.1\x05\x11\x02\x03\0\x02\x08c\
ontract\x01B.\x02\x03\x02\x01\x07\x04\0\x0bagent-error\x03\0\0\x02\x03\x02\x01\x08\
\x04\0\x07message\x03\0\x02\x02\x03\x02\x01\x0e\x04\0\x06config\x03\0\x04\x02\x03\
\x02\x01\x0f\x04\0\x0bllm-options\x03\0\x06\x02\x03\x02\x01\x12\x04\0\x08contrac\
t\x03\0\x08\x04\0\x11llm-options-funcs\x03\x01\x04\0\x0econfig-manager\x03\x01\x01\
h\x0a\x01@\x01\x04self\x0c\0\x07\x04\0\x1d[method]llm-options-funcs.new\x01\x0d\x01\
@\x02\x04self\x0c\x04tempv\0\x07\x04\0%[method]llm-options-funcs.temperature\x01\
\x0e\x01@\x02\x04self\x0c\x05top-pv\0\x07\x04\0\x1f[method]llm-options-funcs.top\
-p\x01\x0f\x01@\x02\x04self\x0c\x04seedy\0\x07\x04\0\x1e[method]llm-options-func\
s.seed\x01\x10\x01ky\x01@\x02\x04self\x0c\x0amax-tokens\x11\0\x07\x04\0$[method]\
llm-options-funcs.max-tokens\x01\x12\x01@\x02\x04self\x0c\x0econtext-window\x11\0\
\x07\x04\0([method]llm-options-funcs.context-window\x01\x13\x01h\x0b\x01j\x01\x05\
\x01s\x01@\x01\x04self\x14\0\x15\x04\0\x1b[method]config-manager.load\x01\x16\x01\
@\x02\x04self\x14\x03uris\0\x15\x04\0$[method]config-manager.load-from-uri\x01\x17\
\x01j\x01\x05\x01\x01\x01@\x02\x04self\x14\x04jsons\0\x18\x04\0\x20[method]confi\
g-manager.from-json\x01\x19\x01j\x01s\x01s\x01@\x01\x04self\x14\0\x1a\x04\0\x1e[\
method]config-manager.to-json\x01\x1b\x01@\x01\x04self\x14\0s\x04\03[method]conf\
ig-manager.format-contract-descriptions\x01\x1c\x01k\x09\x01@\x02\x04self\x14\x04\
names\0\x1d\x04\0+[method]config-manager.get-contract-by-name\x01\x1e\x01j\0\x01\
\x01\x01@\x01\x04self\x14\0\x1f\x04\0\x1f[method]config-manager.validate\x01\x20\
\x03\0\x17wavs:agent/config@0.0.1\x05\x13\x02\x03\0\x02\x0dcontract-call\x01B#\x02\
\x03\x02\x01\x07\x04\0\x0bagent-error\x03\0\0\x02\x03\x02\x01\x12\x04\0\x08contr\
act\x03\0\x02\x02\x03\x02\x01\x14\x04\0\x0dcontract-call\x03\0\x04\x02\x03\x02\x01\
\x0d\x04\0\x0btransaction\x03\0\x06\x04\0\x10contract-manager\x03\x01\x04\0\x13t\
ransaction-manager\x03\x01\x01h\x08\x01@\x04\x04self\x0a\x04names\x07addresss\x03\
abis\0\x03\x04\0\x1c[method]contract-manager.new\x01\x0b\x01@\x05\x04self\x0a\x04\
names\x07addresss\x03abis\x0bdescriptions\0\x03\x04\0-[method]contract-manager.n\
ew-with-description\x01\x0c\x01j\x01s\x01\x01\x01@\x02\x04self\x0a\x08contract\x03\
\0\x0d\x04\0\"[method]contract-manager.parse-abi\x01\x0e\x01ps\x01p}\x01j\x01\x10\
\x01\x01\x01@\x04\x04self\x0a\x08contract\x03\x0dfunction-names\x04args\x0f\0\x11\
\x04\0-[method]contract-manager.encode-function-call\x01\x12\x01@\x03\x04self\x0a\
\x08contract\x03\x0dfunction-names\0\x0d\x04\0&[method]contract-manager.find-fun\
ction\x01\x13\x01j\0\x01\x01\x01@\x04\x04self\x0a\x08contract\x03\x0dfunction-na\
mes\x04args\x0f\0\x14\x04\0/[method]contract-manager.validate-function-call\x01\x15\
\x01h\x09\x01@\x02\x04self\x16\x0btransaction\x07\0\x7f\x04\0$[method]transactio\
n-manager.is-valid\x01\x17\x01@\x02\x04self\x16\x0btransaction\x07\0\x14\x04\00[\
method]transaction-manager.validate-transaction\x01\x18\x01@\x01\x0btransaction\x07\
\0\x0d\x04\0\x16create-payload-from-tx\x01\x19\x03\0\x1awavs:agent/contracts@0.0\
.1\x05\x15\x02\x03\0\x03\x0allm-client\x02\x03\0\x02\x08function\x01B#\x02\x03\x02\
\x01\x16\x04\0\x0allm-client\x03\0\0\x02\x03\x02\x01\x08\x04\0\x07message\x03\0\x02\
\x02\x03\x02\x01\x09\x04\0\x04tool\x03\0\x04\x02\x03\x02\x01\x0a\x04\0\x09tool-c\
all\x03\0\x06\x02\x03\x02\x01\x17\x04\0\x08function\x03\0\x08\x02\x03\x02\x01\x0b\
\x04\0\x13custom-tool-handler\x03\0\x0a\x02\x03\x02\x01\x12\x04\0\x08contract\x03\
\0\x0c\x04\0\x0dtools-builder\x03\x01\x01h\x0e\x01@\x01\x04self\x0f\0\x05\x04\0#\
[method]tools-builder.send-eth-tool\x01\x10\x01p\x05\x01@\x02\x04self\x0f\x08con\
tract\x0d\0\x11\x04\0)[method]tools-builder.tools-from-contract\x01\x12\x01@\x04\
\x04self\x0f\x04names\x0bdescriptions\x0aparameterss\0\x05\x04\0![method]tools-b\
uilder.custom-tool\x01\x13\x01i\x0b\x01p\x14\x01k\x15\x01j\x01s\x01s\x01@\x03\x04\
self\x0f\x09tool-call\x07\x0fcustom-handlers\x16\0\x17\x04\0'[method]tools-build\
er.execute-tool-call\x01\x18\x01@\x02\x04self\x0f\x09tool-call\x07\0\x17\x04\0+[\
method]tools-builder.parse-eth-transaction\x01\x19\x01p\x03\x01p\x07\x01@\x06\x04\
self\x0f\x06client\x01\x10initial-messages\x1a\x08response\x03\x0atool-calls\x1b\
\x0fcustom-handlers\x16\0\x17\x04\0([method]tools-builder.process-tool-calls\x01\
\x1c\x03\0\x16wavs:agent/tools@0.0.1\x05\x18\x02\x03\0\0\x10evm-chain-config\x02\
\x03\0\0\x13cosmos-chain-config\x02\x03\0\0\x09log-level\x01B\x0e\x02\x03\x02\x01\
\x19\x04\0\x10evm-chain-config\x03\0\0\x02\x03\x02\x01\x1a\x04\0\x13cosmos-chain\
-config\x03\0\x02\x02\x03\x02\x01\x1b\x04\0\x09log-level\x03\0\x04\x01k\x01\x01@\
\x01\x0achain-names\0\x06\x04\0\x14get-eth-chain-config\x01\x07\x01k\x03\x01@\x01\
\x0achain-names\0\x08\x04\0\x17get-cosmos-chain-config\x01\x09\x01@\x02\x05level\
\x05\x07messages\x01\0\x04\0\x03log\x01\x0a\x03\0\x04host\x05\x1c\x01k\x04\x01j\x01\
\x1d\x01s\x01@\x01\x0etrigger-action\x02\0\x1e\x04\0\x03run\x01\x1f\x04\0'compon\
ent:dao-agent/layer-trigger-world\x04\0\x0b\x19\x01\0\x13layer-trigger-world\x03\
\0\0\0G\x09producers\x01\x0cprocessed-by\x02\x0dwit-component\x070.220.0\x10wit-\
bindgen-rust\x060.35.0";
#[inline(never)]
#[doc(hidden)]
pub fn __link_custom_section_describing_imports() {
    wit_bindgen_rt::maybe_link_cabi_realloc();
}
