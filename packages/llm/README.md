# WAVS LLM

A package for interacting with large language models in WAVS components (and beyond).

TODO:
- [ ] Drop support OpenAI, we'll only support open source models
- [ ] Make sure it supports formatted responses
- [ ] Elegant API design
- [ ] Automatic encoding of smart contracts into usable tools
- [ ] Remove sol_interfaces (see `wasm` folder contracts.rs implementation)
- [ ] Integration tests that can be run with a local AI model
- [ ] Well documented

In the `wasm` folder, you'll fing the last version we made leveraging WIT types... the developer experience took a hit though, and while there are some good things we did there, we're starting with a fresh refactor in `src`.
