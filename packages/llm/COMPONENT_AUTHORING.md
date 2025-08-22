# Working with WIT (WebAssembly Interface Types) in Rust

This guide provides a comprehensive overview of using WIT (WebAssembly Interface Types) in Rust WebAssembly component projects. WIT is a declarative interface definition language that enables interoperability between WebAssembly modules written in different languages.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [WIT Types](#wit-types)
- [Resources](#resources)
- [Interface Patterns](#interface-patterns)
- [JSON Serialization](#json-serialization)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Tools and Resources](#tools-and-resources)

## Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install the wasm32-wasi target
rustup target add wasm32-wasi

# Install cargo-component
cargo install cargo-component

# Install wit-bindgen-cli (optional)
cargo install wit-bindgen-cli
```

### Create a New Component

```bash
cargo component new my-component --lib
cd my-component
```

### Basic WIT File

```wit
// wit/world.wit
package example:hello;

interface greetings {
  say-hello: func(name: string) -> string;
}

world hello-world {
  export greetings;
}
```

### Rust Implementation

```rust
// src/lib.rs
use crate::bindings::exports::example::hello::greetings::Guest;

struct Component;

impl Guest for Component {
    fn say_hello(name: String) -> String {
        format!("Hello, {}!", name)
    }
}

bindings::export!(Component with_types_in bindings);
```

## Core Concepts

### WIT (WebAssembly Interface Types)

WIT is an IDL (Interface Definition Language) specifically designed for WebAssembly components. It defines:

- **Interfaces**: Collections of functions and types
- **Worlds**: Complete component interfaces with imports and exports
- **Types**: Data structures that can be passed between components

### Components vs Modules

- **Modules**: Raw WebAssembly binaries with basic types
- **Components**: Higher-level constructs with rich types and interfaces defined in WIT

## WIT Types

### Primitive Types

| WIT Type                  | Rust Type                 | Description            |
| ------------------------- | ------------------------- | ---------------------- |
| `bool`                    | `bool`                    | Boolean value          |
| `u8`, `u16`, `u32`, `u64` | `u8`, `u16`, `u32`, `u64` | Unsigned integers      |
| `s8`, `s16`, `s32`, `s64` | `i8`, `i16`, `i32`, `i64` | Signed integers        |
| `float32`, `float64`      | `f32`, `f64`              | Floating point numbers |
| `char`                    | `char`                    | Unicode character      |
| `string`                  | `String`                  | UTF-8 string           |

### Compound Types

```wit
// Records (structs)
record user {
  id: u64,
  name: string,
  email: string,
}

// Variants (enums with data)
variant result {
  success(string),
  error(error-info),
}

// Enums (simple enums)
enum status {
  pending,
  active,
  completed,
}

// Lists
type string-list = list<string>;

// Options
type optional-user = option<user>;

// Results
type operation-result = result<string, string>;

// Tuples
type coordinates = tuple<float64, float64>;
```

## Resources

Resources represent stateful objects with methods:

```wit
resource http-client {
  // Constructor
  constructor(config: client-config);

  // Instance methods
  get: func(url: string) -> result<response, string>;
  post: func(url: string, body: string) -> result<response, string>;

  // Method that consumes the resource
  shutdown: func();
}
```

Rust implementation:

```rust
struct MyHttpClient {
    config: ClientConfig,
    // internal state
}

impl GuestHttpClient for MyHttpClient {
    fn new(config: ClientConfig) -> Self {
        Self { config }
    }

    fn get(&self, url: String) -> Result<Response, String> {
        // implementation
    }

    fn post(&self, url: String, body: String) -> Result<Response, String> {
        // implementation
    }

    fn shutdown(self) {
        // cleanup
    }
}
```

## Interface Patterns

### Trait-like Interfaces with Resources

```wit
resource logger {
  log: func(level: log-level, message: string);
  flush: func();
}

resource file-logger {
  constructor(path: string);
  log: func(level: log-level, message: string);
  flush: func();
}

// Functions accepting any logger implementation
interface logging {
  process-with-logger: func(logger: logger, data: string);
}
```

### Function Tables Pattern

```wit
record formatter {
  format-string: func(string) -> string,
  format-number: func(float64) -> string,
}

interface formatters {
  create-json-formatter: func() -> formatter;
  create-xml-formatter: func() -> formatter;
}
```

### Variant-based Polymorphism

```wit
variant shape {
  circle(circle),
  rectangle(rectangle),
  triangle(triangle),
}

interface geometry {
  area: func(shape: shape) -> float64;
  perimeter: func(shape: shape) -> float64;
}
```

## JSON Serialization

To work with JSON in WIT components:

```rust
use serde::{Deserialize, Serialize};

// WIT type
record user {
  id: u64,
  name: string,
  email: string,
}

// Rust wrapper with serde
#[derive(Serialize, Deserialize)]
struct UserJson {
    id: u64,
    name: String,
    email: String,
}

// Conversion implementations
impl From<User> for UserJson {
    fn from(user: User) -> Self {
        UserJson {
            id: user.id,
            name: user.name,
            email: user.email,
        }
    }
}

impl From<UserJson> for User {
    fn from(json: UserJson) -> Self {
        User {
            id: json.id,
            name: json.name,
            email: json.email,
        }
    }
}

// Usage in component
impl Guest for Component {
    fn parse_user(json: String) -> Result<User, String> {
        let user_json: UserJson = serde_json::from_str(&json)
            .map_err(|e| e.to_string())?;
        Ok(user_json.into())
    }

    fn serialize_user(user: User) -> Result<String, String> {
        let user_json = UserJson::from(user);
        serde_json::to_string(&user_json)
            .map_err(|e| e.to_string())
    }
}
```

## Best Practices

### 1. Interface Design

- Keep interfaces small and focused
- Use semantic versioning for packages
- Document your interfaces with comments
- Design for forward compatibility

### 2. Error Handling

```wit
interface file-operations {
  read-file: func(path: string) -> result<string, string>;
  write-file: func(path: string, content: string) -> result<_, string>;
}
```

### 3. Resource Management

```rust
impl Drop for MyResource {
    fn drop(&mut self) {
        // Clean up resources
        println!("Cleaning up resource {}", self.id);
    }
}
```

### 4. Type Safety

- Use enums for fixed sets of values
- Use results for fallible operations
- Use options for nullable values
- Validate data at component boundaries

## Common Patterns

### Factory Pattern

```wit
interface factory {
  create-processor: func(config: processor-config) -> processor;
  create-default-processor: func() -> processor;
}
```

### Builder Pattern

```wit
resource request-builder {
  constructor();

  method: func(method: http-method) -> request-builder;
  url: func(url: string) -> request-builder;
  header: func(key: string, value: string) -> request-builder;

  build: func() -> http-request;
}
```

### Observer Pattern

```wit
resource event-emitter {
  constructor();

  on: func(event: string, handler: event-handler);
  emit: func(event: string, data: string);
  remove-listener: func(event: string, handler: event-handler);
}

resource event-handler {
  handle: func(data: string);
}
```

## Tools and Resources

### Essential Tools

- **cargo-component**: Build Rust components
- **wit-bindgen**: Generate bindings from WIT
- **wasm-tools**: Manipulate WebAssembly binaries
- **wasmtime**: Runtime for testing components

### Development Workflow

1. Write your WIT interface
2. Generate Rust bindings
3. Implement the interface
4. Build the component
5. Test with a runtime

```bash
# Build the component
cargo component build --release

# Compose components
wasm-tools compose component1.wasm -d component2.wasm -o composed.wasm

# Validate a component
wasm-tools validate component.wasm

# Run tests
cargo test
```

### Additional Resources

- [WebAssembly Component Model Specification](https://github.com/WebAssembly/component-model)
- [WASI Documentation](https://wasi.dev/)
- [cargo-component Documentation](https://github.com/bytecodealliance/cargo-component)
- [WIT Specification](https://github.com/WebAssembly/component-model/blob/main/design/mvp/WIT.md)

## Troubleshooting

### Common Issues

1. **Type Mismatches**: Ensure Rust types match WIT definitions exactly
2. **Memory Leaks**: Properly implement Drop for resources
3. **String Encoding**: WIT strings are always UTF-8
4. **Build Errors**: Check your toolchain versions and targets

### Debugging Tips

- Use `wasm-tools print` to inspect components
- Enable logging in your component implementation
- Test with simple interfaces before complex ones
- Validate components before deployment

## Contributing

This guide is part of the WebAssembly component ecosystem. Contributions and corrections are welcome! Please check the official specifications for the most up-to-date information.

## License

This documentation is provided under the MIT license. See LICENSE file for details.
