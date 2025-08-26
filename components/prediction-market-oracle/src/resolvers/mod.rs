use anyhow::Result;
use async_trait::async_trait;
use serde_json::Value;
use std::collections::HashMap;

pub mod price;
pub mod twitter_followers;

pub struct ResolverInfo {
    pub name: &'static str,
    pub factory: fn(Value) -> Result<Box<dyn Resolver>, String>,
}

inventory::collect!(ResolverInfo);

/// A prediction market resolver.
#[async_trait(?Send)]
pub trait Resolver {
    /// Create a new resolver from config.
    fn from_config(config: Value) -> Result<Self, String>
    where
        Self: Sized;

    /// Resolve true or false.
    async fn resolve(&self) -> Result<bool, String>;
}

/// Factory function type for creating resolvers from config
pub type ResolverFactory = Box<dyn Fn(Value) -> Result<Box<dyn Resolver>, String>>;

/// A registry that manages resolver factories and instances.
pub struct ResolverRegistry {
    /// Factories for creating resolvers
    factories: HashMap<String, ResolverFactory>,
}

impl ResolverRegistry {
    /// Create a new empty registry.
    pub fn new() -> Self {
        Self { factories: HashMap::new() }
    }

    /// Register a resolver factory function.
    pub fn register_factory<F>(&mut self, name: &str, factory: F)
    where
        F: Fn(Value) -> Result<Box<dyn Resolver>, String> + 'static,
    {
        self.factories.insert(name.to_string(), Box::new(factory));
    }

    /// Create and add a resolver instance from config.
    pub fn create_resolver(
        &self,
        resolver_type: &str,
        config: Value,
    ) -> Result<Box<dyn Resolver>, String> {
        let factory = self
            .factories
            .get(resolver_type)
            .ok_or_else(|| format!("Unknown resolver type: {}", resolver_type))?;

        let resolver = factory(config)?;
        Ok(resolver)
    }

    /// Register all available resolvers automatically.
    pub fn all() -> Self {
        let mut registry = Self::new();

        for resolver_info in inventory::iter::<ResolverInfo> {
            registry.register_factory(resolver_info.name, resolver_info.factory);
        }

        registry
    }
}

/// Helper macro to register resolver factories easily
#[macro_export]
macro_rules! register_resolver {
    ($resolver_type:ty, $name:expr) => {
        inventory::submit!($crate::resolvers::ResolverInfo {
            name: $name,
            factory: |config| {
                let resolver =
                    <$resolver_type as $crate::resolvers::Resolver>::from_config(config)?;
                Ok(Box::new(resolver) as Box<dyn $crate::resolvers::Resolver>)
            },
        });
    };
}
