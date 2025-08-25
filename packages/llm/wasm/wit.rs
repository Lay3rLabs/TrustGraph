use wit_bindgen::generate;

generate!({
    // The name of the world that bindings are being generated for. If this
    // is not specified then it's required that the package selected
    // below has a single `world` in it.
    // world: "my-world",

    // Path to parse WIT and its dependencies from. Defaults to the `wit`
    // folder adjacent to your `Cargo.toml`.
    //
    // This parameter also supports the form of a list, such as:
    // ["../path/to/wit1", "../path/to/wit2"]
    // Usually used in testing, our test suite may want to generate code
    // from wit files located in multiple paths within a single mod, and we
    // don't want to copy these files again.
    path: "./wit",

    // Enables passing "inline WIT". If specified this is the default
    // package that a world is selected from. Any dependencies that this
    // inline WIT refers to must be defined in the `path` option above.
    //
    // By default this is not specified.
    // inline: "
    //     world my-world {
    //         import wasi:cli/imports;

    //         export my-run: func()
    //     }
    // ",

    // Additional traits to derive for all defined types. Note that not all
    // types may be able to implement these traits, such as resources.
    //
    // By default this set is empty.
    additional_derives: [PartialEq, Clone, serde::Deserialize, serde::Serialize],

    // When generating bindings for interfaces that are not defined in the
    // same package as `world`, this option can be used to either generate
    // those bindings or point to already generated bindings.
    // For example, if your world refers to WASI types then the `wasi` crate
    // already has generated bindings for all WASI types and structures. In this
    // situation the key `with` here can be used to use those types
    // elsewhere rather than regenerating types.
    // If for example your world refers to some type and you want to use
    // your own custom implementation of that type then you can specify
    // that here as well. There is a requirement on the remapped (custom)
    // type to have the same internal structure and identical to what would
    // wit-bindgen generate (including alignment, etc.), since
    // lifting/lowering uses its fields directly.
    //
    // If, however, your world refers to interfaces for which you don't have
    // already generated bindings then you can use the special `generate` value
    // to have those bindings generated.
    //
    // The `with` key here works for interfaces and individual types.
    //
    // When an interface or type is specified here no bindings will be
    // generated at all. It's assumed bindings are fully generated
    // somewhere else. This is an indicator that any further references to types
    // defined in these interfaces should use the upstream paths specified
    // here instead.
    //
    // Any unused keys in this map are considered an error.
    // with: {
        // "wasi:io/poll": wasi::io::poll,
        // "some:package/my-interface": generate,
        // "some:package/my-interface/my-type": my_crate::types::MyType,
    // },

    // Indicates that all interfaces not present in `with` should be assumed
    // to be marked with `generate`.
    // generate_all,

    // An optional list of function names to skip generating bindings for.
    // This is only applicable to imports and the name specified is the name
    // of the function.
    // skip: ["foo", "bar", "baz"],

    // Configuration of how Rust types are generated.
    //
    // This option will change how WIT types are mapped to Rust types. There
    // are a number of ways this can be done depending on the context. For
    // example a Rust `&str` is suitable to pass to an imported function but
    // an exported function receives a `String`. These both represent the
    // WIT type `string`, however.
    //
    // Type generation becomes extra-significant when aggregates come into
    // play (such as a WIT `record` or `variant`), especially when the
    // aggregate is used both in an imported function and exported one.
    //
    // There are three modes of ownership, documented here, but only one
    // can be specified.
    //
    // The default mode is "Owning" meaning that all Rust types will by
    // default contain their owned containers. For example a `record` with
    // a `string` will map to a Rust `struct` containing a `String`. This
    // maximizes the chance that types can be shared between imports and
    // exports but can come at a cost where calling an import may require
    // more allocations than necessary.
    ownership: Owning,

    // Specifies an alternative name for the `export!` macro generated for
    // any exports this world has.
    //
    // Defaults to "export"
    // export_macro_name: "export",

    // Indicates whether the `export!` macro is `pub` or just `pub(crate)`.
    //
    // This defaults to `false`.
    // pub_export_macro: false,

    // The second mode of ownership is "Borrowing". This mode then
    // additionally has a boolean flag indicating whether duplicate types
    // should be generated if necessary.
    //
    // This mode will prefer using borrowed values in Rust to represent WIT
    // values where possible. For example if the argument to an imported
    // function is a record-with-a-string then in Rust that will generate a
    // `struct` with a lifetime parameter storing `&'a str`.
    //
    // The `duplicate_if_necessary` flag will cause duplicate types to be
    // generated when a WIT type is used both in an import and export. In
    // this situation one will be called `FooParam` and one will be called
    // `FooResult` (where `foo` is the WIT name).
    //
    // It's generally recommended to not turn this on unless performance
    // requires it. Even if so, please feel free to open an issue on the
    // `wit-bindgen` repository to help improve the default "Owning" use
    // case above if possible.
    // ownership: Borrowing { duplicate_if_necessary: false },

    // The generated `export!` macro, if any, will by default look for
    // generated types adjacent to where the `export!` macro is invoked
    // through the `self` module. This option can be used to change the
    // defaults to look somewhere else instead.
    // default_bindings_module: "path::to::bindings",

    // This will suffix the custom section containing component type
    // information with the specified string. This is not required by
    // default but if the same world is generated in two different locations
    // in the crate then one bindings generation location will need this
    // suffix to avoid having the custom sections corrupt each other.
    // type_section_suffix: "suffix",

    // Configures the path to the `wit-bindgen` crate itself. By default
    // this is `wit_bindgen` assuming that your crate depends on the
    // `wit-bindgen` crate itself.
    // runtime_path: "path::to::wit_bindgen",

    // Configure where the `bitflags` crate is located. By default this
    // is `wit_bindgen::bitflags` which already reexports `bitflags` for
    // you.
    // bitflags_path: "path::to::bitflags",

    // Indicates that instead of `&str` and `String` the `&[u8]` and
    // `Vec<u8>` types should be used. Only intended for cases where
    // compiled size is of the utmost concern as this can avoid pulling in
    // UTF-8 validation.
    // raw_strings,

    // Emits `#[cfg(feature = "std")]` around `impl Error for ... {}` blocks
    // for generated types. This is a niche option that is only here to
    // support the standard library itself depending on this crate one day.
    // std_feature,

    // Disable a workaround to force wasm constructors to be run only once
    // when exported functions are called.
    // disable_run_ctors_once_workaround: false,

    // Whether to generate unused `record`, `enum`, `variant` types.
    // By default, they will not be generated unless they are used as input
    // or return value of a function.
    generate_unused_types: false,

    // A list of "features" which correspond to WIT features to activate
    // when parsing WIT files. This enables `@unstable` annotations showing
    // up and having bindings generated for them.
    //
    // By default this is an empty list.
    // features: ["foo", "bar", "baz"],

    // Disables generation of a `#[used]` static to try harder to get the
    // custom section describing WIT types linked into the binary when
    // used in library-like situations. This is `false` by default with
    // `#[used]` statics being emitted.
    // disable_custom_section_link_helpers: false,

    // Write generated code to a .rs file, which allows the compiler to
    // emit more useful diagnostics for errors in the generated code.  This
    // is primarily useful for `wit-bindgen` developers.
    //
    // This does the same thing as setting `WIT_BINDGEN_DEBUG=1`, except
    // that it can be used on a more fine-grained basis (i.e. it only affects
    // the specific `generate!` call where it is used.
    // debug: true,

    // // Generate async import and/or export bindings.
    // //
    // // The resulting bindings will use the component model
    // // [async ABI](https://github.com/WebAssembly/component-model/blob/main/design/mvp/Async.md).
    // // This may be specified either as a boolean (e.g. `async: true`, meaning
    // // all imports and exports should use the async ABI) or as lists of
    // // specific imports and/or exports as shown here:
    // async: {
    //     imports: [
    //         "wasi:http/types@0.3.0-draft#[static]body.finish",
    //         "wasi:http/handler@0.3.0-draft#handle",
    //     ],
    //     exports: [
    //         "wasi:http/handler@0.3.0-draft#handle",
    //     ]
    // }
});
